"use client";

import { ProjectState } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";

interface AnalysisPanelProps {
    state: ProjectState;
    onDownloadReport?: () => void;
    onExportJSON?: () => void;
}

export default function AnalysisPanel({ state, onDownloadReport, onExportJSON }: AnalysisPanelProps) {
    const { phase, zoneResults, overallScore, deviationCount, sectorOverlaps, analysisSummary } = state;
    const hasAnalysis = isPhaseAtLeast(phase, Phase.ANALYZED);

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
                    zoneResults.map((z, i) => (
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
                    ))
                ) : (
                    <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.8 }}>
                        No analysis data.<br />
                        Trace a perimeter polygon and close it to generate deterministic zone analysis.
                    </div>
                )}
            </div>

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
