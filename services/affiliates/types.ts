export interface AffiliateProduct {
  productName: string;
  imageURL: string;
  purchaseURL: string;
  price?: number | null;
  isAffiliate: boolean;
  inStock: boolean;
  platform: string;
  raw?: unknown;
}

export interface ProductSearchQuery {
  query: string;
  mustTokens?: string[];
  limit?: number;
}

export interface AffiliateProvider {
  search(input: ProductSearchQuery): Promise<AffiliateProduct[]>;
  deeplink(url: string): Promise<string>;
}

export interface AffiliateEnv {
  accessKey: string;
  secretKey: string;
  partnerId?: string;
}
