const norm = (s) => s?.toLowerCase().replace(/[^a-z0-9가-힣]/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
const includes = (t, q) => t.includes(q) || q.split(' ').every(w => t.includes(w));
export function score(item, hit) {
    const t = norm(`${hit.title} ${hit.brand ?? ''} ${hit.model ?? ''}`);
    let s = 0;
    if (item.brand) {
        const b = norm(item.brand);
        if (b && includes(t, b))
            s += 0.45;
    }
    if (item.model) {
        const m = norm(item.model);
        if (m && includes(t, m))
            s += 0.35;
    }
    if (item.category) {
        const c = norm(item.category);
        if (c && includes(t, c))
            s += 0.15;
    }
    if (item.attrs && hit.attrs) {
        const kv = Object.entries(item.attrs);
        const ok = kv.filter(([_, v]) => includes(t, norm(String(v))));
        s += Math.min(0.2, (ok.length / Math.max(1, kv.length)) * 0.2);
    }
    return Math.min(1, s);
}
export function decideMatchType(score) {
    if (score >= 0.75)
        return 'exact';
    if (score >= 0.5)
        return 'close';
    return 'style';
}
