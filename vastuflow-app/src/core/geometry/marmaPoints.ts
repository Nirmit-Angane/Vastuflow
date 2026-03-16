// ═══════════════════════════════════════════════════════
// Marma Points — Vastu Purusha Mandala Grid Engine
//
// The Vastu Purusha lies diagonally inside the property:
//   Head   → NE corner
//   Feet   → SW corner
//   Right  → SE side
//   Left   → NW side
//
// Main spine runs NE→SW through centroid (17 nodes).
// Perpendicular L/R extensions branch out from key nodes.
// All geometry is clipped to the user's property polygon.
//
// Pure functions. No React. No state. No side effects.
// ═══════════════════════════════════════════════════════

import { Point } from "./types";
import { computeCentroid, pointInPolygon, boundingBox, distance } from "./polygon";

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export interface MarmaAxis {
    id: string;
    label: string;
    clipStart: Point | null;
    clipEnd: Point | null;
}

export interface MarmaPoint {
    id: string;            // unique key, e.g. "9" or "2R" or "10LT"
    x: number;
    y: number;
    label: string;         // display text inside the badge
    bodyPart: string;      // Vastu Purusha body mapping
    type: "main" | "right" | "left";
    segmentIndex: number;  // which main spine node (1–17) this relates to
}

export interface MarmaData {
    centroid: Point;
    axes: MarmaAxis[];
    marmaPoints: MarmaPoint[];
}

// ═══════════════════════════════════════════════════════
// Vastu Purusha Body Mapping — main spine nodes (1–17)
//
// FIX (Bug 4): All 17 nodes are true midline anatomical
// landmarks. Bilateral names ("Right Eye", "Left Knee")
// no longer appear on the spine — they belong only on
// the R/L extension points generated from EXTENSION_CONFIG.
// ═══════════════════════════════════════════════════════

const MAIN_BODY_PARTS: Record<number, string> = {
    1: "Head Crown",
    2: "Forehead",
    3: "Third Eye (Ajna)",
    4: "Nose",
    5: "Mouth",
    6: "Chin",
    7: "Throat",
    8: "Upper Chest",
    9: "Navel (Brahma Bindu)",
    10: "Lower Abdomen",
    11: "Pelvis",
    12: "Groin",
    13: "Upper Thigh",
    14: "Knee",
    15: "Shin",
    16: "Ankle",
    17: "Foot Base",
};

// ═══════════════════════════════════════════════════════
// Extension body-part labels for R/L branch points.
// Keyed by spine node index and side.
// ═══════════════════════════════════════════════════════

const EXTENSION_BODY_PARTS: Record<number, { right: string; left: string }> = {
    2: { right: "Right Temple", left: "Left Temple" },
    3: { right: "Right Eye", left: "Left Eye" },
    4: { right: "Right Ear", left: "Left Ear" },
    5: { right: "Right Jaw", left: "Left Jaw" },
    7: { right: "Right Shoulder", left: "Left Shoulder" },
    8: { right: "Right Chest", left: "Left Chest" },
    9: { right: "Right Flank", left: "Left Flank" },
    10: { right: "Right Hip", left: "Left Hip" },
    11: { right: "Right Hip Joint", left: "Left Hip Joint" },
    13: { right: "Right Inner Thigh", left: "Left Inner Thigh" },
    15: { right: "Right Calf", left: "Left Calf" },
};

// ═══════════════════════════════════════════════════════
// Extension config — which spine nodes get L/R branches.
//
// FIX (Bug 3): Added nodes 4, 11, and 13 which are
// bilateral landmarks but were missing from the config.
// Each label array item is placed at 1×, 2×, 3× grid-unit
// offset along the perpendicular direction.
// ═══════════════════════════════════════════════════════

const EXTENSION_CONFIG: Record<number, { right: string[]; left: string[] }> = {
    2: { right: ["2R"], left: ["2L"] },
    3: { right: ["3R"], left: ["3L"] },
    4: { right: ["4R"], left: ["4L"] }, // Added
    5: { right: ["5R"], left: ["5L"] },
    7: { right: ["7R"], left: ["7L"] },
    8: { right: ["8R", "8RW"], left: ["8L", "8LW"] },
    9: { right: ["9R", "9RE"], left: ["9L", "9LE"] },
    10: { right: ["10R", "10RT", "10RN"], left: ["10L", "10LT", "10LN"] },
    11: { right: ["11R"], left: ["11L"] }, // Added
    13: { right: ["13R"], left: ["13L"] }, // Added
    15: { right: ["15R"], left: ["15L"] },
};

