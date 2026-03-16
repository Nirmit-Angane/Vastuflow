"use client";

import { useReducer, useCallback, useRef, useState } from "react";
import { createEmptyProject, projectReducer } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { generateReport } from "@/lib/pdf-export";
import StepBar from "@/components/StepBar";
import ToolPanel from "@/components/ToolPanel";
import CanvasArea from "@/components/CanvasArea";
import AnalysisPanel from "@/components/AnalysisPanel";
import MapBuilder, { MapFurniture, MapText, MapWall } from "@/components/map-builder/MapBuilder";
import "./workspace.css";

type WorkspaceMode = "select" | "analysis" | "map-builder";

export default function WorkspacePage() {
    const [mode, setMode] = useState<WorkspaceMode>("select");
    const [state, dispatch] = useReducer(projectReducer, undefined, createEmptyProject);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── File Upload ──
    const handleFileUpload = useCallback(async (file: File) => {
        const sizeMB = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        if (file.type === "application/pdf") {
            // Convert PDF first page to image
            try {
                const { pdfToImageUrl } = await import("@/lib/pdf-to-image");
                const url = await pdfToImageUrl(file);
                dispatch({ type: "LOAD_IMAGE", url, name: file.name, size: sizeMB });
            } catch (err) {
                console.error("PDF conversion failed:", err);
                alert("Failed to load PDF. Please try a different file or export as PNG.");
            }
        } else {
            // Direct image
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    dispatch({ type: "LOAD_IMAGE", url: e.target.result as string, name: file.name, size: sizeMB });
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) handleFileUpload(file);
    }, [handleFileUpload]);

    const handleFileSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    // ── Canvas Click → Scale Point or Vertex ──
    const handleCanvasClick = useCallback((point: { x: number; y: number }) => {
        // Scale drawing mode: clicks set scale line points
        if (state.scaleDrawing) {
            dispatch({ type: "SET_SCALE_POINT", point });
            return;
        }
        // Tracing mode: clicks add polygon vertices
        if (state.phase === Phase.TRACING && !state.polygonClosed) {
            dispatch({ type: "ADD_VERTEX", point });
        }
    }, [state.phase, state.polygonClosed, state.scaleDrawing]);

    // ── PDF Export (only when ANALYZED) ──
    const handleDownloadReport = useCallback(async () => {
        if (!isPhaseAtLeast(state.phase, Phase.ANALYZED)) return;

        // Capture the SVG canvas as a PNG data URL
        let canvasImageUrl: string | null = null;
        let canvasImageAspect: number | undefined;
        try {
            const svgEl = document.querySelector<SVGSVGElement>(".canvas-area svg");
            if (svgEl) {
                let minX = 0; let minY = 0; let maxX = 840; let maxY = 800;
                if (state.image) {
                    // Start bounds based on rotated image corners
                    const cx = 420; const cy = 400;
                    const r = state.rotation ? state.rotation * Math.PI / 180 : 0;
                    const corners = [
                        { x: 0, y: 0 }, { x: 840, y: 0 },
                        { x: 840, y: 800 }, { x: 0, y: 800 }
                    ].map(p => {
                        const dx = p.x - cx;
                        const dy = p.y - cy;
                        return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
                    });

                    minX = Math.min(...corners.map(c => c.x));
                    minY = Math.min(...corners.map(c => c.y));
                    maxX = Math.max(...corners.map(c => c.x));
                    maxY = Math.max(...corners.map(c => c.y));
                }

                if (state.centroid && isPhaseAtLeast(state.phase, Phase.ANALYZED)) {
                    const chakraRadius = 400 * (state.chakraScale ?? 1.0);
                    minX = Math.min(minX, state.centroid.x - chakraRadius);
                    minY = Math.min(minY, state.centroid.y - chakraRadius);
                    maxX = Math.max(maxX, state.centroid.x + chakraRadius);
                    maxY = Math.max(maxY, state.centroid.y + chakraRadius);
                }

                if (state.polygon && state.polygon.length > 0) {
                    const pxs = state.polygon.map(p => p.x);
                    const pys = state.polygon.map(p => p.y);
                    minX = Math.min(minX, ...pxs);
                    minY = Math.min(minY, ...pys);
                    maxX = Math.max(maxX, ...pxs);
                    maxY = Math.max(maxY, ...pys);
                }

                // Add padding
                minX -= 40;
                minY -= 40;
                maxX += 40;
                maxY += 40;

                const svgW = maxX - minX;
                const svgH = maxY - minY;
                canvasImageAspect = svgW > 0 ? svgH / svgW : (800 / 840);

                // Clone for a clean export
                const clone = svgEl.cloneNode(true) as SVGSVGElement;
                clone.setAttribute("viewBox", `${minX} ${minY} ${svgW} ${svgH}`);
                clone.setAttribute("width", String(svgW));
                clone.setAttribute("height", String(svgH));

                // Inject CSS variables so colors resolve in the Blob
                const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
                style.textContent = `
                    :root {
                        --base: #FFFEF9;
                        --surface: #FCFAF5;
                        --surface-2: #F6F4EE;
                        --text-primary: #1C1A15;
                        --text-secondary: #524F45;
                        --text-tertiary: #8C8775;
                        --accent-gold: #B8860B;
                        --accent-gold-light: #D4A017;
                        --good: #3D7A4F;
                        --warning: #B87333;
                        --critical: #A83232;
                        --border: #E2DFD8;
                        --font-mono: 'DM Mono', monospace;
                    }
                    svg { background: #faf9f6; }
                `;
                clone.prepend(style);

                // Convert blob URLs in <image> tags to Data URIs so they export cleanly
                const images = clone.querySelectorAll("image");
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
                    if (href && href.startsWith("blob:")) {
                        try {
                            const response = await fetch(href);
                            const blob = await response.blob();
                            const reader = new FileReader();
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                            img.setAttribute("href", dataUrl);
                        } catch (e) {
                            console.warn("Could not convert blob URL to data URI for export:", e);
                        }
                    }
                }

                const svgBlob = new Blob(
                    [`<?xml version="1.0" encoding="UTF-8"?>`, clone.outerHTML],
                    { type: "image/svg+xml;charset=utf-8" }
                );
                const url = URL.createObjectURL(svgBlob);
                canvasImageUrl = await new Promise<string>((resolve, reject) => {
                    const img = new window.Image();
                    img.onload = () => {
                        const exportScale = 2; // 2× for quality
                        const offscreen = document.createElement("canvas");
                        offscreen.width = svgW * exportScale;
                        offscreen.height = svgH * exportScale;
                        const ctx = offscreen.getContext("2d")!;
                        ctx.fillStyle = "#faf9f6";
                        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
                        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
                        URL.revokeObjectURL(url);
                        resolve(offscreen.toDataURL("image/png"));
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }
        } catch (err) {
            console.warn("Canvas snapshot failed, continuing without map:", err);
        }

        generateReport({
            floorPlan: {
                name: state.imageName ?? "Untitled Project",
                type: "Residential",
                location: "—",
                fileName: state.imageName ?? "project",
                fileSize: state.imageSize ?? "—",
                imageUrl: state.image,
            },
            analysis: {
                overallScore: state.overallScore,
                evaluations: state.zoneResults.map(z => ({
                    direction: z.direction,
                    roomType: "other" as const,
                    roomLabel: `${z.direction} Zone`,
                    score: z.score,
                    areaPercent: z.areaPercent, // Added
                    status: z.status,
                    remark: z.remark,
                })),
                placedItems: state.placedItems.map(item => ({
                    id: item.id,
                    type: item.type,
                    zone: item.zone,
                    status: item.status,
                    reasoning: item.remedy?.reasoning,
                    fix: item.remedy?.fix,
                })),
                sectorOverlaps: state.sectorOverlaps, // Added for the graph
                deviationCount: state.deviationCount,
                summary: state.analysisSummary,
            },
            generatedAt: new Date().toLocaleString(),
            canvasImageUrl,
            canvasImageAspect,
        });
    }, [state]);

    // ── JSON Export ──
    const handleExportJSON = useCallback(() => {
        if (!isPhaseAtLeast(state.phase, Phase.ANALYZED)) return;
        const data = {
            phase: state.phase,
            polygon: state.polygon,
            centroid: state.centroid,
            rotation: state.rotation,
            scaleRatio: state.scaleRatio,
            polygonArea: state.polygonArea,
            sectorOverlaps: state.sectorOverlaps.map(o => ({
                direction: o.direction,
                clippedArea: o.clippedArea,
                percentOfTotal: o.percentOfTotal,
                idealPercent: o.idealPercent,
                deviationPercent: o.deviationPercent,
            })),
            zoneResults: state.zoneResults,
            overallScore: state.overallScore,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VastuFlow_Analysis_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [state]);

    // ── Map Builder → Analysis bridge ──
    const handleMapAnalyze = useCallback((
        polygon: { x: number; y: number }[],
        walls: MapWall[],
        furniture: MapFurniture[],
        texts: MapText[]
    ) => {
        if (polygon.length < 3) return;

        // Normalize polygon from MapBuilder's raw SVG pixel coords
        // into CanvasArea's 840×800 viewBox coordinate space.
        const CANVAS_W = 840;
        const CANVAS_H = 800;
        const PADDING = 60; // padding on each side

        const xs = polygon.map(p => p.x);
        const ys = polygon.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const polyW = maxX - minX || 1;
        const polyH = maxY - minY || 1;

        const availW = CANVAS_W - PADDING * 2;
        const availH = CANVAS_H - PADDING * 2;

        // Scale uniformly to fit, preserving aspect ratio
        const scale = Math.min(availW / polyW, availH / polyH);

        const scaledW = polyW * scale;
        const scaledH = polyH * scale;
        const offsetX = PADDING + (availW - scaledW) / 2;
        const offsetY = PADDING + (availH - scaledH) / 2;

        const transformX = (x: number) => (x - minX) * scale + offsetX;
        const transformY = (y: number) => (y - minY) * scale + offsetY;

        const normalized = polygon.map(p => ({
            x: transformX(p.x),
            y: transformY(p.y),
        }));

        const normWalls = walls.map(w => ({
            ...w,
            x1: transformX(w.x1),
            y1: transformY(w.y1),
            x2: transformX(w.x2),
            y2: transformY(w.y2),
            thickness: w.thickness * scale
        }));

        const normFurn = furniture.map(f => ({
            ...f,
            x: transformX(f.x),
            y: transformY(f.y),
            w: f.w * scale,
            h: f.h * scale
        }));

        const normTexts = texts.map(t => ({
            ...t,
            x: transformX(t.x),
            y: transformY(t.y),
            fontSize: t.fontSize * scale
        }));

        // Feed normalized polygon and map data into the analysis pipeline
        normalized.forEach((pt, i) => {
            if (i === 0) {
                dispatch({ type: "SKIP_TO_TRACE", walls: normWalls, furniture: normFurn, texts: normTexts });
            }
            dispatch({ type: "ADD_VERTEX", point: pt });
        });
        dispatch({ type: "CLOSE_POLYGON" });
        setMode("analysis");
    }, []);

    // ═════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════

    // Mode: Map Builder
    if (mode === "map-builder") {
        return (
            <MapBuilder
                onExit={() => setMode("select")}
                onAnalyze={handleMapAnalyze}
            />
        );
    }

    // Mode: Select (landing)
    if (mode === "select") {
        return (
            <div className="mode-selector-overlay">
                {/* Vastu Mandala Background Accent */}
                <svg className="vastu-bg-mandala" viewBox="0 0 100 100" fill="none" stroke="var(--accent-gold)" strokeWidth="0.5">
                    <circle cx="50" cy="50" r="48" />
                    <circle cx="50" cy="50" r="38" />
                    <rect x="15" y="15" width="70" height="70" transform="rotate(45 50 50)" />
                    <rect x="15" y="15" width="70" height="70" />
                    <circle cx="50" cy="50" r="12" />
                    <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" strokeDasharray="1 2" />
                </svg>

                <div className="mode-selector-content">
                    <div style={{ textAlign: "center" }}>
                        <h1 className="mode-selector-title">
                            VastuFlow
                        </h1>
                        <p className="mode-selector-subtitle">
                            Choose how you&apos;d like to start
                        </p>
                    </div>

                    <div className="mode-selector">
                        <div className="mode-card" onClick={() => setMode("analysis")}>
                            <div className="mode-icon">📊</div>
                            <h3>Start Analysis</h3>
                            <p>
                                Upload an existing floor plan image.<br />
                                Trace the building outline and run<br />
                                Vastu analysis with scoring & remedies.
                            </p>
                        </div>

                        <div className="mode-card" onClick={() => setMode("map-builder")}>
                            <div className="mode-icon">✏️</div>
                            <h3>Create Map</h3>
                            <p>
                                Draw walls from scratch with precise<br />
                                measurements in feet. Add rooms,<br />
                                furniture & objects. Then analyze.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Mode: Analysis (existing flow)
    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                style={{ display: "none" }}
                onChange={handleFileInputChange}
            />

            <StepBar phase={state.phase} />
            <div className="workspace">
                <ToolPanel
                    state={state}
                    dispatch={dispatch}
                    onFileSelect={handleFileSelect}
                    onFileDrop={handleFileDrop}
                />
                <CanvasArea
                    state={state}
                    dispatch={dispatch}
                    onCanvasClick={handleCanvasClick}
                />
                <AnalysisPanel
                    state={state}
                    dispatch={dispatch}
                    onDownloadReport={handleDownloadReport}
                    onExportJSON={handleExportJSON}
                />
            </div>
        </div>
    );
}
