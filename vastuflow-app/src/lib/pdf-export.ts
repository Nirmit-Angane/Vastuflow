import jsPDF from "jspdf";
import { VastuDirection, SectorOverlap } from "@/core/geometry/types";

export interface ReportFloorPlan {
    name: string;
    type: string;
    location: string;
    fileName: string;
    fileSize: string;
    imageUrl: string | null;
}

export interface ReportEvaluation {
    direction: VastuDirection;
    roomType: string;
    roomLabel: string;
    score: number;
    areaPercent: number; // Added for the table
    status: "good" | "moderate" | "critical";
    remark: string;
}

export interface ReportPlacedItem {
    id: string;
    type: string;
    zone: string;
    devta?: string;
    status: "best" | "good" | "bad" | "worst";
    reasoning?: string;
    fix?: string;
}

export interface ReportAnalysis {
    overallScore: number;
    evaluations: ReportEvaluation[];
    placedItems: ReportPlacedItem[]; // Added for placement status
    sectorOverlaps: SectorOverlap[]; // Added for the graph
    deviationCount: number;
    summary: string;
}

export interface ReportData {
    floorPlan: ReportFloorPlan;
    analysis: ReportAnalysis;
    generatedAt: string;
    canvasImageUrl?: string | null;
}

export function generateReport(data: ReportData): void {
    const { floorPlan, analysis, generatedAt, canvasImageUrl } = data;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    let y = 20;

    // ── Header ──
    doc.setFillColor(28, 26, 21);
    doc.rect(0, 0, W, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(250, 250, 248);
    doc.text("VastuFlow", 20, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(176, 171, 158);
    doc.text("Geometric Vastu Analysis Report", 20, 24);
    doc.text(`Generated: ${generatedAt}`, 20, 30);
    y = 48;

    // ── Project Info ──
    doc.setFontSize(14);
    doc.setTextColor(28, 26, 21);
    doc.setFont("helvetica", "bold");
    doc.text(floorPlan.name, 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(122, 117, 103);
    doc.setFont("helvetica", "normal");
    doc.text(`${floorPlan.type} · ${floorPlan.location}`, 20, y);
    y += 12;

    // ── Overall Score ──
    doc.setFillColor(253, 245, 224);
    doc.roundedRect(20, y, W - 40, 28, 4, 4, "F");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(184, 134, 11);
    doc.text(`${analysis.overallScore}`, 34, y + 18);
    doc.setFontSize(10);
    doc.setTextColor(28, 26, 21);
    doc.text("/100  Geometric Balance Score", 52, y + 18);
    doc.setFontSize(8);
    doc.setTextColor(122, 117, 103);
    doc.text(`${analysis.deviationCount} deviations detected`, 34, y + 24);
    y += 36;

    // ── Summary ──
    doc.setFontSize(9);
    doc.setTextColor(28, 26, 21);
    doc.setFont("helvetica", "italic");
    const summaryLines = doc.splitTextToSize(analysis.summary, W - 40);
    doc.text(summaryLines, 20, y);
    y += summaryLines.length * 5 + 10;

    // ── Canvas Map (floor plan + Shakti Chakra) ──
    if (canvasImageUrl) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(28, 26, 21);
        doc.text("Floor Plan Layout & Vastu Zone Map", 20, y);
        y += 6;

        const mapW = W - 40;
        const mapH = Math.round(mapW * (800 / 840));

        if (y + mapH > 270) { doc.addPage(); y = 20; }

        doc.setDrawColor(226, 223, 216);
        doc.setLineWidth(0.4);
        doc.rect(20, y, mapW, mapH);
        doc.addImage(canvasImageUrl, "PNG", 20, y, mapW, mapH);
        y += mapH + 15;
    }

    // ── Geometric Balance Analysis Table ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 26, 21);
    doc.text("Geometric Balance Analysis", 20, y);
    y += 8;

    doc.setFillColor(238, 236, 234);
    doc.rect(20, y, W - 40, 7, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(122, 117, 103);
    doc.text("DIR", 24, y + 5);
    doc.text("AREA %", 50, y + 5);
    doc.text("SCORE", 110, y + 5);
    doc.text("STATUS", 150, y + 5);
    y += 9;

    doc.setFont("helvetica", "normal");
    analysis.evaluations.forEach((ev) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(28, 26, 21);
        doc.text(ev.direction, 24, y + 4);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(122, 117, 103);
        doc.text(`${ev.areaPercent.toFixed(1)}%`, 50, y + 4);

        doc.text(ev.score.toFixed(1), 110, y + 4);

        if (ev.status === "good") doc.setTextColor(61, 122, 79);
        else if (ev.status === "moderate") doc.setTextColor(184, 115, 51);
        else doc.setTextColor(168, 50, 50);

        const statusLabel = ev.status.toUpperCase();
        doc.text(statusLabel, 150, y + 4);

        y += 7;
        doc.setDrawColor(226, 223, 216);
        doc.line(20, y, W - 20, y);
        y += 1;
    });
    y += 10;

    // ── Visual Graph Section (Image 4) ──
    if (y + 60 > 280) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 26, 21);
    doc.text("Spatial Distribution Visualization", 20, y);
    y += 10;

    const graphX = 30;
    const graphY = y + 40;
    const graphW = 150;
    const graphH = 40;

    // Draw Axis
    doc.setDrawColor(200, 200, 200);
    doc.line(graphX, graphY, graphX + graphW, graphY); // X axis
    doc.line(graphX, graphY, graphX, graphY - graphH); // Y axis

    // Draw Bars
    const barW = graphW / analysis.sectorOverlaps.length - 2;
    let maxArea = Math.max(...analysis.sectorOverlaps.map(s => s.percentOfTotal));
    if (maxArea < 10) maxArea = 10; // min scale

    analysis.sectorOverlaps.forEach((ov, i) => {
        const h = (ov.percentOfTotal / maxArea) * graphH;
        const bx = graphX + i * (barW + 2) + 1;
        const by = graphY - h;

        // Use directional colors simplified if possible or just standard
        doc.setFillColor(74, 144, 217); // Blue default
        doc.rect(bx, by, barW, h, "F");

        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        doc.text(ov.direction, bx + barW / 2, graphY + 3, { angle: 45 });
    });
    y += 60;

    // ── Vastu Placement Status (Image 2) ──
    if (analysis.placedItems.length > 0) {
        if (y + 40 > 270) { doc.addPage(); y = 20; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(28, 26, 21);
        doc.text("Vastu Placement Status", 20, y);
        y += 8;

        analysis.placedItems.forEach((item) => {
            const rowH = (item.reasoning || item.fix) ? 35 : 12;
            if (y + rowH > 280) { doc.addPage(); y = 20; }

            doc.setFillColor(250, 249, 246);
            doc.roundedRect(20, y, W - 40, rowH - 2, 2, 2, "F");

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(28, 26, 21);
            doc.text(item.type, 25, y + 6);

            const statusColor = (item.status === "best" || item.status === "good") ? [61, 122, 79] : [168, 50, 50];
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.setFontSize(8);
            doc.text(`${item.zone} · ${item.status.toUpperCase()}`, 150, y + 6);

            if (item.reasoning) {
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(184, 134, 11);
                doc.text("REASONING:", 25, y + 12);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(80, 75, 65);
                const lines = doc.splitTextToSize(item.reasoning, W - 60);
                doc.text(lines, 25, y + 16);
            }

            if (item.fix) {
                const fixY = y + 24;
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(61, 122, 79);
                doc.text("FIX / REMEDY:", 25, fixY);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(80, 75, 65);
                const lines = doc.splitTextToSize(item.fix, W - 60);
                doc.text(lines, 25, fixY + 4);
            }

            y += rowH;
        });
    }

    // ── Footer ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(176, 171, 158);
        doc.text("VastuFlow · Deterministic Geometric Analysis", 20, 290);
        doc.text(`Page ${i} of ${pageCount}`, W - 40, 290);
    }

    doc.save(`VastuFlow_${floorPlan.name.replace(/\s+/g, "_")}_Report.pdf`);
}
