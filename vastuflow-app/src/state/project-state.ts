// ═══════════════════════════════════════════════════════
// State — ProjectState + Reducer
// Single source of truth. All mutations via actions.
// ═══════════════════════════════════════════════════════

import { Phase } from "./phase";
import { Point, Sector, SectorOverlap, ZoneResult, DevtaZone } from "@/core/geometry/types";
import {
    computePolygonArea, computeCentroid, ensureCCW, isSimplePolygon
} from "@/core/geometry/polygon";
import { getDirectionForPoint, computeCoveringRadius } from "@/core/geometry/sectors";
import { computeSectorOverlaps, computeZoneScores, computeOverallScore } from "@/core/geometry/overlap";
import { compute32Devtas, getDevtaForPoint } from "@/core/geometry/devtas";
import { VastuItem, PlacementStatus, VASTU_PLACEMENT_RULES, DEVTA_PLACEMENT_OVERRIDES } from "@/core/geometry/vastu-rules";
import { MapFurniture, MapText, MapWall } from "@/components/map-builder/MapBuilder";
import { generateMarmaPoints, MarmaPoint } from "@/core/geometry/marmaPoints";

export interface PlacedItem {
    id: string;
    type: VastuItem;
    point: Point;
    zone: string;
    devta?: string;
    status: PlacementStatus;
    remedy?: {
        loading?: boolean;
        error?: string;
        reasoning?: string;
        fix?: string;
    };
}

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
    devtaZones: DevtaZone[];
    chakraScale: number;          // 0.5 to 2.0 (default 1.0)
    chakraRotation: number;       // 0 to 360 (default 0)
    // Analysis
    zoneResults: ZoneResult[];
    overallScore: number;
    deviationCount: number;
    analysisSummary: string;
    // Canvas
    layers: Record<string, boolean>;
    // Interactive Selection
    hoveredDirection: string | null;
    selectedDirection: string | null;
    pointerDegree: number | null;
    // Crop
    cropMode: boolean;
    cropRect: { x: number; y: number; w: number; h: number } | null;
    // Vertex editing
    selectedVertex: number | null;
    // Placement Analysis
    placedItems: PlacedItem[];
    activePlacement: VastuItem | null;
    activeTab: "overlay" | "items";
    // Map Builder data
    mapWalls: MapWall[];
    mapFurniture: MapFurniture[];
    mapTexts: MapText[];
    // Marma Points
    marmaPoints: MarmaPoint[];
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
        devtaZones: [],
        chakraScale: 1.0,
        chakraRotation: 0,
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
            marma: false,
        },
        hoveredDirection: null,
        selectedDirection: null,
        pointerDegree: null,
        cropMode: false,
        cropRect: null,
        selectedVertex: null,
        placedItems: [],
        activePlacement: null,
        activeTab: "overlay",
        mapWalls: [],
        mapFurniture: [],
        mapTexts: [],
        marmaPoints: [],
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
    | { type: "SET_CHAKRA_SCALE"; scale: number }
    | { type: "SET_CHAKRA_ROTATION"; degrees: number }
    | { type: "TOGGLE_LAYER"; layer: string }
    | { type: "SET_HOVERED_DIRECTION"; direction: string | null }
    | { type: "SET_SELECTED_DIRECTION"; direction: string | null }
    | { type: "SET_POINTER_DEGREE"; degree: number | null }
    | { type: "START_CROP" }
    | { type: "SET_CROP_RECT"; rect: { x: number; y: number; w: number; h: number } | null }
    | { type: "CANCEL_CROP" }
    | { type: "APPLY_CROP"; url: string }
    | { type: "SELECT_VERTEX"; index: number | null }
    | { type: "MOVE_VERTEX"; index: number; dx: number; dy: number }
    | { type: "START_PLACEMENT"; itemType: VastuItem | null }
    | { type: "PLACE_ITEM"; point: Point }
    | { type: "REMOVE_PLACED_ITEM"; id: string }
    | { type: "FETCH_REMEDY_START"; id: string }
    | { type: "FETCH_REMEDY_SUCCESS"; id: string; reasoning: string; fix: string }
    | { type: "FETCH_REMEDY_ERROR"; id: string; error: string }
    | { type: "SET_ACTIVE_TAB"; tab: "overlay" | "items" }
    | { type: "SKIP_TO_TRACE"; walls?: MapWall[]; furniture?: MapFurniture[]; texts?: MapText[] }
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
                activeTab: "overlay",
            };
        }

        case "SKIP_TO_TRACE": {
            return {
                ...createEmptyProject(),
                phase: Phase.TRACING,
                mapWalls: action.walls || [],
                mapFurniture: action.furniture || [],
                mapTexts: action.texts || [],
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
                    deviationCount: 0,
                    analysisSummary: "",
                    placedItems: [],
                    activePlacement: null,
                    activeTab: "overlay",
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

            const analyzedState = recalculateAnalysis(state);
            return {
                ...analyzedState,
                phase: Phase.ANALYZED,
                polygonClosed: true,
                polygonValid: true,
                validationError: null,
                layers: {
                    ...state.layers,
                    centroid: true,
                    sectors: true,
                    zones: true,
                },
            };
        }

        case "SET_CHAKRA_SCALE": {
            if (state.phase !== Phase.ANALYZED) return state;
            const nextState = { ...state, chakraScale: action.scale };
            return recalculateAnalysis(nextState);
        }

        case "SET_CHAKRA_ROTATION": {
            if (state.phase !== Phase.ANALYZED) return state;
            const nextState = { ...state, chakraRotation: action.degrees };
            return recalculateAnalysis(nextState);
        }

        case "TOGGLE_LAYER": {
            return {
                ...state,
                layers: { ...state.layers, [action.layer]: !state.layers[action.layer] },
            };
        }

        case "SET_HOVERED_DIRECTION": {
            if (state.phase !== Phase.ANALYZED) return state;
            return { ...state, hoveredDirection: action.direction };
        }

        case "SET_SELECTED_DIRECTION": {
            if (state.phase !== Phase.ANALYZED) return state;
            // Toggle off if clicking the already selected direction
            return {
                ...state,
                selectedDirection: state.selectedDirection === action.direction ? null : action.direction
            };
        }

        case "SET_POINTER_DEGREE": {
            if (state.phase !== Phase.ANALYZED) return state;

            let autoSelectedDir = state.selectedDirection;
            if (action.degree !== null) {
                let deg = Math.floor(action.degree) % 360;
                if (deg < 0) deg += 360;
                // Subtract the rotation offset to query against the original dial, 
                // because the user enters a degree relative to true north (the physical world),
                // but our UI rotates the dial. Actually, the user reads the dial visually.
                // If they enter "90", they want whatever wedge visually sits at "90" on the rotated dial.
                // Since our `generate16Sectors` rotates the *start and end angles* of the wedges,
                // `targetDeg` can be checked directly against the sector properties!
                const sector = state.sectors.find(s => {
                    let start = s.startAngle % 360;
                    if (start < 0) start += 360;
                    let end = s.endAngle % 360;
                    if (end < 0) end += 360;

                    if (start > end) return deg >= start || deg <= end;
                    return deg >= start && deg <= end;
                });

                if (sector) autoSelectedDir = sector.direction;
            }

            return {
                ...state,
                pointerDegree: action.degree,
                selectedDirection: autoSelectedDir
            };
        }

        case "START_CROP": {
            return { ...state, cropMode: true, cropRect: null };
        }

        case "SET_CROP_RECT": {
            return { ...state, cropRect: action.rect };
        }

        case "CANCEL_CROP": {
            return { ...state, cropMode: false, cropRect: null };
        }

        case "APPLY_CROP": {
            return {
                ...state,
                image: action.url,
                cropMode: false,
                cropRect: null,
            };
        }

        case "SELECT_VERTEX": {
            return { ...state, selectedVertex: action.index };
        }

        case "MOVE_VERTEX": {
            if (action.index < 0 || action.index >= state.polygon.length) return state;
            const newPoly = state.polygon.map((p, i) =>
                i === action.index
                    ? { x: Math.max(0, p.x + action.dx), y: Math.max(0, p.y + action.dy) }
                    : p
            );
            const nextState = { ...state, polygon: newPoly };
            // Re-run full analysis if polygon is already closed
            if (state.polygonClosed) {
                const re = recalculateAnalysis(nextState);
                return { ...re, selectedVertex: state.selectedVertex };
            }
            return nextState;
        }

        case "START_PLACEMENT": {
            if (!state.centroid) return state; // Must have analyzed layout
            return { ...state, activePlacement: action.itemType };
        }

        case "PLACE_ITEM": {
            if (!state.activePlacement || !state.centroid) return state;
            const dir = getDirectionForPoint(state.centroid, action.point, state.chakraRotation);
            const devtaName = getDevtaForPoint(state.centroid, action.point, state.polygon, state.chakraRotation);

            // Look up status from rules matrix. If zone isn't directly defined, fallback to 'good' or appropriate default
            const ruleMap = VASTU_PLACEMENT_RULES[state.activePlacement];
            let status = (ruleMap && ruleMap[dir as (keyof typeof ruleMap)]) ? ruleMap[dir as (keyof typeof ruleMap)] as PlacementStatus : "good";

            // Check if Devta overrides this status
            const devtaOverrides = DEVTA_PLACEMENT_OVERRIDES[state.activePlacement];
            if (devtaName && devtaOverrides && devtaOverrides[devtaName]) {
                status = devtaOverrides[devtaName];
            }

            // ── Marma Point Conflict Detection ──
            // If the item is placed within 15px of a Marma node, apply energy-conflict penalty.
            const MARMA_CONFLICT_RADIUS = 15; // SVG pixels
            // Items that cause a "critical" energy disruption on Marma points
            const MARMA_CRITICAL_ITEMS: VastuItem[] = ["Toilets", "Washing Machine", "Overhead Watertank"];
            // Items that cause a "bad" disruption
            const MARMA_BAD_ITEMS: VastuItem[] = ["Master Bedroom", "Kitchen", "Water Pump/Bore"];
            const conflictingMarma = state.marmaPoints.find((mp: MarmaPoint) => {
                const dx = mp.x - action.point.x;
                const dy = mp.y - action.point.y;
                return Math.sqrt(dx * dx + dy * dy) <= MARMA_CONFLICT_RADIUS;
            });
            if (conflictingMarma) {
                if (MARMA_CRITICAL_ITEMS.includes(state.activePlacement)) {
                    status = "worst";
                } else if (MARMA_BAD_ITEMS.includes(state.activePlacement)) {
                    status = "bad";
                } else if (status === "best" || status === "good") {
                    status = "bad";
                }
            }

            const newItem: PlacedItem = {
                id: crypto.randomUUID(),
                type: state.activePlacement,
                point: action.point,
                zone: dir,
                devta: devtaName,
                status
            };

            return {
                ...state,
                placedItems: [...state.placedItems, newItem],
                activePlacement: null // auto exit placement mode after drop
            };
        }

        case "REMOVE_PLACED_ITEM": {
            return {
                ...state,
                placedItems: state.placedItems.filter(i => i.id !== action.id)
            };
        }

        case "FETCH_REMEDY_START": {
            return {
                ...state,
                placedItems: state.placedItems.map(item =>
                    item.id === action.id
                        ? { ...item, remedy: { loading: true } }
                        : item
                )
            };
        }

        case "FETCH_REMEDY_SUCCESS": {
            return {
                ...state,
                placedItems: state.placedItems.map(item =>
                    item.id === action.id
                        ? { ...item, remedy: { loading: false, reasoning: action.reasoning, fix: action.fix } }
                        : item
                )
            };
        }

        case "FETCH_REMEDY_ERROR": {
            return {
                ...state,
                placedItems: state.placedItems.map(item =>
                    item.id === action.id
                        ? { ...item, remedy: { loading: false, error: action.error } }
                        : item
                )
            };
        }

        case "SET_ACTIVE_TAB": {
            return { ...state, activeTab: action.tab };
        }

        case "RESET": {
            return createEmptyProject();
        }

        default:
            return state;
    }
}

