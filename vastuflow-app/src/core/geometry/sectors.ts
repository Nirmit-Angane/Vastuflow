// ═══════════════════════════════════════════════════════
// Core Geometry — 16 Radial Sector Generation
// Pure functions. No React. No state.
// ═══════════════════════════════════════════════════════

import { Point, Sector, DIRECTION_ORDER } from "./types";

const SECTOR_COUNT = 16;
const SECTOR_ANGLE = 360 / SECTOR_COUNT; // 22.5°
const ARC_SEGMENTS = 8; // resolution for arc approximation

/**
 * Generate 16 radial pie-sector polygons from centroid.
 *
 * Each sector is a triangle/wedge:
 *   centroid → arc start → arc points → arc end → centroid
 *
 * Convention:
 *   0° = North (up, i.e. -Y in screen coords)
 *   Angles increase clockwise
 *
 * @param centroid — Brahm Bindu
 * @param rotationOffset — degrees to rotate the chakra (default 0)
 */
export function generate16Sectors(centroid: Point, radius: number, rotationOffset: number = 0): Sector[] {
    return DIRECTION_ORDER.map((direction, index) => {
        const startAngle = index * SECTOR_ANGLE - SECTOR_ANGLE / 2 + rotationOffset;
        const endAngle = startAngle + SECTOR_ANGLE;

        const polygon = buildSectorPolygon(centroid, radius, startAngle, endAngle);

        return {
            direction,
            index,
            startAngle: ((startAngle % 360) + 360) % 360,
            endAngle: ((endAngle % 360) + 360) % 360,
            polygon,
        };
    });
}

/**
 * Build a polygon approximation of a circular sector (pie wedge).
 *
 * centroid → points along arc from startAngle to endAngle → centroid
 */
function buildSectorPolygon(
    centroid: Point,
    radius: number,
    startDeg: number,
    endDeg: number
): Point[] {
    const pts: Point[] = [centroid];

    for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const t = i / ARC_SEGMENTS;
        const angleDeg = startDeg + t * (endDeg - startDeg);
        const angleRad = degToScreenRad(angleDeg);
        pts.push({
            x: centroid.x + radius * Math.cos(angleRad),
            y: centroid.y + radius * Math.sin(angleRad),
        });
    }

    return pts;
}

/**
 * Convert compass degrees (0=North, CW) to screen radians.
 * Screen: 0 rad = right (+X), counter-clockwise
 * Compass: 0° = up (-Y), clockwise
 *
 * screenAngle = compassDeg - 90 (rotated), then negate for CW
 * → screenRad = (compassDeg - 90) * π / 180
 *
 * Since screen Y is inverted (down = +Y), clockwise = positive angle
 */
function degToScreenRad(compassDeg: number): number {
    return ((compassDeg - 90) * Math.PI) / 180;
}

/**
 * Compute the maximum radius needed to cover the entire polygon
 * from the centroid (i.e. max distance from centroid to any vertex, * 1.2 safety)
 */
export function computeCoveringRadius(centroid: Point, polygon: Point[]): number {
    let maxDist = 0;
    for (const p of polygon) {
        const d = Math.sqrt((p.x - centroid.x) ** 2 + (p.y - centroid.y) ** 2);
        if (d > maxDist) maxDist = d;
    }
    return maxDist * 1.2; // 20% safety margin
}

/**
 * Determine which Vastu direction a specific point falls into,
 * based on the centroid and current chakra rotation.
 */
export function getDirectionForPoint(centroid: Point, point: Point, rotationOffset: number = 0): string {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    // Math.atan2 gives angle from positive X axis (right) in radians, -PI to PI
    // Screen coords: +Y is down.
    const screenRad = Math.atan2(dy, dx);
    let compassDeg = (screenRad * 180 / Math.PI) + 90; // Convert to compass (0=North, +Y down means clockwise)

    // Adjust for the user's manual chakra rotation mapping
    compassDeg = compassDeg - rotationOffset;

    compassDeg = ((compassDeg % 360) + 360) % 360; // Normalize 0-360

    // Find the sector that contains this angle
    const SECTOR_ANGLE = 360 / 16;
    for (let i = 0; i < DIRECTION_ORDER.length; i++) {
        const dir = DIRECTION_ORDER[i];
        let startAngle = i * SECTOR_ANGLE - SECTOR_ANGLE / 2;
        let endAngle = startAngle + SECTOR_ANGLE;

        startAngle = ((startAngle % 360) + 360) % 360;
        endAngle = ((endAngle % 360) + 360) % 360;

        // Special case for North (crosses 0/360 boundary)
        if (startAngle > endAngle) {
            if (compassDeg >= startAngle || compassDeg < endAngle) return dir;
        } else {
            if (compassDeg >= startAngle && compassDeg < endAngle) return dir;
        }
    }
    return 'N'; // Fallback
}
