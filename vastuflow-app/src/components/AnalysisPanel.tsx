"use client";
import React, { useState } from "react";
import AreaAnalysisModal from "./AreaAnalysisModal";

import { ProjectState, ProjectAction, PlacedItem } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";

interface AnalysisPanelProps {
    state: ProjectState;
    dispatch: React.Dispatch<ProjectAction>;
    onDownloadReport?: () => void;
    onExportJSON?: () => void;
}

const STATUS_CONFIG = {
    "best": { label: "✓✓ BEST", color: "var(--good)" },
    "good": { label: "✓ GOOD", color: "var(--good-soft, #5cb85c)" },
    "bad": { label: "✕ BAD", color: "var(--warning)" },
    "worst": { label: "✕✕ WORST", color: "var(--critical)" }
};

export default function AnalysisPanel({ state, dispatch, onDownloadReport, onExportJSON }: AnalysisPanelProps) {
    const { phase, zoneResults, overallScore, deviationCount, analysisSummary, activeTab, placedItems } = state;
    const hasAnalysis = isPhaseAtLeast(phase, Phase.ANALYZED);

    const [expandedRemedyId, setExpandedRemedyId] = useState<string | null>(null);
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

    const handleFetchRemedy = async (item: PlacedItem) => {
        // Optimistically expand
        setExpandedRemedyId(item.id);

        // If already loaded or currently loading, do nothing
        if (item.remedy) return;

        dispatch({ type: "FETCH_REMEDY_START", id: item.id });
        try {
            const res = await fetch("/api/remedy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: item.type,
                    zone: item.zone,
                    status: item.status
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            dispatch({ type: "FETCH_REMEDY_SUCCESS", id: item.id, reasoning: data.reasoning, fix: data.fix });
        } catch (error: unknown) {
            const err = error as Error;
            dispatch({ type: "FETCH_REMEDY_ERROR", id: item.id, error: err.message || "Failed to fetch remedy" });
        }
    };

    const circumference = 2 * Math.PI * 27;
    const dashArray = hasAnalysis ? `${(overallScore / 100) * circumference} ${circumference}` : `0 ${circumference}`;
    const scoreColor = overallScore >= 70 ? "var(--good)" : overallScore >= 50 ? "var(--accent-gold)" : "var(--critical)";

    return (
        <div className="analysis-panel">
            <div className="analysis-header">
                <div className="analysis-title">Geometric Analysis</div>
                <div className="analysis-subtitle">
                    {hasAnalysis
                        ? `${zoneResults.length} sectors · ${state.polygonArea.toFixed(0)} px² total area`
                        : "Trace and close polygon to begin analysis"}
                </div>
            </div>

            {activeTab === "overlay" ? (
                <>
                    {/* Score Ring */}
                    <div className="score-ring-wrap">
                        <div className="score-ring">
                            <svg viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="27" stroke="var(--border)" strokeWidth="5" fill="none" />
                                {hasAnalysis && (
                                    <circle
                                        cx="32" cy="32" r="27"
                                        stroke={scoreColor}
                                        strokeWidth="5" fill="none"
                                        strokeDasharray={dashArray}
                                        strokeLinecap="round"
                                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                                    />
                                )}
                            </svg>
                            <div className="score-ring-label">
                                <span className="score-num">{hasAnalysis ? overallScore : "—"}</span>
                                <span className="score-denom">/100</span>
                            </div>
                        </div>
                        <div className="score-meta">
                            <div className="score-house">{hasAnalysis ? "Geometric Balance" : "Awaiting Data"}</div>
                            <div className="score-address">
                                {hasAnalysis ? analysisSummary : "Complete polygon tracing to compute scores."}
                            </div>
                            {hasAnalysis && (
                                <div className="score-status">
                                    {deviationCount > 0 ? `⚠ ${deviationCount} deviation${deviationCount !== 1 ? "s" : ""}` : "✓ Balanced"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Zone table — computed data only */}
                    <div className="zone-table-wrap">
                        <div className="zone-table-header">
                            <span>DIR</span>
                            <span>AREA %</span>
                            <span>SCORE</span>
                            <span>STATUS</span>
                        </div>
                        {hasAnalysis ? (
                            <>
                                {zoneResults.map((z, i) => (
                                    <div className="zone-row" key={i}>
                                        <div className="zone-dir">{z.direction}</div>
                                        <div className="zone-room">{z.areaPercent.toFixed(1)}%</div>
                                        <div className="zone-score" style={{
                                            color: z.status === "good" ? "var(--good)" : z.status === "moderate" ? "var(--warning)" : "var(--critical)",
                                        }}>
                                            {z.score.toFixed(1)}
                                        </div>
                                        <div>
                                            <span className={`badge badge-${z.status}`}>
                                                {z.status === "good" ? "Good" : z.status === "moderate" ? "Moderate" : "Critical"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ padding: "16px" }}>
                                    <button
                                        onClick={() => setIsGraphModalOpen(true)}
                                        className="w-full bg-[#3933A9] text-white py-2 rounded-md font-medium hover:bg-[#2F2A90] transition-colors"
                                        style={{ background: "#3933a9", border: "1px solid #4f46e5", color: "white", padding: "8px", borderRadius: "6px", width: "100%", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}
                                    >
                                        View Graph
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.8 }}>
                                No analysis data.<br />
                                Trace a perimeter polygon and close it to generate deterministic zone analysis.
                            </div>
                        )}
                    </div>

                    <AreaAnalysisModal
                        isOpen={isGraphModalOpen}
                        onClose={() => setIsGraphModalOpen(false)}
                        zoneResults={zoneResults}
                        scaleUnit={state.scaleUnit}
                    />
                </>
            ) : (
                <>
                    {/* Placement Analysis view */}
                    <div className="score-ring-wrap" style={{ flexDirection: "column", alignItems: "flex-start", padding: "16px 20px" }}>
                        <div className="score-house" style={{ marginBottom: 4, color: "var(--accent-gold)" }}>Vastu Placement Status</div>
                        <div className="score-address" style={{ fontSize: 10 }}>Review your item placements against ancient Vastu principles.</div>
                    </div>

                    <div className="zone-table-wrap" style={{ flex: 1, borderTop: "none" }}>
                        <div className="zone-table-header" style={{ gridTemplateColumns: "1fr 1fr 40px", padding: "8px 12px" }}>
                            <span>ITEM</span>
                            <span>ZONE / DEVTA / STATUS</span>
                            <span style={{ textAlign: "right" }}>ACT</span>
                        </div>
                        {placedItems.length > 0 ? (
                            placedItems.map((item) => {
                                const conf = STATUS_CONFIG[item.status];
                                const isBad = item.status === "bad" || item.status === "worst" || item.type === "Custom";
                                const isExpanded = expandedRemedyId === item.id || (item.type === "Custom" && item.remedy?.loading);

                                return (
                                    <div key={item.id} style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border)" }}>
                                        <div className="zone-row" style={{ gridTemplateColumns: "1fr 1fr 40px", padding: "8px 12px", alignItems: "center", borderBottom: "none" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                                                {item.type === "Custom" ? (item.customName || "Custom Item") : item.type}
                                                {isBad && (
                                                    <button
                                                        onClick={() => {
                                                            if (isExpanded) {
                                                                setExpandedRemedyId(null);
                                                            } else {
                                                                handleFetchRemedy(item);
                                                            }
                                                        }}
                                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "var(--text-secondary)" }}
                                                        title="Get Remedy"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start", justifyContent: "center" }}>
                                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-secondary)" }}>{item.zone}</span>
                                                    <span style={{ color: conf.color, fontWeight: 700, fontSize: 9 }}>{conf.label}</span>
                                                </div>
                                                {item.devta && (
                                                    <span style={{
                                                        fontFamily: "var(--font-mono)",
                                                        fontSize: 8,
                                                        color: "var(--accent-gold)",
                                                        background: "rgba(184,134,11,0.1)",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        letterSpacing: "0.05em"
                                                    }}>
                                                        DEVTA: {item.devta}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <button
                                                    onClick={() => dispatch({ type: "REMOVE_PLACED_ITEM", id: item.id })}
                                                    style={{ background: "none", border: "none", color: "var(--critical)", cursor: "pointer", padding: 4 }}
                                                    title="Remove Item"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: "0 12px 14px 12px", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(0,0,0,0.015)" }}>
                                                {item.remedy?.loading ? (
                                                    <div style={{ fontStyle: "italic", color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                                                        <span className="spinner" style={{ width: 10, height: 10, border: "2px solid rgba(184,134,11,0.3)", borderTopColor: "var(--accent-gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                                        ✨ Analyzing Vastu placement with AI...
                                                    </div>
                                                ) : item.remedy?.error ? (
                                                    <div style={{ color: "var(--critical)" }}>⚠ Error: {item.remedy.error}</div>
                                                ) : item.remedy?.reasoning && item.remedy?.fix ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                        <div style={{ lineHeight: 1.5 }}><strong style={{ color: "var(--warning)", fontSize: 11, letterSpacing: "0.03em" }}>REASONING:</strong><br />{item.remedy.reasoning}</div>
                                                        <div style={{ lineHeight: 1.5 }}><strong style={{ color: "var(--good)", fontSize: 11, letterSpacing: "0.03em" }}>FIX / REMEDY:</strong><br />{item.remedy.fix}</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.8 }}>
                                No items placed yet.<br />
                                Select items from the left sidebar and place them on the map.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Report footer — gated */}
            <div className="report-footer">
                <button className="btn-report" onClick={onDownloadReport} disabled={!hasAnalysis} style={{ opacity: hasAnalysis ? 1 : 0.4, cursor: hasAnalysis ? "pointer" : "not-allowed" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--base)" strokeWidth="1.4">
                        <path d="M2 1h6.5L10 2.5V11H2V1z" /><path d="M6.5 1v2.5H10" /><path d="M3.5 6h5M3.5 8h3" />
                    </svg>
                    Download PDF Report
                </button>
                <button className="btn-report" onClick={onExportJSON} disabled={!hasAnalysis}
                    style={{
                        marginTop: 6, background: "transparent", color: hasAnalysis ? "var(--text-secondary)" : "var(--text-tertiary)",
                        border: "1.5px solid var(--border-bright)", boxShadow: "none",
                        opacity: hasAnalysis ? 1 : 0.4, cursor: hasAnalysis ? "pointer" : "not-allowed",
                    }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={hasAnalysis ? "var(--text-secondary)" : "var(--text-tertiary)"} strokeWidth="1.4">
                        <path d="M3 1L1 3v2l2 2M9 1l2 2v2l-2 2M7.5 1l-3 7" />
                    </svg>
                    Export JSON Data
                </button>
            </div>
        </div>
    );
}
