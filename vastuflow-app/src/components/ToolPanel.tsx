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
    const { phase, imageName, imageSize, rotation, scaleRatio, polygon, polygonValid, validationError, layers } = state;

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
                    <div className="info-row">
                        <span className="info-label">ROTATION</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                                type="number"
                                min="0"
                                max="360"
                                step="0.5"
                                value={(rotation ?? 0).toFixed(1)}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (Number.isFinite(v)) {
                                        const clamped = Math.max(0, Math.min(360, v));
                                        dispatch({ type: "SET_ROTATION", degrees: clamped });
                                    }
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
                    <button className="btn btn-primary" onClick={() => dispatch({ type: "CONFIRM_ALIGNMENT" })}>
                        Confirm Alignment →
                    </button>
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
            )}

            {/* ── Alignment info (read-only when past alignment) ── */}
            {isPhaseAtLeast(phase, Phase.TRACING) && (
                <div className="panel-section">
                    <div className="panel-section-title">Parameters</div>
                    <div className="info-row"><span className="info-label">ROTATION</span><span className="info-value">{(rotation ?? 0).toFixed(1)}°</span></div>
                    <div className="info-row"><span className="info-label">SCALE</span><span className="info-value">{scaleRatio > 0 ? `${scaleRatio.toFixed(4)} ${state.scaleUnit}/px` : "Not set"}</span></div>
                </div>
            )}

            {/* ── Layers ── */}
            <div className="panel-section" style={{ flex: 1, overflow: "auto" }}>
                <div className="panel-section-title">Layers</div>
                <div className="layer-list">
                    {Object.entries(layers).map(([name, visible]) => (
                        <div className="layer-row" key={name}>
                            <span className="layer-name">
                                <span className="layer-dot" style={{ background: LAYER_COLORS[name] || "#B0AB9E" }} />
                                {name.charAt(0).toUpperCase() + name.slice(1)}
                            </span>
                            <button className={`eye-btn ${!visible ? "eye-off" : ""}`} onClick={() => dispatch({ type: "TOGGLE_LAYER", layer: name })}>
                                {visible ? (
                                    <svg viewBox="0 0 11 11" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2">
                                        <path d="M1 5.5s1.8-3.5 4.5-3.5 4.5 3.5 4.5 3.5-1.8 3.5-4.5 3.5-4.5-3.5-4.5-3.5z" /><circle cx="5.5" cy="5.5" r="1.5" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 11 11" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2">
                                        <path d="M1.5 1.5l8 8M1 4.5C2.4 2.8 4 2 5.5 2M8.5 3.5C9.5 4.5 10 5.5 10 5.5s-1.8 3.5-4.5 3.5c-.7 0-1.5-.2-2.2-.5" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

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

const LAYER_COLORS: Record<string, string> = {
    background: "#B8860B",
    trace: "#D4A017",
    centroid: "#8B6914",
    sectors: "#7A8CA0",
    zones: "#3D7A4F",
    labels: "#B0AB9E",
};
