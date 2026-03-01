"use client";

import { ProjectState, ProjectAction } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { VastuItem } from "@/core/geometry/vastu-rules";

interface PlacementPanelProps {
    state: ProjectState;
    dispatch: React.Dispatch<ProjectAction>;
}

const ITEMS: VastuItem[] = [
    "Entrance", "Pooja/Mandir", "Kitchen", "Master Bedroom",
    "Kids Bedroom", "Toilets", "Washing Machine", "Study Table",
    "Dining Table", "Office Desk", "Locker", "Water Pump/Bore",
    "Underground Watertank", "Overhead Watertank", "Trophies and Medals", "Family Photo"
];


export default function PlacementPanel({ state, dispatch }: PlacementPanelProps) {
    if (!isPhaseAtLeast(state.phase, Phase.ANALYZED)) return null;

    return (
        <div className="tool-panel" style={{ marginTop: 12, maxHeight: "40vh", overflowY: "auto" }}>
            <div className="panel-section active-section">
                <div className="panel-section-title" style={{ color: "var(--accent-gold)" }}>
                    ◉ Placement Analysis
                </div>

                <div className="trace-hint" style={{ background: "rgba(184,134,11,0.06)", borderColor: "rgba(184,134,11,0.2)", marginBottom: 12 }}>
                    {state.activePlacement
                        ? `Click anywhere on the map to place the ${state.activePlacement}.`
                        : "Select an item below, then click a point on the layout."}
                </div>

                {/* Items Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
                    {ITEMS.map((item) => (
                        <button
                            key={item}
                            className={`btn ${state.activePlacement === item ? "btn-primary" : "btn-ghost"}`}
                            style={{
                                fontSize: 9,
                                padding: "6px 4px",
                                justifyContent: "center",
                                border: state.activePlacement === item ? "none" : "1px solid var(--border)"
                            }}
                            onClick={() => dispatch({
                                type: "START_PLACEMENT",
                                itemType: state.activePlacement === item ? null : item
                            })}
                        >
                            {item}
                        </button>
                    ))}
                </div>


            </div>
        </div>
    );
}
