"use client";

import { useState } from "react";
import { ProjectState } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { DIRECTION_ORDER } from "@/core/geometry/types";

interface CanvasAreaProps {
    state: ProjectState;
    onCanvasClick?: (point: { x: number; y: number }) => void;
}

const BASE_W = 840;
const BASE_H = 800;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

export default function CanvasArea({ state, onCanvasClick }: CanvasAreaProps) {
    const { polygon, centroid, layers, phase, sectors, sectorOverlaps, polygonClosed } = state;
    const [zoom, setZoom] = useState(1);

    const vbW = BASE_W / zoom;
    const vbH = BASE_H / zoom;
    const vbX = (BASE_W - vbW) / 2;
    const vbY = (BASE_H - vbH) / 2;

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onCanvasClick) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        onCanvasClick({ x: svgPt.x, y: svgPt.y });
    };

    const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    const zoomFit = () => setZoom(1);

    const cx = centroid?.x ?? 420;
    const cy = centroid?.y ?? 400;

    return (
        <div className="canvas-area">
            <svg
                style={{
                    position: "absolute",
                    inset: "16px",
                    width: "calc(100% - 32px)",
                    height: "calc(100% - 32px)",
                    cursor: (phase === Phase.TRACING || state.scaleDrawing) ? "crosshair" : "default",
                }}
                viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onClick={handleClick}
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

                {/* ── Sector wedges (real geometry from clipping) ── */}
                {layers.sectors && isPhaseAtLeast(phase, Phase.ANALYZED) && sectors.length > 0 && (
                    <g opacity="0.15">
                        {sectors.map((sector, i) => (
                            <polygon
                                key={`sector-${i}`}
                                points={sector.polygon.map(p => `${p.x},${p.y}`).join(" ")}
                                stroke="var(--accent-gold)"
                                strokeWidth="0.5"
                                fill="none"
                            />
                        ))}
                    </g>
                )}

                {/* ── Zone fills (from real overlap clipped polygons) ── */}
                {layers.zones && isPhaseAtLeast(phase, Phase.ANALYZED) && sectorOverlaps.length > 0 && (
                    <g>
                        {sectorOverlaps.map((ov, i) => {
                            if (ov.clippedPolygon.length < 3) return null;
                            const fillColor = ov.percentOfTotal >= 5
                                ? "var(--good)"
                                : ov.percentOfTotal >= 2
                                    ? "var(--accent-gold)"
                                    : "var(--critical)";
                            return (
                                <polygon
                                    key={`zone-${i}`}
                                    points={ov.clippedPolygon.map(p => `${p.x},${p.y}`).join(" ")}
                                    fill={fillColor}
                                    opacity="0.12"
                                    stroke={fillColor}
                                    strokeWidth="0.5"
                                    strokeOpacity="0.3"
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
                        {polygon.map((v, i) => (
                            <g key={`v-${i}`}>
                                <circle cx={v.x} cy={v.y} r="5" fill="var(--text-primary)" stroke="var(--surface)" strokeWidth="2" />
                                {i === 0 && !polygonClosed && (
                                    <circle cx={v.x} cy={v.y} r="10" stroke="var(--accent-gold)" strokeWidth="1.5" fill="none" className="vertex-pulse" opacity="0.5" />
                                )}
                            </g>
                        ))}
                    </>
                )}

                {/* ── Direction labels (only after analysis) ── */}
                {layers.labels && isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
                    <g>
                        {DIRECTION_ORDER.map((dir, i) => {
                            const angle = (i * 22.5 - 90) * (Math.PI / 180);
                            const r = 280;
                            const x = cx + r * Math.cos(angle);
                            const y = cy + r * Math.sin(angle);
                            return (
                                <text
                                    key={dir}
                                    x={x} y={y}
                                    textAnchor="middle" dominantBaseline="middle"
                                    fontFamily="'DM Mono', monospace"
                                    fontSize={["N", "E", "S", "W"].includes(dir) ? "10" : "7"}
                                    fill="var(--text-tertiary)"
                                    fontWeight={["N", "E", "S", "W"].includes(dir) ? "500" : "400"}
                                >
                                    {dir}
                                </text>
                            );
                        })}
                    </g>
                )}

                {/* ── Brahm Bindu (computed centroid — only after CLOSE_POLYGON) ── */}
                {layers.centroid && isPhaseAtLeast(phase, Phase.ANALYZED) && centroid && (
                    <g>
                        <circle cx={cx} cy={cy} r="24" stroke="var(--accent-gold)" strokeWidth="1.5" fill="none" opacity="0.25" />
                        <circle cx={cx} cy={cy} r="15" stroke="var(--accent-gold)" strokeWidth="2" fill="none" opacity="0.55" />
                        <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} stroke="var(--accent-gold)" strokeWidth="1.5" />
                        <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="var(--accent-gold)" strokeWidth="1.5" />
                        <circle cx={cx} cy={cy} r="5.5" fill="var(--text-primary)" />
                        <circle cx={cx} cy={cy} r="2.5" fill="var(--surface)" />
                        <rect x={cx + 8} y={cy - 18} width="80" height="15" rx="8" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
                        <text x={cx + 48} y={cy - 8} textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="7" fill="var(--accent-gold)" fontWeight="500" letterSpacing="0.1em">
                            BRAHM BINDU
                        </text>
                    </g>
                )}

                {/* ── Scale reference line ── */}
                {state.scaleLineStart && (
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
                )}

                {/* ── North compass ── */}
                <g transform="translate(760, 50)">
                    <circle cx="0" cy="0" r="22" stroke="var(--border)" strokeWidth="1.5" fill="var(--surface)" />
                    <polygon points="0,-15 -6,8 0,4 6,8" fill="var(--text-primary)" />
                    <polygon points="0,15 -6,-8 0,-4 6,-8" fill="var(--border)" opacity="0.5" />
                    <text x="0" y="33" textAnchor="middle" fontFamily="'DM Mono', monospace" fontSize="9" fill="var(--text-secondary)" fontWeight="500">N</text>
                </g>
            </svg>

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
            </div>

            {/* Canvas info pill */}
            <div className="canvas-info-pill">
                <span>ZOOM {Math.round(zoom * 100)}%</span>
                <span className="canvas-info-pill-dot" />
                <span>{polygon.length} VERTICES</span>
                <span className="canvas-info-pill-dot" />
                <span>PHASE: {phase}</span>
                {isPhaseAtLeast(phase, Phase.ANALYZED) && (
                    <>
                        <span className="canvas-info-pill-dot" />
                        <span>AREA: {state.polygonArea.toFixed(0)} px²</span>
                    </>
                )}
            </div>

            {/* Scale bar */}
            <div className="scale-bar">
                <div className="scale-line" />
                <span className="scale-label">
                    {state.scaleRatio > 0 ? `${(72 * state.scaleRatio).toFixed(1)} ${state.scaleUnit}` : "No scale"}
                </span>
            </div>
        </div>
    );
}
