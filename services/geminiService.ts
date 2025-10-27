// services/types.ts
export type PredefinedDeskStyle = 'modern' | 'minimal' | 'cozy' | 'gamer';

// services/geminiService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// services/geminiService.ts (수정본 - 맨 위 import)
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type {
  Consultation,
  Item,
  DeskStyle,
} from "./types.js";         // ✅ 경로 ./types
import { API_KEY_ERROR_MESSAGE } from "../components/constants.js";
import { buildExtractedItems } from "./product/extract.js";
import { attachProducts } from "./product/attachProducts.js";
import { StaticCatalogProvider } from "./product/providers/static.js";
import { safeParseJson } from "../utils/safeJson.js";
import { normalizeAfter, type NormalizeLimits } from "../utils/normalize.js";
import { normalizeHotspotLayout, clampPoint, clamp01 } from "../utils/hotspot.js";
import { normalizeConsultation } from "../utils/normalizeConsultation.js";
import { parsePrice } from "../utils/price.js";
import { RECOMMENDATIONS_DISABLED } from "../utils/featureFlags.js";



/* =====================================================================================
 *  0) API 키 로드 (Vite/Node 겸용)  —  이 블록 하나만 유지 (중복 선언 금지)
 * ===================================================================================== */
const API_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY) ??
  (typeof process !== "undefined"
    ? process.env.VITE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
    : undefined);

if (!API_KEY) {
  console.error(API_KEY_ERROR_MESSAGE);
  throw new Error("Gemini API 키(VITE_GEMINI_API_KEY)가 설정되지 않았습니다.");
}

/** Gemini 클라이언트 — 단 한 번만 생성 */
const ai = new GoogleGenAI({ apiKey: API_KEY });

/** (선택) 개발용 로그 프리픽스 — 키 앞 6자리만 */
try {
  // 브라우저/서버 어디서든 에러 안 나게 방어
  // eslint-disable-next-line no-console
  console.log("[AI] KEY:", (API_KEY ?? "").slice(0, 6));
} catch { /* noop */ }

const DEFAULT_AFTER_LIMITS: NormalizeLimits = Object.freeze({
  sentenceMin: 10,
  sentenceMax: 14,
  charMax: 800,
  itemMin: 5,
  itemMax: 7,
});

const STRICT_AFTER_LIMITS: NormalizeLimits = Object.freeze({
  sentenceMin: 9,
  sentenceMax: 12,
  charMax: 600,
  itemMin: 5,
  itemMax: 5,
});

/* =====================================================================================
 *  1) 스키마 정의
 * ===================================================================================== */
const consultationItemSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: "아이템 고유 ID, 예: 'item-1'" },
    name: { type: Type.STRING, description: "아이템 이름 (실제 제품명)" },
    isNewItem: {
      type: Type.BOOLEAN,
      description: "반드시 true (새로 추가된 아이템만 포함)",
    },
    hotspotCoordinates: {
      type: Type.OBJECT,
      description: "After 이미지에서 아이템 중심 좌표. x, y는 0.0~1.0 범위.",
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
      },
      required: ["x", "y"],
    },
    description: {
      type: Type.STRING,
      description: "짧고 매력적인 설명 (한국어)",
    },
    price: {
      type: Type.INTEGER,
      description: "예상 가격 (KRW). 현실적 범위.",
    },
    category: {
      type: Type.STRING,
      description: "카테고리. 예: '책상조명', '모니터받침대', '케이블정리'",
    },
    productName: {
      type: Type.STRING,
      description: "제품 고유 이름 (표시용)",
    },
    productCategory: {
      type: Type.STRING,
      description: "제품 카테고리 (표시/정렬용)",
    },
    purchaseURL: {
      type: Type.STRING,
      description: "실제 구매 가능한 상품 URL (https://, Coupang/SmartStore/Amazon)",
    },
    imageURL: {
      type: Type.STRING,
      description: "상품 대표 이미지 URL (https://)",
    },
    purchaseLinkUrl: {
      type: Type.STRING,
      description: "레거시 호환용 (가능하면 사용 X)",
    },
    imageUrl: {
      type: Type.STRING,
      description: "레거시 호환용 (가능하면 사용 X)",
    },
  },
  required: [
    "id",
    "name",
    "productName",
    "isNewItem",
    "hotspotCoordinates",
    "description",
    "price",
    "category",
    "productCategory",
    "purchaseURL",
    "imageURL",
  ],
} as const;

