export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = Number(value.trim().replace(/%$/, ""));
    if (Number.isFinite(num)) return num;
  }
  return undefined;
}

export function normPoint(
  point: any,
  size?: { width?: number; height?: number },
): { x: number; y: number } {
  if (!point) return { x: 0.5, y: 0.5 };

  let rawX: number | undefined;
  let rawY: number | undefined;

  if (Array.isArray(point) && point.length >= 2) {
    rawX = toNumber(point[0]);
    rawY = toNumber(point[1]);
  } else {
    rawX = toNumber(point.x ?? point.cx ?? point.left ?? point.longitude ?? point.lon);
    rawY = toNumber(point.y ?? point.cy ?? point.top ?? point.latitude ?? point.lat);
  }

  if (rawX === undefined || rawY === undefined) {
    return { x: 0.5, y: 0.5 };
  }

  const width = Number(size?.width);
  const height = Number(size?.height);

  const convert = (value: number, dimension?: number) => {
    if (!Number.isFinite(value)) return 0.5;
    if (value > 1) {
      if (value <= 100) {
        return clamp01(value / 100);
      }
      if (dimension && dimension > 0) {
        return clamp01(value / dimension);
      }
    }
    if (value < 0) return clamp01(value);
    return clamp01(value);
  };

  return {
    x: convert(rawX, width),
    y: convert(rawY, height),
  };
}

export function centerOfBox(box: any, size?: { width?: number; height?: number }) {
  if (!box || typeof box !== "object") return { x: 0.5, y: 0.5 };
  const x = toNumber(box.x ?? box.left) ?? 0;
  const y = toNumber(box.y ?? box.top) ?? 0;
  const w = toNumber(box.w ?? box.width ?? box.right) ?? 0;
  const h = toNumber(box.h ?? box.height ?? box.bottom) ?? 0;

  const norm = normPoint({ x, y }, size);
  const fx = normPoint({ x: x + (Number.isFinite(w) ? w / 2 : 0), y: y + (Number.isFinite(h) ? h / 2 : 0) }, size);
  return {
    x: clamp01(fx.x),
    y: clamp01(fx.y),
  };
}
