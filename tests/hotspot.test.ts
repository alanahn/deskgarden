import { strict as assert } from "node:assert";
import { ensureMinDistance, clampPoint, snapToBoxCenterOrInside, normalizeHotspotLayout } from "../utils/hotspot.js";

const pts = [
  { x: 0.1, y: 0.1 },
  { x: 0.11, y: 0.11 },
  { x: 0.12, y: 0.12 },
];
const adjusted = ensureMinDistance(pts, 48, { width: 800, height: 600 });
const min = 48 / Math.min(800, 600);
for (let i = 0; i < adjusted.length; i += 1) {
  for (let j = i + 1; j < adjusted.length; j += 1) {
    const dx = adjusted[j].x - adjusted[i].x;
    const dy = adjusted[j].y - adjusted[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    assert.ok(dist >= min * 0.8, "points should be separated");
  }
}

const clamped = clampPoint({ x: 1.5, y: -0.2 });
assert.equal(clamped.x, 1);
assert.equal(clamped.y, 0);

const boxSnap = snapToBoxCenterOrInside({ x: 0.05, y: 0.05 }, { x: 0.2, y: 0.2, w: 0.2, h: 0.2 });
assert.ok(boxSnap.x >= 0.2 && boxSnap.x <= 0.4);
assert.ok(boxSnap.y >= 0.2 && boxSnap.y <= 0.4);

const distributed = normalizeHotspotLayout(
  [
    { point: { x: 0.5, y: 0.5 } },
    { point: { x: 0.5, y: 0.5 } },
    { point: { x: 0.52, y: 0.5 } },
  ],
  { minDistance: 0.1, padding: 0.03 },
);
const distPts = distributed.points;
for (let i = 0; i < distPts.length; i += 1) {
  for (let j = i + 1; j < distPts.length; j += 1) {
    const dx = distPts[j].x - distPts[i].x;
    const dy = distPts[j].y - distPts[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    assert.ok(dist >= 0.08, "normalizeHotspotLayout should separate overlapping points");
  }
}

const lockedLayout = normalizeHotspotLayout(
  [
    { point: { x: 0.05, y: 0.05 }, box: { x: 0.7, y: 0.7, w: 0.2, h: 0.2 } },
    { point: { x: 0.72, y: 0.72 } },
  ],
  { minDistance: 0.1, padding: 0.02 },
);
const lockedPoint = lockedLayout.points[0];
assert.ok(lockedPoint.x >= 0.7 && lockedPoint.x <= 0.9, "locked hotspot should stay within its bounding box (x)");
assert.ok(lockedPoint.y >= 0.7 && lockedPoint.y <= 0.9, "locked hotspot should stay within its bounding box (y)");

console.log("hotspot utils tests passed.");
