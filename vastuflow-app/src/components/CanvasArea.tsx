"use client";

import { useState, useRef, useEffect } from "react";
import { ProjectState, ProjectAction } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { DIRECTION_COLORS, Point } from "@/core/geometry/types";
import ShaktiChakra from "./ShaktiChakra";

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

    // Convert client coords → SVG viewBox coords
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
        if (p) onCanvasClick(p);
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
                    cursor: state.cropMode ? "crosshair" : (phase === Phase.TRACING || state.scaleDrawing) ? "crosshair" : "default",
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
                {/* ── Uploaded floor plan image (rotated) ── */}
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

                {/* ── Shakti Chakra Overlay ── */}
                {layers.sectors && isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
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
                )}

                {/* ── Zone fills (from real overlap clipped polygons) ── */}
                {layers.zones && isPhaseAtLeast(phase, Phase.ANALYZED) && sectorOverlaps.length > 0 && (
                    <g style={{ pointerEvents: "none" }}>
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

                {/* ── Traced polygon ── */}
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



                {/* ── Brahm Bindu (computed centroid — only after CLOSE_POLYGON) ── */}
                {layers.centroid && isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
                    <g pointerEvents="none">
                        <line x1={centroid.x - 8} y1={centroid.y} x2={centroid.x + 8} y2={centroid.y} stroke="var(--accent-gold)" strokeWidth="2" />
                        <line x1={centroid.x} y1={centroid.y - 8} x2={centroid.x} y2={centroid.y + 8} stroke="var(--accent-gold)" strokeWidth="2" />
                    </g>
                )}

                {/* ── Scale reference line ── */}
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

                {/* ── North compass ── */}
                <g transform="translate(760, 50)">
                    <circle cx="0" cy="0" r="22" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface)" />
                    <polygon points="0,-15 -6,8 0,4 6,8" fill="var(--text-primary)" />
                    <polygon points="0,15 -6,-8 0,-4 6,-8" fill="var(--border)" opacity="0.5" />
                    <text x="0" y="33" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="9" fill="var(--text-secondary)" fontWeight="500">N</text>
                </g>

                {/* ── Crop Selection Rectangle ── */}
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
                            {Math.round(state.cropRect.w)} × {Math.round(state.cropRect.h)} px
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
                            <span>AREA: {state.polygonArea.toFixed(0)} px²</span>
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
    labels: "#B0AB9E",
};
