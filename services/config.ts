import type { AffiliateEnv } from "./affiliates/types.js";

type EnvSource = Record<string, string | undefined>;

const cachedEnv: { value: AffiliateEnv | null; checked: boolean } = {
  value: null,
  checked: false,
};

function resolveEnv(): EnvSource {
  const sources: EnvSource[] = [];

  if (typeof process !== "undefined" && process?.env) {
    sources.push(process.env as EnvSource);
  }

  if (typeof import.meta !== "undefined" && (import.meta as any)?.env) {
    sources.push(((import.meta as any).env ?? {}) as EnvSource);
  }

  if (typeof window !== "undefined" && (window as any)?.__ENV__) {
    sources.push(((window as any).__ENV__ ?? {}) as EnvSource);
  }

  return new Proxy(
    {},
    {
      get: (_, prop: string) => {
        for (const source of sources) {
          const value = source?.[prop];
          if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
          }
        }
        return undefined;
      },
    },
  ) as EnvSource;
}

const env = resolveEnv();

export function assertAffiliateEnv(): AffiliateEnv {
  if (cachedEnv.checked && cachedEnv.value) return cachedEnv.value;
  const accessKey = env.COUPANG_ACCESS_KEY;
  const secretKey = env.COUPANG_SECRET_KEY;
  const partnerId = env.COUPANG_PARTNER_ID;

  if (!accessKey || !secretKey) {
    const message =
      "Coupang Partners API credentials missing. Set COUPANG_ACCESS_KEY and COUPANG_SECRET_KEY in your environment.";
    // eslint-disable-next-line no-console
    console.warn(`[AFFILIATE_ENV] ${message}`);
    throw new Error(message);
  }

  const resolved: AffiliateEnv = {
    accessKey,
    secretKey,
    partnerId: partnerId || undefined,
  };

  cachedEnv.value = resolved;
  cachedEnv.checked = true;
  // eslint-disable-next-line no-console
  console.log(
    `[AFFILIATE_ENV] Coupang credentials resolved (partnerId: ${resolved.partnerId ?? "none"})`,
  );
  return resolved;
}

export function getApiBaseUrl(): string {
  const explicit = env.VITE_API_BASE ?? env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE;
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof process !== "undefined" && process.env?.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL;
  }
  return "";
}
