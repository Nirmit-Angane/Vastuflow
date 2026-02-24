// ═══════════════════════════════════════════════════════
// L3 — PDF Report Generator (Deterministic)
// Pure data → PDF. No UI, no side effects.
// ═══════════════════════════════════════════════════════

import jsPDF from "jspdf";

export interface ReportFloorPlan {
    name: string;
    type: string;
    location: string;
    fileName: string;
    fileSize: string;
    imageUrl: string | null;
}

export interface ReportEvaluation {
    direction: string;
    roomType: string;
    roomLabel: string;
    score: number;
    status: "good" | "moderate" | "critical";
    remark: string;
}

export interface ReportAnalysis {
    overallScore: number;
    evaluations: ReportEvaluation[];
    deviationCount: number;
    summary: string;
}

export interface ReportData {
    floorPlan: ReportFloorPlan;
    analysis: ReportAnalysis;
    generatedAt: string;
}

export function generateReport(data: ReportData): void {
    const { floorPlan, analysis, generatedAt } = data;
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
    const lines = doc.splitTextToSize(analysis.summary, W - 40);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 8;

    // ── Zone Analysis Table ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 26, 21);
    doc.text("Zone Analysis", 20, y);
    y += 8;

    doc.setFillColor(238, 236, 234);
    doc.rect(20, y, W - 40, 7, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(122, 117, 103);
    doc.text("DIR", 24, y + 5);
    doc.text("AREA %", 48, y + 5);
    doc.text("SCORE", 100, y + 5);
    doc.text("STATUS", 130, y + 5);
    y += 9;

    doc.setFont("helvetica", "normal");
    analysis.evaluations.forEach((ev) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(28, 26, 21);
        doc.text(ev.direction, 24, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(122, 117, 103);
        doc.text(ev.roomLabel, 48, y + 4);
        if (ev.status === "good") doc.setTextColor(61, 122, 79);
        else if (ev.status === "moderate") doc.setTextColor(184, 115, 51);
        else doc.setTextColor(168, 50, 50);
        doc.text(ev.score.toFixed(1), 100, y + 4);
        const statusLabel = ev.status === "good" ? "Good" : ev.status === "moderate" ? "Moderate" : "Critical";
        doc.text(statusLabel, 130, y + 4);
        y += 7;
        doc.setDrawColor(226, 223, 216);
        doc.line(20, y, W - 20, y);
        y += 1;
    });

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
