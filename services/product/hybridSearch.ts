// services/product/hybridSearch.ts
import type { ExtractedItem, ProductHit, Provider } from './types.js';

export async function hybridSearch(item: ExtractedItem, providers: Provider[]): Promise<ProductHit[]> {
  const tasks = providers.map(p =>
    p.search({
      keywords: item.keywords,
      brand: item.brand,
      model: item.model,
      category: item.category,
    })
  );
  const settled = await Promise.allSettled(tasks);
  const rows: ProductHit[] = [];
  for (const r of settled) if (r.status === 'fulfilled') rows.push(...r.value);
  // 링크 기준 중복 제거
  const seen = new Set<string>();
  return rows.filter(r => (seen.has(r.link) ? false : (seen.add(r.link), true)));
}
