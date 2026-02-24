// ═══════════════════════════════════════════════════════
// State — ProjectState + Reducer
// Single source of truth. All mutations via actions.
// ═══════════════════════════════════════════════════════

import { Phase } from "./phase";
import { Point, Sector, SectorOverlap, ZoneResult } from "@/core/geometry/types";
import {
    computePolygonArea, computeCentroid, ensureCCW, isSimplePolygon,
} from "@/core/geometry/polygon";
import { generate16Sectors, computeCoveringRadius } from "@/core/geometry/sectors";
import { computeSectorOverlaps, computeZoneScores, computeOverallScore } from "@/core/geometry/overlap";

// ── Project State ──

export interface ProjectState {
    phase: Phase;
    // Image
    image: string | null;
    imageName: string | null;
    imageSize: string | null;
    // Alignment
    rotation: number;
    // Scale calibration
    scaleRatio: number;           // real units per pixel
    scaleUnit: "feet" | "meters";
    scaleLineStart: Point | null; // first click on canvas
    scaleLineEnd: Point | null;   // second click on canvas
    scalePixelDistance: number;   // px distance between the two points
    scaleRealDistance: number;    // user-entered real-world distance
    scaleDrawing: boolean;        // currently in scale-draw mode
    scaleConfirmed: boolean;      // scale has been locked
    // Polygon
    polygon: Point[];
    polygonClosed: boolean;
    polygonArea: number;
    polygonValid: boolean;
    validationError: string | null;
    // Geometry
    centroid: Point | null;
    sectors: Sector[];
    sectorOverlaps: SectorOverlap[];
    // Analysis
    zoneResults: ZoneResult[];
    overallScore: number;
    deviationCount: number;
    analysisSummary: string;
    // Canvas
    layers: Record<string, boolean>;
}

export function createEmptyProject(): ProjectState {
    return {
        phase: Phase.IDLE,
        image: null,
        imageName: null,
        imageSize: null,
        rotation: 0,
        scaleRatio: 0,
        scaleUnit: "feet",
        scaleLineStart: null,
        scaleLineEnd: null,
        scalePixelDistance: 0,
        scaleRealDistance: 0,
        scaleDrawing: false,
        scaleConfirmed: false,
        polygon: [],
        polygonClosed: false,
        polygonArea: 0,
        polygonValid: true,
        validationError: null,
        centroid: null,
        sectors: [],
        sectorOverlaps: [],
        zoneResults: [],
        overallScore: 0,
        deviationCount: 0,
        analysisSummary: "",
        layers: {
            background: true,
            trace: true,
            centroid: true,
            sectors: false,
            zones: false,
            labels: true,
        },
    };
}

// ── Actions ──

export type ProjectAction =
    | { type: "LOAD_IMAGE"; url: string; name: string; size: string }
    | { type: "SET_ROTATION"; degrees: number }
    | { type: "CONFIRM_ALIGNMENT" }
    | { type: "START_SCALE_DRAW" }
    | { type: "SET_SCALE_POINT"; point: Point }
    | { type: "SET_REAL_DISTANCE"; distance: number }
    | { type: "SET_SCALE_UNIT"; unit: "feet" | "meters" }
    | { type: "CLEAR_SCALE_LINE" }
    | { type: "CONFIRM_SCALE" }
    | { type: "START_TRACING" }
    | { type: "ADD_VERTEX"; point: Point }
    | { type: "UNDO_VERTEX" }
    | { type: "CLOSE_POLYGON" }
    | { type: "TOGGLE_LAYER"; layer: string }
    | { type: "RESET" };

