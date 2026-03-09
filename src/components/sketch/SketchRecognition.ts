// SketchRecognition.ts — Shape recognition logic for the Sketch Editor
import type { Point, Stroke } from './SketchTypes';

// --- Shape recognition types ---

export type RecognizedShapeData =
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'square'; x: number; y: number; size: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number }
  | { type: 'circle'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'triangle'; x1: number; y1: number; x2: number; y2: number; x3: number; y3: number }
  | { type: 'star'; cx: number; cy: number; r: number }
  | { type: 'diamond'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'pentagon'; cx: number; cy: number; r: number }
  | { type: 'polygon'; cx: number; cy: number; r: number }
  | { type: 'heart'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'arrow'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'trapezoid'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'moon'; cx: number; cy: number; r: number }
  | { type: 'cloud'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'speechBubble'; x: number; y: number; w: number; h: number }
  | { type: 'cylinder'; x: number; y: number; w: number; h: number }
  | { type: 'cone'; cx: number; cy: number; rx: number; ry: number }
  | { type: 'cross'; cx: number; cy: number; rx: number; ry: number };

export interface ShapeRecognitionResult {
  shape: RecognizedShapeData;
  confidence: number; // 0-100
}

// --- Helper functions ---

export const getTotalLength = (points: Point[]): number => {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.sqrt((points[i].x - points[i - 1].x) ** 2 + (points[i].y - points[i - 1].y) ** 2);
  }
  return len;
};

export const getLineDeviation = (points: Point[], a: Point, b: Point): number => {
  const segLen = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  if (segLen === 0) return 1;
  let maxDev = 0;
  for (const p of points) {
    const d = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x) / segLen;
    if (d > maxDev) maxDev = d;
  }
  return maxDev / segLen;
};

export const detectCorners = (points: Point[], totalLen: number): Point[] => {
  const step = Math.max(1, Math.floor(points.length / 40));
  const windowSize = Math.max(3, Math.floor(points.length / 15));
  const angles: { idx: number; angle: number }[] = [];

  for (let i = windowSize; i < points.length - windowSize; i += step) {
    const before = points[Math.max(0, i - windowSize)];
    const at = points[i];
    const after = points[Math.min(points.length - 1, i + windowSize)];
    const a1 = Math.atan2(at.y - before.y, at.x - before.x);
    const a2 = Math.atan2(after.y - at.y, after.x - at.x);
    let diff = Math.abs(a2 - a1);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    angles.push({ idx: i, angle: diff });
  }

  angles.sort((a, b) => b.angle - a.angle);

  const corners: Point[] = [];
  for (const a of angles) {
    if (a.angle < 0.38) break;
    const p = points[a.idx];
    const tooClose = corners.some(c => Math.sqrt((c.x - p.x) ** 2 + (c.y - p.y) ** 2) < totalLen * 0.08);
    if (!tooClose) {
      corners.push(p);
      if (corners.length >= 8) break;
    }
  }
  return corners;
};

export const getRectangleFit = (corners: Point[], minX: number, minY: number, maxX: number, maxY: number): number => {
  const bboxCorners = [
    { x: minX, y: minY }, { x: maxX, y: minY },
    { x: maxX, y: maxY }, { x: minX, y: maxY },
  ];
  const bw = maxX - minX;
  const bh = maxY - minY;
  const diag = Math.sqrt(bw * bw + bh * bh);
  if (diag === 0) return 1;

  let totalErr = 0;
  const used = new Set<number>();
  for (const bc of bboxCorners) {
    let bestDist = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < corners.length; i++) {
      if (used.has(i)) continue;
      const d = Math.sqrt((corners[i].x - bc.x) ** 2 + (corners[i].y - bc.y) ** 2);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx >= 0) {
      used.add(bestIdx);
      totalErr += bestDist;
    } else {
      totalErr += diag;
    }
  }
  return totalErr / diag;
};

// --- Main recognition function ---

