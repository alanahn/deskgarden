export async function hybridSearch(item, providers) {
    const tasks = providers.map(p => p.search({
        keywords: item.keywords,
        brand: item.brand,
        model: item.model,
        category: item.category,
    }));
    const settled = await Promise.allSettled(tasks);
    const rows = [];
    for (const r of settled)
        if (r.status === 'fulfilled')
            rows.push(...r.value);
    // 링크 기준 중복 제거
    const seen = new Set();
    return rows.filter(r => (seen.has(r.link) ? false : (seen.add(r.link), true)));
}
