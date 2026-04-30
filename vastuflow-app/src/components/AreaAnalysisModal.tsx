"use client";
import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { DIRECTION_COLORS } from '@/core/geometry/types';

interface AreaAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    zoneResults: {
        direction: string;
        areaPixel: number;
        areaReal: number;
        areaPercent: number;
    }[];
    scaleUnit: string;
}

export default function AreaAnalysisModal({ isOpen, onClose, zoneResults, scaleUnit }: AreaAnalysisModalProps) {
    if (!isOpen) return null;

    // Check if scale is configured (some areaReal > 0)
    const hasScale = zoneResults.some(z => z.areaReal && z.areaReal > 0);

    const getValue = (z: typeof zoneResults[0]) => {
        const val = hasScale ? z.areaReal : z.areaPixel;
        return (isNaN(val) || val == null) ? 0 : val;
    };

    // Calculate metrics based on available area type
    const totalArea = zoneResults.reduce((sum, z) => sum + getValue(z), 0);
    const n = zoneResults.length;

    // Safety check for empty results
    if (n === 0) return null;

    const maxArea = Math.max(...zoneResults.map(getValue));
    const minArea = Math.min(...zoneResults.map(getValue));

    const avgLine = totalArea / n;
    const maxLine = avgLine + (maxArea / 2);
    const minLine = avgLine + (minArea / 2);

    // Format data for Recharts
    const data = zoneResults.map((z) => {
        return {
            name: z.direction,
            area: Number(getValue(z).toFixed(2)),
            color: DIRECTION_COLORS[z.direction as keyof typeof DIRECTION_COLORS] || '#8884d8'
        };
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl border border-[var(--border)] shadow-2xl p-8 w-full max-w-5xl max-h-[90vh] flex flex-col relative overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="mb-4 text-center">
                    <p className="text-gray-500 text-lg mt-1 font-medium font-sans">
                        Visualizing geometric balance across all Vastu sectors
                    </p>
                </div>

                <div className="w-full mt-4" style={{ height: "400px", minHeight: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />

                            <XAxis
                                dataKey="name"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                                tickMargin={10}
                                axisLine={{ stroke: 'var(--border)' }}
                                tickLine={false}
                            />

                            <YAxis
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, Math.ceil(maxLine * 1.1)]}
                                label={{
                                    value: hasScale ? `Area (sq. ${scaleUnit})` : 'Relative Area (px²)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: 'var(--text-secondary)',
                                    fontSize: 12,
                                    offset: -5
                                }}
                            />

                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 1)' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    color: '#374151',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                formatter={(value: any) => [`${Number(value || 0).toFixed(2)} sq. ${scaleUnit}`, 'Area']}
                            />

                            <ReferenceLine
                                y={maxLine}
                                stroke="#ef4444"
                                strokeDasharray="3 3"
                                label={{ value: `Max. (${maxLine.toFixed(2)})`, position: 'insideTopLeft', fill: '#ef4444', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                            />
                            <ReferenceLine
                                y={avgLine}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                label={{ value: `Avg. (${avgLine.toFixed(2)})`, position: 'insideTopLeft', fill: '#10b981', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                            />
                            <ReferenceLine
                                y={minLine}
                                stroke="#3b82f6"
                                strokeDasharray="3 3"
                                label={{ value: `Min. (${minLine.toFixed(2)})`, position: 'insideTopLeft', fill: '#3b82f6', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                            />

                            <Bar
                                dataKey="area"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                                activeBar={{ stroke: 'none', strokeWidth: 0 }}
                                style={{ outline: 'none' }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
