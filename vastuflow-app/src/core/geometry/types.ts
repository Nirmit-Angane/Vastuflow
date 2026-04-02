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
    areaPixel: number;
    areaReal: number;
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

// ═══════════════════════════════════════════════════════
// Devta Typings
// ═══════════════════════════════════════════════════════

export interface DevtaZone {
    name: string;
    englishAura?: string; // e.g. "Illusions", "Strength"
    ring: "brahmasthan" | "inner" | "middle" | "outer" | "corner";
    startAngle: number;
    endAngle: number;
    polygon: Point[];     // intersection bounded by the user's floor plan
    color: string;
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

export const DIRECTION_COLORS: Record<VastuDirection, string> = {
    // Matching the ShaktiChakra ring colors exactly
    N: "#4a90d9",   // blue
    NNE: "#5a9fd4",
    NE: "#6aafe0",   // teal-blue
    ENE: "#7bbd72",   // lime-green
    E: "#5cb85c",   // green
    ESE: "#82c96a",   // light green
    SE: "#c9b84e",   // gold-yellow
    SSE: "#d4a843",   // amber
    S: "#e8572a",   // red-orange
    SSW: "#d44e2a",   // deep orange
    SW: "#c9a34e",   // amber-brown
    WSW: "#a0917a",   // stone
    W: "#8a8a9a",   // cool grey
    WNW: "#7a8aaa",   // slate
    NW: "#6a7fba",   // periwinkle
    NNW: "#5a70c4",   // indigo-blue
};
