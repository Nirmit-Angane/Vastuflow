import React from 'react';

function toSVGAngle(compassDeg: number) {
    return (compassDeg - 90) * Math.PI / 180;
}

function polarToXY(angleDeg: number, r: number) {
    const rad = toSVGAngle(angleDeg);
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

function describeArc(startDeg: number, endDeg: number, rInner: number, rOuter: number) {
    const s1 = polarToXY(startDeg, rOuter);
    const e1 = polarToXY(endDeg, rOuter);
    const s2 = polarToXY(endDeg, rInner);
    const e2 = polarToXY(startDeg, rInner);

    let diff = endDeg - startDeg;
    if (diff < 0) diff += 360;
    const largeArc = diff > 180 ? 1 : 0;

    return `M ${s1.x} ${s1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${e2.x} ${e2.y} Z`;
}

function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const directions = [
    { name: 'N', abbr: 'N', start: 348.75, end: 11.25, color: '#4a90d9', zone: 'North' },
    { name: 'NNE', abbr: 'NNE', start: 11.25, end: 33.75, color: '#5a9fd4', zone: 'N-NE' },
    { name: 'NE', abbr: 'NE', start: 33.75, end: 56.25, color: '#6aafe0', zone: 'NE' },
    { name: 'ENE', abbr: 'ENE', start: 56.25, end: 78.75, color: '#7bbd72', zone: 'E-NE' },
    { name: 'E', abbr: 'E', start: 78.75, end: 101.25, color: '#5cb85c', zone: 'East' },
    { name: 'ESE', abbr: 'ESE', start: 101.25, end: 123.75, color: '#82c96a', zone: 'E-SE' },
    { name: 'SE', abbr: 'SE', start: 123.75, end: 146.25, color: '#c9b84e', zone: 'SE' },
    { name: 'SSE', abbr: 'SSE', start: 146.25, end: 168.75, color: '#d4a843', zone: 'S-SE' },
    { name: 'S', abbr: 'S', start: 168.75, end: 191.25, color: '#e8572a', zone: 'South' },
    { name: 'SSW', abbr: 'SSW', start: 191.25, end: 213.75, color: '#d44e2a', zone: 'S-SW' },
    { name: 'SW', abbr: 'SW', start: 213.75, end: 236.25, color: '#c9a34e', zone: 'SW' },
    { name: 'WSW', abbr: 'WSW', start: 236.25, end: 258.75, color: '#a0917a', zone: 'W-SW' },
    { name: 'W', abbr: 'W', start: 258.75, end: 281.25, color: '#8a8a9a', zone: 'West' },
    { name: 'WNW', abbr: 'WNW', start: 281.25, end: 303.75, color: '#7a8aaa', zone: 'W-NW' },
    { name: 'NW', abbr: 'NW', start: 303.75, end: 326.25, color: '#6a7fba', zone: 'NW' },
    { name: 'NNW', abbr: 'NNW', start: 326.25, end: 348.75, color: '#5a70c4', zone: 'N-NW' },
];

const subZones = Array.from({ length: 32 }).map((_, i) => ({
    start: i * 11.25,
    end: (i + 1) * 11.25,
    index: i
}));

const mainDirs = [
    { name: 'North', deg: 0 }, { name: 'NE', deg: 45 }, { name: 'East', deg: 90 },
    { name: 'SE', deg: 135 }, { name: 'South', deg: 180 }, { name: 'SW', deg: 225 },
    { name: 'West', deg: 270 }, { name: 'NW', deg: 315 }
];

const zoneKeys = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

interface ShaktiChakraProps {
    centroid: { x: number, y: number };
    scale: number;
    rotation: number;
    selectedDirection: string | null;
    hoveredDirection: string | null;
    onDirectionClick: (dir: string | null) => void;
    onDirectionHover: (dir: string | null) => void;
    entranceDegree?: number | null;
}

export default function ShaktiChakra({
    centroid, scale, rotation, selectedDirection, hoveredDirection, onDirectionClick, onDirectionHover, entranceDegree
}: ShaktiChakraProps) {

    // Group transformation scales and aligns the chakra correctly inside the CanvasArea
    const transformStr = `translate(${centroid.x}, ${centroid.y}) scale(${scale}) rotate(${rotation})`;

    return (
        <g transform={transformStr} style={{ transition: "transform 0.3s ease" }}>
            <defs>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f5d78e" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#c9a96e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="redGlow">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Outer ring segments: colored zones */}
            <g id="outerRing">
                {directions.map((d) => {
                    const paths = [];
                    if (d.start > d.end) {
                        paths.push(describeArc(d.start, 359.99, 230, 260));
                        paths.push(describeArc(0, d.end, 230, 260));
                    } else {
                        paths.push(describeArc(d.start, d.end, 230, 260));
                    }
                    return paths.map((pathStr, i) => (
                        <path key={`${d.name}-ring-${i}`} d={pathStr} fill={d.color} opacity="0.85" />
                    ));
                })}
                <circle cx="0" cy="0" r="260" fill="none" stroke="#c8cfe0" strokeWidth="2" />
                <circle cx="0" cy="0" r="230" fill="none" stroke="#c8cfe0" strokeWidth="1.5" />
            </g>

            {/* Draw sub-zone ring & Inner area backgrounds */}
            <circle cx="0" cy="0" r="230" fill="transparent" />

            {/* Inner rings */}
            <circle cx="0" cy="0" r="230" fill="none" stroke="#c8cfe0" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="210" fill="none" stroke="#c8cfe0" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="190" fill="none" stroke="#d5dae8" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="170" fill="none" stroke="#c8cfe0" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="150" fill="none" stroke="#c8cfe0" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(184,146,58,0.35)" strokeWidth="0.8" />

            {/* Entrance Degree Indicator */}
            {typeof entranceDegree === 'number' && entranceDegree >= 0 && (
                <g id="entranceArrow">
                    <line
                        x1="0" y1="0"
                        x2={polarToXY(entranceDegree, 280).x}
                        y2={polarToXY(entranceDegree, 280).y}
                        stroke="#EF4444" strokeWidth="2.5"
                        strokeDasharray="4 2"
                    />
                    <circle cx={polarToXY(entranceDegree, 280).x} cy={polarToXY(entranceDegree, 280).y} r="4" fill="#EF4444" />
                </g>
            )}

            {/* Direction wedge segments (clickable) */}
            <g id="wedges">
                {directions.map((d) => {
                    const paths = [];
                    if (d.start > d.end) {
                        paths.push({ s: d.start, e: 359.99 });
                        paths.push({ s: 0, e: d.end });
                    } else {
                        paths.push({ s: d.start, e: d.end });
                    }

                    const isSelected = selectedDirection === d.name;

                    return paths.map((seg, segIdx) => {
                        const pathStr = describeArc(seg.s, seg.e, 0, 230);
                        const fill = "transparent";

                        // Active sectors get a slight glow / pop
                        const stroke = isSelected ? hexToRgba(d.color, 0.85) : "rgba(180,190,210,0.6)";
                        const filter = isSelected ? "url(#glow)" : "none";

                        return (
                            <path
                                key={`${d.name}-wedge-${segIdx}`}
                                d={pathStr}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={isSelected ? "1.5" : "0.5"}
                                cursor="pointer"
                                filter={filter}
                                style={{ transition: "fill 0.2s, stroke 0.2s" }}
                                onMouseEnter={() => onDirectionHover(d.name)}
                                onMouseLeave={() => onDirectionHover(null)}
                                onClick={() => onDirectionClick(d.name)}
                            >
                                <title>{`${d.name} (${d.zone})\nRange: ${d.start}° – ${d.end}°`}</title>
                            </path>
                        );
                    });
                })}
            </g>

            {/* Spokes */}
            <g id="spokes" style={{ pointerEvents: "none" }}>
                {Array.from({ length: 32 }).map((_, i) => {
                    const deg = i * 11.25;
                    const isMajor = deg % 22.5 === 0;
                    const p1 = polarToXY(deg, isMajor ? 100 : 150);
                    const p2 = polarToXY(deg, 230);
                    return (
                        <line
                            key={`spoke-${deg}`}
                            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                            stroke={isMajor ? 'rgba(160,170,190,0.7)' : 'rgba(180,190,210,0.45)'}
                            strokeWidth={isMajor ? '0.8' : '0.4'}
                        />
                    );
                })}
            </g>

            {/* Outer degree labels */}
            <g id="degreeLabels" style={{ pointerEvents: "none" }}>
                {Array.from({ length: 36 }).map((_, i) => {
                    const deg = i * 10;
                    const p = polarToXY(deg, 272);
                    const svgAngle = toSVGAngle(deg) * 180 / Math.PI;
                    return (
                        <text
                            key={`deg-${deg}`}
                            x={p.x} y={p.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fill="#7a8090" fontSize="9.5" fontFamily="'Raleway', sans-serif"
                            transform={`rotate(${svgAngle + 90}, ${p.x}, ${p.y})`}
                        >
                            {deg}°
                        </text>
                    );
                })}
            </g>

            {/* Main direction labels */}
            <g id="dirLabels" style={{ pointerEvents: "none" }}>
                {mainDirs.map(d => {
                    const p = polarToXY(d.deg, 130);
                    const isSelected = selectedDirection === d.name || selectedDirection === directions.find((dir) => dir.start === d.deg)?.name;
                    return (
                        <text
                            key={`main-${d.name}`}
                            x={p.x} y={p.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fill={isSelected ? "#b8923a" : "#7b5c2e"}
                            fontSize={d.name.length <= 2 ? "15" : "12"}
                            fontFamily="'Cinzel', serif"
                            fontWeight={isSelected ? "700" : "600"}
                            opacity="0.85"
                            style={{ transition: "fill 0.2s" }}
                        >
                            {d.name}
                        </text>
                    );
                })}
            </g>

            {/* Sub-direction abbreviations on ring (190-230) */}
            <g id="subDirLabels" style={{ pointerEvents: "none" }}>
                {directions.map(d => {
                    let midDeg = (d.start + d.end) / 2;
                    if (d.start > d.end) midDeg = (d.start + d.end + 360) / 2 % 360;
                    const p = polarToXY(midDeg, 210);
                    const svgAngle = toSVGAngle(midDeg) * 180 / Math.PI + 90;
                    const isSelected = selectedDirection === d.name;
                    return (
                        <text
                            key={`sub-${d.name}`}
                            x={p.x} y={p.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fill={isSelected ? "#b8923a" : "#4a3a25"}
                            fontSize={isSelected ? "10" : "8.5"}
                            fontFamily="'Raleway', sans-serif"
                            fontWeight="600"
                            transform={`rotate(${svgAngle}, ${p.x}, ${p.y})`}
                            style={{ transition: "all 0.2s" }}
                        >
                            {d.abbr}
                        </text>
                    );
                })}
            </g>

            {/* Zone sub-labels (W1-W8 style) on inner ring area */}
            <g id="zoneLabels" style={{ pointerEvents: "none" }}>
                {subZones.map((sz, i) => {
                    const dirIdx = Math.floor(i / 2);
                    const dirKey = zoneKeys[dirIdx];
                    const letter = dirKey.charAt(0);

                    const midDeg = (sz.start + sz.end) / 2;
                    const p = polarToXY(midDeg, 178);
                    const svgAngle = toSVGAngle(midDeg) * 180 / Math.PI + 90;

                    const localIdx = i % 2 + 1;
                    const textLabel = letter + (dirIdx * 2 + localIdx - dirIdx * 2);

                    return (
                        <text
                            key={`zone-${i}`}
                            x={p.x} y={p.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fill="rgba(100,80,50,0.6)"
                            fontSize="7.5"
                            fontFamily="'Raleway', sans-serif"
                            transform={`rotate(${svgAngle}, ${p.x}, ${p.y})`}
                        >
                            {textLabel}
                        </text>
                    );
                })}
            </g>

            {/* Center starburst */}
            <g style={{ pointerEvents: "none" }}>
                <circle cx="0" cy="0" r="18" fill="url(#centerGlow)" filter="url(#glow)" />
                <circle cx="0" cy="0" r="8" fill="#f5d78e" opacity="0.95" />
                <circle cx="0" cy="0" r="3" fill="#fff" />
            </g>
        </g>
    );
}
