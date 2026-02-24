// ═══════════════════════════════════════════════════════
// Core Geometry Types — Pure data, no logic
// ═══════════════════════════════════════════════════════

export interface Point {
    x: number;
    y: number;
}

export interface Sector {
    direction: VastuDirection;
    index: number;
    startAngle: number; // degrees, 0 = North (up), clockwise
    endAngle: number;
    polygon: Point[]; // triangle/wedge polygon from centroid to bounding radius
}

export interface SectorOverlap {
    direction: VastuDirection;
    clippedPolygon: Point[];
    clippedArea: number;       // absolute area in px²
    percentOfTotal: number;    // 0–100
    idealPercent: number;      // expected % if perfectly balanced = 6.25
    deviationPercent: number;  // actual - ideal
}

export interface ZoneResult {
    direction: VastuDirection;
    areaPercent: number;
    score: number;        // 0–10 derived from overlap geometry
    status: "good" | "moderate" | "critical";
    remark: string;
}

export interface AnalysisResult {
    totalArea: number;
    centroid: Point;
    sectorOverlaps: SectorOverlap[];
    zoneResults: ZoneResult[];
    overallScore: number; // 0–100
    deviationCount: number;
    summary: string;
}

export type VastuDirection =
    | "N" | "NNE" | "NE" | "ENE"
    | "E" | "ESE" | "SE" | "SSE"
    | "S" | "SSW" | "SW" | "WSW"
    | "W" | "WNW" | "NW" | "NNW";

export const DIRECTION_ORDER: VastuDirection[] = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
];

export const DIRECTION_LABELS: Record<VastuDirection, string> = {
    N: "North", NNE: "North-Northeast", NE: "Northeast", ENE: "East-Northeast",
    E: "East", ESE: "East-Southeast", SE: "Southeast", SSE: "South-Southeast",
    S: "South", SSW: "South-Southwest", SW: "Southwest", WSW: "West-Southwest",
    W: "West", WNW: "West-Northwest", NW: "Northwest", NNW: "North-Northwest",
};
