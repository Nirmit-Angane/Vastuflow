// ═══════════════════════════════════════════════════════
// Core Geometry — Polygon Mathematics
// Pure functions. No React. No state. No side effects.
// ═══════════════════════════════════════════════════════

import { Point } from "./types";

/**
 * Signed area via Shoelace formula.
 * Positive = counter-clockwise, Negative = clockwise.
 */
export function computeSignedArea(pts: Point[]): number {
    const n = pts.length;
    if (n < 3) return 0;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += pts[i].x * pts[j].y;
        area -= pts[j].x * pts[i].y;
    }
    return area / 2;
}

/**
 * Absolute area via Shoelace formula.
 */
export function computePolygonArea(pts: Point[]): number {
    return Math.abs(computeSignedArea(pts));
}

/**
 * Centroid (center of mass) of a simple polygon.
 * Uses the Shoelace-weighted formula.
 */
export function computeCentroid(pts: Point[]): Point {
    const n = pts.length;
    if (n === 0) return { x: 0, y: 0 };
    if (n === 1) return { x: pts[0].x, y: pts[0].y };
    if (n === 2) return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    const signedA = computeSignedArea(pts);
    if (Math.abs(signedA) < 1e-10) {
        // Degenerate — fallback to simple average
        const sx = pts.reduce((s, p) => s + p.x, 0);
        const sy = pts.reduce((s, p) => s + p.y, 0);
        return { x: sx / n, y: sy / n };
    }

    let cx = 0;
    let cy = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const cross = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
        cx += (pts[i].x + pts[j].x) * cross;
        cy += (pts[i].y + pts[j].y) * cross;
    }

    const factor = 1 / (6 * signedA);
    return { x: cx * factor, y: cy * factor };
}

/**
 * Ensure counter-clockwise winding order.
 */
export function ensureCCW(pts: Point[]): Point[] {
    if (computeSignedArea(pts) < 0) return [...pts].reverse();
    return [...pts];
}

/**
 * Point-in-polygon test (ray casting).
 */
export function pointInPolygon(pt: Point, poly: Point[]): boolean {
    let inside = false;
    const n = poly.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        if (((yi > pt.y) !== (yj > pt.y)) &&
            (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Detect self-intersection in a simple polygon.
 * Two non-adjacent edges must not cross.
 */
export function isSimplePolygon(pts: Point[]): boolean {
    const n = pts.length;
    if (n < 3) return false;

    for (let i = 0; i < n; i++) {
        const a1 = pts[i];
        const a2 = pts[(i + 1) % n];
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue; // skip adjacent wrap
            const b1 = pts[j];
            const b2 = pts[(j + 1) % n];
            if (segmentsIntersect(a1, a2, b1, b2)) return false;
        }
    }
    return true;
}

/**
 * Proper segment–segment intersection test (excludes endpoint touching).
 */
function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
    const d1 = cross(b1, b2, a1);
    const d2 = cross(b1, b2, a2);
    const d3 = cross(a1, a2, b1);
    const d4 = cross(a1, a2, b2);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    return false;
}

function cross(o: Point, a: Point, b: Point): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Distance between two points.
 */
export function distance(a: Point, b: Point): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Bounding box of a polygon.
 */
export function boundingBox(pts: Point[]): {
    minX: number; minY: number; maxX: number; maxY: number;
    width: number; height: number;
} {
    if (pts.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
