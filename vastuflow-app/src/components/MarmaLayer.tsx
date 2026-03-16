"use client";

import { MarmaAxis, MarmaPoint } from "@/core/geometry/marmaPoints";

interface MarmaLayerProps {
    axes: MarmaAxis[];
    marmaPoints: MarmaPoint[];
    visible: boolean;
}

const AXIS_STROKE = "rgba(200, 80, 60, 0.6)";
const AXIS_DASH = "6 3";
const AXIS_WIDTH = 0.8;

const BADGE_FILL = "#16a34a";
const BADGE_STROKE = "#0a5c2a";
const BADGE_RX = 3;
const BADGE_H = 14;
const LABEL_FILL = "#ffffff";
const LABEL_SIZE = 8;

const CONNECT_STROKE = "rgba(22, 163, 74, 0.55)";
const CONNECT_DASH = "4 4";
const CONNECT_WIDTH = 1;

export default function MarmaLayer({ axes = [], marmaPoints = [], visible }: MarmaLayerProps) {
    if (!visible || (!axes.length && !marmaPoints.length)) return null;

    // ── Build connector paths ──

    // 1. Spine polyline — main points sorted by segmentIndex
    const spinePoints = [...marmaPoints]
        .filter(mp => mp.type === "main")
        .sort((a, b) => a.segmentIndex - b.segmentIndex);

    const spinePolyline = spinePoints
        .map(mp => `${mp.x},${mp.y}`)
        .join(" ");

    // 2. Per-row cross lines: left extensions → spine node → right extensions
    //    Group by segmentIndex, then sort left points by distance (farthest first)
    //    and right points by distance (farthest first) so the line goes tip→spine→tip.
    const rowMap = new Map<number, { spine: MarmaPoint | null; left: MarmaPoint[]; right: MarmaPoint[] }>();

    for (const mp of marmaPoints) {
        if (!rowMap.has(mp.segmentIndex)) {
            rowMap.set(mp.segmentIndex, { spine: null, left: [], right: [] });
        }
        const row = rowMap.get(mp.segmentIndex)!;
        if (mp.type === "main") row.spine = mp;
        else if (mp.type === "left") row.left.push(mp);
        else if (mp.type === "right") row.right.push(mp);
    }

    const crossLines: { points: string; key: string }[] = [];

    rowMap.forEach((row, idx) => {
        if (!row.spine || (row.left.length === 0 && row.right.length === 0)) return;

        const spineNode = row.spine;

        // Sort by distance from spine — farthest first so line goes outer→spine→outer
        const dist = (mp: MarmaPoint) =>
            Math.sqrt((mp.x - spineNode.x) ** 2 + (mp.y - spineNode.y) ** 2);

        const leftSorted = [...row.left].sort((a, b) => dist(b) - dist(a));
        const rightSorted = [...row.right].sort((a, b) => dist(b) - dist(a));

        const pts = [
            ...leftSorted,
            spineNode,
            ...rightSorted,
        ].map(mp => `${mp.x},${mp.y}`).join(" ");

        crossLines.push({ points: pts, key: `cross-${idx}` });
    });

    return (
        <g style={{ pointerEvents: "none" }}>
            {/* ── Grid Axis Lines ── */}
            {axes.map((axis) => {
                if (!axis.clipStart || !axis.clipEnd) return null;
                const isSpine = axis.id === "spine";
                return (
                    <line
                        key={`axis-${axis.id}`}
                        x1={axis.clipStart.x}
                        y1={axis.clipStart.y}
                        x2={axis.clipEnd.x}
                        y2={axis.clipEnd.y}
                        stroke={AXIS_STROKE}
                        strokeWidth={isSpine ? AXIS_WIDTH + 0.4 : AXIS_WIDTH}
                        strokeDasharray={AXIS_DASH}
                        strokeLinecap="round"
                        opacity={isSpine ? 0.85 : 0.45}
                    />
                );
            })}

            {/* ── Spine connector polyline ── */}
            {spinePolyline && (
                <polyline
                    points={spinePolyline}
                    fill="none"
                    stroke={CONNECT_STROKE}
                    strokeWidth={CONNECT_WIDTH}
                    strokeDasharray={CONNECT_DASH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}

            {/* ── Cross-row connector lines ── */}
            {crossLines.map(({ points, key }) => (
                <polyline
                    key={key}
                    points={points}
                    fill="none"
                    stroke={CONNECT_STROKE}
                    strokeWidth={CONNECT_WIDTH}
                    strokeDasharray={CONNECT_DASH}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            ))}

            {/* ── Marma Point Badges (rendered last so they sit on top of lines) ── */}
            {marmaPoints.map((mp) => {
                const charCount = mp.label.length;
                const badgeW = Math.max(18, charCount * 7 + 8);
                const isMain = mp.type === "main";

                return (
                    <g key={`mp-${mp.id}`}>
                        <rect
                            x={mp.x - badgeW / 2}
                            y={mp.y - BADGE_H / 2}
                            width={badgeW}
                            height={BADGE_H}
                            rx={BADGE_RX}
                            ry={BADGE_RX}
                            fill={BADGE_FILL}
                            stroke={BADGE_STROKE}
                            strokeWidth={isMain ? 1 : 0.6}
                            opacity={isMain ? 1 : 0.9}
                        />
                        <text
                            x={mp.x}
                            y={mp.y + LABEL_SIZE * 0.35}
                            textAnchor="middle"
                            fontSize={LABEL_SIZE}
                            fontWeight="700"
                            fill={LABEL_FILL}
                            fontFamily="'DM Mono', monospace"
                        >
                            {mp.label}
                        </text>
                        <title>{`Marma ${mp.label} — ${mp.bodyPart}`}</title>
                    </g>
                );
            })}
        </g>
    );
}