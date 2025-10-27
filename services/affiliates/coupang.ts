import { assertAffiliateEnv } from "../config.js";
import type {
  AffiliateProduct,
  AffiliateProvider,
  ProductSearchQuery,
  AffiliateEnv,
} from "./types.js";

const API_HOST = "https://api-gateway.coupang.com";
const SEARCH_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
const DEEPLINK_PATH =
  "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

const SOLDOUT_KEYWORDS = ["품절", "판매 중인 상품이 아닙니다", "이미지 준비 중"];

type FetchOptions = {
  method: "GET" | "POST";
  path: string;
  query?: URLSearchParams;
  body?: string;
  headers?: Record<string, string>;
};

async function createSignature(secretKey: string, message: string): Promise<string> {
  if (typeof globalThis !== "undefined" && (globalThis as any)?.crypto?.subtle) {
    const subtle = (globalThis as any).crypto.subtle;
    const encoder = new TextEncoder();
    const key = await subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBuffer = await subtle.sign("HMAC", key, encoder.encode(message));
    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const { createHmac } = await import("node:crypto");
  return createHmac("sha256", secretKey).update(message).digest("hex");
}

async function buildSignature(env: AffiliateEnv, opts: FetchOptions, timestamp: string) {
  const { method, path, query, body } = opts;
  const queryString = query?.toString() ?? "";
  const message = `${timestamp}\n${method}\n${path}\n${queryString}\n${body ?? ""}`;
  const signature = await createSignature(env.secretKey, message);
  const authorization = `CEA algorithm=HmacSHA256, access-key=${env.accessKey}, signed-date=${timestamp}, signature=${signature}`;
  return { authorization };
}

async function coupangFetch<T>(opts: FetchOptions): Promise<T> {
  const env = assertAffiliateEnv();
  const timestamp = String(Date.now());
  const queryString = opts.query?.toString();
  const url = `${API_HOST}${opts.path}${queryString ? `?${queryString}` : ""}`;

  const { authorization } = await buildSignature(env, opts, timestamp);

  const res = await fetch(url, {
    method: opts.method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      "X-EXTENDED-TIMESTAMP": timestamp,
      ...opts.headers,
    },
    body: opts.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coupang API ${opts.path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

function includesAllTokens(value: string, tokens: string[]): boolean {
  const lower = value.toLowerCase();
  return tokens.every((token) => lower.includes(token.toLowerCase()));
}

function isValidProduct(raw: any, tokens: string[] = []): boolean {
  const link: string = raw?.productUrl ?? raw?.productUrlMobile ?? "";
  const image: string = raw?.productImage ?? raw?.productImageMobile ?? "";
  const name: string = raw?.productName ?? "";

  if (!link || !image || !name) return false;
  const hostname = (() => {
    try {
      return new URL(link).hostname;
    } catch {
      return "";
    }
  })();
  if (!hostname.endsWith("coupang.com")) return false;
  const textBlob = `${name} ${raw?.sellerName ?? ""} ${raw?.vendorName ?? ""}`;
  const containsSoldOut = SOLDOUT_KEYWORDS.some((kw) =>
    textBlob.includes(kw),
  );
  if (containsSoldOut) return false;
  if (tokens.length && !includesAllTokens(name, tokens)) return false;
  return true;
}

async function searchProducts(
  query: ProductSearchQuery,
  env: AffiliateEnv,
): Promise<AffiliateProduct[]> {
  const params = new URLSearchParams({
    keyword: query.query,
    sort: "scoreDesc",
    limit: String(query.limit ?? 10),
  });
  if (env.partnerId) params.set("subId", env.partnerId);

  // eslint-disable-next-line no-console
  console.log(
    `[COUPANG_API] search="${query.query}" tokens=${(query.mustTokens ?? []).join(",")}`,
  );

  type SearchResponse = {
    data?: Array<{
      productName?: string;
      productUrl?: string;
      productImage?: string;
      price?: number;
    }>;
  };

  const raw = await coupangFetch<SearchResponse>({
    method: "GET",
    path: SEARCH_PATH,
    query: params,
  });

  const items = raw?.data ?? [];
  const tokens = query.mustTokens ?? [];

  return items
    .filter((item) => isValidProduct(item, tokens))
    .map((item) => ({
      productName: item.productName ?? query.query,
      imageURL: item.productImage ?? "",
      purchaseURL: item.productUrl ?? "",
      price: item.price ?? null,
      isAffiliate: true,
      inStock: true,
      platform: "Coupang",
      raw: item,
    }));
}

async function buildDeeplink(url: string, env: AffiliateEnv): Promise<string> {
  if (!url) return url;

  type DeeplinkResponse = {
    data?: Array<{ shortenUrl?: string; url?: string }>;
  };

  const body = JSON.stringify({
    coupangUrls: [url],
    subId: env.partnerId,
  });

  const response = await coupangFetch<DeeplinkResponse>({
    method: "POST",
    path: DEEPLINK_PATH,
    body,
  });

  const deeplink =
    response?.data?.[0]?.shortenUrl ?? response?.data?.[0]?.url ?? url;
  // eslint-disable-next-line no-console
  console.log(`[DEEPLINK_OK] ${url} -> ${deeplink}`);
  return deeplink;
}

export const CoupangProvider: AffiliateProvider = {
  async search(query) {
    try {
      const env = assertAffiliateEnv();
      const results = await searchProducts(query, env);
      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[COUPANG_API] search failed", error);
      return [];
    }
  },
  async deeplink(url: string) {
    try {
      const env = assertAffiliateEnv();
      return await buildDeeplink(url, env);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("[COUPANG_API] deeplink failed", error);
      return url;
    }
  },
};
