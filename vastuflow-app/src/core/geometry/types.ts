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
    N: "rgba(74,  144, 217, 0.55)",   // #4a90d9 — blue
    NNE: "rgba(90,  159, 212, 0.55)",   // #5a9fd4
    NE: "rgba(106, 175, 224, 0.55)",   // #6aafe0 — teal-blue
    ENE: "rgba(123, 189, 114, 0.55)",   // #7bbd72 — lime-green
    E: "rgba(92,  184, 92,  0.55)",   // #5cb85c — green
    ESE: "rgba(130, 201, 106, 0.55)",   // #82c96a — light green
    SE: "rgba(201, 184, 78,  0.55)",   // #c9b84e — gold-yellow
    SSE: "rgba(212, 168, 67,  0.55)",   // #d4a843 — amber
    S: "rgba(232, 87,  42,  0.55)",   // #e8572a — red-orange
    SSW: "rgba(212, 78,  42,  0.55)",   // #d44e2a — deep orange
    SW: "rgba(201, 163, 78,  0.55)",   // #c9a34e — amber-brown
    WSW: "rgba(160, 145, 122, 0.55)",   // #a0917a — stone
    W: "rgba(138, 138, 154, 0.55)",   // #8a8a9a — cool grey
    WNW: "rgba(122, 138, 170, 0.55)",   // #7a8aaa — slate
    NW: "rgba(106, 127, 186, 0.55)",   // #6a7fba — periwinkle
    NNW: "rgba(90,  112, 196, 0.55)",   // #5a70c4 — indigo-blue
};