const consultationPayloadProperties = {
  styleSummary: {
    type: Type.STRING,
    description:
      "2~3문장 요약 (한국어). 새로운 책상 스타일의 핵심 특징과 분위기를 간단히 설명.",
  },
  afterImageDescription: {
    type: Type.STRING,
    description:
      "10~14문장 소설형 묘사 (한국어). 전체 길이는 800자 이하. 'After' 책상 장면을 사진처럼 상세하게 설명. 구도 유지, 재질·질감·빛·그림자·배치·분위기를 구체적으로 담을 것.",
  },
  beforeImageAnalysis: {
    type: Type.STRING,
    description: "1~2문장 (한국어). 'Before' 책상의 특징을 간결히 요약.",
  },
  improvementPoints: {
    type: Type.STRING,
    description: "2~3개 구체적 개선 포인트 (한국어). 불릿 또는 짧은 단락.",
  },
  rearrangementRecommendation: {
    type: Type.STRING,
    description: "1~2문장 (한국어). 기존 아이템 재배치 제안.",
  },
  changedDeskAnalysis: {
    type: Type.STRING,
    description: "1~2문장 (한국어). 변화 요약, 개선된 점을 간단히 설명.",
  },
  changedItems: {
    type: Type.ARRAY,
    description:
      "After 이미지에서 새로 추가된 5~7개 아이템. 의미 있는 개선점만 포함. isNewItem=true 필수. 실제 쿠팡/아마존/스마트스토어 링크 포함.",
    items: consultationItemSchema,
  },
  summary: {
    type: Type.STRING,
    description: "styleSummary와 동일한 2~3문장 요약 (한국어).",
  },
  items: {
    type: Type.ARRAY,
    description: "changedItems와 동일한 아이템 목록. 최소한 id와 name을 포함.",
    items: {
      ...consultationItemSchema,
      required: ["id", "name"],
    },
  },
} as const;

const consultationPayloadRequired = [
  "styleSummary",
  "afterImageDescription",
  "beforeImageAnalysis",
  "improvementPoints",
  "rearrangementRecommendation",
  "changedDeskAnalysis",
  "changedItems",
  "summary",
  "items",
] as const;

const responseSchema = {
  type: Type.OBJECT,
  description: "AI consultation response must be wrapped inside the 'consultation' property.",
  properties: {
    consultation: {
      type: Type.OBJECT,
      description: "Structured consultation payload.",
      properties: consultationPayloadProperties,
      required: [...consultationPayloadRequired],
    },
  },
  required: ["consultation"],
} as const;
export { responseSchema as consultationSchema };

const CONSULTATION_MODEL_CONFIG = Object.freeze({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema,
    maxOutputTokens: 1024,
    temperature: 0.25,
    topP: 0.9,
    candidateCount: 1,
  },
});

const LENGTH_DIRECTIVE =
  "styleSummary ≤ 300 chars; afterImageDescription ≤ 800 chars; changedItems/items must be 5–7 entries.";
const JSON_GUARD_BASE =
  `${LENGTH_DIRECTIVE} Return ONLY one JSON object with top-level key 'consultation'. No markdown fences or extra text.`;
const JSON_GUARD_STRICT =
  `${LENGTH_DIRECTIVE} Only JSON. Absolutely no extra characters. Keep response under 800 tokens. Top-level key must be 'consultation'.`;

type GeminiMessage = { role: "user" | "model"; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };

function extractInlineData(imageBase64?: string) {
  if (!imageBase64) return null;
  const match = String(imageBase64).match(/data:(image\/[a-z0-9.+-]+);base64,/i);
  const mimeType = match?.[1] ?? "image/jpeg";
  const data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  return { mimeType, data }; 
}

function buildUserMessage(prompt: string, imageBase64?: string): GeminiMessage {
  const parts: GeminiMessage["parts"] = [];
  const inlineData = extractInlineData(imageBase64);
  if (inlineData) parts.push({ inlineData });
  if (prompt?.trim()) parts.push({ text: prompt });
  return { role: "user", parts };
}

/* =====================================================================================
 *  2) 반환 타입
 * ===================================================================================== */
export type AiConsultationResponse = Omit<
  Consultation,
  | "id"
  | "userId"
  | "timestamp"
  | "beforeImageUrl"
  | "afterImageUrl"
  | "style"
  | "likeCount"
  | "commentCount"
  | "comments"
  | "isLikedByCurrentUser"
> & {
  items?: Item[];
};

/* =====================================================================================
 *  3) 유틸 함수들
 * ===================================================================================== */

/** 브라우저에서 큰 이미지를 축소 (전송/요금/속도 최적화) */
export async function resizeImageForAI(base64: string, maxSize = 1280): Promise<string> {
  try {
    // 런타임이 브라우저일 때만 동작
    if (typeof window === "undefined") return base64;

    const img = new Image();
    img.src = base64;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    if (scale >= 1) return base64;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return base64;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return base64;
  }
}

/** 응답에서 텍스트를 안전하게 추출 (text() 또는 candidates/parts 모두 지원) */
async function getTextFromResponse(resp: any): Promise<string> {
  try {
    if (typeof resp?.text === "function") {
      const t = await resp.text();
      if (t) return String(t);
    }
    if (resp?.text) return String(resp.text);

    const parts = resp?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const joined = parts
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
      if (joined) return joined;
    }

    // 디버깅 보조
    // eslint-disable-next-line no-console
    console.warn("[AI] No text found in response. First 400 chars:", JSON.stringify(resp).slice(0, 400));
    return "";
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[AI] getTextFromResponse error:", e);
    return "";
  }
}

