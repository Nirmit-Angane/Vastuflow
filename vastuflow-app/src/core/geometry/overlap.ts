// ═══════════════════════════════════════════════════════
// Core Geometry — Overlap Computation & Zone Scoring
// Pure functions. No React. No state.
//
// Computes the actual area overlap between the traced
// polygon and each of the 16 radial sectors, then
// derives zone scores from the real percentages.
// ═══════════════════════════════════════════════════════

import { Point, Sector, SectorOverlap, ZoneResult, VastuDirection, DIRECTION_ORDER } from "./types";
import { computePolygonArea, computeCentroid, ensureCCW } from "./polygon";
import { generate16Sectors, computeCoveringRadius } from "./sectors";
import { clipPolygon } from "./clipping";

/**
 * Compute the actual polygon ∩ sector overlap for all 16 sectors.
 *
 * 1. Compute centroid from polygon
 * 2. Compute covering radius
 * 3. Generate 16 sectors
 * 4. Clip polygon against each sector
 * 5. Compute clipped area / total area
 */
export function computeSectorOverlaps(polygon: Point[]): {
    centroid: Point;
    totalArea: number;
    sectors: Sector[];
    overlaps: SectorOverlap[];
} {
    const ccwPoly = ensureCCW(polygon);
    const totalArea = computePolygonArea(ccwPoly);
    const centroid = computeCentroid(ccwPoly);
    const radius = computeCoveringRadius(centroid, ccwPoly);
    const sectors = generate16Sectors(centroid, radius);

    const idealPercent = 100 / 16; // 6.25%

    const overlaps: SectorOverlap[] = sectors.map((sector) => {
        const clippedPolygon = clipPolygon(ccwPoly, sector.polygon);
        const clippedArea = clippedPolygon.length >= 3 ? computePolygonArea(clippedPolygon) : 0;
        const percentOfTotal = totalArea > 0 ? (clippedArea / totalArea) * 100 : 0;

        return {
            direction: sector.direction,
            clippedPolygon,
            clippedArea,
            percentOfTotal,
            idealPercent,
            deviationPercent: percentOfTotal - idealPercent,
        };
    });

    return { centroid, totalArea, sectors, overlaps };
}

/**
 * Derive zone-level scores from overlap percentages.
 *
 * Scoring model:
 * - Perfect balance = 6.25% per sector → score 10
 * - Score degrades with deviation from ideal
 * - Sectors with 0% overlap (polygon doesn't reach that zone) → score 0
 * - Status thresholds: good ≥ 7, moderate ≥ 4, critical < 4
 */
export function computeZoneScores(overlaps: SectorOverlap[]): ZoneResult[] {
    return overlaps.map((ov) => {
        const score = computeSingleZoneScore(ov);
        const status: ZoneResult["status"] =
            score >= 7 ? "good" : score >= 4 ? "moderate" : "critical";
        const remark = generateRemark(ov.direction, ov.percentOfTotal, score, status);

        return {
            direction: ov.direction,
            areaPercent: ov.percentOfTotal,
            score,
            status,
            remark,
        };
    });
}

/**
 * Score a single zone based on its area coverage.
 *
 * Scoring formula:
 * - If area is 0%: score = 0 (polygon doesn't extend into this sector)
 * - If area is ideal (6.25%): score = 10
 * - Linear degradation: each 1% deviation from ideal reduces score by ~1 point
 * - Clamped to [0, 10]
 */
function computeSingleZoneScore(ov: SectorOverlap): number {
    if (ov.percentOfTotal < 0.01) return 0; // No coverage

    const absDev = Math.abs(ov.deviationPercent);
    // Max ideal deviation before score = 0 is ~10%
    const rawScore = 10 - absDev * 1.0;
    return Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));
}

function generateRemark(
    direction: VastuDirection,
    areaPercent: number,
    score: number,
    status: ZoneResult["status"]
): string {
    if (areaPercent < 0.01) {
        return `${direction}: Polygon does not extend into this sector. No coverage detected.`;
    }
    if (status === "good") {
        return `${direction}: ${areaPercent.toFixed(1)}% area coverage — well-balanced sector.`;
    }
    if (status === "moderate") {
        return `${direction}: ${areaPercent.toFixed(1)}% area coverage — moderate deviation from ideal 6.25%. Consider spatial adjustment.`;
    }
    return `${direction}: ${areaPercent.toFixed(1)}% area coverage — significant deviation. Remediation recommended.`;
}

/**
 * Compute overall analysis score from zone results.
 * Weighted average of all 16 zone scores, scaled to 0–100.
 */
export function computeOverallScore(zones: ZoneResult[]): number {
    if (zones.length === 0) return 0;
    const totalScore = zones.reduce((sum, z) => sum + z.score, 0);
    const maxPossible = zones.length * 10;
    return Math.round((totalScore / maxPossible) * 100);
}