export const recognizeShape = (points: Point[]): ShapeRecognitionResult | null => {
  if (points.length < 5) return null;

  const totalLen = getTotalLength(points);
  if (totalLen < 15) return null;

  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const bw = maxX - minX;
  const bh = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = bw / 2;
  const ry = bh / 2;

  // Closedness check
  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const endDist = Math.sqrt((firstPt.x - lastPt.x) ** 2 + (firstPt.y - lastPt.y) ** 2);
  const isClosed = endDist < totalLen * 0.15;
  const closeScore = isClosed ? 1 : Math.max(0, 1 - endDist / (totalLen * 0.15));

  // Bounding box area & perimeter
  const area = bw * bh;
  const perimeter = 2 * (bw + bh);
  const circularity = area > 0 ? (4 * Math.PI * area) / (perimeter * perimeter) : 0;

  // --- Line ---
  if (!isClosed) {
    const lineDeviation = getLineDeviation(points, firstPt, lastPt);
    if (lineDeviation < 0.08) {
      const directDist = Math.sqrt((lastPt.x - firstPt.x) ** 2 + (lastPt.y - firstPt.y) ** 2);
      if (directDist > 20) {
        // Arrow check
        const lastSegLen = Math.min(8, Math.floor(points.length * 0.12));
        const tipStart = points[points.length - lastSegLen] || points[0];
        const lastDx = lastPt.x - tipStart.x;
        const lastDy = lastPt.y - tipStart.y;
        const mainDx = lastPt.x - firstPt.x;
        const mainDy = lastPt.y - firstPt.y;
        const dot = lastDx * mainDx + lastDy * mainDy;
        const crossMag = Math.abs(lastDx * mainDy - lastDy * mainDx);
        if (dot < 0 && crossMag > 5) {
          return { shape: { type: 'arrow', x1: firstPt.x, y1: firstPt.y, x2: lastPt.x, y2: lastPt.y }, confidence: Math.round(80 + (1 - lineDeviation / 0.08) * 15) };
        }
        const conf = Math.round(Math.max(80, Math.min(99, (1 - lineDeviation / 0.08) * 20 + 80)));
        return { shape: { type: 'line', x1: firstPt.x, y1: firstPt.y, x2: lastPt.x, y2: lastPt.y }, confidence: conf };
      }
    }
  }

  if (!isClosed && endDist > totalLen * 0.3) return null;

  const corners = detectCorners(points, totalLen);
  const numCorners = corners.length;

  // --- Star ---
  if (numCorners >= 5) {
    const cornerDists = corners.map(c => Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2));
    cornerDists.sort((a, b) => a - b);
    const outerGroup = cornerDists.slice(-3);
    const innerGroup = cornerDists.slice(0, Math.max(2, cornerDists.length - 3));
    const avgOuter = outerGroup.reduce((a, b) => a + b, 0) / outerGroup.length;
    const avgInner = innerGroup.reduce((a, b) => a + b, 0) / innerGroup.length;
    const ratio = avgInner / avgOuter;
    if (ratio < 0.65 && ratio > 0.2 && numCorners >= 5 && numCorners <= 12) {
      const conf = Math.round(65 + (0.65 - ratio) * 60 + closeScore * 10);
      return { shape: { type: 'star', cx, cy, r: avgOuter }, confidence: Math.min(95, conf) };
    }
  }

  // --- Speech Bubble ---
  if (numCorners >= 3 && numCorners <= 5 && isClosed) {
    const cornerAngles = corners.map(c => Math.atan2(c.y - cy, c.x - cx));
    const sorted = [...cornerAngles].sort((a, b) => a - b);
    let maxGap = 0;
    for (let i = 1; i < sorted.length; i++) maxGap = Math.max(maxGap, sorted[i] - sorted[i - 1]);
    maxGap = Math.max(maxGap, 2 * Math.PI + sorted[0] - sorted[sorted.length - 1]);
    if (maxGap > Math.PI * 0.8) {
      const bottomCorners = corners.filter(c => c.y > cy + ry * 0.3);
      if (bottomCorners.length >= 1) {
        return { shape: { type: 'speechBubble', x: minX, y: minY, w: bw, h: bh }, confidence: Math.round(68 + closeScore * 15) };
      }
    }
  }

  // --- Diamond ---
  if (numCorners === 4) {
    const cornerAngles = corners.map(c => Math.atan2(c.y - cy, c.x - cx));
    const withAngles = corners.map((c, i) => ({ ...c, angle: cornerAngles[i] }));
    withAngles.sort((a, b) => a.angle - b.angle);
    const dists = withAngles.map(c => Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2));
    const avgDist = dists.reduce((a, b) => a + b, 0) / 4;
    const distDeviation = dists.reduce((sum, d) => sum + Math.abs(d - avgDist), 0) / 4 / avgDist;
    const rectFit = getRectangleFit(corners, minX, minY, maxX, maxY);
    if (distDeviation < 0.35 && rectFit > 0.2) {
      const angleDiffs: number[] = [];
      for (let i = 1; i < withAngles.length; i++) angleDiffs.push(withAngles[i].angle - withAngles[i - 1].angle);
      angleDiffs.push(2 * Math.PI + withAngles[0].angle - withAngles[withAngles.length - 1].angle);
      const avgAngleDiff = Math.PI / 2;
      const angleDeviation = angleDiffs.reduce((sum, d) => sum + Math.abs(d - avgAngleDiff), 0) / angleDiffs.length;
      if (angleDeviation < 0.45) {
        const conf = Math.round(Math.max(65, Math.min(95, 70 + (1 - angleDeviation / 0.45) * 15 + closeScore * 10)));
        return { shape: { type: 'diamond', cx, cy, rx, ry }, confidence: conf };
      }
    }
  }

  // --- Triangle ---
  if (numCorners === 3) {
    const rectFit = getRectangleFit(corners, minX, minY, maxX, maxY);
    if (rectFit > 0.15) {
      const sorted = [...corners].sort((a, b) => a.y - b.y);
      const conf = Math.round(Math.max(70, Math.min(96, 75 + (1 - rectFit) * 10 + closeScore * 10)));
      return {
        shape: { type: 'triangle', x1: sorted[0].x, y1: sorted[0].y, x2: sorted[1].x, y2: sorted[1].y, x3: sorted[2].x, y3: sorted[2].y },
        confidence: conf,
      };
    }
  }

  // --- Trapezoid ---
  if (numCorners === 4) {
    const rectFit = getRectangleFit(corners, minX, minY, maxX, maxY);
    const cornerAngles = corners.map(c => Math.atan2(c.y - cy, c.x - cx));
    const withAngles = corners.map((c, i) => ({ ...c, angle: cornerAngles[i] }));
    withAngles.sort((a, b) => a.angle - b.angle);
    const topCorners = withAngles.filter(c => c.y < cy);
    const bottomCorners = withAngles.filter(c => c.y >= cy);
    if (topCorners.length >= 2 && bottomCorners.length >= 2) {
      const topWidth = Math.abs(topCorners[0].x - topCorners[1].x);
      const bottomWidth = Math.abs(bottomCorners[0].x - bottomCorners[1].x);
      const widthRatio = Math.min(topWidth, bottomWidth) / Math.max(topWidth, bottomWidth);
      if (widthRatio < 0.8 && widthRatio > 0.2 && rectFit > 0.08) {
        const conf = Math.round(68 + (0.8 - widthRatio) * 30 + closeScore * 10);
        return { shape: { type: 'trapezoid', cx, cy, rx, ry }, confidence: Math.min(92, conf) };
      }
    }
  }

  // --- Rectangle/Square ---
  if (numCorners >= 3 && numCorners <= 5) {
    const rectFit = getRectangleFit(corners, minX, minY, maxX, maxY);
    if (rectFit < 0.18) {
      const aspectRatio = bw / bh;
      if (aspectRatio > 0.85 && aspectRatio < 1.18) {
        const conf = Math.round(Math.max(80, Math.min(99, (1 - rectFit / 0.18) * 20 + 80)));
        return { shape: { type: 'square', x: minX, y: minY, size: Math.max(bw, bh) }, confidence: conf };
      }
      const conf = Math.round(Math.max(75, Math.min(99, (1 - rectFit / 0.18) * 20 + 75)));
      return { shape: { type: 'rect', x: minX, y: minY, w: bw, h: bh }, confidence: conf };
    }
  }

  // --- Pentagon ---
  if (numCorners >= 4 && numCorners <= 6) {
    const top5 = corners.slice(0, 5);
    const withAngles = top5.map(c => ({ ...c, angle: Math.atan2(c.y - cy, c.x - cx) }));
    withAngles.sort((a, b) => a.angle - b.angle);
    const dists = withAngles.map(c => Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2));
    const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;
    const distDeviation = dists.reduce((sum, d) => sum + Math.abs(d - avgDist), 0) / dists.length / avgDist;
    if (distDeviation < 0.25) {
      const angleDiffs: number[] = [];
      for (let i = 1; i < withAngles.length; i++) angleDiffs.push(withAngles[i].angle - withAngles[i - 1].angle);
      angleDiffs.push(2 * Math.PI + withAngles[0].angle - withAngles[withAngles.length - 1].angle);
      const avgAngleDiff = (2 * Math.PI) / 5;
      const angleDeviation = angleDiffs.reduce((sum, d) => sum + Math.abs(d - avgAngleDiff), 0) / angleDiffs.length;
      if (angleDeviation < 0.5) {
        const conf = Math.round(Math.max(60, Math.min(93, 60 + (1 - angleDeviation / 0.5) * 25 + closeScore * 8)));
        return { shape: { type: 'pentagon', cx, cy, r: avgDist }, confidence: conf };
      }
    }
  }

  // --- Hexagon ---
  if (numCorners >= 6 && numCorners <= 8) {
    const top6 = corners.slice(0, 6);
    const withAngles = top6.map(c => ({ ...c, angle: Math.atan2(c.y - cy, c.x - cx) }));
    withAngles.sort((a, b) => a.angle - b.angle);
    const dists = withAngles.map(c => Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2));
    const avgDist = dists.reduce((a, b) => a + b, 0) / dists.length;
    const distDeviation = dists.reduce((sum, d) => sum + Math.abs(d - avgDist), 0) / dists.length / avgDist;
    if (distDeviation < 0.3) {
      const angleDiffs: number[] = [];
      for (let i = 1; i < withAngles.length; i++) angleDiffs.push(withAngles[i].angle - withAngles[i - 1].angle);
      angleDiffs.push(2 * Math.PI + withAngles[0].angle - withAngles[withAngles.length - 1].angle);
      const avgAngleDiff = (2 * Math.PI) / 6;
      const angleDeviation = angleDiffs.reduce((sum, d) => sum + Math.abs(d - avgAngleDiff), 0) / angleDiffs.length;
      if (angleDeviation < 0.6) {
        const conf = Math.round(Math.max(60, Math.min(93, 60 + (1 - angleDeviation / 0.6) * 25 + closeScore * 8)));
        return { shape: { type: 'polygon', cx, cy, r: avgDist }, confidence: conf };
      }
    }
  }

  // --- Moon ---
  {
    let circleErrCheck = 0;
    for (const p of points) {
      const nx = (p.x - cx) / rx, ny = (p.y - cy) / ry;
      circleErrCheck += (Math.sqrt(nx * nx + ny * ny) - 1) ** 2;
    }
    circleErrCheck = Math.sqrt(circleErrCheck / points.length);
    if (circleErrCheck < 0.3 && circleErrCheck > 0.14 && circularity > 0.45 && circularity < 0.82) {
      const leftPts = points.filter(p => p.x < cx).length;
      const rightPts = points.filter(p => p.x >= cx).length;
      const ratio = Math.min(leftPts, rightPts) / Math.max(leftPts, rightPts);
      if (ratio < 0.5) {
        const conf = Math.round(60 + (0.5 - ratio) * 40 + closeScore * 10);
        return { shape: { type: 'moon', cx, cy, r: Math.max(rx, ry) }, confidence: Math.min(90, conf) };
      }
    }
  }

  // --- Cloud ---
  {
    const topHalf = points.filter(p => p.y < cy);
    const bottomHalf = points.filter(p => p.y >= cy);
    if (topHalf.length > 5 && bottomHalf.length > 5) {
      const topSorted = [...topHalf].sort((a, b) => a.x - b.x);
      let dirChanges = 0;
      for (let i = 2; i < topSorted.length; i++) {
        const d1 = topSorted[i - 1].y - topSorted[i - 2].y;
        const d2 = topSorted[i].y - topSorted[i - 1].y;
        if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) dirChanges++;
      }
      const bumpiness = dirChanges / topSorted.length;
      const bottomRange = Math.max(...bottomHalf.map(p => p.y)) - Math.min(...bottomHalf.map(p => p.y));
      const bottomFlatness = bottomRange / bh;
      if (bumpiness > 0.12 && bumpiness < 0.45 && bottomFlatness < 0.34 && bw > bh * 1.05 && numCorners >= 6) {
        const conf = Math.round(60 + bumpiness * 60 + closeScore * 10);
        return { shape: { type: 'cloud', cx, cy, rx, ry }, confidence: Math.min(92, conf) };
      }
    }
  }

  // --- Cylinder ---
  if (bh > bw * 1.2) {
    const topBand = points.filter(p => p.y < minY + bh * 0.2);
    const bottomBand = points.filter(p => p.y > maxY - bh * 0.2);
    if (topBand.length > 3 && bottomBand.length > 3) {
      const topXSpread = Math.max(...topBand.map(p => p.x)) - Math.min(...topBand.map(p => p.x));
      const bottomXSpread = Math.max(...bottomBand.map(p => p.x)) - Math.min(...bottomBand.map(p => p.x));
      if (topXSpread > bw * 0.65 && bottomXSpread > bw * 0.65 && Math.abs(topXSpread - bottomXSpread) < bw * 0.22) {
        const leftSide = points.filter(p => p.x < minX + bw * 0.15);
        const rightSide = points.filter(p => p.x > maxX - bw * 0.15);
        if (leftSide.length > 3 && rightSide.length > 3 && numCorners <= 5) {
          return { shape: { type: 'cylinder', x: minX, y: minY, w: bw, h: bh }, confidence: Math.round(72 + closeScore * 15) };
        }
      }
    }
  }

  // --- Cone ---
  if (bh > bw * 0.6) {
    const topBand = points.filter(p => p.y < minY + bh * 0.2);
    const bottomBand = points.filter(p => p.y > maxY - bh * 0.25);
    if (topBand.length > 1 && bottomBand.length > 3) {
      const topXSpread = Math.max(...topBand.map(p => p.x)) - Math.min(...topBand.map(p => p.x));
      const bottomXSpread = Math.max(...bottomBand.map(p => p.x)) - Math.min(...bottomBand.map(p => p.x));
      if (topXSpread < bw * 0.28 && bottomXSpread > bw * 0.6 && numCorners <= 5) {
        return { shape: { type: 'cone', cx, cy, rx, ry }, confidence: Math.round(70 + closeScore * 15) };
      }
    }
  }

  // --- Cross ---
  {
    const hBand = points.filter(p => Math.abs(p.y - cy) < ry * 0.35);
    const vBand = points.filter(p => Math.abs(p.x - cx) < rx * 0.35);
    const hRatio = hBand.length / points.length;
    const vRatio = vBand.length / points.length;
    if (numCorners >= 8 && hRatio > 0.33 && vRatio > 0.33 && hRatio + vRatio > 0.8) {
      const conf = Math.round(65 + (hRatio + vRatio - 0.7) * 50 + closeScore * 8);
      return { shape: { type: 'cross', cx, cy, rx, ry }, confidence: Math.min(95, conf) };
    }
  }

  // --- Circle/Ellipse ---
  let circleErr = 0;
  for (const p of points) {
    const nx = (p.x - cx) / rx, ny = (p.y - cy) / ry;
    circleErr += (Math.sqrt(nx * nx + ny * ny) - 1) ** 2;
  }
  circleErr = Math.sqrt(circleErr / points.length);
  if (circleErr < 0.19 && circularity > 0.72) {
    const conf = Math.round(Math.max(75, Math.min(99, (1 - circleErr / 0.19) * 25 + 75)));
    return { shape: { type: 'circle', cx, cy, rx, ry }, confidence: conf };
  }

  return null;
};

