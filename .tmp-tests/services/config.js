const cachedEnv = {
    value: null,
    checked: false,
};
function resolveEnv() {
    const sources = [];
    if (typeof process !== "undefined" && process?.env) {
        sources.push(process.env);
    }
    if (typeof import.meta !== "undefined" && import.meta?.env) {
        sources.push((import.meta.env ?? {}));
    }
    if (typeof window !== "undefined" && window?.__ENV__) {
        sources.push((window.__ENV__ ?? {}));
    }
    return new Proxy({}, {
        get: (_, prop) => {
            for (const source of sources) {
                const value = source?.[prop];
                if (typeof value === "string" && value.trim().length > 0) {
                    return value.trim();
                }
            }
            return undefined;
        },
    });
}
const env = resolveEnv();
export function assertAffiliateEnv() {
    if (cachedEnv.checked && cachedEnv.value)
        return cachedEnv.value;
    const accessKey = env.COUPANG_ACCESS_KEY;
    const secretKey = env.COUPANG_SECRET_KEY;
    const partnerId = env.COUPANG_PARTNER_ID;
    if (!accessKey || !secretKey) {
        const message = "Coupang Partners API credentials missing. Set COUPANG_ACCESS_KEY and COUPANG_SECRET_KEY in your environment.";
        // eslint-disable-next-line no-console
        console.warn(`[AFFILIATE_ENV] ${message}`);
        throw new Error(message);
    }
    const resolved = {
        accessKey,
        secretKey,
        partnerId: partnerId || undefined,
    };
    cachedEnv.value = resolved;
    cachedEnv.checked = true;
    // eslint-disable-next-line no-console
    console.log(`[AFFILIATE_ENV] Coupang credentials resolved (partnerId: ${resolved.partnerId ?? "none"})`);
    return resolved;
}
export function getApiBaseUrl() {
    const explicit = env.VITE_API_BASE ?? env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE;
    if (explicit && explicit.trim().length > 0)
        return explicit.trim();
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }
    if (typeof process !== "undefined" && process.env?.VITE_DEV_SERVER_URL) {
        return process.env.VITE_DEV_SERVER_URL;
    }
    return "";
}
