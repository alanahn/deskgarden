// services/product/attachProducts.ts
import type { ExtractedItem, Provider } from './types.js';
import type { Item, ProductSource } from '../../types.js';
import { CoupangProvider } from '../affiliates/coupang.js';
import { assertAffiliateEnv } from '../config.js';
import type { AffiliateProduct } from '../affiliates/types.js';
import { decideMatchType } from './rerank.js';

const PLACEHOLDER_STATUS = '상품 준비 중';

function buildTokens(candidate?: ExtractedItem): string[] {
  const tokens: string[] = [];
  if (candidate?.brand) tokens.push(candidate.brand);
  if (candidate?.model) tokens.push(candidate.model);
  return tokens.filter(Boolean);
}

function applyAffiliateProduct(item: Item, product: AffiliateProduct, confidence = 0.9) {
  item.purchaseURL = product.purchaseURL;
  item.purchaseLinkUrl = product.purchaseURL;
  item.imageURL = product.imageURL;
  item.imageUrl = product.imageURL;
  item.inStock = product.inStock;
  item.stockStatus = product.inStock ? undefined : PLACEHOLDER_STATUS;
  if (typeof product.price === 'number') {
    item.price = product.price;
  }
  if (product.productName) {
    item.productName = product.productName;
    item.name = product.productName;
  }

  const linked = (item.linkedProduct ?? {}) as Partial<NonNullable<Item['linkedProduct']>>;
  const source = (product.platform ?? 'Coupang') as ProductSource;
  item.linkedProduct = {
    ...linked,
    title: product.productName ?? item.name,
    link: product.purchaseURL,
    image: product.imageURL,
    priceKRW: product.price ?? linked.priceKRW,
    source: source,
    confidence,
    matchType: decideMatchType(confidence),
    fetchedAt: new Date().toISOString(),
    isAffiliate: product.isAffiliate,
    platform: product.platform ?? 'Coupang',
  } as typeof item.linkedProduct;
}

function markUnavailable(item: Item, reason: string) {
  console.warn(`[AFFILIATE_LINK_FAIL] ${item.name ?? 'item'} :: ${reason}`);
  item.inStock = false;
  item.purchaseURL = '';
  item.purchaseLinkUrl = '';
  item.stockStatus = PLACEHOLDER_STATUS;
  const existing = (item.linkedProduct ?? {}) as Partial<NonNullable<Item['linkedProduct']>>;
  item.linkedProduct = {
    ...existing,
    title: existing.title ?? item.name,
    link: '',
    image: existing.image ?? item.imageURL ?? item.imageUrl ?? '',
    confidence: 0,
    matchType: 'style',
    fetchedAt: new Date().toISOString(),
    isAffiliate: false,
    platform: existing.platform ?? 'Coupang',
    source: existing.source ?? 'Coupang',
  } as NonNullable<Item['linkedProduct']>;
}

export async function attachProducts(
  items: Item[],
  ctx: { extracted: ExtractedItem[]; providers: Provider[] }
) {
  let affiliateAvailable = true;
  try {
    assertAffiliateEnv();
  } catch (error) {
    affiliateAvailable = false;
    console.warn('[AFFILIATE_ENV] using fallback mode', error);
  }

  const pickByName = (label: string) => {
    const l = (label || '').toLowerCase();
    return (
      ctx.extracted.find(e => l.includes((e.category ?? e.name).toLowerCase())) ??
      ctx.extracted[0]
    );
  };

  for (const it of items) {
    if (!affiliateAvailable) {
      markUnavailable(it, 'missing-affiliate-env');
      continue;
    }

    const searchCandidate = pickByName(it.name || '');
    if (!searchCandidate) {
      markUnavailable(it, 'no-search-candidate');
      continue;
    }

    try {
      const results = await CoupangProvider.search({
        query: searchCandidate.name ?? it.name ?? '데스크 용품',
        mustTokens: buildTokens(searchCandidate),
        limit: 10,
      });

      const chosen: AffiliateProduct | undefined = results[0];
      if (!chosen) {
        markUnavailable(it, 'no-affiliate-results');
        continue;
      }

      const deeplink = await CoupangProvider.deeplink(chosen.purchaseURL);
      const productWithDeeplink: AffiliateProduct = {
        ...chosen,
        purchaseURL: deeplink,
      };

      applyAffiliateProduct(it, productWithDeeplink);
      // eslint-disable-next-line no-console
      console.log(`[AFFILIATE_LINK_OK] ${it.name ?? productWithDeeplink.productName} -> ${productWithDeeplink.purchaseURL}`);
    } catch (error) {
      markUnavailable(it, (error as Error)?.message ?? 'affiliate-error');
    }
  }

  return items;
}

export const __TESTING__ = {
  buildTokens,
  applyAffiliateProduct,
  markUnavailable,
};
