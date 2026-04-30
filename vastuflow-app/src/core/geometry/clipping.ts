// ═══════════════════════════════════════════════════════
// Core Geometry — Sutherland-Hodgman Polygon Clipping
// Pure functions. No React. No state.
//
// Clips a subject polygon against a convex clip polygon.
// Used to compute the intersection of the floor plan
// polygon with each of the 16 radial sectors.
// ═══════════════════════════════════════════════════════

import { Point } from "./types";

/**
 * Sutherland-Hodgman polygon clipping algorithm.
 *
 * Clips `subject` polygon against each edge of the convex `clip` polygon.
 * Returns the clipped polygon vertices (may be empty if no overlap).
 *
 * Both polygons should be in the same winding order (CCW preferred).
 */
export function clipPolygon(subject: Point[], clip: Point[]): Point[] {
    if (subject.length < 3 || clip.length < 3) return [];

    let output = [...subject];

    for (let i = 0; i < clip.length; i++) {
        if (output.length === 0) return [];

        const edgeStart = clip[i];
        const edgeEnd = clip[(i + 1) % clip.length];
        const input = output;
        output = [];

        for (let j = 0; j < input.length; j++) {
            const current = input[j];
            const prev = input[(j + input.length - 1) % input.length];

            const currentInside = isLeft(edgeStart, edgeEnd, current);
            const prevInside = isLeft(edgeStart, edgeEnd, prev);

            if (currentInside) {
                if (!prevInside) {
                    // Entering: add intersection, then current
                    const inter = lineIntersection(prev, current, edgeStart, edgeEnd);
                    if (inter) output.push(inter);
                }
                output.push(current);
            } else if (prevInside) {
                // Leaving: add intersection only
                const inter = lineIntersection(prev, current, edgeStart, edgeEnd);
                if (inter) output.push(inter);
            }
        }
    }

    return output;
}

/**
 * Is point `p` on the left side of directed edge (a → b)?
 * For CCW polygons, "left" = "inside".
 */
function isLeft(a: Point, b: Point, p: Point): boolean {
    return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0;
}

/**
 * Compute intersection point of line segment (p1,p2) with line (p3,p4).
 * Returns null if lines are parallel.
 */
function lineIntersection(
    p1: Point, p2: Point,
    p3: Point, p4: Point
): Point | null {
    const dx1 = p2.x - p1.x;
    const dy1 = p2.y - p1.y;
    const dx2 = p4.x - p3.x;
    const dy2 = p4.y - p3.y;

    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-10) return null; // Parallel

    const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;

    return {
        x: p1.x + t * dx1,
        y: p1.y + t * dy1,
    };
}
