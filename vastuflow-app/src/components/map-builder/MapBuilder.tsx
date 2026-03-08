"use client";
/**
 * MapBuilder — AutoCAD-style floor plan builder.
 *
 * PERF: Grid is rendered via CSS background-image (zero SVG elements).
 * Ruler labels only for visible viewport. Furniture has realistic SVG shapes.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import "./MapBuilder.css";

// ── Types ────────────────────────────────────────────────────────────────
export interface MapWall {
    id: string;
    x1: number; y1: number;
    x2: number; y2: number;
    lengthFt: number;
    lengthIn: number;
    thickness: number;
    type: "standard" | "inner" | "beam";
}

export interface MapFurniture {
    id: string;
    type: string;
    label: string;
    x: number; y: number;
    w: number; h: number;
    rotation: number;
}

export interface MapText {
    id: string;
    text: string;
    x: number;
    y: number;
    rotation: number;
    fontSize: number;
}

interface MapBuilderProps {
    onExit: () => void;
    onAnalyze?: (polygon: { x: number; y: number }[]) => void;
}

// ── Constants ────────────────────────────────────────────────────────────
const PX_PER_FT = 40;
const SNAP_SIZE = PX_PER_FT;
const WALL_THICKNESS = 6;

// ── Furniture icons (mini SVG paths) ─────────────────────────────────────
const FURN_ICONS: Record<string, (w: number, h: number) => React.ReactNode> = {
    sofa3: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="none" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={2} y={h * 0.6} width={w - 4} height={h * 0.35} rx={2} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={0.8} />
        <rect x={3} y={h * 0.65} width={w * 0.28} height={h * 0.25} rx={2} fill="#C4B498" />
        <rect x={w * 0.35} y={h * 0.65} width={w * 0.3} height={h * 0.25} rx={2} fill="#C4B498" />
        <rect x={w * 0.68} y={h * 0.65} width={w * 0.28} height={h * 0.25} rx={2} fill="#C4B498" />
        <rect x={1} y={2} width={w - 2} height={h * 0.55} rx={2} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={0.6} />
    </>),
    loveseat: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="none" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={2} y={h * 0.6} width={w - 4} height={h * 0.35} rx={2} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={0.8} />
        <rect x={3} y={h * 0.65} width={w * 0.42} height={h * 0.25} rx={2} fill="#C4B498" />
        <rect x={w * 0.52} y={h * 0.65} width={w * 0.42} height={h * 0.25} rx={2} fill="#C4B498" />
        <rect x={1} y={2} width={w - 2} height={h * 0.55} rx={2} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={0.6} />
    </>),
    armchair: (w, h) => (<>
        <rect x={w * 0.15} y={0} width={w * 0.7} height={h} rx={3} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={0} y={h * 0.15} width={w * 0.2} height={h * 0.7} rx={4} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={0.8} />
        <rect x={w * 0.8} y={h * 0.15} width={w * 0.2} height={h * 0.7} rx={4} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={0.8} />
        <rect x={w * 0.2} y={h * 0.55} width={w * 0.6} height={h * 0.4} rx={2} fill="#C4B498" />
    </>),
    dining6: (w, h) => (<>
        <rect x={w * 0.1} y={h * 0.1} width={w * 0.8} height={h * 0.8} rx={4} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={w * 0.15} y={0} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.42} y={0} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.7} y={0} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.15} y={h * 0.88} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.42} y={h * 0.88} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.7} y={h * 0.88} width={w * 0.15} height={h * 0.12} rx={1} fill="#8B7D6B" />
    </>),
    kingbed: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={0} y={0} width={w} height={h * 0.12} rx={2} fill="#8B7D6B" />
        <rect x={w * 0.05} y={h * 0.18} width={w * 0.42} height={h * 0.35} rx={3} fill="#F5F0E6" stroke="#C4B498" strokeWidth={0.8} />
        <rect x={w * 0.53} y={h * 0.18} width={w * 0.42} height={h * 0.35} rx={3} fill="#F5F0E6" stroke="#C4B498" strokeWidth={0.8} />
        <rect x={w * 0.1} y={h * 0.6} width={w * 0.8} height={h * 0.35} rx={2} fill="#D4C4A8" stroke="#C4B498" strokeWidth={0.6} />
    </>),
    queenbed: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={0} y={0} width={w} height={h * 0.1} rx={2} fill="#8B7D6B" />
        <rect x={w * 0.05} y={h * 0.15} width={w * 0.42} height={h * 0.3} rx={3} fill="#F5F0E6" stroke="#C4B498" strokeWidth={0.8} />
        <rect x={w * 0.53} y={h * 0.15} width={w * 0.42} height={h * 0.3} rx={3} fill="#F5F0E6" stroke="#C4B498" strokeWidth={0.8} />
        <rect x={w * 0.1} y={h * 0.55} width={w * 0.8} height={h * 0.4} rx={2} fill="#D4C4A8" stroke="#C4B498" strokeWidth={0.6} />
    </>),
    desk: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={1.2} />
        <rect x={w * 0.05} y={h * 0.15} width={w * 0.35} height={h * 0.7} rx={1} fill="#C4B498" stroke="#8B7D6B" strokeWidth={0.5} />
        <line x1={w * 0.5} y1={h * 0.3} x2={w * 0.9} y2={h * 0.3} stroke="#8B7D6B" strokeWidth={0.5} />
        <line x1={w * 0.5} y1={h * 0.5} x2={w * 0.9} y2={h * 0.5} stroke="#8B7D6B" strokeWidth={0.5} />
        <line x1={w * 0.5} y1={h * 0.7} x2={w * 0.9} y2={h * 0.7} stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
    wardrobe: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#D4C4A8" stroke="#8B7D6B" strokeWidth={1.2} />
        <line x1={w * 0.5} y1={2} x2={w * 0.5} y2={h - 2} stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.42} cy={h * 0.5} r={2} fill="#8B7D6B" />
        <circle cx={w * 0.58} cy={h * 0.5} r={2} fill="#8B7D6B" />
    </>),
    toilet: (w, h) => (<>
        <rect x={w * 0.15} y={0} width={w * 0.7} height={h * 0.35} rx={2} fill="#F0EDE8" stroke="#8B7D6B" strokeWidth={1} />
        <ellipse cx={w * 0.5} cy={h * 0.65} rx={w * 0.4} ry={h * 0.32} fill="#F5F2EE" stroke="#8B7D6B" strokeWidth={1.2} />
    </>),
    sink: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#F0EDE8" stroke="#8B7D6B" strokeWidth={1} />
        <ellipse cx={w * 0.5} cy={h * 0.5} rx={w * 0.3} ry={h * 0.3} fill="#DDD8D0" stroke="#8B7D6B" strokeWidth={0.8} />
        <circle cx={w * 0.5} cy={h * 0.35} r={2} fill="#8B7D6B" />
    </>),
    stove: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={2} fill="#E0DDD8" stroke="#8B7D6B" strokeWidth={1.2} />
        <circle cx={w * 0.28} cy={h * 0.32} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.72} cy={h * 0.32} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.28} cy={h * 0.68} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
        <circle cx={w * 0.72} cy={h * 0.68} r={w * 0.14} fill="none" stroke="#8B7D6B" strokeWidth={1} />
    </>),
    fridge: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={3} fill="#E8E5E0" stroke="#8B7D6B" strokeWidth={1.2} />
        <line x1={2} y1={h * 0.35} x2={w - 2} y2={h * 0.35} stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.78} y={h * 0.08} width={3} height={h * 0.2} rx={1} fill="#8B7D6B" />
        <rect x={w * 0.78} y={h * 0.42} width={3} height={h * 0.2} rx={1} fill="#8B7D6B" />
    </>),
    singledoor: (w, h) => (<>
        <rect x={0} y={0} width={w * 0.2} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <path d={`M${w * 0.2} ${h} A${w * 0.8} ${h} 0 0 0 ${w} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="4 2" />
        <line x1={w * 0.2} y1={h} x2={w * 0.2} y2={0} stroke="#8B7D6B" />
        <line x1={w * 0.2} y1={h} x2={w} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
    </>),
    doubledoor: (w, h) => (<>
        <rect x={0} y={0} width={w * 0.15} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <rect x={w * 0.85} y={0} width={w * 0.15} height={h} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <path d={`M${w * 0.15} ${h} A${w * 0.35} ${h} 0 0 0 ${w * 0.5} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="3 2" />
        <path d={`M${w * 0.85} ${h} A${w * 0.35} ${h} 0 0 1 ${w * 0.5} 0`} fill="none" stroke="#8B7D6B" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={w * 0.15} y1={h} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
        <line x1={w * 0.85} y1={h} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeDasharray="2 2" />
    </>),
    window: (w, h) => (<>
        <rect x={0} y={0} width={w} height={h} rx={1} fill="#FFF" stroke="#8B7D6B" strokeWidth={1} />
        <line x1={w * 0.5} y1={0} x2={w * 0.5} y2={h} stroke="#8B7D6B" strokeWidth={1} />
        <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="#8B7D6B" strokeWidth={0.5} />
    </>),
};

// Furniture sidebar icon (small preview)
function FurnIcon({ type }: { type: string }) {
    const render = FURN_ICONS[type];
    if (!render) return <span style={{ fontSize: 20, color: "#8B7D6B" }}>▭</span>;
    return <svg width={36} height={28} viewBox="0 0 36 28">{render(36, 28)}</svg>;
}

// Furniture library
const FURNITURE_LIB: { type: string; label: string; wFt: number; hFt: number }[] = [
    { type: "sofa3", label: "Sofa (3-Seat)", wFt: 7, hFt: 3 },
    { type: "loveseat", label: "Loveseat", wFt: 5, hFt: 3 },
    { type: "armchair", label: "Armchair", wFt: 3, hFt: 3 },
    { type: "dining6", label: "Dining Table", wFt: 5, hFt: 3 },
    { type: "kingbed", label: "King Bed", wFt: 6.5, hFt: 6 },
    { type: "queenbed", label: "Queen Bed", wFt: 5, hFt: 6.5 },
    { type: "desk", label: "Study Desk", wFt: 4, hFt: 2 },
    { type: "wardrobe", label: "Wardrobe", wFt: 5, hFt: 2 },
    { type: "toilet", label: "Toilet", wFt: 2, hFt: 2.5 },
    { type: "sink", label: "Sink", wFt: 2, hFt: 1.5 },
    { type: "stove", label: "Stove", wFt: 2.5, hFt: 2 },
    { type: "fridge", label: "Refrigerator", wFt: 2.5, hFt: 2.5 },
];

// Room presets
const ROOM_PRESETS: { label: string; wFt: number; hFt: number }[] = [
    { label: "8' × 10'", wFt: 8, hFt: 10 },
    { label: "8' × 12'", wFt: 8, hFt: 12 },
    { label: "10' × 10'", wFt: 10, hFt: 10 },
    { label: "10' × 12'", wFt: 10, hFt: 12 },
    { label: "12' × 12'", wFt: 12, hFt: 12 },
    { label: "12' × 14'", wFt: 12, hFt: 14 },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function snap(v: number) { return Math.round(v / SNAP_SIZE) * SNAP_SIZE; }
function wallLen(w: MapWall) { return Math.sqrt((w.x2 - w.x1) ** 2 + (w.y2 - w.y1) ** 2); }
function fmtFt(ft: number, inc: number) { return inc > 0 ? `${ft}'${inc}"` : `${ft}'`; }
function uid() { return Math.random().toString(36).slice(2, 9); }

// ═══════════════════════════════════════════════════════════════════════════
export default function MapBuilder({ onExit, onAnalyze }: MapBuilderProps) {
    const [walls, setWalls] = useState<MapWall[]>([]);
    const [furniture, setFurniture] = useState<MapFurniture[]>([]);
    const [texts, setTexts] = useState<MapText[]>([]);
    const [tool, setTool] = useState<"draw" | "select" | "furniture" | "text">("draw");
    const [wallType, setWallType] = useState<"standard" | "inner" | "beam">("standard");
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [editWall, setEditWall] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string | null>(null);
    const [dimFt, setDimFt] = useState("");
    const [dimIn, setDimIn] = useState("");
    const [showDims, setShowDims] = useState(true);
    const [pan, setPan] = useState({ x: 100, y: 60 });
    const [zoom, setZoom] = useState(1);
    const [sidebarTab, setSidebarTab] = useState<"rooms" | "furniture" | "doors">("rooms");
    const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
    const [placingFurniture, setPlacingFurniture] = useState<typeof FURNITURE_LIB[0] | null>(null);
    const [history, setHistory] = useState<MapWall[][]>([[]]);
    const [historyIdx, setHistoryIdx] = useState(0);
    const svgRef = useRef<SVGSVGElement>(null);
    const isPanning = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    // Resize state: which furniture + which handle edge
    const resizing = useRef<{ id: string; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);
    // Dragging furniture/text state
    const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; isText?: boolean } | null>(null);
    // Rotating furniture/text state
    const rotating = useRef<{ id: string; centerX: number; centerY: number; startAngle: number; origRotation: number; isText?: boolean } | null>(null);

    // ── History ──────────────────────────────────────────────────────────
    const pushHistory = useCallback((newWalls: MapWall[]) => {
        setHistory(prev => [...prev.slice(0, historyIdx + 1), newWalls]);
        setHistoryIdx(prev => prev + 1);
    }, [historyIdx]);

    const undo = useCallback(() => {
        if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setWalls(history[historyIdx - 1]); }
    }, [historyIdx, history]);

    const redo = useCallback(() => {
        if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setWalls(history[historyIdx + 1]); }
    }, [historyIdx, history]);

    // ── SVG coordinate conversion ────────────────────────────────────────
    const svgPoint = useCallback((cx: number, cy: number) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const r = svg.getBoundingClientRect();
        return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
    }, [pan, zoom]);

    // ── Start resize on a furniture handle ─────────────────────────────
    const startResize = useCallback((e: React.MouseEvent, fId: string, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        const f = furniture.find(f => f.id === fId);
        if (!f) return;
        resizing.current = { id: fId, handle, startX: e.clientX, startY: e.clientY, origX: f.x, origY: f.y, origW: f.w, origH: f.h };
    }, [furniture]);

    // ── Start drag on a furniture/text item ─────────────────────────────────
    const startDrag = useCallback((e: React.MouseEvent, id: string, isText = false) => {
        e.stopPropagation();
        const item = isText ? texts.find(t => t.id === id) : furniture.find(f => f.id === id);
        if (!item) return;
        setSelectedFurniture(id);
        dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y, isText };
    }, [furniture, texts]);

    // ── Start rotate on a furniture/text item ────────────────────────────────
    const startRotate = useCallback((e: React.MouseEvent, id: string, isText = false) => {
        e.stopPropagation();
        e.preventDefault();
        const item = isText ? texts.find(t => t.id === id) : furniture.find(f => f.id === id);
        if (!item) return;
        // Center of the item in SVG coords
        const w = (item as MapFurniture).w || 0;
        const h = (item as MapFurniture).h || 0;
        const cx = isText ? item.x : item.x + w / 2;
        const cy = isText ? item.y : item.y + h / 2;
        const pt = svgPoint(e.clientX, e.clientY);
        const startAngle = Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI;
        rotating.current = { id, centerX: cx, centerY: cy, startAngle, origRotation: item.rotation, isText };
    }, [furniture, texts, svgPoint]);

    // ── Mouse handlers ───────────────────────────────────────────────────
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            return;
        }
        // Block drawing clicks while dimension popup is open
        if (editWall) return;
        // Don't draw if resize/drag is active
        if (resizing.current || dragging.current) return;
        const pt = svgPoint(e.clientX, e.clientY);
        const snapped = { x: snap(pt.x), y: snap(pt.y) };

        if (tool === "draw") {
            if (!drawStart) {
                setDrawStart(snapped);
            } else {
                const newWall: MapWall = {
                    id: uid(), x1: drawStart.x, y1: drawStart.y, x2: snapped.x, y2: snapped.y,
                    lengthFt: 0, lengthIn: 0, thickness: WALL_THICKNESS, type: wallType,
                };
                const pxLen = wallLen(newWall);
                const realFt = pxLen / PX_PER_FT;
                newWall.lengthFt = Math.floor(realFt);
                newWall.lengthIn = Math.round((realFt - Math.floor(realFt)) * 12);
                const nw = [...walls, newWall];
                setWalls(nw);
                pushHistory(nw);
                setEditWall(newWall.id);
                setDimFt(String(newWall.lengthFt));
                setDimIn(String(newWall.lengthIn));
                setDrawStart(null);
            }
        } else if (tool === "furniture" && placingFurniture) {
            setFurniture(prev => [...prev, {
                id: uid(), type: placingFurniture.type, label: placingFurniture.label,
                x: snapped.x, y: snapped.y,
                w: placingFurniture.wFt * PX_PER_FT, h: placingFurniture.hFt * PX_PER_FT,
                rotation: 0,
            }]);
            setPlacingFurniture(null);
            setTool("select");
        } else if (tool === "text") {
            const newId = uid();
            setTexts(prev => [...prev, { id: newId, text: "Text Label", x: snapped.x, y: snapped.y, rotation: 0, fontSize: 16 }]);
            setEditingText(newId);
            setSelectedFurniture(newId);
            setTool("select");
        } else if (tool === "select") {
            // Clicking empty space deselects
            setSelectedFurniture(null);
            setEditingText(null);
        }
    }, [tool, drawStart, walls, wallType, svgPoint, pushHistory, placingFurniture, editWall]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // Rotation dragging
        if (rotating.current) {
            const rot = rotating.current;
            const pt = svgPoint(e.clientX, e.clientY);
            const currentAngle = Math.atan2(pt.y - rot.centerY, pt.x - rot.centerX) * 180 / Math.PI;
            const delta = currentAngle - rot.startAngle;
            // Snap to 15° increments
            const snapped = Math.round((rot.origRotation + delta) / 15) * 15;
            if (rot.isText) {
                setTexts(prev => prev.map(t => t.id !== rot.id ? t : { ...t, rotation: snapped }));
            } else {
                setFurniture(prev => prev.map(f => f.id !== rot.id ? f : { ...f, rotation: snapped }));
            }
            return;
        }
        // Resize dragging
        if (resizing.current) {
            const r = resizing.current;
            const dx = (e.clientX - r.startX) / zoom;
            const dy = (e.clientY - r.startY) / zoom;
            const MIN = PX_PER_FT; // 1ft minimum
            setFurniture(prev => prev.map(f => {
                if (f.id !== r.id) return f;
                let nx = r.origX, ny = r.origY, nw = r.origW, nh = r.origH;
                const h = r.handle;
                if (h.includes('r')) { nw = Math.max(MIN, r.origW + dx); }
                if (h.includes('l')) { const d = Math.min(dx, r.origW - MIN); nx = r.origX + d; nw = r.origW - d; }
                if (h.includes('b')) { nh = Math.max(MIN, r.origH + dy); }
                if (h.includes('t')) { const d = Math.min(dy, r.origH - MIN); ny = r.origY + d; nh = r.origH - d; }
                return { ...f, x: snap(nx), y: snap(ny), w: snap(nw), h: snap(nh) };
            }));
            return;
        }
        // Item dragging
        if (dragging.current) {
            const drag = dragging.current;
            const dx = (e.clientX - drag.startX) / zoom;
            const dy = (e.clientY - drag.startY) / zoom;
            let nx = drag.origX + dx;
            let ny = drag.origY + dy;
            if (e.shiftKey) { nx = snap(nx); ny = snap(ny); }
            if (drag.isText) {
                setTexts(prev => prev.map(t => t.id !== drag.id ? t : { ...t, x: nx, y: ny }));
            } else {
                setFurniture(prev => prev.map(f => f.id !== drag.id ? f : { ...f, x: nx, y: ny }));
            }
            return;
        }
        if (isPanning.current) {
            setPan(prev => ({
                x: prev.x + e.clientX - lastMouse.current.x,
                y: prev.y + e.clientY - lastMouse.current.y,
            }));
            lastMouse.current = { x: e.clientX, y: e.clientY };
            return;
        }
        const pt = svgPoint(e.clientX, e.clientY);
        setMousePos({ x: snap(pt.x), y: snap(pt.y) });
    }, [svgPoint, zoom]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        resizing.current = null;
        dragging.current = null;
        rotating.current = null;
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => Math.max(0.2, Math.min(5, prev * (e.deltaY < 0 ? 1.1 : 0.9))));
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setDrawStart(null);
    }, []);

    // ── Keyboard ─────────────────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Ignore keystrokes if we are actively editing an input
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
                return;
            }

            if (e.key === "Escape") {
                setDrawStart(null);
                setEditWall(null);
                setPlacingFurniture(null);
                setSelectedFurniture(null);
                setEditingText(null);
            }
            if (e.ctrlKey && e.key === "z") undo();
            if (e.ctrlKey && e.key === "y") redo();

            // Furniture specific keyboard controls
            if (selectedFurniture) {
                if (e.key === "Delete" || e.key === "Backspace") {
                    setFurniture(p => p.filter(f => f.id !== selectedFurniture));
                    setTexts(p => p.filter(t => t.id !== selectedFurniture));
                    setSelectedFurniture(null);
                }

                // Arrow keys for fine-grained alignment
                if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                    e.preventDefault(); // prevent page scroll
                    const moveAmt = e.shiftKey ? 10 : 1; // 10px with shift, 1px normal

                    setFurniture(prev => prev.map(f => {
                        if (f.id !== selectedFurniture) return f;
                        let nx = f.x;
                        let ny = f.y;
                        if (e.key === "ArrowUp") ny -= moveAmt;
                        if (e.key === "ArrowDown") ny += moveAmt;
                        if (e.key === "ArrowLeft") nx -= moveAmt;
                        if (e.key === "ArrowRight") nx += moveAmt;
                        return { ...f, x: nx, y: ny };
                    }));

                    setTexts(prev => prev.map(t => {
                        if (t.id !== selectedFurniture) return t;
                        let nx = t.x;
                        let ny = t.y;
                        if (e.key === "ArrowUp") ny -= moveAmt;
                        if (e.key === "ArrowDown") ny += moveAmt;
                        if (e.key === "ArrowLeft") nx -= moveAmt;
                        if (e.key === "ArrowRight") nx += moveAmt;
                        return { ...t, x: nx, y: ny };
                    }));
                }
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [undo, redo, selectedFurniture]);

    // ── Apply dimension ──────────────────────────────────────────────────
    const applyDim = useCallback(() => {
        if (!editWall) return;
        const ft = parseInt(dimFt) || 0;
        const inc = parseInt(dimIn) || 0;
        const totalFt = ft + inc / 12;
        setWalls(prev => prev.map(w => {
            if (w.id !== editWall) return w;
            const curLen = wallLen(w);
            if (curLen < 1) return { ...w, lengthFt: ft, lengthIn: inc };
            const scale = (totalFt * PX_PER_FT) / curLen;
            return { ...w, x2: w.x1 + (w.x2 - w.x1) * scale, y2: w.y1 + (w.y2 - w.y1) * scale, lengthFt: ft, lengthIn: inc };
        }));
        setEditWall(null);
    }, [editWall, dimFt, dimIn]);

    // ── Place room preset ────────────────────────────────────────────────
    const placeRoom = useCallback((p: typeof ROOM_PRESETS[0]) => {
        const x = snap((-pan.x / zoom) + 300 / zoom);
        const y = snap((-pan.y / zoom) + 200 / zoom);
        const w = p.wFt * PX_PER_FT, h = p.hFt * PX_PER_FT;
        const nw: MapWall[] = [
            { id: uid(), x1: x, y1: y, x2: x + w, y2: y, lengthFt: p.wFt, lengthIn: 0, thickness: WALL_THICKNESS, type: "standard" },
            { id: uid(), x1: x + w, y1: y, x2: x + w, y2: y + h, lengthFt: p.hFt, lengthIn: 0, thickness: WALL_THICKNESS, type: "standard" },
            { id: uid(), x1: x + w, y1: y + h, x2: x, y2: y + h, lengthFt: p.wFt, lengthIn: 0, thickness: WALL_THICKNESS, type: "standard" },
            { id: uid(), x1: x, y1: y + h, x2: x, y2: y, lengthFt: p.hFt, lengthIn: 0, thickness: WALL_THICKNESS, type: "standard" },
        ];
        const all = [...walls, ...nw];
        setWalls(all);
        pushHistory(all);
    }, [walls, pan, zoom, pushHistory]);

    // ── Area calculation ─────────────────────────────────────────────────
    const totalArea = useMemo(() => {
        if (walls.length < 3) return 0;
        const pts = walls.map(w => ({ x: w.x1, y: w.y1 }));
        let a = 0;
        for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; a += pts[i].x * pts[j].y - pts[j].x * pts[i].y; }
        return Math.abs(a / 2) / (PX_PER_FT * PX_PER_FT);
    }, [walls]);

    // ── Keyboard ─────────────────────────────────────────────────────────
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") { setDrawStart(null); setEditWall(null); setPlacingFurniture(null); }
            if (e.ctrlKey && e.key === "z") undo();
            if (e.ctrlKey && e.key === "y") redo();
            if (e.key === "Delete" && selectedFurniture) { setFurniture(p => p.filter(f => f.id !== selectedFurniture)); setSelectedFurniture(null); }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [undo, redo, selectedFurniture]);

    // ── CSS grid background (FAST — zero DOM elements) ───────────────────
    const gridBg = useMemo(() => {
        const g = PX_PER_FT * zoom;
        return {
            backgroundImage: `radial-gradient(circle, #D5D2CC ${Math.max(0.5, 0.8 * zoom)}px, transparent ${Math.max(0.5, 0.8 * zoom)}px)`,
            backgroundSize: `${g}px ${g}px`,
            backgroundPosition: `${pan.x % g}px ${pan.y % g}px`,
        };
    }, [zoom, pan]);

    // ── Visible ruler range ──────────────────────────────────────────────
    const visibleRulers = useMemo(() => {
        const el = wrapperRef.current;
        const vw = el?.clientWidth ?? 1600;
        const vh = el?.clientHeight ?? 900;
        const startX = Math.floor(-pan.x / (PX_PER_FT * zoom * 5)) * 5;
        const endX = Math.ceil((vw - pan.x) / (PX_PER_FT * zoom * 5)) * 5;
        const startY = Math.floor(-pan.y / (PX_PER_FT * zoom * 5)) * 5;
        const endY = Math.ceil((vh - pan.y) / (PX_PER_FT * zoom * 5)) * 5;
        const xs = [], ys = [];
        for (let i = startX; i <= endX; i += 5) xs.push(i);
        for (let i = startY; i <= endY; i += 5) ys.push(i);
        return { xs, ys };
    }, [pan, zoom]);

    // ═════════════════════════════════════════════════════════════════════
    return (
        <div className="map-builder">
            {/* Toolbar */}
            <div className="map-toolbar">
                <div className="map-toolbar-group">
                    <button onClick={undo} title="Undo (Ctrl+Z)">↩</button>
                    <button onClick={redo} title="Redo (Ctrl+Y)">↪</button>
                </div>
                <div className="map-toolbar-divider" />
                <div className="map-toolbar-group">
                    <button className={tool === "select" ? "active" : ""} onClick={() => { setTool("select"); setDrawStart(null); }} title="Select">◇</button>
                    <button className={tool === "draw" ? "active" : ""} onClick={() => setTool("draw")} title="Draw Wall">┃</button>
                    <button className={tool === "text" ? "active" : ""} onClick={() => { setTool("text"); setDrawStart(null); }} title="Add Text">T</button>
                </div>
                <div className="map-toolbar-divider" />
                <span className="toolbar-label">Wall Thickness</span>
                <input className="toolbar-input" type="number" defaultValue={150} min={50} max={500} />
                <span className="toolbar-label">mm</span>
                <div className="map-toolbar-divider" />
                <button onClick={() => setZoom(z => Math.min(5, z * 1.2))} title="Zoom In">🔍+</button>
                <button onClick={() => setZoom(z => Math.max(0.2, z * 0.8))} title="Zoom Out">🔍−</button>
                <div className="area-display">
                    {totalArea > 0 && <span>⊞ {totalArea.toFixed(0)} ft²</span>}
                    <span className="toolbar-label">|</span>
                    <button className="save-btn" onClick={onExit}>✕ Exit</button>
                    {onAnalyze && walls.length >= 3 && (
                        <button className="save-btn" onClick={() => onAnalyze(walls.map(w => ({ x: w.x1, y: w.y1 })))}>
                            Analyze →
                        </button>
                    )}
                </div>
            </div>

            <div className="map-builder-body">
                {/* Sidebar */}
                <div className="map-sidebar">
                    <div className="map-sidebar-section">
                        <h4>Draw Walls</h4>
                        <div className="wall-type-grid">
                            {(["standard", "inner", "beam"] as const).map(t => (
                                <button key={t} className={`wall-type-btn ${wallType === t && tool === "draw" ? "active" : ""}`}
                                    onClick={() => { setWallType(t); setTool("draw"); }}>
                                    <span className="wall-type-icon">{t === "standard" ? "═══" : t === "inner" ? "───" : "⋯⋯⋯"}</span>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="map-sidebar-section">
                        <h4>Object Library</h4>
                        <div className="map-sidebar-tabs">
                            {(["rooms", "furniture", "doors"] as const).map(tab => (
                                <button key={tab} className={sidebarTab === tab ? "active" : ""} onClick={() => setSidebarTab(tab)}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {sidebarTab === "rooms" && (
                            <div className="map-sidebar-grid">
                                {ROOM_PRESETS.map(p => (
                                    <div key={p.label} className="map-sidebar-item" onClick={() => placeRoom(p)}>
                                        <svg width={36} height={28} viewBox="0 0 36 28">
                                            <rect x={1} y={1} width={34} height={26} fill="none" stroke="#8B7D6B" strokeWidth={2} rx={1} />
                                        </svg>
                                        <span className="item-label">{p.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sidebarTab === "furniture" && (
                            <div className="map-sidebar-grid">
                                {FURNITURE_LIB.map(f => (
                                    <div key={f.type}
                                        className={`map-sidebar-item ${placingFurniture?.type === f.type ? "selected" : ""}`}
                                        onClick={() => { setPlacingFurniture(f); setTool("furniture"); }}>
                                        <FurnIcon type={f.type} />
                                        <span className="item-label">{f.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {sidebarTab === "doors" && (
                            <div className="map-sidebar-grid">
                                {[
                                    { type: "singledoor", wFt: 3, hFt: 0.5, label: "Single Door", icon: (<svg width={36} height={28} viewBox="0 0 36 28"><rect x={2} y={2} width={14} height={24} fill="none" stroke="#8B7D6B" strokeWidth={1.2} /><path d="M16 26 A14 14 0 0 0 16 2" fill="none" stroke="#8B7D6B" strokeWidth={0.8} strokeDasharray="2 1.5" /></svg>) },
                                    { type: "doubledoor", wFt: 6, hFt: 0.5, label: "Double Door", icon: (<svg width={36} height={28} viewBox="0 0 36 28"><rect x={1} y={2} width={12} height={24} fill="none" stroke="#8B7D6B" strokeWidth={1} /><rect x={23} y={2} width={12} height={24} fill="none" stroke="#8B7D6B" strokeWidth={1} /><path d="M13 26 A12 12 0 0 0 13 2" fill="none" stroke="#8B7D6B" strokeWidth={0.7} strokeDasharray="2 1.5" /><path d="M23 26 A12 12 0 0 1 23 2" fill="none" stroke="#8B7D6B" strokeWidth={0.7} strokeDasharray="2 1.5" /></svg>) },
                                    { type: "window", wFt: 4, hFt: 0.5, label: "Window", icon: (<svg width={36} height={28} viewBox="0 0 36 28"><rect x={2} y={8} width={32} height={12} rx={1} fill="none" stroke="#8B7D6B" strokeWidth={1.2} /><line x1={18} y1={8} x2={18} y2={20} stroke="#8B7D6B" strokeWidth={0.8} /><line x1={2} y1={14} x2={34} y2={14} stroke="#8B7D6B" strokeWidth={0.5} /></svg>) },
                                ].map(d => (
                                    <div key={d.label}
                                        className={`map-sidebar-item ${placingFurniture?.type === d.type ? "selected" : ""}`}
                                        onClick={() => { setPlacingFurniture({ type: d.type, label: d.label, wFt: d.wFt, hFt: d.hFt }); setTool("furniture"); }}>
                                        {d.icon}
                                        <span className="item-label">{d.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="map-sidebar-section">
                        <h4>Tools & View</h4>
                        <div className="map-toggle-row">
                            <span className="map-toggle-label">Wall Dimensions</span>
                            <button className={`map-toggle ${showDims ? "on" : ""}`} onClick={() => setShowDims(!showDims)} />
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div ref={wrapperRef} className="map-canvas-wrapper" style={gridBg}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleContextMenu}>
                    <svg ref={svgRef}>
                        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                            {/* Ruler labels — only visible range */}
                            {visibleRulers.xs.map(i => (
                                <text key={`rx-${i}`} x={i * PX_PER_FT} y={-8} fontSize={9 / zoom} fill="#B0AB9E" textAnchor="middle" fontFamily="var(--font-mono)">{i}&apos;</text>
                            ))}
                            {visibleRulers.ys.map(i => (
                                <text key={`ry-${i}`} x={-8} y={i * PX_PER_FT + 3} fontSize={9 / zoom} fill="#B0AB9E" textAnchor="end" fontFamily="var(--font-mono)">{i}&apos;</text>
                            ))}

                            {/* Walls */}
                            {walls.map(w => (
                                <g key={w.id}>
                                    <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                                        stroke={w.type === "inner" ? "#6B6560" : "#1C1A15"}
                                        strokeWidth={(w.type === "beam" ? 3 : w.thickness) / zoom}
                                        strokeDasharray={w.type === "beam" ? `${6 / zoom} ${3 / zoom}` : w.type === "inner" ? `${4 / zoom} ${2 / zoom}` : "none"}
                                        strokeLinecap="round" />
                                    {showDims && w.lengthFt > 0 && (
                                        <text x={(w.x1 + w.x2) / 2} y={(w.y1 + w.y2) / 2 - 8 / zoom}
                                            fontSize={10 / zoom} fill="#7A7567" textAnchor="middle"
                                            fontFamily="var(--font-mono)" fontWeight="500">
                                            {fmtFt(w.lengthFt, w.lengthIn)}
                                        </text>
                                    )}
                                </g>
                            ))}

                            {/* Furniture — realistic shapes + resize handles */}
                            {furniture.map(f => {
                                const render = FURN_ICONS[f.type];
                                const selected = selectedFurniture === f.id;
                                const hs = 5 / zoom; // handle size
                                return (
                                    <g key={f.id} transform={`translate(${f.x + f.w / 2},${f.y + f.h / 2}) rotate(${f.rotation}) translate(${-f.w / 2},${-f.h / 2})`}
                                        onMouseDown={(e) => { if (tool === 'select' || tool === 'draw') startDrag(e, f.id); }}
                                        style={{ cursor: selected ? "move" : "pointer" }}>
                                        {selected && <rect x={-2} y={-2} width={f.w + 4} height={f.h + 4} fill="none" stroke="#B8860B" strokeWidth={1.5 / zoom} strokeDasharray={`${3 / zoom} ${2 / zoom}`} rx={3 / zoom} />}
                                        <g transform={`scale(${f.w / 36},${f.h / 28})`}>
                                            {render ? render(36, 28) : <rect width={36} height={28} fill="#E8DCC8" stroke="#8B7D6B" strokeWidth={1} />}
                                        </g>
                                        <text x={f.w / 2} y={f.h + 10 / zoom} fontSize={8 / zoom} fill="#7A7567" textAnchor="middle" fontFamily="var(--font-mono)">{f.label}</text>
                                        {/* Resize handles + Rotate handle */}
                                        {selected && <>
                                            {/* Rotate handle — circle above the item */}
                                            <line x1={f.w / 2} y1={-2} x2={f.w / 2} y2={-20 / zoom} stroke="#B8860B" strokeWidth={1 / zoom} />
                                            <circle cx={f.w / 2} cy={-20 / zoom} r={6 / zoom} fill="#fff" stroke="#B8860B" strokeWidth={1.2 / zoom}
                                                style={{ cursor: 'grab' }}
                                                onMouseDown={e => { e.stopPropagation(); startRotate(e, f.id); }} />
                                            <text x={f.w / 2} y={-17 / zoom} fontSize={7 / zoom} fill="#B8860B" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>↻</text>
                                            {/* Rotation degree label */}
                                            {f.rotation !== 0 && <text x={f.w / 2 + 12 / zoom} y={-18 / zoom} fontSize={7 / zoom} fill="#7A7567" fontFamily="var(--font-mono)">{f.rotation}°</text>}
                                            {/* Corners */}
                                            <rect x={-hs} y={-hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'nw-resize' }} onMouseDown={e => startResize(e, f.id, 'tl')} />
                                            <rect x={f.w - hs} y={-hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'ne-resize' }} onMouseDown={e => startResize(e, f.id, 'tr')} />
                                            <rect x={-hs} y={f.h - hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'sw-resize' }} onMouseDown={e => startResize(e, f.id, 'bl')} />
                                            <rect x={f.w - hs} y={f.h - hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'se-resize' }} onMouseDown={e => startResize(e, f.id, 'br')} />
                                            {/* Edge midpoints */}
                                            <rect x={f.w / 2 - hs} y={-hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'n-resize' }} onMouseDown={e => startResize(e, f.id, 't')} />
                                            <rect x={f.w / 2 - hs} y={f.h - hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 's-resize' }} onMouseDown={e => startResize(e, f.id, 'b')} />
                                            <rect x={-hs} y={f.h / 2 - hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'w-resize' }} onMouseDown={e => startResize(e, f.id, 'l')} />
                                            <rect x={f.w - hs} y={f.h / 2 - hs} width={hs * 2} height={hs * 2} fill="#fff" stroke="#B8860B" strokeWidth={1 / zoom} style={{ cursor: 'e-resize' }} onMouseDown={e => startResize(e, f.id, 'r')} />
                                        </>}
                                    </g>
                                );
                            })}

                            {/* Texts — click to edit or drag */}
                            {texts.map(t => {
                                const selected = selectedFurniture === t.id;
                                const isEditing = editingText === t.id;
                                if (isEditing) return null; // hide text while editing in DOM overlay
                                const tWidth = t.text.length * (t.fontSize * 0.6);
                                const boxW = tWidth + 20;

                                return (
                                    <g key={t.id} transform={`translate(${t.x},${t.y}) rotate(${t.rotation})`}
                                        onMouseDown={(e) => {
                                            e.stopPropagation(); // Prevent canvas background from deselecting
                                            if (tool === 'select') startDrag(e, t.id, true);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setEditingText(t.id);
                                            setSelectedFurniture(t.id);
                                        }}
                                        style={{ cursor: selected ? "move" : "pointer" }}>

                                        {/* Invisible clickable hit box for easier selection */}
                                        <rect x={-boxW / 2} y={-t.fontSize} width={boxW} height={t.fontSize * 2} fill="transparent" />

                                        {selected && <rect x={-boxW / 2} y={-t.fontSize} width={boxW} height={t.fontSize * 2} fill="none" stroke="#B8860B" strokeWidth={1.5 / zoom} strokeDasharray={`${3 / zoom} ${2 / zoom}`} rx={3 / zoom} />}
                                        <text x={0} y={0} fontSize={t.fontSize} fill="#1C1A15" textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-primary)" fontWeight={500} style={{ pointerEvents: 'none', userSelect: 'none' }}>{t.text}</text>

                                        {/* Resize handles + Rotate handle */}
                                        {selected && <>
                                            {/* Rotate handle — circle above the item */}
                                            <line x1={0} y1={-(t.fontSize + 10)} x2={0} y2={-(t.fontSize + 25)} stroke="#B8860B" strokeWidth={1 / zoom} />
                                            <circle cx={0} cy={-(t.fontSize + 25)} r={6 / zoom} fill="#fff" stroke="#B8860B" strokeWidth={1.2 / zoom}
                                                style={{ cursor: 'grab' }}
                                                onMouseDown={e => { e.stopPropagation(); startRotate(e, t.id, true); }} />
                                            <text x={0} y={-(t.fontSize + 23)} fontSize={7 / zoom} fill="#B8860B" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>↻</text>

                                            {/* Delete handle (x) */}
                                            <circle cx={boxW / 2 + 10} cy={-t.fontSize} r={8 / zoom} fill="#ff4d4d" stroke="#fff" strokeWidth={1 / zoom}
                                                style={{ cursor: 'pointer' }}
                                                onMouseDown={e => {
                                                    e.stopPropagation();
                                                    setTexts(prev => prev.filter(x => x.id !== t.id));
                                                    setSelectedFurniture(null);
                                                    setEditingText(null);
                                                }} />
                                            <text x={boxW / 2 + 10} y={-t.fontSize + 0.5 / zoom} fontSize={10 / zoom} fill="#fff" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>✕</text>

                                            {/* A+ handle */}
                                            <circle cx={boxW / 2 + 10} cy={-t.fontSize + 22} r={8 / zoom} fill="#4A90E2" stroke="#fff" strokeWidth={1 / zoom}
                                                style={{ cursor: 'pointer' }}
                                                onMouseDown={e => {
                                                    e.stopPropagation();
                                                    setTexts(prev => prev.map(x => x.id === t.id ? { ...x, fontSize: Math.min(100, x.fontSize + 2) } : x));
                                                }} />
                                            <text x={boxW / 2 + 10} y={-t.fontSize + 22.5 / zoom} fontSize={8 / zoom} fill="#fff" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>A+</text>

                                            {/* A- handle */}
                                            <circle cx={boxW / 2 + 10} cy={-t.fontSize + 44} r={8 / zoom} fill="#4A90E2" stroke="#fff" strokeWidth={1 / zoom}
                                                style={{ cursor: 'pointer' }}
                                                onMouseDown={e => {
                                                    e.stopPropagation();
                                                    setTexts(prev => prev.map(x => x.id === t.id ? { ...x, fontSize: Math.max(8, x.fontSize - 2) } : x));
                                                }} />
                                            <text x={boxW / 2 + 10} y={-t.fontSize + 44.5 / zoom} fontSize={8 / zoom} fill="#fff" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>A-</text>
                                        </>}
                                    </g>
                                );
                            })}

                            {/* Rubber band */}
                            {drawStart && tool === "draw" && (<>
                                <line x1={drawStart.x} y1={drawStart.y} x2={mousePos.x} y2={mousePos.y}
                                    stroke="#B8860B" strokeWidth={2 / zoom} strokeDasharray={`${4 / zoom} ${3 / zoom}`} />
                                <circle cx={drawStart.x} cy={drawStart.y} r={4 / zoom} fill="#B8860B" />
                            </>)}

                            {/* Crosshair */}
                            <line x1={mousePos.x - 8 / zoom} y1={mousePos.y} x2={mousePos.x + 8 / zoom} y2={mousePos.y} stroke="#B0AB9E" strokeWidth={0.5 / zoom} />
                            <line x1={mousePos.x} y1={mousePos.y - 8 / zoom} x2={mousePos.x} y2={mousePos.y + 8 / zoom} stroke="#B0AB9E" strokeWidth={0.5 / zoom} />

                            {/* Placing furniture preview */}
                            {placingFurniture && tool === "furniture" && (
                                <g transform={`translate(${mousePos.x},${mousePos.y})`} opacity={0.6}>
                                    <g transform={`scale(${placingFurniture.wFt * PX_PER_FT / 36},${placingFurniture.hFt * PX_PER_FT / 28})`}>
                                        {FURN_ICONS[placingFurniture.type]?.(36, 28) ?? <rect width={36} height={28} fill="#E8DCC8" stroke="#B8860B" strokeWidth={1} />}
                                    </g>
                                </g>
                            )}
                        </g>
                    </svg>

                    {/* Dimension popup */}
                    {editWall && (() => {
                        const w = walls.find(w => w.id === editWall);
                        if (!w) return null;
                        const mx = (w.x1 + w.x2) / 2 * zoom + pan.x;
                        const my = (w.y1 + w.y2) / 2 * zoom + pan.y - 40;
                        return (
                            <div className="wall-dim-popup" style={{ left: mx, top: my }}>
                                <input value={dimFt} onChange={e => setDimFt(e.target.value)} autoFocus
                                    onKeyDown={e => e.key === "Enter" && applyDim()} />
                                <span className="dim-label">ft</span>
                                <input value={dimIn} onChange={e => setDimIn(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && applyDim()} />
                                <span className="dim-label">in</span>
                                <button className="dim-done" onClick={applyDim}>Done</button>
                            </div>
                        );
                    })()}

                    {/* Text Edit Popup */}
                    {editingText && (() => {
                        const t = texts.find(t => t.id === editingText);
                        if (!t) return null;
                        const mx = t.x * zoom + pan.x;
                        const my = t.y * zoom + pan.y;
                        return (
                            <div className="wall-dim-popup"
                                style={{ left: mx, top: my, minWidth: 200, transform: `translate(-50%, -50%) rotate(${t.rotation}deg)` }}
                                onMouseDown={e => e.stopPropagation()}
                            >
                                <input
                                    style={{ width: "100%", textAlign: "center", fontSize: t.fontSize * zoom, fontFamily: "var(--font-primary)", fontWeight: 500 }}
                                    value={t.text}
                                    onChange={e => setTexts(prev => prev.map(textItem => textItem.id === editingText ? { ...textItem, text: e.target.value } : textItem))}
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === "Enter") setEditingText(null);
                                        e.stopPropagation(); // prevent window keydown bindings
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
