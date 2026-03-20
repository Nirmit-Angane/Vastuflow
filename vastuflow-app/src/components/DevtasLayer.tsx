import React from 'react';
import { DevtaCell } from '@/core/geometry/devtas';

interface DevtasLayerProps {
    zones: DevtaCell[];
    visible: boolean;
    showNames?: boolean;
    showNumbers?: boolean;
}

export default function DevtasLayer({ zones, visible, showNames = true }: DevtasLayerProps) {
    if (!visible || !zones || zones.length === 0) return null;

    const brahma = zones.find(z => z.type === 'brahmasthan');
    const layoutCentroid = brahma ? brahma.textPos : null;

    return (
        <g className="devtas-layer pointer-events-auto">
            {zones.map((cell) => {
                const isOuter = cell.type === 'outer';
                let labelX = cell.textPos?.x || 0;
                let labelY = cell.textPos?.y || 0;

                if (isOuter && layoutCentroid && cell.textPos) {
                    const dx = cell.textPos.x - layoutCentroid.x;
                    const dy = cell.textPos.y - layoutCentroid.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        const pushOut = 80; // Push text 80px outside its centroid
                        labelX += (dx / dist) * pushOut;
                        labelY += (dy / dist) * pushOut;
                    }
                }

                return (
                    <g key={cell.id} className="devta-group group cursor-pointer">
                        {/* Render ALL clipped pieces separately, never merged */}
                        {cell.polygons.map((poly, idx) => (
                            <polygon
                                key={`${cell.id}-poly-${idx}`}
                                points={poly.map(p => `${p.x},${p.y}`).join(" ")}
                                fill={cell.color}
                                stroke="rgba(0, 0, 0, 0.5)"
                                strokeWidth={1}
                                opacity={0.6}
                                className="transition-opacity duration-200 group-hover:opacity-80 group-hover:stroke-black group-hover:stroke-2"
                            />
                        ))}
                        
                        {/* Label layout handling */}
                        {showNames && cell.textPos && (
                            <g>
                                {isOuter && (
                                    <>
                                        <circle cx={cell.textPos.x} cy={cell.textPos.y} r={3} fill="rgba(0, 0, 255, 0.4)" />
                                        <line 
                                            x1={cell.textPos.x} y1={cell.textPos.y} 
                                            x2={labelX} y2={labelY} 
                                            stroke="rgba(0, 0, 255, 0.4)" 
                                            strokeWidth="1" 
                                        />
                                    </>
                                )}
                                <text
                                    x={labelX}
                                    y={labelY}
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    fontSize={cell.type === 'brahmasthan' ? "12" : "10"}
                                    fontWeight="bold"
                                    fill="#222"
                                    pointerEvents="none"
                                    className="drop-shadow-sm select-none"
                                >
                                    <tspan x={labelX} dy="-0.5em">{cell.devta}</tspan>
                                    {cell.subtext && cell.subtext.split('\n').map((lineText, i) => (
                                        <tspan 
                                            key={i} 
                                            x={labelX} 
                                            dy="1.2em" 
                                            fontSize="8" 
                                            fontWeight="normal"
                                            fill="#444"
                                        >
                                            {lineText}
                                        </tspan>
                                    ))}
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </g>
    );
}
