const envSources = [
  typeof import.meta !== "undefined" ? (import.meta as any).env : undefined,
  typeof process !== "undefined" ? process.env : undefined,
] as const;

const truthyValues = new Set(["1", "true", "yes", "y", "on"]);
const falsyValues = new Set(["0", "false", "no", "n", "off"]);

function readEnv(key: string): string | undefined {
  for (const source of envSources) {
    if (!source || typeof source !== "object") continue;
    const raw = (source as Record<string, unknown>)[key];
    if (raw === undefined || raw === null) continue;
    if (typeof raw === "string") return raw;
    if (typeof raw === "number") return String(raw);
    if (typeof raw === "boolean") return raw ? "true" : "false";
  }
  return undefined;
}

function parseBoolean(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (rawValue === undefined) return defaultValue;
  const normalized = rawValue.trim().toLowerCase();
  if (truthyValues.has(normalized)) return true;
  if (falsyValues.has(normalized)) return false;
  return defaultValue;
}

/**
 * Feature flag: disable AI recommendations & hotspots when true.
 * Defaults to `true` so the functionality stays hidden unless explicitly enabled.
 */
export const RECOMMENDATIONS_DISABLED = parseBoolean(readEnv("VITE_DISABLE_RECO"), true);

export const RECOMMENDATIONS_ENABLED = !RECOMMENDATIONS_DISABLED;

export function isRecommendationsDisabled(): boolean {
  return RECOMMENDATIONS_DISABLED;
}

export function isRecommendationsEnabled(): boolean {
  return RECOMMENDATIONS_ENABLED;
}