async function runConsultationModel(
  contents: GeminiMessage[],
  overrides: Partial<typeof CONSULTATION_MODEL_CONFIG.generationConfig> = {},
) {
  const sanitized: GeminiMessage[] = contents.map((original, idx) => {
    const role = original?.role === "model" ? "model" : "user";
    if (original?.role !== role) {
      // eslint-disable-next-line no-console
      console.warn(`[ROLE_VALIDATION] Invalid role detected at index ${idx}: ${String(original?.role)}`);
    }
    const parts = Array.isArray(original?.parts) ? original.parts : [];
    return { role, parts };
  });

  const response = await ai.models.generateContent({
    model: CONSULTATION_MODEL_CONFIG.model,
    contents: sanitized,
    generationConfig: {
      ...CONSULTATION_MODEL_CONFIG.generationConfig,
      ...overrides,
    },
  } as any);
  return response;
}

function harmonizeConsultationPayload(payload: Record<string, unknown>) {
  if (!payload || typeof payload !== "object") return payload;
  const draft = payload as any;

  const summary = typeof draft.summary === "string" ? draft.summary : undefined;
  const styleSummary = typeof draft.styleSummary === "string" ? draft.styleSummary : undefined;
  if (!summary && styleSummary) {
    draft.summary = styleSummary;
  } else if (!styleSummary && summary) {
    draft.styleSummary = summary;
  }

  const items = Array.isArray(draft.items) ? draft.items : undefined;
  const changedItems = Array.isArray(draft.changedItems) ? draft.changedItems : undefined;
  if (!items && changedItems) {
    draft.items = changedItems;
  } else if (!changedItems && items) {
    draft.changedItems = items;
  }

  return payload;
}

export async function generateConsultationJSON(params: {
  base64ImageData: string;
  instruction: string;
  temperature?: number;
  topP?: number;
  contextLabel?: string;
}) {
  const { base64ImageData, instruction, temperature, topP, contextLabel } = params;
  const label = contextLabel ?? "consultation";

  const baseOverrides: Partial<typeof CONSULTATION_MODEL_CONFIG.generationConfig> = {};
  if (typeof temperature === "number") baseOverrides.temperature = temperature;
  if (typeof topP === "number") baseOverrides.topP = topP;

  const buildPrompt = (guard: string) => `${guard}\n\n${instruction}`.trim();

  const attempt = async (
    guard: string,
    extraOverrides: Partial<typeof CONSULTATION_MODEL_CONFIG.generationConfig> = {},
  ) => {
    const response = await runConsultationModel([
      buildUserMessage(buildPrompt(guard), base64ImageData),
    ], {
      ...baseOverrides,
      ...extraOverrides,
    });
    return getTextFromResponse(response);
  };

  const handleParse = (raw: string, stage: "first" | "retry") => {
    const parsed = safeParseJson<{ consultation: Record<string, unknown> }>(raw);
    if ("error" in parsed) {
      const { error, rawHead } = parsed;
      // eslint-disable-next-line no-console
      console.warn(`[AI RAW][services/geminiService.ts:generateConsultationJSON:${stage}] ${label} :: ${rawHead}`);
      // eslint-disable-next-line no-console
      console.warn(
        `[AI PARSE_FAIL][services/geminiService.ts:generateConsultationJSON:${stage}] ${label} :: ${error}`,
      );
      return null;
    }
    return harmonizeConsultationPayload(parsed.data.consultation);
  };

  const firstRaw = await attempt(JSON_GUARD_BASE);
  const firstParsed = handleParse(firstRaw, "first");
  if (firstParsed) return firstParsed;

  const retryRaw = await attempt(JSON_GUARD_STRICT, { temperature: 0.2 });
  const retryParsed = handleParse(retryRaw, "retry");
  if (retryParsed) return retryParsed;

  throw new Error("JSON_OUTER_NOT_FOUND");
}

/** 문장 수 세기 */
export function sentenceCount(s: string): number {
  const m = String(s ?? "").match(/[.!?？！。…]+/g);
  return m ? m.length : 0;
}

/** 이름 표준화 & 중복 제거 */
export function normalizeName(n: string) {
  return String(n ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}
export function dedupeByName<T extends { name?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = normalizeName(it.name);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

/** 점 간 최소거리 & 3×3 분산 보정 */
export function isTooClose(a: { x: number; y: number }, b: { x: number; y: number }, min = 0.12) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < min;
}
export function gridCell({ x, y }: { x: number; y: number }) {
  return `${Math.floor(x * 3)}-${Math.floor(y * 3)}`;
}
export function decluster<T extends { hotspotCoordinates?: { x: number; y: number } }>(items: T[]) {
  const used = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (!it.hotspotCoordinates) continue;
    const cell = gridCell(it.hotspotCoordinates);
    const tooClose = out.some(
      (o) => o.hotspotCoordinates && isTooClose(o.hotspotCoordinates, it.hotspotCoordinates),
    );
    if (!tooClose && !used.has(cell)) {
      used.add(cell);
      out.push(it);
    }
  }
  return out.length >= 2 ? out : items;
}

const NORMALIZED_HOTSPOT_PADDING = 0.05;
const NORMALIZED_HOTSPOT_MIN_DISTANCE = 0.14;
const STYLE_SUMMARY_MAX_CHARS = 300;
const AFTER_DESCRIPTION_MAX_CHARS = 800;
const CHANGED_ITEMS_MAX_COUNT = 7;