const SEGMENTS = 16; // 16 equal divisions → 17 nodes

// ═══════════════════════════════════════════════════════
// Geometry Utilities
// ═══════════════════════════════════════════════════════

function lerp(a: Point, b: Point, t: number): Point {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Segment–segment intersection.
 * Returns intersection point if the two finite segments cross, else null.
 */
function segSegIntersect(
    p1: Point, p2: Point,
    p3: Point, p4: Point
): Point | null {
    const d1x = p2.x - p1.x;
    const d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x;
    const d2y = p4.y - p3.y;

    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { x: p1.x + t * d1x, y: p1.y + t * d1y };
    }
    return null;
}

/**
 * Clips an infinite line (through `origin` at `angleDeg`) to the polygon.
 * Returns the two boundary intersection points that form the chord, or null.
 */
function clipLineToPoly(
    origin: Point,
    angleDeg: number,
    polygon: Point[]
): { start: Point; end: Point } | null {
    const n = polygon.length;
    if (n < 3) return null;

    const rad = (angleDeg - 90) * (Math.PI / 180);
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);

    const bb = boundingBox(polygon);
    const reach = Math.max(bb.width, bb.height) * 2 + 200;

    const fwd: Point = { x: origin.x + dx * reach, y: origin.y + dy * reach };
    const bwd: Point = { x: origin.x - dx * reach, y: origin.y - dy * reach };

    const hits: { pt: Point; t: number }[] = [];
    const totalDx = fwd.x - bwd.x;
    const totalDy = fwd.y - bwd.y;
    const lenSq = totalDx * totalDx + totalDy * totalDy;

    for (let i = 0; i < n; i++) {
        const pa = polygon[i];
        const pb = polygon[(i + 1) % n];
        const pt = segSegIntersect(bwd, fwd, pa, pb);
        if (pt) {
            const t = lenSq > 1e-10
                ? ((pt.x - bwd.x) * totalDx + (pt.y - bwd.y) * totalDy) / lenSq
                : 0;
            hits.push({ pt, t });
        }
    }

    if (hits.length < 2) return null;
    hits.sort((a, b) => a.t - b.t);

    const start = hits[0].pt;
    const end = hits[hits.length - 1].pt;

    // Sanity: midpoint must be inside
    const mid: Point = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    if (!pointInPolygon(mid, polygon)) return null;

    return { start, end };
}

// ═══════════════════════════════════════════════════════
// Main Generator
// ═══════════════════════════════════════════════════════

