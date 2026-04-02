import jsPDF from "jspdf";
import { VastuDirection, SectorOverlap } from "@/core/geometry/types";

export interface ReportFloorPlan {
    name: string;
    type: string;
    location: string;
    fileName: string;
    fileSize: string;
    imageUrl: string | null;
    clientName: string;
    consultantName: string;
}

export interface ReportEvaluation {
    direction: VastuDirection;
    roomType: string;
    roomLabel: string;
    score: number;
    areaPercent: number;
    status: "good" | "moderate" | "critical";
    remark: string;
}

export interface ReportPlacedItem {
    id: string;
    type: string;
    customName?: string;
    zone: string;
    devta?: string;
    status: "best" | "good" | "bad" | "worst";
    reasoning?: string;
    fix?: string;
}

export interface ReportAnalysis {
    overallScore: number;
    evaluations: ReportEvaluation[];
    placedItems: ReportPlacedItem[];
    sectorOverlaps: SectorOverlap[];
    deviationCount: number;
    summary: string;
    zoneResults?: Array<{ direction: string; areaReal: number }>;
    devtaAreas?: Array<{ name: string; type: string; areaReal: number }>;
}

export interface ReportData {
    floorPlan: ReportFloorPlan;
    analysis: ReportAnalysis;
    generatedAt: string;
    svgElement: SVGSVGElement;
}

// Helper to convert SVG to a high-res data URL, toggling layer visibility
async function svgToImage(originalSvg: SVGSVGElement, visibleLayers: string[]): Promise<string> {
    const clone = originalSvg.cloneNode(true) as SVGSVGElement;
    
    // Default config to hide things not specifically requested
    const allLayers = [
        "bg-image-layer", "trace-layer", "map-walls-layer", "map-furniture-layer", 
        "map-texts-layer", "shakti-chakra-layer", "marma-layer", "zone-fills-layer", "devtas-layer",
        "placed-items"
    ];

    allLayers.forEach(layerClass => {
        const els = clone.getElementsByClassName(layerClass);
        for (let i = 0; i < els.length; i++) {
            (els[i] as SVGElement).style.visibility = visibleLayers.includes(layerClass) ? "visible" : "hidden";
            // Disable animations for static capture
            (els[i] as SVGElement).style.transition = "none";
        }
    });

    // Extract viewBox to know native dimensions
    let w = 800, h = 800;
    if (clone.viewBox.baseVal) {
        w = clone.viewBox.baseVal.width || 800;
        h = clone.viewBox.baseVal.height || 800;
    }

    // Force style on trace layer if we want walls but no background
    if (visibleLayers.includes("trace-layer") || visibleLayers.includes("map-walls-layer")) {
        // Change white stroke to dark for print if needed, though they are already #1C1A15
        const lines = clone.querySelectorAll('.map-walls-layer line');
        lines.forEach(l => {
            const stroke = l.getAttribute('stroke');
            if (stroke === '#FFF' || stroke === '#ffffff') {
               l.setAttribute('stroke', '#000000');
            }
        });
    }

    // Force zone opacity to 100% and show all for ZONE layer
    if (visibleLayers.includes("zone-fills-layer")) {
        const polys = clone.querySelectorAll('.zone-fills-layer polygon');
        polys.forEach(p => {
            p.setAttribute('opacity', '0.6'); // Match UI active opacity
            p.setAttribute('stroke-opacity', '1');
        });
    }

    // Inject required CSS variables into the SVG so that styles using var(--xxx) resolve in the rasterized Image.
    const styleDef = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleDef.textContent = `
        :root {
            --base: #FAFAF8;
            --surface: #FFFFFF;
            --surface-2: #F5F4F0;
            --surface-3: #EEECEA;
            --border: #E2DFD8;
            --border-bright: #CCC9BF;
            --text-primary: #1C1A15;
            --text-secondary: #7A7567;
            --text-tertiary: #B0AB9E;
            --accent-gold: #B8860B;
            --accent-gold-light: #D4A017;
            --accent-gold-pale: #FDF5E0;
            --signal: #C49A0A;
            --signal-bg: #FEF9E7;
            --good: #3D7A4F;
            --good-soft: #4CAF50;
            --good-bg: #EBF5EE;
            --warning: #B87333;
            --warning-bg: #FDF3E7;
            --critical: #A83232;
            --critical-bg: #FCEAEA;
        }
        
        /* High-Visibility Print Overrides */
        text {
            font-family: 'Inter', 'system-ui', 'Arial', sans-serif !important;
            shape-rendering: geometricPrecision !important;
            text-rendering: optimizeLegibility !important;
        }

        /* FULL-PAGE Devta analysis (p.7) - Focus on main names */
        .devtas-layer text {
            fill: #000 !important;
            stroke: #FFFFFF !important;
            stroke-width: 0.6px !important;
            paint-order: stroke fill !important;
        }
        /* The main Devta name (first line) */
        .devtas-layer text tspan:first-child {
            font-size: 18px !important;
            font-weight: 900 !important;
        }
        /* The subtext details (other lines) - make them thin and small */
        .devtas-layer text tspan:not(:first-child) {
            font-size: 10px !important;
            font-weight: 500 !important;
            fill: #444 !important;
            stroke: none !important;
        }

        /* Clean, lighter labels for the Shakti Chakra ring (p.2,3,4,5,6) */
        .shakti-chakra-layer #zoneLabels text {
            font-size: 12px !important;
            font-weight: 500 !important;
            fill: #111 !important;
            stroke: none !important;
        }

        /* Shakti Chakra main labels - keep them clear but readable, not oversized */
        .shakti-chakra-layer #dirLabels text {
            font-size: 14px !important;
            font-weight: 700 !important;
            stroke: none !important;
        }
        .shakti-chakra-layer #subDirLabels text {
            font-size: 9px !important;
        }
        .shakti-chakra-layer #degreeLabels text {
            font-size: 9px !important;
            font-weight: 500 !important;
        }

        /* Wall lines - slightly darker for print */
        .map-walls-layer line {
            stroke-opacity: 0.9 !important;
        }
    `;
    clone.insertBefore(styleDef, clone.firstChild);

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);
    // Add namespace if missing
    if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Wrap in blob
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // 4x scale for high-quality (300dpi+) printing
            const scale = 4;
            const canvas = document.createElement("canvas");
            
            // Safety cap: don't exceed 8000px to avoid memory issues
            canvas.width = Math.min(8000, w * scale);
            canvas.height = Math.min(8000, h * scale);
            
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Ensure high-quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // JPEG at 0.98 quality — virtually lossless text with 4x resolution
                resolve(canvas.toDataURL("image/jpeg", 0.98));
            } else {
                reject(new Error("Failed to get canvas context"));
            }
            URL.revokeObjectURL(url);
        };
        img.onerror = reject;
        img.src = url;
    });
}