/** 가격/카테고리 보정 */
export function clampPrice(v: number) {
  if (!Number.isFinite(v)) return 5000;
  if (v < 5000) return 5000;
  if (v > 1_200_000) return 1_200_000;
  return Math.round(v);
}
const ALLOWED_CATEGORIES = new Set<string>([
  "책상조명",
  "모니터받침대",
  "케이블정리",
  "데스크매트",
  "선반",
  "식물/화분",
  "의자방석",
  "기타",
]);
export function coerceCategory(v: string) {
  const c = String(v ?? "").trim();
  return ALLOWED_CATEGORIES.has(c) ? c : "기타";
}

function clampText(value: string | undefined, maxChars: number, label: string) {
  if (!value) return value;
  const limit = Math.max(0, maxChars);
  const before = value.length;
  if (before <= limit) return value;
  const sliceLength = Math.max(0, limit - 1);
  const truncated = `${value.slice(0, sliceLength).trimEnd()}…`;
  try {
    // eslint-disable-next-line no-console
    console.log(`[LEN_FIX] ${label} ${before} -> ${truncated.length}`);
  } catch {
    /* noop */
  }
  return truncated;
}

const ALLOWED_PURCHASE_DOMAIN_SUFFIXES = [
  "coupang.com",
  "amazon.com",
  "amazon.co",
  "amazon.co.kr",
  "smartstore.naver.com",
] as const;

