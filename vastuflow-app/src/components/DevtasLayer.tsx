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
            {zones.map((cell, idx) => {
                const isOuter = cell.type === 'outer';
                let labelX = cell.textPos?.x || 0;
                let labelY = cell.textPos?.y || 0;

                if (isOuter && layoutCentroid && cell.textPos) {
                    const dx = cell.textPos.x - layoutCentroid.x;
                    const dy = cell.textPos.y - layoutCentroid.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        const pushOut = 110 + (idx % 2 === 0 ? 0 : 65); // Stagger text distance
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
                                fillOpacity={0.4}
                                stroke="#111"
                                strokeWidth={2}
                                className="transition-opacity duration-200 group-hover:fill-opacity-100"
                            />
                        ))}
                        
                        {/* Label layout handling */}
                        {showNames && cell.textPos && (() => {
                            const mainText = cell.devta || '';
                            const subLines = cell.subtext ? cell.subtext.split('\n') : [];
                            const fontSize = cell.type === 'brahmasthan' ? 16 : 12;
                            const subFontSize = 9;
                            
                            // Approximate char widths (snug but sufficient)
                            const mainWidth = mainText.length * fontSize * 0.68;
                            const subWidths = subLines.map(l => l.length * subFontSize * 0.58);
                            const maxWidth = Math.max(mainWidth, ...subWidths) + 18;
                            
                            // Use absolute Y positions for each line
                            const mainLineY = labelY;                              // devta name
                            const subLineYs = subLines.map((_, i) => labelY + fontSize * 0.95 + i * (subFontSize * 1.35));
                            
                            // Bounding box — generous padding for both browser SVG & PDF Canvas renderer
                            const padV = 12;
                            const topY = mainLineY - fontSize - padV;
                            const bottomY = subLines.length > 0
                                ? subLineYs[subLineYs.length - 1] + subFontSize * 0.8 + padV
                                : mainLineY + fontSize * 0.6 + padV;
                            const totalH = bottomY - topY;

                            return (
                                <g>
                                    {isOuter && (
                                        <>
                                            <circle cx={cell.textPos.x} cy={cell.textPos.y} r={3} fill="#222" />
                                            <line 
                                                x1={cell.textPos.x} y1={cell.textPos.y} 
                                                x2={labelX} y2={labelY} 
                                                stroke="#222" 
                                                strokeWidth="1" 
                                            />
                                        </>
                                    )}
                                    {/* White background for label readability */}
                                    <rect
                                        x={labelX - maxWidth / 2}
                                        y={topY}
                                        width={maxWidth}
                                        height={totalH}
                                        rx={2}
                                        ry={2}
                                        fill="white"
                                        fillOpacity={0.88}
                                    />
                                    <text
                                        x={labelX}
                                        textAnchor="middle"
                                        pointerEvents="none"
                                        className="select-none"
                                    >
                                        {/* Main devta name - absolute Y */}
                                        <tspan
                                            x={labelX}
                                            y={mainLineY}
                                            fontSize={fontSize}
                                            fontWeight="bold"
                                            fill="#000"
                                        >
                                            {cell.devta}
                                        </tspan>
                                        {/* Sub-text lines - absolute Y each */}
                                        {subLines.map((lineText, i) => (
                                            <tspan 
                                                key={i} 
                                                x={labelX}
                                                y={subLineYs[i]}
                                                fontSize={subFontSize}
                                                fontWeight="600"
                                                fill="#222"
                                            >
                                                {lineText}
                                            </tspan>
                                        ))}
                                    </text>
                                </g>
                            );
                        })()}
                    </g>
                );
            })}
        </g>
    );
}