export function generateMarmaPoints(polygon: Point[], chakraRotation: number = 0): MarmaData | null {
    if (polygon.length < 3) return null;

    const centroid = computeCentroid(polygon);

    // ── 1. Main Spine: NE → SW axis ──
    // Base NE angle = 45°, offset by chakraRotation to match the user's compass.
    const spineAngle = 45 + chakraRotation;
    const spineClip = clipLineToPoly(centroid, spineAngle, polygon);
    if (!spineClip) return null;

    // The clip function sorts hits by parameter t along bwd→fwd.
    //   start (t≈0) = backward end = SW direction
    //   end   (t≈1) = forward end  = NE direction
    const spineNE = spineClip.end;    // forward = NE
    const spineSW = spineClip.start;  // backward = SW

    const spineLen = distance(spineNE, spineSW);
    if (spineLen < 1) return null;
    const gridUnit = spineLen / SEGMENTS;

    // Spine direction unit vector (NE → SW)
    const ux = (spineSW.x - spineNE.x) / spineLen;
    const uy = (spineSW.y - spineNE.y) / spineLen;

    // Perpendicular unit vectors
    // 90° clockwise rotation: (x,y) → (y, -x)  →  toward SE (right side of body)
    const rightDx = uy;
    const rightDy = -ux;
    // 90° counter-clockwise: toward NW (left side of body)
    const leftDx = -uy;
    const leftDy = ux;

    // ── 2. Interpolate 17 main spine points ──
    const spineNodes: Point[] = [];
    const mainPoints: MarmaPoint[] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const pt = lerp(spineNE, spineSW, t);
        spineNodes.push(pt);

        const num = i + 1; // 1-based (1 = Head/NE, 17 = Feet/SW)
        if (pointInPolygon(pt, polygon) || i === 0 || i === SEGMENTS) {
            mainPoints.push({
                id: `${num}`,
                x: pt.x,
                y: pt.y,
                label: `${num}`,
                bodyPart: MAIN_BODY_PARTS[num] ?? `Node ${num}`,
                type: "main",
                segmentIndex: num,
            });
        }
    }

    // ── 3. Perpendicular L/R extensions ──
    const extPoints: MarmaPoint[] = [];

    // FIX (Bug 2): track which spine nodes produce at least one visible extension
    // so we only draw perpendicular axis lines where they have marma points.
    const nodesWithVisibleExtensions = new Set<number>();

    for (const [idxStr, config] of Object.entries(EXTENSION_CONFIG)) {
        const num = parseInt(idxStr, 10);     // 1-based Marma number
        const interpIdx = num - 1;            // 0-based array index
        if (interpIdx < 0 || interpIdx > SEGMENTS) continue;

        const basePt = spineNodes[interpIdx];
        if (!basePt) continue;

        const extLabels = EXTENSION_BODY_PARTS[num];

        // ── Right extensions (toward SE) ──
        config.right.forEach((lbl, unitIdx) => {
            const units = unitIdx + 1;
            const pt: Point = {
                x: basePt.x + rightDx * gridUnit * units,
                y: basePt.y + rightDy * gridUnit * units,
            };
            if (pointInPolygon(pt, polygon)) {
                nodesWithVisibleExtensions.add(num);
                extPoints.push({
                    id: lbl,
                    x: pt.x,
                    y: pt.y,
                    label: lbl,
                    bodyPart: extLabels?.right ?? `${MAIN_BODY_PARTS[num] ?? "Node"} — Right`,
                    type: "right",
                    segmentIndex: num,
                });
            }
        });

        // ── Left extensions (toward NW) ──
        config.left.forEach((lbl, unitIdx) => {
            const units = unitIdx + 1;
            const pt: Point = {
                x: basePt.x + leftDx * gridUnit * units,
                y: basePt.y + leftDy * gridUnit * units,
            };
            if (pointInPolygon(pt, polygon)) {
                nodesWithVisibleExtensions.add(num);
                extPoints.push({
                    id: lbl,
                    x: pt.x,
                    y: pt.y,
                    label: lbl,
                    bodyPart: extLabels?.left ?? `${MAIN_BODY_PARTS[num] ?? "Node"} — Left`,
                    type: "left",
                    segmentIndex: num,
                });
            }
        });
    }

    // ── 4. Assemble axes for the rendering layer ──
    const perpAngle = 135 + chakraRotation;

    const axes: MarmaAxis[] = [
        {
            id: "spine",
            label: "NE–SW Spine",
            clipStart: spineNE,
            clipEnd: spineSW,
        },
    ];

    // FIX (Bug 2): Only add perpendicular grid lines for nodes that actually
    // have visible extension points inside the polygon. Drawing perp lines at
    // nodes whose extensions are all outside the polygon creates orphaned
    // floating lines with no associated marma badge — visual noise.
    for (const idxStr of Object.keys(EXTENSION_CONFIG)) {
        const num = parseInt(idxStr, 10);

        // Skip nodes with no visible extensions inside this polygon
        if (!nodesWithVisibleExtensions.has(num)) continue;

        const interpIdx = num - 1;
        const basePt = spineNodes[interpIdx];
        if (!basePt) continue;

        const perpAtNode = clipLineToPoly(basePt, perpAngle, polygon);
        if (perpAtNode) {
            axes.push({
                id: `perp-${num}`,
                label: `Perp @ ${num}`,
                clipStart: perpAtNode.start,
                clipEnd: perpAtNode.end,
            });
        }
    }

    return {
        centroid,
        axes,
        marmaPoints: [...mainPoints, ...extPoints],
    };
}