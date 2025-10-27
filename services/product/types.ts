import type { ProductSource } from "../types.js";

export interface ExtractedItem {
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  keywords: string[];
  attrs?: Record<string, string | number | boolean>;
}

export interface ProductHit {
  title: string;
  brand?: string;
  model?: string;
  link: string;
  image?: string;
  priceKRW?: number;
  source?: ProductSource;
  attrs?: Record<string, string | number | boolean>;
}

export interface Provider {
  search(input: {
    keywords: string[];
    brand?: string;
    model?: string;
    category?: string;
  }): Promise<ProductHit[]>;

  searchSimilar?(input: {
    name?: string;
    category?: string;
  }): Promise<Array<Pick<ProductHit, 'title' | 'link' | 'image'> & { inStock?: boolean }>>;
}