// --- Convert recognized shape to clean stroke ---

export const convertToCleanShape = (stroke: Stroke, shape: RecognizedShapeData | null): Stroke | null => {
  if (!shape) return null;
  const pressure = 0.5;
  switch (shape.type) {
    case 'line':
      return { ...stroke, tool: 'line', points: [{ x: shape.x1, y: shape.y1, pressure }, { x: shape.x2, y: shape.y2, pressure }] };
    case 'square':
      return { ...stroke, tool: 'rect', points: [{ x: shape.x, y: shape.y, pressure }, { x: shape.x + shape.size, y: shape.y + shape.size, pressure }] };
    case 'rect':
      return { ...stroke, tool: 'rect', points: [{ x: shape.x, y: shape.y, pressure }, { x: shape.x + shape.w, y: shape.y + shape.h, pressure }] };
    case 'circle':
      return { ...stroke, tool: 'circle', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'triangle': {
      const minX = Math.min(shape.x1, shape.x2, shape.x3);
      const maxX = Math.max(shape.x1, shape.x2, shape.x3);
      const minY = Math.min(shape.y1, shape.y2, shape.y3);
      const maxY = Math.max(shape.y1, shape.y2, shape.y3);
      return { ...stroke, tool: 'triangle', points: [{ x: minX, y: minY, pressure }, { x: maxX, y: maxY, pressure }] };
    }
    case 'star':
      return { ...stroke, tool: 'star', points: [{ x: shape.cx - shape.r, y: shape.cy - shape.r, pressure }, { x: shape.cx + shape.r, y: shape.cy + shape.r, pressure }] };
    case 'diamond':
      return { ...stroke, tool: 'diamond', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'pentagon':
      return { ...stroke, tool: 'pentagon', points: [{ x: shape.cx - shape.r, y: shape.cy - shape.r, pressure }, { x: shape.cx + shape.r, y: shape.cy + shape.r, pressure }] };
    case 'polygon':
      return { ...stroke, tool: 'polygon', points: [{ x: shape.cx - shape.r, y: shape.cy - shape.r, pressure }, { x: shape.cx + shape.r, y: shape.cy + shape.r, pressure }] };
    case 'heart':
      return { ...stroke, tool: 'heart', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'arrow':
      return { ...stroke, tool: 'arrow', points: [{ x: shape.x1, y: shape.y1, pressure }, { x: shape.x2, y: shape.y2, pressure }] };
    case 'trapezoid':
      return { ...stroke, tool: 'trapezoid', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'moon':
      return { ...stroke, tool: 'moon', points: [{ x: shape.cx - shape.r, y: shape.cy - shape.r, pressure }, { x: shape.cx + shape.r, y: shape.cy + shape.r, pressure }] };
    case 'cloud':
      return { ...stroke, tool: 'cloud', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'speechBubble':
      return { ...stroke, tool: 'speechBubble', points: [{ x: shape.x, y: shape.y, pressure }, { x: shape.x + shape.w, y: shape.y + shape.h, pressure }] };
    case 'cylinder':
      return { ...stroke, tool: 'cylinder', points: [{ x: shape.x, y: shape.y, pressure }, { x: shape.x + shape.w, y: shape.y + shape.h, pressure }] };
    case 'cone':
      return { ...stroke, tool: 'cone', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
    case 'cross':
      return { ...stroke, tool: 'rect', points: [{ x: shape.cx - shape.rx, y: shape.cy - shape.ry, pressure }, { x: shape.cx + shape.rx, y: shape.cy + shape.ry, pressure }] };
  }
};
