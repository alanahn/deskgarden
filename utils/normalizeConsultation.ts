import type { Item } from "../services/types";
import { clamp01, normPoint, centerOfBox } from "./coords";
import { RECOMMENDATIONS_DISABLED } from "./featureFlags";
import { parsePrice } from "./price";

type SizeMeta = { width?: number; height?: number } | null;

function resolveHotspot(item: any, size?: SizeMeta) {
  const point = item?.hotspotCoordinates ?? item?.hotspot ?? null;
  if (point) {
    const normalized = normPoint(point, size ?? undefined);
    if (Number.isFinite(normalized.x) && Number.isFinite(normalized.y)) {
      return normalized;
    }
  }

  const box =
    item?.boundingBox ??
    item?.box ??
    item?.detection?.box ??
    (typeof item?.left === "number"
      ? { x: item.left, y: item.top, w: item.width, h: item.height }
      : null);
  if (box) {
    return centerOfBox(box, size ?? undefined);
  }

  const center = item?.center ?? item?.position;
  if (center) {
    const normalized = normPoint(center, size ?? undefined);
    if (Number.isFinite(normalized.x) && Number.isFinite(normalized.y)) {
      return normalized;
    }
  }

  return null;
}

function ensureBasics(item: Partial<Item>, idx: number, size?: SizeMeta): Item {
  const hotspot = resolveHotspot(item, size);
  const boundingBox = item.boundingBox ?? item.box ?? undefined;
  const parsedPrice =
    parsePrice(item.price) ??
    parsePrice((item as any)?.priceKRW) ??
    parsePrice((item as any)?.linkedProduct?.priceKRW) ??
    null;

  return {
    id: item.id ?? `item-${idx + 1}`,
    name: item.name ?? item.productName ?? `아이템 ${idx + 1}`,
    description: item.description ?? "",
    price: parsedPrice ?? 0,
    imageUrl: item.imageUrl ?? item.imageURL,
    imageURL: item.imageURL ?? item.imageUrl,
    productName: item.productName ?? item.name ?? `아이템 ${idx + 1}`,
    productCategory: item.productCategory ?? item.category,
    purchaseURL: item.purchaseURL ?? item.purchaseLinkUrl ?? "",
    purchaseLinkUrl: item.purchaseLinkUrl ?? item.purchaseURL ?? "",
    sellerId: item.sellerId ?? "ai-recommendation",
    hotspotCoordinates: hotspot ?? undefined,
    boundingBox,
    isNewItem: item.isNewItem ?? true,
    category: item.category ?? item.productCategory,
    linkedProduct: item.linkedProduct as Item["linkedProduct"],
    inStock: item.inStock,
    fallbackUsed: (item as any).fallbackUsed,
    fallbackPurchaseURL: item.fallbackPurchaseURL,
    lastRenderedPosition: item.lastRenderedPosition ?? null,
    lastRenderedPixelPosition: item.lastRenderedPixelPosition ?? null,
    hotspot: hotspot ?? undefined,
    box: boundingBox ?? undefined,
  } satisfies Item;
}

export function normalizeConsultation(raw: any, size?: SizeMeta): any {
  if (!raw || typeof raw !== "object") return raw;

  const consultation = raw.consultation ?? raw;
  const candidateItems =
    consultation.items ??
    consultation.changedItems ??
    consultation.recommendedItems ??
    consultation.detections ??
    [];

  const itemsArray = Array.isArray(candidateItems) ? candidateItems : [];
  const normalizedItems = itemsArray.map((item, idx) => ensureBasics(item, idx, size));

  const itemsWithHotspot = normalizedItems.filter((item) => {
    const hotspot = (item as any).hotspot ?? item.hotspotCoordinates;
    if (!hotspot) return false;
    const { x, y } = hotspot;
    return Number.isFinite(x) && Number.isFinite(y);
  });

  const effectiveItems = RECOMMENDATIONS_DISABLED ? [] : normalizedItems;

  const next = {
    ...consultation,
    items: effectiveItems,
    recommendedItems: effectiveItems,
    __debug: {
      hotspotCount: itemsWithHotspot.length,
      totalItems: normalizedItems.length,
    },
  };

  if (raw.consultation) {
    return {
      ...raw,
      consultation: next,
    };
  }

  return next;
}
