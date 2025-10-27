export type NormalizeLimits = {
  sentenceMin?: number;
  sentenceMax?: number;
  charMax?: number;
  itemMin?: number;
  itemMax?: number;
};

const DEFAULT_SENTENCE_SPLIT_REGEX = /[^.!?？！。…]+[.!?？！。…]+|[^.!?？！。…]+$/g;

export function clampTextBySentences(text: string, min = 10, max = 14): string {
  if (!text) return text;
  const sentences = text.match(DEFAULT_SENTENCE_SPLIT_REGEX);
  if (!sentences || sentences.length <= max) {
    return text;
  }
  return sentences.slice(0, max).join(" ").trim();
}

export function clampTextByChars(text: string, max = 800): string {
  if (!text) return text;
  if (text.length <= max) return text;
  return text.slice(0, max).trim();
}

export function clampArray<T>(arr: T[] | undefined, min = 5, max = 7): T[] | undefined {
  if (!Array.isArray(arr)) return arr;
  if (arr.length <= max) return arr;
  return arr.slice(0, max);
}

export function normalizeAfter<T extends {
  afterImageDescription?: string;
  changedItems?: any[];
}>(payload: T, limits: NormalizeLimits = {}): T {
  const {
    sentenceMin = 10,
    sentenceMax = 14,
    charMax = 800,
    itemMin = 5,
    itemMax = 7,
  } = limits;

  const result: T = { ...payload };

  if (typeof payload.afterImageDescription === "string") {
    let desc = payload.afterImageDescription;
    desc = clampTextBySentences(desc, sentenceMin, sentenceMax);
    desc = clampTextByChars(desc, charMax);
    result.afterImageDescription = desc;
  }

  if (Array.isArray(payload.changedItems)) {
    const items = clampArray(payload.changedItems, itemMin, itemMax);
    if (items) {
      result.changedItems = items;
    }
  }

  return result;
}
