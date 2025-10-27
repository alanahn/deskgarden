// services/product/providers/static.ts
import type { Provider, ProductHit } from '../types.js';

const INTERNAL_DB: ProductHit[] = [
  {
    title: '로지텍 MX Keys Mini (그라파이트)',
    brand: 'Logitech',
    model: 'MX Keys Mini',
    link: 'https://www.logitech.com/ko-kr/products/keyboards/mx-keys-mini.html',
    image: 'https://assets.logitech.com/mx-keys-mini.jpg',
    priceKRW: 129000,
    source: 'Internal',
    attrs: { layout: '75%', color: 'gray' },
  },
  {
    title: '카멜 모니터암 GMA-2DS (화이트)',
    brand: 'Camel',
    model: 'GMA-2DS',
    link: 'https://brand.naver.com/camel/products/000',
    image: 'https://static.camelarm/img/gma2ds.jpg',
    priceKRW: 89000,
    source: 'Internal',
    attrs: { color: 'white', size: 'dual' },
  },
  // 👉 운영 시 여기 SKU 50~200개 정도로 보강
];

export const StaticCatalogProvider: Provider = {
  async search({ keywords, brand, model }) {
    const q = (keywords.join(' ') + ' ' + (brand || '') + ' ' + (model || '')).toLowerCase();
    return INTERNAL_DB.filter((p) => {
      const t = `${p.title} ${p.brand ?? ''} ${p.model ?? ''}`.toLowerCase();
      return q.split(/\s+/).every((w) => t.includes(w));
    });
  },
};
