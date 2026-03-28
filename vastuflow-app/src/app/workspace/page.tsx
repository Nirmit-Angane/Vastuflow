"use client";

import { useReducer, useCallback, useRef, useState } from "react";
import { createEmptyProject, projectReducer } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { generateReport } from "@/lib/pdf-export";
import { computePolygonArea } from "@/core/geometry/polygon";
import StepBar from "@/components/StepBar";
import ToolPanel from "@/components/ToolPanel";
import CanvasArea from "@/components/CanvasArea";
import AnalysisPanel from "@/components/AnalysisPanel";
import ProjectInfoModal from "@/components/ProjectInfoModal";
import MapBuilder, { MapFurniture, MapText, MapWall } from "@/components/map-builder/MapBuilder";
import "./workspace.css";

type WorkspaceMode = "select" | "analysis" | "map-builder";

export default function WorkspacePage() {
    const [mode, setMode] = useState<WorkspaceMode>("select");
    const [state, dispatch] = useReducer(projectReducer, undefined, createEmptyProject);
    const [showProjectModal, setShowProjectModal] = useState(false);
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
                setShowProjectModal(true);
            } catch (err) {
                console.error("PDF conversion failed:", err);
                alert("Failed to load PDF. Please try a different file or export as PNG.");
            }
        } else {
            // Direct image
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result;
                if (url) {
                    dispatch({ type: "LOAD_IMAGE", url: url as string, name: file.name, size: sizeMB });
                    setShowProjectModal(true);
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

        const svgEl = document.querySelector<SVGSVGElement>(".canvas-area svg");
        if (!svgEl) {
            console.warn("Could not find SVG element to generate report.");
            return;
        }

        try {
            await generateReport({
                floorPlan: {
                    name: state.projectInfo.clientName || state.imageName || "Untitled Project",
                    type: state.projectInfo.propertyType,
                    location: state.projectInfo.address || "—",
                    fileName: state.imageName || "project",
                    fileSize: state.imageSize || "—",
                    imageUrl: state.image,
                    clientName: state.projectInfo.clientName || state.imageName || "Project",
                    consultantName: state.projectInfo.consultantName,
                },
                analysis: {
                    overallScore: state.overallScore,
                    evaluations: state.zoneResults.map(z => ({
                        direction: z.direction,
                        roomType: "other" as const,
                        roomLabel: `${z.direction} Zone`,
                        score: z.score,
                        areaPercent: z.areaPercent,
                        status: z.status,
                        remark: z.remark,
                    })),
                    placedItems: state.placedItems.map(item => ({
                        id: item.id,
                        type: item.type,
                        customName: item.customName,
                        zone: item.zone,
                        status: item.status,
                        reasoning: item.remedy?.reasoning,
                        fix: item.remedy?.fix,
                    })),
                    sectorOverlaps: state.sectorOverlaps,
                    deviationCount: state.deviationCount,
                    summary: state.analysisSummary,
                    devtaAreas: state.devtaZones
                        .filter(dz => dz.type === 'outer')
                        .map(dz => {
                            // Quick import inside or use full module path: we should've imported it. Let me just use the imported one.
                            const areaPx = dz.polygons.reduce((acc, p) => acc + computePolygonArea(p), 0);
                            return {
                                name: dz.devta,
                                type: dz.type,
                                areaReal: areaPx * (state.scaleRatio * state.scaleRatio)
                            };
                        }),
                },
                generatedAt: new Date().toLocaleString(),
                svgElement: svgEl,
            });
        } catch (err) {
            console.error("Failed to generate PDF report:", err);
            alert("Failed to generate PDF report. Please check the console for details.");
        }
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
                    onStartTracing={() => {
                        dispatch({ type: "START_TRACING" });
                        setShowProjectModal(true);
                    }}
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

            <ProjectInfoModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                onSave={(info) => dispatch({ type: "SET_PROJECT_INFO", info })}
                currentInfo={state.projectInfo}
            />
        </div>
    );
}
