import { hybridSearch } from './hybridSearch';
import { score, decideMatchType } from './rerank';
const ALLOWED_DOMAINS = [
    "coupang.com",
    "smartstore.naver.com",
    "amazon.com",
    "amazon.co",
    "amazon.co.kr",
    "amazon.jp",
];
const SOLDOUT_KEYWORDS = [
    "품절",
    "품 절",
    "일시품절",
    "일시 품절",
    "재고없음",
    "재고 없음",
    "판매중단",
    "판매 중단",
    "단종",
    "soldout",
    "sold out",
    "out of stock",
    "currently unavailable",
    "not available",
    "unavailable",
    "현재 판매 중인 상품이 아닙니다",
];
function isAllowedDomain(url) {
    if (!url)
        return false;
    try {
        const host = new URL(url).hostname.toLowerCase();
        return ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
    }
    catch {
        return false;
    }
}
function containsSoldOut(text) {
    if (!text)
        return false;
    const lower = text.toLowerCase();
    return SOLDOUT_KEYWORDS.some((kw) => lower.includes(kw));
}
const COUPANG_HOST_WHITELIST = new Set(["www.coupang.com", "m.coupang.com"]);
const COUPANG_PRODUCT_PATTERNS = [
    /^\/vp\/products\/\d+/,
    /^\/np\/products\/\d+/,
    /^\/vp\/subscription\/\d+/,
];
const COUPANG_PATH_BLOCKLISTS = [
    "/np/search",
    "/np/categories",
    "/np/campaigns",
    "/np/promotion",
    "/np/coupangglobal",
    "/np/coupangglobalmall",
    "/vp/events",
];
const COUPANG_QUERY_BLOCKLIST = ["soldout", "oos", "isavailable=false", "soldout=true", "outofstock=true"];
const AMAZON_PRODUCT_PATTERNS = [
    /^\/dp\/[a-z0-9]{5,}/i,
    /^\/gp\/product\/[a-z0-9]{5,}/i,
    /^\/gp\/aw\/d\/[a-z0-9]{5,}/i,
];
function isLikelyProductUrl(url) {
    if (!url)
        return false;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname;
        if (host.endsWith("coupang.com")) {
            if (!COUPANG_HOST_WHITELIST.has(host))
                return false;
            if (COUPANG_PATH_BLOCKLISTS.some((prefix) => pathname.startsWith(prefix)))
                return false;
            if (!COUPANG_PRODUCT_PATTERNS.some((pattern) => pattern.test(pathname)))
                return false;
            const lowerSearch = parsed.search.toLowerCase();
            if (COUPANG_QUERY_BLOCKLIST.some((token) => lowerSearch.includes(token)))
                return false;
            return true;
        }
        if (host.endsWith("amazon.com") || host.endsWith("amazon.co.kr") || host.endsWith("amazon.co") || host.endsWith("amazon.jp")) {
            return AMAZON_PRODUCT_PATTERNS.some((pattern) => pattern.test(pathname));
        }
        if (host.endsWith("smartstore.naver.com")) {
            return /\/products\/\d+/.test(pathname);
        }
        return true;
    }
    catch {
        return false;
    }
}
function tokenize(value) {
    if (!value)
        return new Set();
    return new Set(value.toLowerCase().split(/[^a-z0-9가-힣]+/).filter(Boolean));
}
function nameSimilarity(a, b) {
    const setA = tokenize(a);
    const setB = tokenize(b);
    if (!setA.size || !setB.size)
        return 0;
    let intersection = 0;
    setA.forEach((token) => {
        if (setB.has(token))
            intersection += 1;
    });
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}
async function validateCandidate(candidate) {
    if (!candidate.link) {
        return { ok: false, reason: "missing-link" };
    }
    if (!isAllowedDomain(candidate.link)) {
        return { ok: false, reason: "domain" };
    }
    if (!isLikelyProductUrl(candidate.link)) {
        return { ok: false, reason: "non-product" };
    }
    if (containsSoldOut(candidate.title) || containsSoldOut(candidate.link)) {
        return { ok: false, reason: "soldout" };
    }
    if (!candidate.image) {
        return { ok: false, reason: "no-image" };
    }
    return { ok: true };
}
export async function attachProducts(items, ctx) {
    const pickByName = (label) => {
        const l = (label || '').toLowerCase();
        return (ctx.extracted.find(e => l.includes((e.category ?? e.name).toLowerCase())) ??
            ctx.extracted[0]);
    };
    for (const it of items) {
        const itemForSearch = pickByName(it.name || '');
        if (!itemForSearch)
            continue;
        const candidates = await hybridSearch(itemForSearch, ctx.providers);
        if (!candidates.length)
            continue;
        const ranked = candidates.map(c => ({ c, s: score(itemForSearch, c) })).sort((a, b) => b.s - a.s);
        let chosen = null;
        for (let idx = 0; idx < ranked.length; idx += 1) {
            const candidate = ranked[idx];
            const validation = await validateCandidate(candidate.c);
            if (validation.ok) {
                chosen = {
                    link: candidate.c.link,
                    image: candidate.c.image,
                    title: candidate.c.title,
                    priceKRW: candidate.c.priceKRW,
                    brand: candidate.c.brand,
                    model: candidate.c.model,
                    source: candidate.c.source,
                    score: candidate.s,
                    fallbackUsed: idx > 0,
                    similarity: nameSimilarity(itemForSearch.name, candidate.c.title),
                };
                break;
            }
            console.warn(`[PRODUCT_OOS] ${validation.reason} :: ${candidate.c.link ?? 'unknown-link'}`);
        }
        if (!chosen) {
            let fallbackCandidate = null;
            for (const provider of ctx.providers) {
                if (typeof provider.searchSimilar !== 'function')
                    continue;
                try {
                    const similar = await provider.searchSimilar({ name: itemForSearch.name, category: itemForSearch.category });
                    if (!similar?.length)
                        continue;
                    for (const alt of similar) {
                        if (!alt.link)
                            continue;
                        if (!isAllowedDomain(alt.link)) {
                            console.warn(`[PRODUCT_OOS] domain :: ${alt.link}`);
                            continue;
                        }
                        const fallbackValidation = await validateCandidate(alt);
                        if (!fallbackValidation.ok) {
                            console.warn(`[PRODUCT_OOS] fallback-${fallbackValidation.reason} :: ${alt.link}`);
                            continue;
                        }
                        fallbackCandidate = alt;
                        break;
                    }
                    if (fallbackCandidate)
                        break;
                }
                catch (err) {
                    console.warn('[PRODUCT_OOS] fallback-search-error', err);
                }
            }
            if (!fallbackCandidate) {
                it.inStock = false;
                it.fallbackUsed = false;
                continue;
            }
            chosen = {
                link: fallbackCandidate.link,
                image: fallbackCandidate.image,
                title: fallbackCandidate.title,
                priceKRW: undefined,
                brand: undefined,
                model: undefined,
                source: undefined,
                score: 0.4,
                fallbackUsed: true,
                similarity: nameSimilarity(itemForSearch.name, fallbackCandidate.title),
            };
            console.log(`[PRODUCT_OK] Fallback title="${fallbackCandidate.title ?? ''}" similarity=${chosen.similarity.toFixed(2)}`);
        }
        const similarityScore = Number.isFinite(chosen.similarity) ? Number(chosen.similarity) : 0;
        console.log(`[PRODUCT_OK] title="${chosen.title ?? ''}" similarity=${similarityScore.toFixed(2)}`);
        it.linkedProduct = {
            title: chosen.title,
            brand: chosen.brand,
            model: chosen.model,
            category: itemForSearch.category,
            attrs: ranked[0]?.c.attrs,
            link: chosen.link,
            priceKRW: chosen.priceKRW,
            image: chosen.image,
            source: chosen.source,
            confidence: chosen.score,
            matchType: decideMatchType(chosen.score),
            fetchedAt: new Date().toISOString(),
        };
        if (!it.purchaseURL || chosen.fallbackUsed) {
            it.purchaseURL = chosen.link;
        }
        if (!it.purchaseLinkUrl || chosen.fallbackUsed) {
            it.purchaseLinkUrl = chosen.link;
        }
        if (chosen.image && (!it.imageURL || chosen.fallbackUsed)) {
            it.imageURL = chosen.image;
        }
        if (chosen.image && (!it.imageUrl || chosen.fallbackUsed)) {
            it.imageUrl = chosen.image;
        }
        it.inStock = true;
        it.fallbackUsed = chosen.fallbackUsed;
        if (chosen.fallbackUsed) {
            it.fallbackPurchaseURL = chosen.link;
        }
    }
    return items;
}
export const __TESTING__ = {
    isAllowedDomain,
    containsSoldOut,
    isLikelyProductUrl,
    validateCandidate,
};
