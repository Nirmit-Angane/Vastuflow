"use client";

import { useReducer, useCallback, useRef } from "react";
import { createEmptyProject, projectReducer, ProjectAction } from "@/state/project-state";
import { Phase, isPhaseAtLeast } from "@/state/phase";
import { generateReport } from "@/lib/pdf-export";
import StepBar from "@/components/StepBar";
import ToolPanel from "@/components/ToolPanel";
import CanvasArea from "@/components/CanvasArea";
import AnalysisPanel from "@/components/AnalysisPanel";
import "./workspace.css";

export default function WorkspacePage() {
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
            const url = URL.createObjectURL(file);
            dispatch({ type: "LOAD_IMAGE", url, name: file.name, size: sizeMB });
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
    const handleDownloadReport = useCallback(() => {
        if (!isPhaseAtLeast(state.phase, Phase.ANALYZED)) return;
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
                    status: z.status,
                    remark: z.remark,
                })),
                deviationCount: state.deviationCount,
                summary: state.analysisSummary,
            },
            generatedAt: new Date().toLocaleString(),
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
                    onCanvasClick={handleCanvasClick}
                />
                <AnalysisPanel
                    state={state}
                    onDownloadReport={handleDownloadReport}
                    onExportJSON={handleExportJSON}
                />
            </div>
        </div>
    );
}