/**
 * Recomputes the entire analysis pipeline based on the current polygon, scale, and rotation. 
 * Assumes the polygon is already validated to be non-self-intersecting.
 */
function recalculateAnalysis(state: ProjectState): ProjectState {
    const ccwPoly = ensureCCW(state.polygon);
    const totalArea = computePolygonArea(ccwPoly);
    const centroid = computeCentroid(ccwPoly);

    // Compute overlaps (this internally scales and rotates the 16 sectors)
    const { sectors, overlaps } = computeSectorOverlaps(ccwPoly, state.chakraScale, state.chakraRotation);
    const zoneResults = computeZoneScores(overlaps, state.scaleRatio);

    // Compute Devta geometries
    const devtas = compute32Devtas(centroid, computeCoveringRadius(centroid, ccwPoly) * state.chakraScale, ccwPoly, state.chakraRotation);

    const overallScore = computeOverallScore(zoneResults);
    const deviationCount = zoneResults.filter(z => z.status !== "good").length;

    let summary: string;
    if (overallScore >= 80) summary = "Excellent geometric balance. Minimal spatial deviation across zones.";
    else if (overallScore >= 60) summary = "Good overall balance with some sector deviations. Targeted adjustment recommended.";
    else if (overallScore >= 40) summary = "Moderate imbalance. Multiple sectors show significant area deviation.";
    else summary = "Significant geometric imbalance detected. Comprehensive spatial review needed.";

    // Compute Marma Points from the CCW polygon
    const marmaData = generateMarmaPoints(ccwPoly, state.chakraRotation);
    const marmaPoints: MarmaPoint[] = marmaData ? marmaData.marmaPoints : [];

    return {
        ...state,
        polygonArea: totalArea,
        centroid,
        sectors,
        sectorOverlaps: overlaps,
        devtaZones: devtas,
        zoneResults,
        overallScore,
        deviationCount,
        analysisSummary: summary,
        marmaPoints,
    };
}
