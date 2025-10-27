export function clamp01(n) {
    if (Number.isNaN(n))
        return 0;
    if (n < 0)
        return 0;
    if (n > 1)
        return 1;
    return n;
}
export function clampPoint(p) {
    return { x: clamp01(p.x), y: clamp01(p.y) };
}
export function snapToBoxCenterOrInside(point, box) {
    if (!box)
        return clampPoint(point);
    const center = {
        x: clamp01(box.x + (box.w ?? 0) / 2),
        y: clamp01(box.y + (box.h ?? 0) / 2),
    };
    const snapped = {
        x: clamp01(Math.max(box.x, Math.min(point.x, box.x + box.w))),
        y: clamp01(Math.max(box.y, Math.min(point.y, box.y + box.h))),
    };
    const withinX = snapped.x;
    const withinY = snapped.y;
    return clampPoint({
        x: Math.abs(point.x - withinX) < 0.001 ? withinX : center.x,
        y: Math.abs(point.y - withinY) < 0.001 ? withinY : center.y,
    });
}
export function ensureMinDistance(normalizedPoints, minDistancePx, container, maxIterations = 16) {
    if (normalizedPoints.length <= 1 || minDistancePx <= 0)
        return normalizedPoints.map(clampPoint);
    const points = normalizedPoints.map(clampPoint).map((p) => ({ ...p }));
    const { width, height } = container;
    if (!width || !height)
        return points;
    const minX = minDistancePx / width;
    const minY = minDistancePx / height;
    const minDistSq = (minDistancePx / Math.min(width, height)) ** 2;
    for (let iter = 0; iter < maxIterations; iter += 1) {
        let moved = false;
        for (let i = 0; i < points.length; i += 1) {
            for (let j = i + 1; j < points.length; j += 1) {
                const dx = points[j].x - points[i].x;
                const dy = points[j].y - points[i].y;
                const distSq = dx * dx + dy * dy;
                if (distSq === 0 || distSq < minDistSq) {
                    const adjustX = dx === 0 ? (Math.random() > 0.5 ? minX : -minX) : dx / 2;
                    const adjustY = dy === 0 ? (Math.random() > 0.5 ? minY : -minY) : dy / 2;
                    points[i].x = clamp01(points[i].x - adjustX);
                    points[i].y = clamp01(points[i].y - adjustY);
                    points[j].x = clamp01(points[j].x + adjustX);
                    points[j].y = clamp01(points[j].y + adjustY);
                    moved = true;
                }
            }
        }
        if (!moved)
            break;
    }
    return points.map(clampPoint);
}
const DEFAULT_SPREAD_PADDING = 0.04;
const DEFAULT_SPREAD_DISTANCE = 0.12;
const MAX_SPREAD_ITERATIONS = 32;
const FALLBACK_DIRECTIONS = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
];
function clampWithPadding(value, padding) {
    const pad = clamp01(padding);
    const min = pad;
    const max = 1 - pad;
    if (max <= min)
        return 0.5;
    return Math.min(max, Math.max(min, clamp01(value)));
}
function sanitizePoint(point) {
    if (!point || typeof point !== "object")
        return { x: 0.5, y: 0.5 };
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return { x: 0.5, y: 0.5 };
    return clampPoint({ x, y });
}
function sanitizeBox(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    let x = Number(raw.x ?? raw.left ?? 0);
    let y = Number(raw.y ?? raw.top ?? 0);
    let w = Number(raw.w ?? raw.width ?? 0);
    let h = Number(raw.h ?? raw.height ?? 0);
    if (!Number.isFinite(x))
        x = 0;
    if (!Number.isFinite(y))
        y = 0;
    if (!Number.isFinite(w))
        w = 0;
    if (!Number.isFinite(h))
        h = 0;
    x = clamp01(x);
    y = clamp01(y);
    w = clamp01(w);
    h = clamp01(h);
    if (w <= 0 || h <= 0)
        return null;
    if (x + w > 1)
        x = clamp01(1 - w);
    if (y + h > 1)
        y = clamp01(1 - h);
    return { x, y, w, h };
}
function spreadPoints(points, locked, minDistance, padding) {
    const minDist = Math.max(0, Math.min(0.5, minDistance));
    if (minDist <= 0)
        return;
    for (let iter = 0; iter < MAX_SPREAD_ITERATIONS; iter += 1) {
        let moved = false;
        for (let i = 0; i < points.length; i += 1) {
            for (let j = i + 1; j < points.length; j += 1) {
                const p1 = points[i];
                const p2 = points[j];
                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;
                let distSq = dx * dx + dy * dy;
                if (distSq === 0) {
                    const dir = FALLBACK_DIRECTIONS[(i + j + iter) % FALLBACK_DIRECTIONS.length];
                    dx = dir.x * 1e-3;
                    dy = dir.y * 1e-3;
                    distSq = dx * dx + dy * dy;
                }
                const dist = Math.sqrt(distSq);
                if (dist >= minDist)
                    continue;
                const canMoveI = !locked.has(i);
                const canMoveJ = !locked.has(j);
                if (!canMoveI && !canMoveJ)
                    continue;
                const ux = dx / (dist || 1);
                const uy = dy / (dist || 1);
                const required = minDist - dist;
                if (canMoveI && canMoveJ) {
                    const half = required / 2;
                    p1.x = clampWithPadding(p1.x - ux * half, padding);
                    p1.y = clampWithPadding(p1.y - uy * half, padding);
                    p2.x = clampWithPadding(p2.x + ux * half, padding);
                    p2.y = clampWithPadding(p2.y + uy * half, padding);
                    moved = true;
                }
                else if (canMoveI) {
                    p1.x = clampWithPadding(p1.x - ux * required, padding);
                    p1.y = clampWithPadding(p1.y - uy * required, padding);
                    moved = true;
                }
                else if (canMoveJ) {
                    p2.x = clampWithPadding(p2.x + ux * required, padding);
                    p2.y = clampWithPadding(p2.y + uy * required, padding);
                    moved = true;
                }
            }
        }
        if (!moved)
            break;
    }
}
export function normalizeHotspotLayout(inputs, options = {}) {
    const padding = options.padding ?? DEFAULT_SPREAD_PADDING;
    const minDistance = options.minDistance ?? DEFAULT_SPREAD_DISTANCE;
    const boxes = inputs.map((entry) => sanitizeBox(entry?.box));
    const locked = new Set();
    const points = inputs.map((entry, idx) => {
        const base = sanitizePoint(entry?.point);
        const box = boxes[idx];
        if (box) {
            locked.add(idx);
            return clampPoint(snapToBoxCenterOrInside(base, box));
        }
        return {
            x: clampWithPadding(base.x, padding),
            y: clampWithPadding(base.y, padding),
        };
    });
    spreadPoints(points, locked, minDistance, padding);
    return {
        points: points.map(clampPoint),
        boxes,
    };
}
