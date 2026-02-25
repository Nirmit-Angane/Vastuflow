"use client";

import { ProjectState, ProjectAction } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";

interface ToolPanelProps {
    state: ProjectState;
    dispatch: React.Dispatch<ProjectAction>;
    onFileSelect?: () => void;
    onFileDrop?: (e: React.DragEvent) => void;
}

export default function ToolPanel({ state, dispatch, onFileSelect, onFileDrop }: ToolPanelProps) {
    const { phase, imageName, imageSize, rotation, scaleRatio, polygon, polygonValid, validationError } = state;

    return (
        <div className="tool-panel">
            {/* ── Image Upload ── */}
            <div className="panel-section">
                <div className="panel-section-title">Floor Plan</div>
                {imageName ? (
                    <div className="upload-success">
                        <div className="upload-thumb">
                            {state.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={state.image} alt="Plan" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 5 }} />
                            ) : (
                                <svg viewBox="0 0 18 18" fill="none" stroke="var(--accent-gold)" strokeWidth="1.3">
                                    <rect x="2" y="2" width="14" height="14" />
                                    <path d="M2 12l3.5-3.5 2.5 2.5 3-4 4 5" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className="upload-name">{imageName}</div>
                            <div className="upload-meta">{imageSize}</div>
                            <div className="status-loaded"><span className="status-dot" /> LOADED</div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="upload-dropzone"
                        onClick={onFileSelect}
                        onDrop={onFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" style={{ margin: "0 auto 8px", display: "block" }}>
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        <p>Drop floor plan or <strong style={{ color: "var(--accent-gold)" }}>browse</strong></p>
                        <span style={{ fontSize: "8px", color: "var(--text-tertiary)", marginTop: 4, display: "block" }}>
                            JPG, PNG, or PDF — you can also trace directly
                        </span>
                    </div>
                )}
                {/* Skip to tracing */}
                {phase === Phase.IDLE && (
                    <button className="btn btn-ghost" onClick={() => dispatch({ type: "START_TRACING" })} style={{ marginTop: 8 }}>
                        Skip → Start Tracing
                    </button>
                )}
            </div>

            {/* ── Alignment (when IMAGE_LOADED) ── */}
            {phase === Phase.IMAGE_LOADED && (
                <div className="panel-section active-section">
                    <div className="panel-section-title" style={{ color: "var(--accent-gold)" }}>◉ Alignment</div>

                    {/* Rotation */}
                    {!state.cropMode && (
                        <>
                            <div className="info-row">
                                <span className="info-label">ROTATION</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <input
                                        type="number" min="0" max="360" step="0.5"
                                        value={(rotation ?? 0).toFixed(1)}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            if (Number.isFinite(v)) dispatch({ type: "SET_ROTATION", degrees: Math.max(0, Math.min(360, v)) });
                                        }}
                                        style={{
                                            width: 52, padding: "3px 6px", border: "1px solid var(--border)",
                                            borderRadius: 4, background: "var(--surface)", color: "var(--text-primary)",
                                            fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "right",
                                        }}
                                    />
                                    <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>°</span>
                                </div>
                            </div>
                            <input type="range" min="0" max="360" step="0.5" value={rotation ?? 0}
                                onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) dispatch({ type: "SET_ROTATION", degrees: v }); }}
                                style={{ width: "100%", height: 3, appearance: "none", background: `linear-gradient(90deg, var(--accent-gold) ${((rotation ?? 0) / 360) * 100}%, var(--surface-3) ${((rotation ?? 0) / 360) * 100}%)`, borderRadius: 2, cursor: "pointer", marginBottom: 12 }}
                            />

                            {/* Crop trigger */}
                            <button
                                className="btn btn-ghost"
                                style={{ marginBottom: 8 }}
                                onClick={() => dispatch({ type: "START_CROP" })}
                            >
                                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" style={{ width: 12, height: 12, marginRight: 4 }}>
                                    <path d="M3 1v10h10M1 3h10v10" />
                                    <path d="M3 3l8 8" strokeDasharray="3 2" />
                                </svg>
                                Crop Image
                            </button>
                            <button className="btn btn-primary" onClick={() => dispatch({ type: "CONFIRM_ALIGNMENT" })}>
                                Confirm Alignment →
                            </button>
                        </>
                    )}

                    {/* Crop mode UI */}
                    {state.cropMode && (
                        <>
                            <div className="trace-hint" style={{ background: "rgba(184,134,11,0.06)", borderColor: "rgba(184,134,11,0.2)", marginBottom: 12 }}>
                                <strong>Drag</strong> on the map to select the crop area, then click <strong>Apply</strong>.
                            </div>

                            {state.cropRect && state.cropRect.w > 4 && state.cropRect.h > 4 && (
                                <div className="info-row" style={{ marginBottom: 10 }}>
                                    <span className="info-label">SELECTION</span>
                                    <span className="info-value" style={{ fontSize: 9 }}>
                                        {Math.round(state.cropRect.w)}&times;{Math.round(state.cropRect.h)}
                                    </span>
                                </div>
                            )}

                            <button
                                className="btn btn-primary"
                                disabled={!state.cropRect || state.cropRect.w < 8 || state.cropRect.h < 8}
                                onClick={() => {
                                    if (!state.image || !state.cropRect) return;
                                    const img = new window.Image();
                                    img.onload = () => {
                                        const r = state.cropRect!;
                                        const SVG_W = 840, SVG_H = 800;
                                        const imgW = img.naturalWidth, imgH = img.naturalHeight;

                                        // preserveAspectRatio="xMidYMid meet" — uniform scale, centered
                                        const scale = Math.min(SVG_W / imgW, SVG_H / imgH);
                                        const rendW = imgW * scale;
                                        const rendH = imgH * scale;
                                        // Offset of the actual image inside the 840×800 SVG canvas
                                        const xOff = (SVG_W - rendW) / 2;
                                        const yOff = (SVG_H - rendH) / 2;

                                        // Map SVG crop rect → source image pixels
                                        const srcX = Math.max(0, (r.x - xOff) / scale);
                                        const srcY = Math.max(0, (r.y - yOff) / scale);
                                        const srcW = Math.min(r.w / scale, imgW - srcX);
                                        const srcH = Math.min(r.h / scale, imgH - srcY);

                                        if (srcW < 2 || srcH < 2) return;

                                        const canvas = document.createElement("canvas");
                                        canvas.width = Math.round(srcW);
                                        canvas.height = Math.round(srcH);
                                        const ctx = canvas.getContext("2d")!;
                                        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
                                        const url = canvas.toDataURL("image/png");
                                        dispatch({ type: "APPLY_CROP", url });
                                    };
                                    img.src = state.image;
                                }}
                                style={{ marginBottom: 6 }}
                            >
                                ✓ Apply Crop
                            </button>
                            <button className="btn btn-ghost" onClick={() => dispatch({ type: "CANCEL_CROP" })}>
                                ✕ Cancel
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Scale Setup (when ALIGNED) ── */}
            {phase === Phase.ALIGNED && (
                <div className="panel-section active-section">
                    <div className="panel-section-title" style={{ color: "var(--accent-gold)" }}>◉ Scale Setup</div>

                    {/* Tooltip */}
                    <div className="trace-hint" style={{ background: "rgba(184,134,11,0.06)", borderColor: "rgba(184,134,11,0.2)" }}>
                        Draw a line along a <strong>known wall length</strong> to set scale.
                    </div>

                    {/* Step 1: Draw line */}
                    {!state.scaleLineStart && !state.scaleLineEnd && !state.scaleDrawing && (
                        <button className="btn btn-primary" onClick={() => dispatch({ type: "START_SCALE_DRAW" })}>
                            ✏ Draw Reference Line
                        </button>
                    )}

                    {/* Drawing in progress */}
                    {state.scaleDrawing && !state.scaleLineStart && (
                        <div className="trace-hint" style={{ color: "var(--accent-gold)", fontWeight: 500 }}>
                            👆 Click on the <strong>first point</strong> of the wall on the canvas.
                        </div>
                    )}
                    {state.scaleDrawing && state.scaleLineStart && !state.scaleLineEnd && (
                        <div className="trace-hint" style={{ color: "var(--accent-gold)", fontWeight: 500 }}>
                            👆 Click on the <strong>second point</strong> of the wall on the canvas.
                        </div>
                    )}

                    {/* Step 2: Line drawn — show pixel distance + enter real distance */}
                    {state.scaleLineStart && state.scaleLineEnd && state.scalePixelDistance > 0 && (
                        <>
                            <div className="info-row" style={{ marginTop: 8 }}>
                                <span className="info-label">PIXEL LENGTH</span>
                                <span className="info-value" style={{ color: "var(--accent-gold)" }}>
                                    {state.scalePixelDistance.toFixed(1)} px
                                </span>
                            </div>

                            <div style={{ marginTop: 10 }}>
                                <div className="info-label" style={{ marginBottom: 6 }}>ENTER REAL-WORLD DISTANCE</div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.1"
                                        value={state.scaleRealDistance || ""}
                                        placeholder="e.g. 10"
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            dispatch({ type: "SET_REAL_DISTANCE", distance: Number.isFinite(v) ? v : 0 });
                                        }}
                                        style={{
                                            flex: 1, padding: "6px 8px", border: "1.5px solid var(--border)",
                                            borderRadius: 6, background: "var(--surface)", color: "var(--text-primary)",
                                            fontFamily: "var(--font-mono)", fontSize: 12,
                                        }}
                                    />
                                    <select
                                        value={state.scaleUnit}
                                        onChange={(e) => dispatch({ type: "SET_SCALE_UNIT", unit: e.target.value as "feet" | "meters" })}
                                        style={{
                                            padding: "6px 8px", border: "1.5px solid var(--border)",
                                            borderRadius: 6, background: "var(--surface)", color: "var(--text-primary)",
                                            fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer",
                                        }}
                                    >
                                        <option value="feet">Feet</option>
                                        <option value="meters">Meters</option>
                                    </select>
                                </div>
                            </div>

                            {/* Computed ratio */}
                            {state.scaleRealDistance > 0 && (
                                <div style={{ marginTop: 8, padding: "6px 8px", background: "rgba(61,122,79,0.06)", border: "1px solid rgba(61,122,79,0.2)", borderRadius: 6 }}>
                                    <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                                        1 pixel = {(state.scaleRealDistance / state.scalePixelDistance).toFixed(4)} {state.scaleUnit}<br />
                                        Scale: {state.scaleRealDistance} {state.scaleUnit} / {state.scalePixelDistance.toFixed(0)} px
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => dispatch({ type: "CLEAR_SCALE_LINE" })}>
                                    ↺ Clear Line
                                </button>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: 6, opacity: state.scaleRealDistance > 0 ? 1 : 0.4 }}
                                disabled={state.scaleRealDistance <= 0}
                                onClick={() => dispatch({ type: "CONFIRM_SCALE" })}
                            >
                                Confirm Scale & Proceed →
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Scale (when SCALED — just confirm and start tracing) ── */}
            {phase === Phase.SCALED && (
                <div className="panel-section active-section">
                    <div className="panel-section-title" style={{ color: "var(--accent-gold)" }}>◉ Ready to Trace</div>
                    <div className="trace-hint">
                        Alignment and scale confirmed. Click below to begin tracing the perimeter.
                    </div>
                    <button className="btn btn-primary" onClick={() => dispatch({ type: "START_TRACING" })}>
                        Begin Tracing →
                    </button>
                </div>
            )}

            {/* ── Tracing ── */}
            {phase === Phase.TRACING && (
                <div className="panel-section active-section">
                    <div className="panel-section-title" style={{ color: "var(--accent-gold)" }}>◉ Trace Perimeter</div>
                    <div className="point-badge">{polygon.length.toString().padStart(2, "0")} vertices placed</div>
                    <div className="trace-hint">
                        <strong>Click</strong> on canvas to add boundary vertex.<br />
                        <strong>Min:</strong> 3 vertices to close polygon.
                    </div>
                    {!polygonValid && validationError && (
                        <div className="trace-hint" style={{ background: "var(--critical-bg)", borderColor: "var(--critical)", color: "var(--critical)" }}>
                            ⚠ {validationError}
                        </div>
                    )}
                    <button className="btn btn-ghost" onClick={() => dispatch({ type: "UNDO_VERTEX" })} disabled={polygon.length === 0}>
                        ← Undo Last
                    </button>
                    <button className="btn btn-primary" onClick={() => dispatch({ type: "CLOSE_POLYGON" })} disabled={polygon.length < 3}>
                        Close Polygon ✓
                    </button>
                </div>
            )}

            {/* ── Analysis Summary ── */}
            {isPhaseAtLeast(phase, Phase.ANALYZED) && (
                <>
                    <div className="panel-section active-section">
                        <div className="panel-section-title" style={{ color: "var(--good)" }}>✓ Analysis Complete</div>
                        <div className="point-badge" style={{ color: "var(--good)", borderColor: "rgba(61,122,79,0.25)", background: "var(--good-bg)" }}>
                            {state.overallScore}/100 Geometric Score
                        </div>
                        <div className="trace-hint">{state.analysisSummary}</div>
                        <div style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", lineHeight: 1.7 }}>
                            Polygon Area: {state.polygonArea.toFixed(1)} px²<br />
                            Centroid: ({state.centroid?.x.toFixed(1)}, {state.centroid?.y.toFixed(1)})<br />
                            Deviations: {state.deviationCount} / 16 sectors
                        </div>
                    </div>

                    <div className="panel-section">
                        <div className="panel-section-title">Shakti Chakra Overlay</div>
                        <div className="trace-hint" style={{ marginBottom: 16 }}>
                            Adjust the size and orientation of the 16 Vastu directional zones.
                        </div>
                        <div className="info-row" style={{ marginTop: 6, marginBottom: 4 }}>
                            <span className="info-label">SCALE</span>
                            <span className="info-value">{state.chakraScale.toFixed(2)}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5" max="2.0" step="0.05"
                            value={state.chakraScale}
                            onChange={(e) => dispatch({ type: "SET_CHAKRA_SCALE", scale: parseFloat(e.target.value) })}
                            style={{
                                width: "100%", height: 3, appearance: "none",
                                background: `linear-gradient(90deg, var(--accent-gold) ${((state.chakraScale - 0.5) / 1.5) * 100}%, var(--surface-3) ${((state.chakraScale - 0.5) / 1.5) * 100}%)`,
                                borderRadius: 2, cursor: "pointer", marginBottom: 16
                            }}
                        />

                        <div className="info-row" style={{ marginBottom: 4 }}>
                            <span className="info-label">ROTATION</span>
                            <span className="info-value">{state.chakraRotation.toFixed(1)}°</span>
                        </div>
                        <input
                            type="range"
                            min="-180" max="180" step="1"
                            value={state.chakraRotation}
                            onChange={(e) => dispatch({ type: "SET_CHAKRA_ROTATION", degrees: parseInt(e.target.value, 10) })}
                            style={{
                                width: "100%", height: 3, appearance: "none",
                                background: `linear-gradient(90deg, var(--accent-gold) ${((state.chakraRotation + 180) / 360) * 100}%, var(--surface-3) ${((state.chakraRotation + 180) / 360) * 100}%)`,
                                borderRadius: 2, cursor: "pointer", marginBottom: 16
                            }}
                        />

                        <div className="info-row" style={{ marginBottom: 6 }}>
                            <span className="info-label">ENTRANCE POINTER (°)</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                    type="number"
                                    min="0" max="360" step="1"
                                    placeholder="e.g. 103"
                                    value={state.pointerDegree ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const degree = val === "" ? null : parseInt(val, 10);
                                        dispatch({ type: "SET_POINTER_DEGREE", degree });
                                    }}
                                    style={{
                                        width: 52, padding: "3px 6px", border: "1px solid var(--border)",
                                        borderRadius: 4, background: "var(--surface)", color: "var(--text-primary)",
                                        fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "right",
                                        outline: "none"
                                    }}
                                />
                                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>°</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Alignment info (read-only when past alignment) ── */}
            {isPhaseAtLeast(phase, Phase.TRACING) && (
                <div className="panel-section">
                    <div className="panel-section-title">Parameters</div>
                    <div className="info-row"><span className="info-label">ROTATION</span><span className="info-value">{(rotation ?? 0).toFixed(1)}°</span></div>
                    <div className="info-row"><span className="info-label">SCALE</span><span className="info-value">{scaleRatio > 0 ? `${scaleRatio.toFixed(4)} ${state.scaleUnit}/px` : "Not set"}</span></div>
                </div>
            )}



            {/* ── Reset ── */}
            {isPhaseAtLeast(phase, Phase.ANALYZED) && (
                <div className="panel-section">
                    <button className="btn btn-ghost" onClick={() => dispatch({ type: "RESET" })}>
                        ↺ New Project
                    </button>
                </div>
            )}
        </div>
    );
}