export function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(String(url ?? "").trim());
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isAllowedPurchaseUrl(url: string): boolean {
  try {
    const parsed = new URL(String(url ?? "").trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_PURCHASE_DOMAIN_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

/** changedItems 유효성 */
export function validateChangedItems(items: any[], opts: { min?: number; max?: number } = {}) {
  const min = opts.min ?? 2;
  const max = opts.max ?? 7;
  if (!Array.isArray(items) || items.length < min || items.length > max) {
    const err: any = new Error("DOT_COUNT");
    err.prevJson = { changedItems: items };
    throw err;
  }
  for (const it of items) {
    if (it?.isNewItem !== true) {
      const err: any = new Error("IS_NEW_FALSE"); err.prevJson = { item: it }; throw err;
    }
    let hotspot = it?.hotspotCoordinates ?? (it?.hotspot ?? null);
    if (!hotspot || typeof hotspot.x !== "number" || typeof hotspot.y !== "number" || !Number.isFinite(hotspot.x) || !Number.isFinite(hotspot.y)) {
      hotspot = { x: 0.5, y: 0.5 };
    } else {
      hotspot = {
        x: clamp01(hotspot.x),
        y: clamp01(hotspot.y),
      };
    }
    it.hotspotCoordinates = hotspot;
    const resolvedName = String(it?.productName ?? it?.name ?? "").trim();
    if (!resolvedName) {
      const err: any = new Error("NAME_MISSING"); err.prevJson = { item: it }; throw err;
    }
    it.productName = resolvedName;
    it.name = resolvedName;
    const parsedPrice = parsePrice(it?.price);
    if (parsedPrice === null || parsedPrice < 0) {
      try {
        // eslint-disable-next-line no-console
        console.warn("[reco] PRICE_INVALID, coercing to null:", it?.price);
      } catch {
        /* noop */
      }
      it.price = null;
    } else {
      it.price = parsedPrice;
    }
    const resolvedCategory = String(it?.productCategory ?? it?.category ?? "").trim();
    if (!resolvedCategory) {
      const err: any = new Error("CATEGORY_MISSING"); err.prevJson = { item: it }; throw err;
    }
    it.productCategory = resolvedCategory;
    it.category = resolvedCategory;
    const purchaseUrl = String(it?.purchaseURL ?? it?.purchaseLinkUrl ?? "").trim();
    if (!purchaseUrl || !isAllowedPurchaseUrl(purchaseUrl)) {
      const err: any = new Error("PURCHASE_URL_INVALID"); err.prevJson = { item: it }; throw err;
    }
    const imageUrl = String(it?.imageURL ?? it?.imageUrl ?? "").trim();
    if (!imageUrl || !isHttpsUrl(imageUrl)) {
      const err: any = new Error("IMAGE_URL_INVALID"); err.prevJson = { item: it }; throw err;
    }
  }
}

/* =====================================================================================
 *  4) 프롬프트 빌더
 * ===================================================================================== */
export function buildUserInstruction(style: DeskStyle, userPrompt: string) {
  const userContext = userPrompt?.trim()
    ? `\n---\n**CRITICAL USER INPUT - MUST FOLLOW**\n<user_request>\n${userPrompt}\n</user_request>\n---\n`
    : "";

  const HINT = `
-[Answer Shape Hints]
- styleSummary: 2~3문장 (한국어, 300자 이하)
- summary: styleSummary와 동일한 2~3문장 (한국어, 300자 이하)
- afterImageDescription: 10~14문장, 전체 글자수 800자 이하 (현실적인 디테일 포함)
- changedItems: 5~7개 (isNewItem=true, hotspotCoordinates {x:0~1, y:0~1}, 설명/가격/productName/productCategory/purchaseURL/imageURL 포함)
- items: changedItems와 동일 목록, 최소 id/name 포함
- purchaseURL: https:// 로 시작하며 coupang.com / amazon.com / amazon.co.kr / smartstore.naver.com 도메인
- imageURL: 실제 상품 사진(https://) — AI가 생성할 After 이미지에서도 동일 제품이 보이도록 묘사
- 한 물리 개체에는 점 1개만. 3×3 가상 격자 기준 분산. 빈 공간/배경/잘린 영역 금지.
`;

  const CHECK = `
[Validation Checklist]
- 모든 텍스트는 한국어.
- summary: styleSummary와 동일한 2–3문장, 300자 이하.
- styleSummary: 2–3문장, 300자 이하.
- afterImageDescription: 10–14문장, 전체 800자 이하, 동일 구도, 현실적인 미세 디테일 포함.
- changedItems: 5–7개, isNewItem=true, 점 분산, 좌표는 [0,1].
- items: changedItems와 동일 목록, 최소 id/name 포함.
- 모든 아이템은 실제 판매 중인 제품으로, 정확한 이름/카테고리/금액/purchaseURL/imageURL 포함.
- productName과 productCategory를 채우고 name/category와 일치시킬 것.
- purchaseURL은 https://, coupang.com / amazon.com / amazon.co.kr / smartstore.naver.com 도메인.
- imageURL은 해당 실제 제품 사진(https://).
- user_request가 있으면 무조건 우선 적용.
`;

  return `
You are an expert desk interior consultant called '책상정원 AI'.
Your job: analyze the user's "before" desk photo and return a structured JSON consultation for style '${style}'.

${userContext}
핵심 목표:
- afterImageDescription: '${style}' 스타일로 확실한 변화 (10~14문장, 소설 같은 묘사, 총 800자 이하)
- changedItems: 5~7개 핵심 아이템 (핫스팟 + 실존 제품 정보)
- styleSummary: 짧고 매력적인 요약 (2~3문장, 300자 이하)
- before/after 분석, 개선 포인트, 재배치 제안: 간결하게 (1–2문장)
- 실제 판매 중인 제품만 선택. 정확한 productName/productCategory/purchaseURL/imageURL 제공.
- For styleSummary: keep within 300 characters. For afterImageDescription: write 10–14 sentences, <= 800 characters total. For changedItems: return 5–7 items. Do NOT exceed these limits. No markdown fences or extra text.
- Use real products currently sold online. Include correct names, categories, and attach valid purchase URLs from Coupang or Amazon. The generated image should visually match those items.

핫스팟 규칙:
- 같은 물체에 점 1개만.
- 중앙 몰림 금지. 3×3 격자 분산.
- 빈 공간/벽/창문/배경/그림자/잘린 영역 금지.
- 크고 중요한 아이템, 지저분했던 영역 중심.

출력 형식:
- Return ONLY a single JSON object with the exact top-level key 'consultation'. No markdown fences, no commentary.
- 최상위 키는 consultation 이어야 하며, 그 안에 모든 필드를 채운다.
- Schema를 반드시 준수.

${HINT}
${CHECK}
`.trim();
}

export function buildCritiqueInstruction(reason: string, prevJson: any) {
  return `
Your previous JSON failed validation because: ${reason}.
You must FIX ONLY what is invalid. Keep valid parts unchanged.

Strict rules:
- Language: Korean only.
- styleSummary: 2–3문장, 300자 이하.
- afterImageDescription: 10–14문장, 총 800자 이하.
- changedItems: 5–7개, isNewItem=true.
- hotspotCoordinates (x,y): 0.0–1.0 사이.
- 점 분산 (중앙 몰림 금지).
- 모든 아이템은 실제 판매 제품. purchaseURL/imageURL 필수.
- productName/productCategory 필수 (name/category와 동일 의미).
- purchaseURL은 https://, coupang.com / amazon.com / amazon.co.kr / smartstore.naver.com 도메인.
- The generated image must visually match the listed real products.
- Do NOT exceed the sentence/item limits. No markdown fences or extra text.
- Return ONLY a single JSON object with the exact top-level key 'consultation'. No markdown fences, no commentary.
- 최상위 키는 consultation 이어야 하며, 모든 필드를 채운다.

Previous JSON (for reference):
${JSON.stringify(prevJson).slice(0, 6000)}
`.trim();
}

/* =====================================================================================
 *  5) 컨설팅 호출 + 검증 파이프라인
 * ===================================================================================== */

export const getAiConsultation = async (
  base64ImageData: string,
  style: DeskStyle,
  userPrompt: string,
): Promise<AiConsultationResponse> => {
  // 브라우저면 축소, 서버면 그대로
  const resized = await resizeImageForAI(base64ImageData, 1280);

  let parsed: any;
  try {
    parsed = await generateConsultationJSON({
      base64ImageData: resized,
      instruction: buildUserInstruction(style, userPrompt),
      contextLabel: "initial",
    });
  } catch (e: any) {
    const hint = e?.message || e?.status || e?.code || "unknown";
    // eslint-disable-next-line no-console
    console.error("[AI] 1st call failed:", e);
    throw new Error(`AI 응답 생성 중 오류: ${hint}`);
  }

  // 후처리 + 검증
  const postProcess = async (payload: any, limits: NormalizeLimits = DEFAULT_AFTER_LIMITS) => {
    const normalizedRaw = normalizeAfter(payload, limits);
    const baseNormalized: any = {
      ...normalizedRaw,
      styleSummary: clampText(normalizedRaw.styleSummary, STYLE_SUMMARY_MAX_CHARS, "styleSummary"),
      afterImageDescription: clampText(
        normalizedRaw.afterImageDescription,
        Math.min(AFTER_DESCRIPTION_MAX_CHARS, limits.charMax ?? AFTER_DESCRIPTION_MAX_CHARS),
        "afterImageDescription",
      ),
    };
    harmonizeConsultationPayload(baseNormalized);
    const normalizedWrapper = normalizeConsultation({ consultation: baseNormalized });
    const normalized = normalizedWrapper.consultation ?? normalizedWrapper;
    if (Array.isArray(normalized.changedItems) && normalized.changedItems.length > CHANGED_ITEMS_MAX_COUNT) {
      const trimmed = normalized.changedItems.slice(0, CHANGED_ITEMS_MAX_COUNT);
      normalized.changedItems = trimmed;
      try {
        // eslint-disable-next-line no-console
        console.log(`[LEN_FIX] changedItems ${normalized.changedItems.length} -> ${trimmed.length}`);
      } catch {
        /* noop */
      }
    }

    if (sentenceCount(normalized?.styleSummary || "") < 2) {
      throw Object.assign(new Error("LEN_SUMMARY"), { prevJson: normalized });
    }

    const desc = String(normalized.afterImageDescription ?? "").trim();
    const minSent = limits.sentenceMin ?? DEFAULT_AFTER_LIMITS.sentenceMin ?? 10;
    const maxSent = limits.sentenceMax ?? DEFAULT_AFTER_LIMITS.sentenceMax ?? 14;
    const charMax = limits.charMax ?? DEFAULT_AFTER_LIMITS.charMax ?? 800;
    const descSentenceCount = sentenceCount(desc);

    if (!desc || descSentenceCount < minSent || descSentenceCount > maxSent || desc.length > charMax) {
      throw Object.assign(new Error("LEN_AFTER"), { prevJson: normalized });
    }

    const itemMin = limits.itemMin ?? DEFAULT_AFTER_LIMITS.itemMin ?? 5;
    const itemMax = limits.itemMax ?? DEFAULT_AFTER_LIMITS.itemMax ?? 7;
    let items = Array.isArray(normalized.changedItems) ? [...normalized.changedItems] : [];

    if (RECOMMENDATIONS_DISABLED) {
      items = [];
    } else {
      validateChangedItems(items, { min: itemMin, max: itemMax });
      items = dedupeByName(items);
      items = decluster(items);

      items = items.filter((it: any) => {
        const parsed =
          parsePrice(it?.price) ??
          parsePrice(it?.priceKRW) ??
          parsePrice(it?.linkedProduct?.priceKRW) ??
          parsePrice(it?.linkedProduct?.price);
        if (parsed === null || parsed < 0) {
          try {
            // eslint-disable-next-line no-console
            console.warn("[reco] PRICE_INVALID, dropping item:", it?.price);
          } catch {
            /* noop */
          }
          return false;
        }
        it.price = parsed;
        return true;
      });

      if (items.length > 0) {
        const hotspotLayout = normalizeHotspotLayout(
          items.map((it: any) => ({
            point: it?.hotspotCoordinates,
            box: it?.boundingBox,
          })),
          {
            padding: NORMALIZED_HOTSPOT_PADDING,
            minDistance: NORMALIZED_HOTSPOT_MIN_DISTANCE,
          },
        );

        items = items
          .map((it: any, i: number) => {
            const purchaseURL = String(it.purchaseURL ?? it.purchaseLinkUrl ?? "").trim();
            const imageURL = String(it.imageURL ?? it.imageUrl ?? "").trim();
            const productName = String(it.productName ?? it.name ?? "").trim();
            const productCategoryRaw = String(it.productCategory ?? it.category ?? "").trim();
            const normalizedCategory = coerceCategory(productCategoryRaw || "기타");
            const parsedPrice = parsePrice(it.price);
            if (parsedPrice === null || parsedPrice < 0) {
              try {
                // eslint-disable-next-line no-console
                console.warn("[reco] PRICE_INVALID after normalization, dropping item:", it?.price);
              } catch {
                /* noop */
              }
              return null;
            }
            const hotspot = hotspotLayout.points[i] ?? clampPoint(it.hotspotCoordinates ?? { x: 0.5, y: 0.5 });
            const normalizedBox = hotspotLayout.boxes[i] ?? null;
            return {
              ...it,
              id: it.id ?? `item-${i + 1}`,
              price: clampPrice(parsedPrice),
              name: productName,
              productName,
              category: normalizedCategory,
              productCategory: productCategoryRaw || normalizedCategory,
              purchaseURL,
              imageURL,
              purchaseLinkUrl: purchaseURL,
              imageUrl: imageURL,
              sellerId: "ai-recommendation",
              hotspotCoordinates: hotspot,
              boundingBox: normalizedBox ?? undefined,
            } as Item;
          })
          .filter((candidate): candidate is Item => Boolean(candidate));

        if (items.length > 0) {
          await attachProducts(items, {
            extracted: buildExtractedItems(desc, items),
            providers: [StaticCatalogProvider],
          });

          items = items
            .map((it: any, idx: number) => {
              const purchaseURL = String(it.purchaseURL ?? it.purchaseLinkUrl ?? it.linkedProduct?.link ?? "").trim();
              const imageURL = String(it.imageURL ?? it.imageUrl ?? it.linkedProduct?.image ?? "").trim();
              const productName = String(it.productName ?? it.name ?? it.linkedProduct?.title ?? "").trim();
              const productCategoryRaw = String(it.productCategory ?? it.category ?? it.linkedProduct?.category ?? "").trim();
              const normalizedCategory = coerceCategory(productCategoryRaw || "기타");
              const priceSource =
                parsePrice(it.linkedProduct?.priceKRW) ??
                parsePrice(it.linkedProduct?.price) ??
                parsePrice(it.price);
              if (priceSource === null || priceSource < 0) {
                try {
                  // eslint-disable-next-line no-console
                  console.warn("[reco] PRICE_INVALID after enrichment, dropping item:", it?.linkedProduct?.priceKRW ?? it?.price);
                } catch {
                  /* noop */
                }
                return null;
              }
              const hotspot = clampPoint(it.hotspotCoordinates ?? hotspotLayout.points[idx] ?? { x: 0.5, y: 0.5 });
              const normalizedBox = hotspotLayout.boxes[idx] ?? it.boundingBox ?? null;
              return {
                ...it,
                price: clampPrice(priceSource),
                name: productName,
                productName,
                category: normalizedCategory,
                productCategory: productCategoryRaw || normalizedCategory,
                purchaseURL,
                purchaseLinkUrl: purchaseURL,
                imageURL,
                imageUrl: imageURL,
                sellerId: it.sellerId ?? "ai-recommendation",
                hotspotCoordinates: hotspot,
                boundingBox: normalizedBox ?? undefined,
              } as Item;
            })
            .filter((candidate): candidate is Item => Boolean(candidate));
        }
      }

      if (items.length > CHANGED_ITEMS_MAX_COUNT) {
        const trimmedItems = items.slice(0, CHANGED_ITEMS_MAX_COUNT);
        try {
          // eslint-disable-next-line no-console
          console.log(`[LEN_FIX] recommendedItems ${items.length} -> ${trimmedItems.length}`);
        } catch {
          /* noop */
        }
        items = trimmedItems;
      }
    }

    normalized.items = items;
    normalized.changedItems = items;

    const output: any = {
      ...normalized,
      summary: normalized.summary ?? normalized.styleSummary,
      items,
      recommendedItems: items,
    };
    delete output.changedItems;

    output.styleSummary = clampText(output.styleSummary, STYLE_SUMMARY_MAX_CHARS, "styleSummary");
    output.summary = clampText(output.summary, STYLE_SUMMARY_MAX_CHARS, "summary");
    output.afterImageDescription = clampText(
      output.afterImageDescription,
      Math.min(AFTER_DESCRIPTION_MAX_CHARS, limits.charMax ?? AFTER_DESCRIPTION_MAX_CHARS),
      "afterImageDescription",
    );

    let normalizedOutput = normalizeConsultation(output) as AiConsultationResponse;
    if ((normalizedOutput as any)?.consultation) {
      normalizedOutput = (normalizedOutput as any).consultation;
    }

    if (!Array.isArray(normalizedOutput.items)) normalizedOutput.items = [];
    if (!Array.isArray(normalizedOutput.recommendedItems)) {
      normalizedOutput.recommendedItems = normalizedOutput.items;
    }

    if (RECOMMENDATIONS_DISABLED) {
      normalizedOutput.items = [];
      normalizedOutput.recommendedItems = [];
    }

    if (normalizedOutput.items.length > CHANGED_ITEMS_MAX_COUNT) {
      const trimmed = normalizedOutput.items.slice(0, CHANGED_ITEMS_MAX_COUNT);
      try {
        // eslint-disable-next-line no-console
        console.log(`[LEN_FIX] normalized items ${normalizedOutput.items.length} -> ${trimmed.length}`);
      } catch {
        /* noop */
      }
      normalizedOutput.items = trimmed;
      normalizedOutput.recommendedItems = trimmed;
    }

    const mode = (typeof import.meta !== "undefined" && (import.meta as any)?.env?.MODE)
      || (typeof process !== "undefined" ? process.env?.NODE_ENV : undefined);
    if (typeof window !== "undefined" && (window as any)?.localStorage && mode !== "production") {
      try {
        window.localStorage.setItem("CONSULTATION_DEBUG", JSON.stringify(normalizedOutput));
      } catch {
        /* noop */
      }
    }

    return normalizedOutput as AiConsultationResponse;
  };

  const runWithNormalization = async (payload: any) => {
    try {
      return await postProcess(payload, DEFAULT_AFTER_LIMITS);
    } catch (err: any) {
      const reason = String(err?.message || "VALIDATION_FAILED");
      const prev = err?.prevJson ?? payload ?? {};
      if (reason === "LEN_AFTER") {
        const desc = String(prev?.afterImageDescription ?? "");
        const itemCount = Array.isArray(prev?.changedItems) ? prev.changedItems.length : 0;
        // eslint-disable-next-line no-console
        console.warn(
          `[AI LEN_AFTER][services/geminiService.ts] sentences=${sentenceCount(desc)} chars=${desc.length} items=${itemCount}`,
        );
        try {
          return await postProcess(prev, STRICT_AFTER_LIMITS);
        } catch (strictErr: any) {
          const strictPrev = strictErr?.prevJson ?? prev ?? {};
          throw Object.assign(strictErr, { reason: String(strictErr?.message || "VALIDATION_FAILED"), prevJson: strictPrev });
        }
      }
      throw Object.assign(err, { reason, prevJson: prev });
    }
  };

  try {
    return await runWithNormalization(parsed);
  } catch (e: any) {
    const reason = String(e?.reason || e?.message || "VALIDATION_FAILED");
    const prev = e?.prevJson ?? parsed ?? {};
    // eslint-disable-next-line no-console
    console.warn("Validation failed. retry with critique:", reason);

    try {
      const payload = await generateConsultationJSON({
        base64ImageData,
        instruction: buildCritiqueInstruction(reason, prev),
        temperature: 0.2,
        contextLabel: "critique",
      });
      return await runWithNormalization(payload);
    } catch (ee: any) {
      // eslint-disable-next-line no-console
      console.error("[AI] critique retry failed:", ee);
      throw new Error(`AI가 유효한 형식의 응답을 생성하지 못했습니다. (${ee?.message || "retry_failed"})`);
    }
  }
};

/* =====================================================================================
 *  6) After 이미지 생성
 * ===================================================================================== */
export const generateAfterImage = async (
  prompt: string,
  style: DeskStyle,
  originalImageBase64: string,
): Promise<string> => {
  const enhancedPrompt = `
You are a professional photo editor creating a photorealistic "After" desk transformation.

**ORIGINAL IMAGE ANALYSIS REQUIRED:**
Before making any changes, analyze the original image for:
- Camera angle, distance, and perspective (MUST preserve exactly)
- Light source direction and color temperature
- Existing furniture dimensions and positions
- Wall color, floor material, window location
- Overall spatial layout

**CRITICAL COMPOSITION RULES:**
1. ABSOLUTE FRAMING LOCK:
   - Keep the EXACT same camera position, angle, height, and focal length
   - The desk edges, walls, and major furniture must align pixel-perfectly with the original
   - NO zoom in/out, NO cropping, NO rotation, NO perspective shift
   - If the original shows 80% of the desk, the after must show 80% as well

2. PRESERVE SPATIAL STRUCTURE:
   - Keep wall positions, window locations, and floor boundaries identical
   - Maintain the same depth of field and background blur (if any)
   - Objects in the background (shelves, posters, etc.) stay in the same position unless specified

3. LIGHTING CONSISTENCY:
   - Match the original light direction and intensity
   - Preserve natural shadows and reflections
   - Avoid artificial-looking yellow or blue tints
   - If original has warm afternoon light, keep that exact tone

**STYLE APPLICATION: "${style}"**
Apply the following transformation while respecting the rules above:
${prompt}

**PHOTOREALISTIC DETAILS (CRITICAL):**
- Add micro-imperfections: subtle dust particles, fingerprints, slight wear marks
- Wood grain must follow natural patterns with visible texture variation
- Metal surfaces show realistic reflections with accurate distortion
- Fabric (if any) has natural wrinkles and light diffusion
- Shadows must have soft gradients, not hard edges
- Color temperature must match the original lighting (check white balance)

**WHAT TO AVOID (NEGATIVE PROMPTS):**
- NO text overlays, labels, watermarks, or UI elements
- NO fake product placements or obvious CGI items
- NO unrealistic color saturation or HDR effect
- NO fisheye distortion or warped perspective
- NO floating objects or physics violations
- NO cut-off items at edges (unless in original)
- NO blurry or low-resolution textures
- NO duplicate items or cloned patterns

**VALIDATION CHECKLIST:**
Before finalizing, verify:
✓ Desk corners align with original position?
✓ Wall-to-desk distance unchanged?
✓ Light source direction matches?
✓ No text or overlays visible?
✓ All objects physically grounded?
✓ Textures look natural and high-res?

Generate ONLY the final clean desk image with these exact specifications.
`.trim();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: [buildUserMessage(enhancedPrompt, originalImageBase64)],
    generationConfig: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      temperature: 0.15,
    },
  } as any);

  const candidates = (response as any)?.candidates ?? [];
  if (!candidates.length) {
    throw new Error("AI가 이미지를 생성하지 못했습니다. (no candidates)");
  }

  const parts = candidates[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = (part as any)?.inlineData;
    if (inline?.mimeType?.startsWith("image/") && inline?.data) {
      return `data:${inline.mimeType};base64,${inline.data}`;
    }
  }
  throw new Error("AI가 이미지를 생성하지 못했습니다. (Image part not found in response)");
};

export const generateAfterImageWithRetry = async (
  prompt: string,
  style: DeskStyle,
  originalImageBase64: string,
  maxRetries = 2,
): Promise<string> => {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-console
      console.log(`After 이미지 생성 시도 ${attempt}/${maxRetries}...`);
      return await generateAfterImage(prompt, style, originalImageBase64);
    } catch (err: any) {
      lastError = err;
      // eslint-disable-next-line no-console
      console.warn(`시도 ${attempt} 실패:`, err?.message);
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw lastError || new Error("이미지 생성에 실패했습니다.");
};
