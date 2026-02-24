"use client";

import { Phase, phaseIndex } from "@/state/phase";

interface StepBarProps {
    phase: Phase;
}

const PHASE_STEPS: { phase: Phase; label: string }[] = [
    { phase: Phase.IDLE, label: "Start" },
    { phase: Phase.IMAGE_LOADED, label: "Image" },
    { phase: Phase.ALIGNED, label: "Align" },
    { phase: Phase.SCALED, label: "Scale" },
    { phase: Phase.TRACING, label: "Trace" },
    { phase: Phase.POLYGON_CLOSED, label: "Closed" },
    { phase: Phase.CENTROID_COMPUTED, label: "Centroid" },
    { phase: Phase.SECTORS_GENERATED, label: "Sectors" },
    { phase: Phase.ANALYZED, label: "Analysis" },
    { phase: Phase.REPORT_READY, label: "Report" },
];

export default function StepBar({ phase }: StepBarProps) {
    const currentIdx = phaseIndex(phase);

    return (
        <div className="step-bar">
            <div className="step-bar-brand">
                Vastu<span>Flow</span>
            </div>
            <div className="steps">
                {PHASE_STEPS.map((step, i) => {
                    const stepIdx = phaseIndex(step.phase);
                    const isDone = stepIdx < currentIdx;
                    const isActive = stepIdx === currentIdx;
                    const stepClass = isDone ? "done" : isActive ? "active" : "";

                    return (
                        <div key={step.phase} style={{ display: "flex", alignItems: "center" }}>
                            {i > 0 && (
                                <div className={`step-connector ${isDone ? "done" : ""}`} />
                            )}
                            <div className={`step ${stepClass}`}>
                                <div className="step-node">
                                    {isDone ? "✓" : i + 1}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
