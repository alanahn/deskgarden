// services/product/extract.ts
import type { ExtractedItem } from "./types.js";
import type { Item } from "../types.js";

const catMap: Record<string, string> = {
  "키보드": "keyboard",
  "마우스": "mouse",
  "모니터": "monitor",
  "모니터암": "monitor_arm",
  "스탠드": "stand",
  "램프": "lamp",
  "조명": "lamp",
  "선반": "shelf",
  "의자": "chair",
  "책상": "desk",
};

function guessCategory(name: string): string | undefined {
  const n = name.toLowerCase();
  for (const [ko, key] of Object.entries(catMap)) {
    if (n.includes(ko)) return key;
  }
  return undefined;
}

export function buildExtractedItems(
  afterImageDescription: string | undefined,
  items: Item[]
): ExtractedItem[] {
  const arr: ExtractedItem[] = items.map((it) => ({
    name: it.name,
    category: guessCategory(it.name),
    keywords: it.name
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6),
    attrs: {},
  }));

  // 설명문에 등장하는 브랜드/키워드(대강) 보강
  if (afterImageDescription) {
    const tokens = afterImageDescription
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 20);
    if (tokens.length) {
      arr.forEach((e) => {
        e.keywords = Array.from(new Set([...(e.keywords || []), ...tokens])).slice(0, 10);
      });
    }
  }
  return arr;
}