export async function generateReport(data: ReportData): Promise<void> {
    const { floorPlan, analysis, generatedAt, svgElement } = data;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Page dimensions
    const W = 210;
    const H = 297;
    const margin = 12; // Base margin

    // Palette
    const COLOR_PRIMARY = [43, 27, 26]; // Dark Brown #2B1B1A
    const COLOR_ACCENT = [184, 146, 58]; // Gold #B8923A
    const COLOR_TEXT = [80, 75, 65]; 

    const generatePageBorder = (showFooter = true) => {
        // Outer dark border
        doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.setLineWidth(1.5);
        doc.rect(margin, margin, W - 2*margin, H - 2*margin);

        // Inner thin border
        doc.setLineWidth(0.3);
        doc.rect(margin + 2, margin + 2, W - 2*margin - 4, H - 2*margin - 4);
        
        if (showFooter) {
            // Footer separator
            doc.line(margin + 2, H - margin - 15, W - margin - 2, H - margin - 15);
            
            // Footer Text
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text(`Client: ${floorPlan.clientName}`, margin + 6, H - margin - 6);
            
            // Page Number
            doc.setFont("helvetica", "bold");
            const pageNum = doc.getNumberOfPages().toString().padStart(2, '0');
            doc.text(pageNum, W / 2, H - margin - 6, { align: "center" });

            // Consultant Name
            doc.setFont("helvetica", "normal");
            doc.text(floorPlan.consultantName, W - margin - 6, H - margin - 6, { align: "right" });
        }
    };

    const addHeader = (title: string, subtitle: string) => {
        doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.rect(margin + 2, margin + 2, W - 2*margin - 4, 30, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(title, margin + 10, margin + 18);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
        doc.text(subtitle, margin + 10, margin + 26);
    };

    // Calculate map dimensions
    let svgW = 800;
    let svgH = 800;
    if (svgElement.viewBox && svgElement.viewBox.baseVal && svgElement.viewBox.baseVal.width > 0) {
        svgW = svgElement.viewBox.baseVal.width;
        svgH = svgElement.viewBox.baseVal.height;
    }
    const mapAspect = svgH / svgW;

    const cw = margin + 6;  // tighter left padding → wider maps
    const cy = margin + 38; // top padding after header (closer to header)
    const mw = W - (cw * 2); // available width
    // Cap map height so it never overlaps the footer (footer starts at H-margin-18)
    const maxMh = H - cy - margin - 30; // 30mm breathing room for footer+text
    const mh = Math.min(mw * mapAspect, maxMh);

    // ==========================================
    // PAGE 1: COVER
    // ==========================================
    generatePageBorder(false); // No footer on cover

    // Decorate cover
    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(margin + 2, margin + 2, W - 2*margin - 4, H / 2 - margin, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("VASTU ANALYSIS", W / 2, H / 4, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text("COMPREHENSIVE REPORT", W / 2, H / 4 + 10, { align: "center" });

    // Client Info
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PREPARED FOR", W / 2, H / 2 + 30, { align: "center" });
    doc.setFontSize(18);
    doc.text(floorPlan.clientName.toUpperCase(), W / 2, H / 2 + 40, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(`${floorPlan.type} | ${floorPlan.location}`, W / 2, H / 2 + 46, { align: "center" });
    doc.text(`Date: ${generatedAt.split(' ')[0]}`, W / 2, H / 2 + 52, { align: "center" });

    // Consultant Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("PREPARED BY", W / 2, H - 60, { align: "center" });
    doc.setFontSize(14);
    doc.text(floorPlan.consultantName, W / 2, H - 52, { align: "center" });

    // ==========================================
    // PREPARE IMAGES
    // ==========================================
    // 1. Layout Map (Walls/Furniture/Text/Background)
    const imgLayout = await svgToImage(svgElement, ["bg-image-layer", "trace-layer", "map-walls-layer", "map-furniture-layer", "map-texts-layer", "placed-items"]);
    // 2. Shakti Chakra Map (Walls + Chakra + Text/Furniture based on user feedback)
    const imgChakra = await svgToImage(svgElement, ["map-walls-layer", "map-furniture-layer", "map-texts-layer", "shakti-chakra-layer", "placed-items"]);
    // 3. Zones Map (Walls + Zones)
    const imgZones = await svgToImage(svgElement, ["map-walls-layer", "zone-fills-layer", "shakti-chakra-layer", "placed-items"]); 
    // 4. Marma Points Map
    const imgMarma = await svgToImage(svgElement, ["map-walls-layer", "map-furniture-layer", "map-texts-layer", "shakti-chakra-layer", "marma-layer", "placed-items"]);
    // 5. Devtas Map
    const imgDevtas = await svgToImage(svgElement, ["map-walls-layer", "devtas-layer", "placed-items"]);

    // ==========================================
    // PAGE 2: LAYOUT CENTER
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("LAYOUT CENTER", "Floor Plan & Architectural Layout");
    
    // Background frame for map
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.rect(cw - 2, cy - 2, mw + 4, mh + 4);
    
    doc.addImage(imgLayout, "JPEG", cw, cy, mw, mh);

    // Compact one-line summary below map
    if (cy + mh + 12 < H - margin - 20) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        const summaryLine = doc.splitTextToSize(analysis.summary || "Floor plan layout.", W - 2*margin - 12);
        doc.text(summaryLine[0], margin + 6, cy + mh + 10);
    }

    // ==========================================
    // PAGE 3: SHAKTI CHAKRA
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("SHAKTI CHAKRA", "16 Vastu Zones overlay on layout");

    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.rect(cw - 2, cy - 2, mw + 4, mh + 4);
    
    doc.setFillColor(250, 248, 245);
    doc.rect(cw, cy, mw, mh, "F");
    doc.addImage(imgChakra, "JPEG", cw, cy, mw, mh);

    if (cy + mh + 10 < H - margin - 20) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.text("16 directional energy zones — Shakti Chakra overlay on floor plan.", margin + 6, cy + mh + 10);
    }

    // ==========================================
    // PAGE 4: MARMA POINTS
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("MARMA ANALYSIS", "Vital Energy Intersections (Maha Marma)");

    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.rect(cw - 2, cy - 2, mw + 4, mh + 4);
    
    doc.setFillColor(250, 248, 245);
    doc.rect(cw, cy, mw, mh, "F");
    doc.addImage(imgMarma, "JPEG", cw, cy, mw, mh);

    if (cy + mh + 10 < H - margin - 20) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.text("Vital energy nodes — keep free of heavy structures & pillars.", margin + 6, cy + mh + 10);
    }

    // ==========================================
    // PAGE 5: MARMA POINTS TABLE
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("MARMA IDENTIFICATION", "Detailed Body Mapping & Zones");

    const marmaTableData = [
        { p1: "1", b1: "Head Top (Sir)", z1: "NE", p2: "8L, 7L", b2: "Left Lung", z2: "NNW, NNE", p3: "10RT", b3: "Right Thigh", z3: "SSE" },
        { p1: "2", b1: "Third Eye (Ajna)", z1: "NE", p2: "8R, 7R", b2: "Right Lung", z2: "ESE, E", p3: "10LN", b3: "Left Knee", z3: "NW" },
        { p1: "2L", b1: "Side Temple (L)", z1: "NNE", p2: "8LW", b2: "Left Wrist", z2: "NNW", p3: "10RN", b3: "Right Knee", z3: "SSE" },
        { p1: "2R", b1: "Side Temple (R)", z1: "ENE", p2: "8RW", b2: "Right Wrist", z2: "ESE", p3: "11, 12", b3: "Reproductive", z3: "SW" },
        { p1: "3", b1: "Medula", z1: "NE", p2: "9", b2: "Navel (Nabhi)", z2: "Brahmbindu", p3: "13", b3: "Excretory", z3: "SW" },
        { p1: "3L", b1: "Left Ear", z1: "NNE", p2: "9L, 9R", b2: "Waist/Side", z2: "NW, SE", p3: "14", b3: "Tail Bone", z3: "SW" },
        { p1: "3R", b1: "Right Ear", z1: "ENE", p2: "9LE", b2: "Left Elbow", z2: "NW", p3: "15", b3: "Ankle Heel", z3: "SW" },
        { p1: "4", b1: "Neck (C1-C4)", z1: "NE", p2: "9RE", b2: "Right Elbow", z2: "SE", p3: "15R", b3: "Right Ankle", z3: "SSW" },
        { p1: "6, 5", b1: "Trachea (C5-C7)", z1: "NE", p2: "10", b2: "Bladder", z2: "SW", p3: "15L", b3: "Left Ankle", z3: "WSW" },
        { p1: "5L", b1: "Left Shoulder", z1: "NNE", p2: "10L", b2: "Left Kidney", z2: "W", p3: "16", b3: "Arch (Talva)", z3: "SW" },
        { p1: "5R", b1: "Right Shoulder", z1: "ENE", p2: "10R", b2: "Right Kidney", z2: "S", p3: "17", b3: "Toe (Angutha)", z3: "SW" },
        { p1: "8, 7", b1: "Heart", z1: "NE", p2: "10LT", b2: "Left Thigh", z2: "W", p3: "", b3: "", z3: "" }
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Marma Points Identification Table", W / 2, cy + 2, { align: "center" });

    let tY = cy + 10;
    const tGroupW = (W - 2 * margin - 10) / 3;
    
    // Header
    doc.setFillColor(245, 247, 250);
    doc.rect(margin + 2, tY, W - 2*margin - 4, 10, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

    for (let g = 0; g < 3; g++) {
        const oX = margin + 5 + g * tGroupW;
        doc.text("Point", oX, tY + 6);
        doc.text("Body Part / Organ", oX + 11, tY + 6);
        doc.text("Zones", oX + tGroupW - 14, tY + 6);
    }
    tY += 12;

    doc.setFont("helvetica", "normal");
    marmaTableData.forEach((row, i) => {
        if (i % 2 === 0) {
            doc.setFillColor(252, 253, 255);
            doc.rect(margin + 2, tY - 3, W - 2*margin - 4, 8, "F");
        }

        const drawCol = (oX: number, p: string, b: string, z: string) => {
            doc.setFont("helvetica", "bold");
            doc.text(p, oX, tY + 2);
            doc.setFont("helvetica", "normal");
            doc.text(b, oX + 11, tY + 2);
            doc.text(z, oX + tGroupW - 14, tY + 2);
        };

        drawCol(margin + 5, row.p1, row.b1, row.z1);
        drawCol(margin + 5 + tGroupW, row.p2, row.b2, row.z2);
        drawCol(margin + 5 + 2*tGroupW, row.p3, row.b3, row.z3);

        tY += 8;
    });


    // ==========================================
    // PAGE 6: ZONE ANALYSIS
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("ZONE ANALYSIS", "Spatial Distribution & Area Strengths");

    // Full-width map — use the same mw/mh as other map pages
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setFillColor(250, 248, 245);
    doc.rect(cw - 2, cy - 2, mw + 4, mh + 4, "FD");
    doc.addImage(imgZones, "JPEG", cw, cy, mw, mh);

    if (cy + mh + 10 < H - margin - 20) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.text("16 Vastu zones — proportional area distribution across the property.", margin + 6, cy + mh + 10);
    }

    // ==========================================
    // PAGE 7: DEVTA ANALYSIS — full-page map, no bar chart
    // ==========================================
    if (analysis.devtaAreas && analysis.devtaAreas.length > 0) {
        doc.addPage();
        generatePageBorder();
        addHeader("DEVTA ANALYSIS", "32 Outer Devta Energy Fields");

        // Use full available width & smart height cap same as other pages
        doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
        doc.setFillColor(250, 248, 245);
        doc.rect(cw - 2, cy - 2, mw + 4, mh + 4, "FD");
        doc.addImage(imgDevtas, "JPEG", cw, cy, mw, mh);

        if (cy + mh + 10 < H - margin - 20) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text("32 outer Devta energy fields — Vastu Purusha Mandala mapped on floor plan.", margin + 6, cy + mh + 10);
        }
    }

    // ==========================================
    // PAGE 8: PLACEMENT & REMEDIES
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("OBJECT PLACEMENT", "Activities, Utilities & Remedies");

    let placementY = cy;

    const drawTableHeader = (y: number) => {
        doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.rect(margin + 2, y, W - 2*margin - 4, 10, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("OBJECT / ACTIVITY", margin + 6, y + 6);
        doc.text("ZONE", margin + 50, y + 6);
        doc.text("DETAILS & REMEDY", margin + 80, y + 6);
        return y + 10;
    };

    placementY = drawTableHeader(placementY);

    analysis.placedItems.forEach((item, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(250, 248, 245);
        } else {
            doc.setFillColor(255, 255, 255);
        }
        
        const c1X = margin + 6;
        const c2X = margin + 50;
        const c3X = margin + 80;
        const maxTextW = W - margin - c3X - 6;

        let remarkText = `STATUS: ${item.status.toUpperCase()}`;
        if (item.reasoning) remarkText += `\nREASONING: ${item.reasoning}`;
        if (item.fix) remarkText += `\nREMEDY: ${item.fix}`;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const splitRemark = doc.splitTextToSize(remarkText, maxTextW);
        
        // Calculate required row height based on text lines
        const rowH = Math.max(15, splitRemark.length * 4.5 + 6);

        // Check page overflow heavily guarded against intersecting footer
        if (placementY + rowH > H - margin - 20) {
            doc.addPage();
            generatePageBorder();
            placementY = margin + 20; // reset y
            placementY = drawTableHeader(placementY);
            
            // Reapply alternating bg for new page top row
            if (index % 2 === 0) doc.setFillColor(250, 248, 245);
            else doc.setFillColor(255, 255, 255);
        }

        doc.rect(margin + 2, placementY, W - 2*margin - 4, rowH, "F");

        // Object
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        
        // Wrap object name if it's too long
        const splitObjName = doc.splitTextToSize(item.customName || item.type, c2X - c1X - 2);
        doc.text(splitObjName, c1X, placementY + 8);

        // Zone
        doc.setFont("helvetica", "bold");
        const statusColor = (item.status === "best" || item.status === "good") ? [61, 122, 79] : [168, 50, 50];
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(item.zone, c2X, placementY + 8);

        // Description
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.text(splitRemark, c3X, placementY + 8);

        placementY += rowH;
        
        // Line separator
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(margin + 2, placementY, W - margin - 2, placementY);
    });

    // Save
    doc.save(`VastuFlow_${floorPlan.name.replace(/\s+/g, "_")}_Report.pdf`);
}


