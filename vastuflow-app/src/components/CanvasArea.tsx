"use client";

import { useState, useRef, useEffect } from "react";

import { ProjectState, ProjectAction } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { DIRECTION_COLORS, Point } from "@/core/geometry/types";
import { MapFurniture, MapText, MapWall } from "@/components/map-builder/MapBuilder";
import ShaktiChakra from "./ShaktiChakra";
import MarmaLayer from "./MarmaLayer";
import DevtasLayer from "./DevtasLayer";

const FURN_ICONS: Record<string, (w: number, h: number) => React.ReactNode> = {
    bed: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={4} fill="#D2C8B8" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.6} rx={2} fill="#E1D7C6" stroke="#8B7D6B" strokeWidth={0.5} />
        <rect x={w * 0.08} y={h * 0.68} width={w * 0.38} height={h * 0.25} rx={3} fill="#F4EFE6" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.54} y={h * 0.68} width={w * 0.38} height={h * 0.25} rx={3} fill="#F4EFE6" stroke="#8B7D6B" strokeWidth={1} />
    </>),
    sofa: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#BBAA94" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.1} y={0} width={w * 0.8} height={h * 0.7} rx={1} fill="#CFC0AD" stroke="#8B7D6B" strokeWidth={0.5} />
        <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h * 0.7} stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
    table: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#A28C73" stroke="#685744" strokeWidth={1.5} />
        <rect x={w * 0.1} y={h * 0.1} width={w * 0.8} height={h * 0.8} rx={1} fill="none" stroke="#685744" strokeWidth={0.5} opacity={0.5} />
    </>),
    chair: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={w * 0.5} fill="#D5CBBB" stroke="#8B7D6B" strokeWidth={1} />
        <path d={`M${w * 0.1} ${h * 0.5} Q${w * 0.5} ${h * 0.1} ${w * 0.9} ${h * 0.5}`} fill="none" stroke="#8B7D6B" strokeWidth={2} strokeLinecap="round" />
        <circle cx={w * 0.5} cy={h * 0.6} r={w * 0.2} fill="#E8E2D9" stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
    tv: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#4A4A4A" stroke="#2B2B2B" strokeWidth={1.5} />
        <rect x={1} y={1} width={w - 2} height={h - 2} fill="#232323" />
        <line x1={w * 0.3} y1={h} x2={w * 0.7} y2={h} stroke="#2B2B2B" strokeWidth={2} />
    </>),
    plant: (w, h) => (<>
        <circle cx={w * 0.5} cy={h * 0.5} r={w * 0.45} fill="#7A8B6B" stroke="#5C6B4E" strokeWidth={1} />
        <circle cx={w * 0.5} cy={h * 0.5} r={w * 0.3} fill="#8DA67A" stroke="#5C6B4E" strokeWidth={0.5} />
        <path d={`M${w * 0.5} ${h * 0.5} L${w * 0.2} ${h * 0.2} M${w * 0.5} ${h * 0.5} L${w * 0.8} ${h * 0.2} M${w * 0.5} ${h * 0.5} L${w * 0.8} ${h * 0.8} M${w * 0.5} ${h * 0.5} L${w * 0.2} ${h * 0.8}`} stroke="#5C6B4E" strokeWidth={1} strokeLinecap="round" />
    </>),
    sink: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#E8EDF2" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.1} y={h * 0.1} width={w * 0.8} height={h * 0.6} rx={w * 0.4} fill="#FFFFFF" stroke="#8B7D6B" strokeWidth={0.5} />
        <circle cx={w * 0.5} cy={h * 0.4} r={w * 0.08} fill="#4A4A4A" />
        <circle cx={w * 0.5} cy={h * 0.85} r={w * 0.05} fill="#A0A0A0" />
    </>),
    toilet: (w, h) => (<>
        <rect x={w * 0.1} y={0} width={w * 0.8} height={h * 0.4} rx={2} fill="#FFFFFF" stroke="#8B7D6B" strokeWidth={1} />
        <ellipse cx={w * 0.5} cy={h * 0.6} rx={w * 0.35} ry={h * 0.35} fill="#FFFFFF" stroke="#8B7D6B" strokeWidth={1} />
        <ellipse cx={w * 0.5} cy={h * 0.6} rx={w * 0.25} ry={h * 0.25} fill="none" stroke="#D1CEC5" strokeWidth={0.8} />
    </>),
    bathtub: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#FFFFFF" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={w * 0.05} y={h * 0.08} width={w * 0.9} height={h * 0.84} rx={h * 0.3} fill="#F7F9FA" stroke="#D1CEC5" strokeWidth={0.8} />
        <circle cx={w * 0.85} cy={h * 0.5} r={w * 0.03} fill="#4A4A4A" />
    </>),
    desk: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#C6B5A1" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.1} y={h * 0.2} width={w * 0.8} height={h * 0.6} fill="#DCH8C4" />
        <rect x={w * 0.6} y={1} width={w * 0.3} height={h * 0.3} fill="#F0F0F0" stroke="#A9A9A9" strokeWidth={0.5} />
    </>),
    dining: (w, h) => (<>
        <rect x={w * 0.15} y={h * 0.15} width={w * 0.7} height={h * 0.7} rx={w * 0.35} fill="#A28C73" stroke="#685744" strokeWidth={1} />
        <circle cx={w * 0.5} cy={h * 0.05} r={w * 0.12} fill="#D5CBBB" stroke="#8B7D6B" strokeWidth={0.5} />
        <circle cx={w * 0.5} cy={h * 0.95} r={w * 0.12} fill="#D5CBBB" stroke="#8B7D6B" strokeWidth={0.5} />
        <circle cx={w * 0.05} cy={h * 0.5} r={w * 0.12} fill="#D5CBBB" stroke="#8B7D6B" strokeWidth={0.5} />
        <circle cx={w * 0.95} cy={h * 0.5} r={w * 0.12} fill="#D5CBBB" stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
    rug: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#DCD5CB" stroke="#B8A793" strokeWidth={1} strokeDasharray="2 1" />
        <rect x={w * 0.05} y={h * 0.05} width={w * 0.9} height={h * 0.9} fill="none" stroke="#B8A793" strokeWidth={0.5} opacity={0.6} />
    </>),
    wardrobe: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#A28C73" stroke="#685744" strokeWidth={1} />
        <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h} stroke="#685744" strokeWidth={0.8} />
        <line x1={w * 0.4} y1={h * 0.5} x2={w * 0.45} y2={h * 0.5} stroke="#685744" strokeWidth={1.5} />
        <line x1={w * 0.6} y1={h * 0.5} x2={w * 0.55} y2={h * 0.5} stroke="#685744" strokeWidth={1.5} />
    </>),
    washer: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#F0EDE8" stroke="#8B7D6B" strokeWidth={1} />
        <ellipse cx={w * 0.5} cy={h * 0.5} rx={w * 0.3} ry={h * 0.3} fill="#DDD8D0" stroke="#8B7D6B" strokeWidth={0.8} />
        <circle cx={w * 0.5} cy={h * 0.35} r={2} fill="#8B7D6B" />
    </>),
    stove: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#E0DDD8" stroke="#8B7D6B" strokeWidth={1.2} />
        <circle cx={w * 0.28} cy={h * 0.32} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.72} cy={h * 0.32} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.28} cy={h * 0.68} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.72} cy={h * 0.68} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
    </>),
    fridge: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#E8E5E0" stroke="#8B7D6B" strokeWidth={1.2} />
        <line x1={2} y1={h * 0.35} x2={w - 2} y2={h * 0.35} stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.78} y={h * 0.08} width={3} height={h * 0.2} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.78} y={h * 0.42} width={3} height={h * 0.2} rx={1} fill="#8B7D6B" />
    </>),
    singledoor: (w, h) => (<>
        <rect x={0} y={0} width={w * 0.2} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <path d={`M${w * 0.2} ${h} A${w * 0.8} ${h} 0 0 0 ${w} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="4 2" />
        <line x1={w * 0.2} y1={h} x2={w * 0.2} y2={0} stroke="#8B7D6B" />
        <line x1={w * 0.2} y1={h} x2={w} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
    </>),
    doubledoor: (w, h) => (<>
        <rect x={0} y={0} width={w * 0.15} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.85} y={0} width={w * 0.15} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <path d={`M${w * 0.15} ${h} A${w * 0.35} ${h} 0 0 0 ${w * 0.5} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="3 2" />
        <path d={`M${w * 0.85} ${h} A${w * 0.35} ${h} 0 0 1 ${w * 0.5} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={w * 0.15} y1={h} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
        <line x1={w * 0.85} y1={h} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
    </>),
    window: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeWidth={1} />
        <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
};
interface CanvasAreaProps {
    state: ProjectState;
    dispatch: React.Dispatch<ProjectAction>;
    onCanvasClick: (p: Point) => void;
}

const BASE_W = 840;
const BASE_H = 800;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

export default function CanvasArea({ state, dispatch, onCanvasClick }: CanvasAreaProps) {
    const { polygon, centroid, layers, phase, sectorOverlaps, polygonClosed, hoveredDirection, selectedDirection } = state;
    const [zoom, setZoom] = useState(1);
    const svgRef = useRef<SVGSVGElement>(null);
    const cropDragStart = useRef<{ x: number; y: number } | null>(null);

    const vbW = BASE_W / zoom;
    const vbH = BASE_H / zoom;
    const vbX = (BASE_W - vbW) / 2;
    const vbY = (BASE_H - vbH) / 2;

    // Handle AI evaluation for custom items
    useEffect(() => {
        const loadingCustomItems = state.placedItems.filter(item =>
            item.type === "Custom" &&
            item.remedy?.loading === true
        );

        loadingCustomItems.forEach(async (item) => {
            try {
                const res = await fetch("/api/evaluate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        itemName: item.customName,
                        zone: item.zone
                    })
                });
                const data = await res.json();
                if (data.status) {
                    dispatch({
                        type: "UPDATE_ITEM_EVALUATION",
                        id: item.id,
                        status: data.status,
                        reasoning: data.reasoning,
                        fix: data.fix
                    });
                }
            } catch (err) {
                console.error("Failed to evaluate custom item:", err);
            }
        });
    }, [state.placedItems, dispatch]);

    // Convert client coords ? SVG viewBox coords
    const clientToSVG = (cx: number, cy: number): Point | null => {
        const svg = svgRef.current;
        if (!svg) return null;
        const pt = svg.createSVGPoint();
        pt.x = cx; pt.y = cy;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        return pt.matrixTransform(ctm.inverse());
    };

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (state.cropMode) return; // don't add vertices in crop mode
        if (!onCanvasClick) return;
        const p = clientToSVG(e.clientX, e.clientY);
        if (!p) return;

        // Handle item placement
        if (state.activePlacement && state.centroid) {
            dispatch({ type: "PLACE_ITEM", point: p });
            return;
        }

        onCanvasClick(p);
    };

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!state.cropMode) return;
        const p = clientToSVG(e.clientX, e.clientY);
        if (!p) return;
        cropDragStart.current = p;
        dispatch({ type: "SET_CROP_RECT", rect: { x: p.x, y: p.y, w: 0, h: 0 } });
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!state.cropMode || !cropDragStart.current) return;
        const p = clientToSVG(e.clientX, e.clientY);
        if (!p) return;
        const { x: sx, y: sy } = cropDragStart.current;
        dispatch({
            type: "SET_CROP_RECT", rect: {
                x: Math.min(sx, p.x), y: Math.min(sy, p.y),
                w: Math.abs(p.x - sx), h: Math.abs(p.y - sy)
            }
        });
    };

    const handleMouseUp = () => {
        cropDragStart.current = null;
    };

    const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    const zoomFit = () => setZoom(1);

    // Arrow-key nudge for selected vertex
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const onKey = (e: KeyboardEvent) => {
            if (state.selectedVertex === null) return;
            const DIRS: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0], ArrowRight: [1, 0],
                ArrowUp: [0, -1], ArrowDown: [0, 1],
            };
            const dir = DIRS[e.key];
            if (!dir) {
                if (e.key === "Escape") dispatch({ type: "SELECT_VERTEX", index: null });
                return;
            }
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            dispatch({ type: "MOVE_VERTEX", index: state.selectedVertex, dx: dir[0] * step, dy: dir[1] * step });
        };
        svg.addEventListener("keydown", onKey);
        return () => svg.removeEventListener("keydown", onKey);
    }, [state.selectedVertex, dispatch]);

    return (
        <div className="canvas-area">
            <svg
                ref={svgRef}
                tabIndex={0}
                style={{
                    position: "absolute",
                    inset: "16px",
                    width: "calc(100% - 32px)",
                    height: "calc(100% - 32px)",
                    cursor: state.cropMode ? "crosshair" : state.activePlacement ? "crosshair" : (phase === Phase.TRACING || state.scaleDrawing) ? "crosshair" : "default",
                    outline: "none",
                }}
                viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* -- Uploaded floor plan image (rotated) -- */}
                {layers.background && state.image && (
                    <g transform={`rotate(${state.rotation}, 420, 400)`}>
                        <image
                            href={state.image}
                            x="0"
                            y="0"
                            width="840"
                            height="800"
                            preserveAspectRatio="xMidYMid meet"
                            opacity="0.85"
                            style={{ pointerEvents: "none" }}
                        />
                    </g>
                )}

                {/* -- MapBuilder Rendered Walls -- */}
                {state.mapWalls && state.mapWalls.length > 0 && (
                    <g className="map-walls-layer">
                        {state.mapWalls.map((w: MapWall) => (
                            <g key={w.id}>
                                {w.type === "standard" ? (
                                    <g>
                                        <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#1C1A15" strokeWidth={w.thickness} strokeLinecap="round" opacity={0.5} />
                                        {/* Simplified double line rendering for CanvasArea read-only view */}
                                        <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#FFF" strokeWidth={Math.max(1, w.thickness - 2)} strokeLinecap="round" />
                                    </g>
                                ) : (
                                    <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                                        stroke={w.type === "inner" ? "#AFA9A0" : "#CD853F"}
                                        strokeWidth={w.type === "beam" ? 3 : w.thickness}
                                        strokeDasharray={w.type === "beam" ? "6 3" : "none"}
                                        strokeLinecap="round" />
                                )}
                            </g>
                        ))}
                    </g>
                )}

                {/* -- MapBuilder Rendered Furniture & Objects -- */}
                {state.mapFurniture && state.mapFurniture.length > 0 && (
                    <g className="map-furniture-layer">
                        {state.mapFurniture.map((f: MapFurniture) => {
                            const render = FURN_ICONS[f.type];
                            return (
                                <g key={f.id} transform={`translate(${f.x + f.w / 2},${f.y + f.h / 2}) rotate(${f.rotation}) translate(${-f.w / 2},${-f.h / 2})`}>
                                    <g transform={`scale(${f.w / 36},${f.h / 28})`}>
                                        {render ? render(36, 28) : <rect width={36} height={28} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={1} />}
                                    </g>
                                    <text x={f.w / 2} y={f.h + 10} fontSize={8} fill="#7A7567" textAnchor="middle" fontFamily="var(--font-mono)">{f.label}</text>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* -- MapBuilder Rendered Texts -- */}
                {state.mapTexts && state.mapTexts.length > 0 && (
                    <g className="map-texts-layer">
                        {state.mapTexts.map((t: MapText) => (
                            <g key={t.id} transform={`translate(${t.x},${t.y}) rotate(${t.rotation})`}>
                                <text x={0} y={0} fontSize={t.fontSize} fill="#1C1A15" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-primary)" fontWeight={500}>{t.text}</text>
                            </g>
                        ))}
                    </g>
                )}

                {/* -- Shakti Chakra Overlay -- */}
                {isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
                    <g className="shakti-chakra-layer" style={{ visibility: layers.sectors ? "visible" : "hidden" }}>
                        <ShaktiChakra
                            centroid={centroid}
                            scale={state.chakraScale}
                            rotation={state.chakraRotation}
                            selectedDirection={state.selectedDirection}
                            hoveredDirection={state.hoveredDirection}
                            entranceDegree={state.pointerDegree}
                            onDirectionClick={(dir) => dispatch({ type: "SET_SELECTED_DIRECTION", direction: dir })}
                            onDirectionHover={(dir) => dispatch({ type: "SET_HOVERED_DIRECTION", direction: dir })}
                        />
                    </g>
                )}

                {/* -- Marma Points Layer -- */}
                {/* FIX (Bug 1): pass axes + marmaPoints from state instead of polygon + chakraRotation.
                    MarmaLayer no longer recomputes — it renders exactly what the reducer stored,
                    so the visual layer and collision detection (PLACE_ITEM) are always in sync. */}
                {isPhaseAtLeast(phase, Phase.ANALYZED) && state.marmaPoints.length > 0 && (
                    <g className="marma-layer" style={{ visibility: layers.marma ? "visible" : "hidden" }}>
                        <MarmaLayer
                            axes={state.marmaAxes}
                            marmaPoints={state.marmaPoints}
                            visible={true}
                        />
                    </g>
                )}

                {/* -- Zone fills (from real overlap clipped polygons) -- */}
                {isPhaseAtLeast(phase, Phase.ANALYZED) && sectorOverlaps.length > 0 && (
                    <g className="zone-fills-layer" style={{ pointerEvents: "none", visibility: layers.zones ? "visible" : "hidden" }}>
                        {sectorOverlaps.map((ov, i) => {
                            if (ov.clippedPolygon.length < 3) return null;
                            const isHovered = hoveredDirection === ov.direction;
                            const isSelected = selectedDirection === ov.direction;
                            const isActive = isSelected || isHovered;

                            // Only show specific zone if one is hovered/selected, otherwise show all if none selected
                            if (!isActive && (hoveredDirection || selectedDirection)) return null;

                            const statusColor = ov.percentOfTotal >= 5
                                ? "var(--good)"
                                : ov.percentOfTotal >= 2
                                    ? "var(--accent-gold)"
                                    : "var(--critical)";

                            return (
                                <polygon
                                    key={`zone-${i}`}
                                    points={ov.clippedPolygon.map(p => `${p.x},${p.y}`).join(" ")}
                                    fill={isActive ? DIRECTION_COLORS[ov.direction] : statusColor}
                                    opacity={isActive ? "0.6" : "0.12"}
                                    stroke={isActive ? DIRECTION_COLORS[ov.direction] : statusColor}
                                    strokeWidth={isActive ? "1.5" : "0.5"}
                                    strokeOpacity={isActive ? "1" : "0.3"}
                                />
                            );
                        })}
                    </g>
                )}

                {/* -- Devta Zones -- */}
                {isPhaseAtLeast(phase, Phase.ANALYZED) && state.devtaZones && state.devtaZones.length > 0 && (
                    <g className="devtas-layer" style={{ visibility: layers.devtas ? "visible" : "hidden" }}>
                        <DevtasLayer zones={state.devtaZones} visible={true} showNames={layers.labels} />
                    </g>
                )}

                {/* -- Traced polygon -- */}
                {layers.trace && polygon.length > 0 && (
                    <>
                        <polygon
                            points={polygon.map(v => `${v.x},${v.y}`).join(" ")}
                            stroke="var(--accent-gold)"
                            strokeWidth="2"
                            fill={polygonClosed ? "rgba(184,134,11,0.04)" : "none"}
                            strokeDasharray={polygonClosed ? "none" : "6 3"}
                            strokeLinejoin="round"
                        />
                        {polygon.map((v, i) => {
                            const isSel = state.selectedVertex === i;
                            return (
                                <g
                                    key={`v-${i}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Click on selected vertex to deselect, or select another
                                        const next = isSel ? null : i;
                                        dispatch({ type: "SELECT_VERTEX", index: next });
                                        // Focus SVG so arrow keys work immediately
                                        svgRef.current?.focus();
                                    }}
                                >
                                    {/* Outer selection ring */}
                                    {isSel && (
                                        <circle cx={v.x} cy={v.y} r="10"
                                            fill="rgba(184,134,11,0.15)"
                                            stroke="var(--accent-gold)" strokeWidth="2"
                                        />
                                    )}
                                    {/* Base vertex dot */}
                                    <circle cx={v.x} cy={v.y} r="5"
                                        fill={isSel ? "var(--accent-gold)" : "var(--text-primary)"}
                                        stroke="var(--surface)" strokeWidth="2"
                                    />
                                    {/* Vertex index label (shown when selected) */}
                                    {isSel && (
                                        <text x={v.x + 10} y={v.y - 10}
                                            fontFamily="'DM Mono', monospace" fontSize="9"
                                            fill="var(--accent-gold)" fontWeight="700"
                                        >
                                            P{i + 1}
                                        </text>
                                    )}
                                    {/* First-vertex pulse ring while tracing */}
                                    {i === 0 && !polygonClosed && (
                                        <circle cx={v.x} cy={v.y} r="12" stroke="var(--accent-gold)" strokeWidth="1.5" fill="none" className="vertex-pulse" opacity="0.5" />
                                    )}
                                </g>
                            );
                        })}
                    </>
                )}



                {/* -- Brahm Bindu (computed centroid � only after CLOSE_POLYGON) -- */}
                {layers.centroid && isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
                    <g pointerEvents="none">
                        <line x1={centroid.x - 8} y1={centroid.y} x2={centroid.x + 8} y2={centroid.y} stroke="var(--accent-gold)" strokeWidth="2" />
                        <line x1={centroid.x} y1={centroid.y - 8} x2={centroid.x} y2={centroid.y + 8} stroke="var(--accent-gold)" strokeWidth="2" />
                    </g>
                )}

                {/* -- Scale reference line -- */}
                {
                    state.scaleLineStart && (
                        <g>
                            {/* Line */}
                            {state.scaleLineEnd && (
                                <line
                                    x1={state.scaleLineStart.x} y1={state.scaleLineStart.y}
                                    x2={state.scaleLineEnd.x} y2={state.scaleLineEnd.y}
                                    stroke="var(--accent-gold)" strokeWidth="2" strokeDasharray="6 3"
                                />
                            )}
                            {/* Start dot */}
                            <circle cx={state.scaleLineStart.x} cy={state.scaleLineStart.y} r="5"
                                fill="var(--accent-gold)" stroke="var(--surface)" strokeWidth="2" />
                            {/* End dot */}
                            {state.scaleLineEnd && (
                                <circle cx={state.scaleLineEnd.x} cy={state.scaleLineEnd.y} r="5"
                                    fill="var(--accent-gold)" stroke="var(--surface)" strokeWidth="2" />
                            )}
                            {/* Pixel distance label at midpoint */}
                            {state.scaleLineEnd && state.scalePixelDistance > 0 && (
                                <text
                                    x={(state.scaleLineStart.x + state.scaleLineEnd.x) / 2}
                                    y={(state.scaleLineStart.y + state.scaleLineEnd.y) / 2 - 10}
                                    textAnchor="middle" fontFamily="'DM Mono', monospace"
                                    fontSize="11" fill="var(--accent-gold)" fontWeight="600"
                                >
                                    {state.scalePixelDistance.toFixed(1)} px
                                </text>
                            )}
                        </g>
                    )
                }

                {/* -- North compass -- */}
                <g transform="translate(760, 50)">
                    <circle cx="0" cy="0" r="22" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface)" />
                    <polygon points="0,-15 -6,8 0,4 6,8" fill="var(--text-primary)" />
                    <polygon points="0,15 -6,-8 0,-4 6,-8" fill="var(--border)" opacity="0.5" />
                    <text x="0" y="33" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="9" fill="var(--text-secondary)" fontWeight="500">N</text>
                </g>


                {/* -- Placed Items -- */}
                {state.placedItems.length > 0 && (
                    <g className="placed-items">
                        {state.placedItems.map(item => {
                            const isBest = item.status === "best";
                            const isGood = item.status === "good";
                            const color = isBest ? "var(--good)" : isGood ? "var(--good-soft, #5cb85c)" : item.status === "worst" ? "var(--critical)" : "var(--warning)";
                            // Use first letter of item as icon
                            const letter = item.type.charAt(0);
                            return (
                                <g key={item.id} transform={`translate(${item.point.x}, ${item.point.y})`} style={{ pointerEvents: "auto", cursor: "help" }}>
                                    <circle cx="0" cy="0" r="10" fill={color} stroke="var(--surface)" strokeWidth="2" />
                                    <text x="0" y="3.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="system-ui">{letter}</text>
                                    <title>{`${item.type}\nZone: ${item.zone}\nDevta: ${item.devta || 'Main Grid'}\nStatus: ${item.status.toUpperCase()}`}</title>
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* -- Crop Selection Rectangle -- */}
                {state.cropMode && state.cropRect && state.cropRect.w > 4 && state.cropRect.h > 4 && (
                    <g pointerEvents="none">
                        {/* Dark overlay outside selection */}
                        <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="rgba(0,0,0,0.4)" />
                        {/* Punch-out the selected area by covering it with a transparent rect over the darkened overlay */}
                        <rect
                            x={state.cropRect.x} y={state.cropRect.y}
                            width={state.cropRect.w} height={state.cropRect.h}
                            fill="rgba(255,255,255,0.07)"
                        />
                        {/* Selection border */}
                        <rect
                            x={state.cropRect.x} y={state.cropRect.y}
                            width={state.cropRect.w} height={state.cropRect.h}
                            fill="none" stroke="var(--accent-gold)" strokeWidth="1.5"
                            strokeDasharray="6 3"
                        />
                        {/* Corner handles */}
                        {[
                            [state.cropRect.x, state.cropRect.y],
                            [state.cropRect.x + state.cropRect.w, state.cropRect.y],
                            [state.cropRect.x, state.cropRect.y + state.cropRect.h],
                            [state.cropRect.x + state.cropRect.w, state.cropRect.y + state.cropRect.h],
                        ].map(([cx, cy], i) => (
                            <circle key={i} cx={cx} cy={cy} r="4" fill="var(--accent-gold)" stroke="var(--surface)" strokeWidth="1.5" />
                        ))}
                        {/* Size label */}
                        <text
                            x={state.cropRect.x + state.cropRect.w / 2}
                            y={state.cropRect.y - 6}
                            textAnchor="middle" fontFamily="'DM Mono', monospace"
                            fontSize="10" fill="var(--accent-gold)" fontWeight="600"
                        >
                            {Math.round(state.cropRect.w)} � {Math.round(state.cropRect.h)} px
                        </text>
                    </g>
                )}
            </svg >

            {/* Canvas toolbar */}
            <div className="canvas-toolbar">
                <button className="canvas-btn" title="Zoom In" onClick={zoomIn}>
                    <svg viewBox="0 0 13 13" fill="none" stroke="var(--text-secondary)" strokeWidth="1.3">
                        <circle cx="5.5" cy="5.5" r="4" /><path d="M8.5 8.5l3 3M5.5 3.5v4M3.5 5.5h4" />
                    </svg>
                </button>
                <button className="canvas-btn" title="Zoom Out" onClick={zoomOut}>
                    <svg viewBox="0 0 13 13" fill="none" stroke="var(--text-secondary)" strokeWidth="1.3">
                        <circle cx="5.5" cy="5.5" r="4" /><path d="M8.5 8.5l3 3M3.5 5.5h4" />
                    </svg>
                </button>
                <button className="canvas-btn" title="Fit to View" onClick={zoomFit}>
                    <svg viewBox="0 0 13 13" fill="none" stroke="var(--text-secondary)" strokeWidth="1.3">
                        <path d="M2 5V2h3M8 2h3v3M11 8v3H8M5 11H2V8" />
                    </svg>
                </button>
            </div >

            {/* Canvas info pill */}
            < div className="canvas-info-pill" >
                <span>ZOOM {Math.round(zoom * 100)}%</span>
                <span className="canvas-info-pill-dot" />
                <span>{polygon.length} VERTICES</span>
                <span className="canvas-info-pill-dot" />
                <span>PHASE: {phase}</span>
                {
                    isPhaseAtLeast(phase, Phase.ANALYZED) && (
                        <>
                            <span className="canvas-info-pill-dot" />
                            <span>AREA: {state.polygonArea.toFixed(0)} px�</span>
                        </>
                    )
                }
            </div >

            {/* Scale bar */}
            <div className="scale-bar">
                <div className="scale-line" />
                <span className="scale-label">
                    {state.scaleRatio > 0 ? `${(72 * state.scaleRatio).toFixed(1)} ${state.scaleUnit}` : "No scale"}
                </span>
            </div>

            {/* View Bar Floating Panel */}
            <div className="view-bar-floating">
                {Object.entries(layers).map(([name, visible]) => (
                    <div className="view-bar-item" key={name} onClick={() => dispatch({ type: "TOGGLE_LAYER", layer: name })} style={{ opacity: visible ? 1 : 0.5 }}>
                        <span className="layer-dot" style={{ background: LAYER_COLORS[name] || "#B0AB9E", width: 8, height: 8, borderRadius: 2 }} />
                        <span className="layer-name" style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: visible ? 600 : 400 }}>
                            {name.charAt(0).toUpperCase() + name.slice(1)}
                        </span>
                        <div className="eye-btn" style={{ marginLeft: 6, display: "flex" }}>
                            {visible ? (
                                <svg viewBox="0 0 11 11" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" style={{ width: 11, height: 11 }}>
                                    <path d="M1 5.5s1.8-3.5 4.5-3.5 4.5 3.5 4.5 3.5-1.8 3.5-4.5 3.5-4.5-3.5-4.5-3.5z" /><circle cx="5.5" cy="5.5" r="1.5" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 11 11" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" style={{ width: 11, height: 11 }}>
                                    <path d="M1.5 1.5l8 8M1 4.5C2.4 2.8 4 2 5.5 2M8.5 3.5C9.5 4.5 10 5.5 10 5.5s-1.8 3.5-4.5 3.5c-.7 0-1.5-.2-2.2-.5" />
                                </svg>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const LAYER_COLORS: Record<string, string> = {
    background: "#B8860B",
    trace: "#D4A017",
    centroid: "#8B6914",
    sectors: "#7A8CA0",
    zones: "#3D7A4F",
    devtas: "#4CAF50",
    marma: "#16a34a",
    labels: "#B0AB9E",
};