// ── Reducer ──

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
    switch (action.type) {
        case "LOAD_IMAGE": {
            if (state.phase !== Phase.IDLE) return state;
            return {
                ...state,
                phase: Phase.IMAGE_LOADED,
                image: action.url,
                imageName: action.name,
                imageSize: action.size,
            };
        }

        case "SET_ROTATION": {
            const deg = Number.isFinite(action.degrees) ? action.degrees : state.rotation;
            return { ...state, rotation: deg };
        }

        case "CONFIRM_ALIGNMENT": {
            if (state.phase !== Phase.IMAGE_LOADED) return state;
            return { ...state, phase: Phase.ALIGNED };
        }

        case "START_SCALE_DRAW": {
            if (state.phase !== Phase.ALIGNED) return state;
            return {
                ...state,
                scaleDrawing: true,
                scaleLineStart: null,
                scaleLineEnd: null,
                scalePixelDistance: 0,
            };
        }

        case "SET_SCALE_POINT": {
            if (!state.scaleDrawing) return state;
            if (!state.scaleLineStart) {
                return { ...state, scaleLineStart: action.point };
            }
            if (!state.scaleLineEnd) {
                const dx = action.point.x - state.scaleLineStart.x;
                const dy = action.point.y - state.scaleLineStart.y;
                const pixDist = Math.sqrt(dx * dx + dy * dy);
                return {
                    ...state,
                    scaleLineEnd: action.point,
                    scalePixelDistance: pixDist,
                    scaleDrawing: false,
                };
            }
            return state;
        }

        case "SET_REAL_DISTANCE": {
            const d = Number.isFinite(action.distance) ? action.distance : state.scaleRealDistance;
            return { ...state, scaleRealDistance: Math.max(0, d) };
        }

        case "SET_SCALE_UNIT": {
            return { ...state, scaleUnit: action.unit };
        }

        case "CLEAR_SCALE_LINE": {
            return {
                ...state,
                scaleLineStart: null,
                scaleLineEnd: null,
                scalePixelDistance: 0,
                scaleRealDistance: 0,
                scaleDrawing: false,
                scaleConfirmed: false,
                scaleRatio: 0,
            };
        }

        case "CONFIRM_SCALE": {
            if (state.phase !== Phase.ALIGNED) return state;
            if (state.scalePixelDistance <= 0 || state.scaleRealDistance <= 0) return state;
            const ratio = state.scaleRealDistance / state.scalePixelDistance;
            return {
                ...state,
                phase: Phase.SCALED,
                scaleRatio: ratio,
                scaleConfirmed: true,
                scaleDrawing: false,
            };
        }

        case "START_TRACING": {
            // Can start tracing from IDLE (no image) or SCALED (after alignment)
            if (state.phase === Phase.IDLE || state.phase === Phase.SCALED) {
                return {
                    ...state,
                    phase: Phase.TRACING,
                    polygon: [],
                    polygonClosed: false,
                    polygonArea: 0,
                    polygonValid: true,
                    validationError: null,
                    centroid: null,
                    sectors: [],
                    sectorOverlaps: [],
                    zoneResults: [],
                    overallScore: 0,
                    deviationCount: 0,
                    analysisSummary: "",
                };
            }
            return state;
        }

        case "ADD_VERTEX": {
            if (state.phase !== Phase.TRACING || state.polygonClosed) return state;
            return {
                ...state,
                polygon: [...state.polygon, action.point],
            };
        }

        case "UNDO_VERTEX": {
            if (state.phase !== Phase.TRACING) return state;
            return {
                ...state,
                polygon: state.polygon.slice(0, -1),
            };
        }

        case "CLOSE_POLYGON": {
            if (state.phase !== Phase.TRACING) return state;
            if (state.polygon.length < 3) return state;

            // Validate: non-self-intersecting
            if (!isSimplePolygon(state.polygon)) {
                return {
                    ...state,
                    polygonValid: false,
                    validationError: "Self-intersecting polygon detected. Undo and fix crossing edges.",
                };
            }

            // ── Full deterministic pipeline ──
            const ccwPoly = ensureCCW(state.polygon);
            const totalArea = computePolygonArea(ccwPoly);
            const centroid = computeCentroid(ccwPoly);
            const radius = computeCoveringRadius(centroid, ccwPoly);
            const sectors = generate16Sectors(centroid, radius);

            // Compute overlaps
            const { overlaps } = computeSectorOverlaps(ccwPoly);
            const zoneResults = computeZoneScores(overlaps);
            const overallScore = computeOverallScore(zoneResults);
            const deviationCount = zoneResults.filter(z => z.status !== "good").length;

            let summary: string;
            if (overallScore >= 80) summary = "Excellent geometric balance. Minimal spatial deviation across zones.";
            else if (overallScore >= 60) summary = "Good overall balance with some sector deviations. Targeted adjustment recommended.";
            else if (overallScore >= 40) summary = "Moderate imbalance. Multiple sectors show significant area deviation.";
            else summary = "Significant geometric imbalance detected. Comprehensive spatial review needed.";

            return {
                ...state,
                phase: Phase.ANALYZED,
                polygonClosed: true,
                polygonValid: true,
                validationError: null,
                polygonArea: totalArea,
                centroid,
                sectors,
                zoneResults,
                overallScore,
                deviationCount,
                analysisSummary: summary,
                layers: {
                    ...state.layers,
                    centroid: true,
                    sectors: true,
                    zones: true,
                },
            };
        }

        case "TOGGLE_LAYER": {
            return {
                ...state,
                layers: { ...state.layers, [action.layer]: !state.layers[action.layer] },
            };
        }

        case "RESET": {
            return createEmptyProject();
        }

        default:
            return state;
    }
}
