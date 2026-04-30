import jsPDF from "jspdf";
import { VastuDirection, SectorOverlap, DIRECTION_COLORS } from "@/core/geometry/types";

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
    const COLOR_PRIMARY = [74, 14, 14]; // Maroon #4A0E0E
    const COLOR_ACCENT = [184, 146, 58]; // Gold #B8923A
    const COLOR_TEXT = [50, 50, 50]; 
    const COLOR_HEADER_BG = [242, 242, 242]; // Light grey

    const generatePageBorder = (showFooter = true) => {
        if (showFooter) {
            const footerY = H - margin - 15;
            
            // Footer separator
            doc.setDrawColor(220, 220, 220); // Very light grey
            doc.setLineWidth(0.2);
            doc.line(margin + 5, footerY, W - margin - 5, footerY); // Match visual lines 
            
            // Footer Text & Values
            doc.setFont("helvetica", "bold"); 
            doc.setFontSize(8);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            
            const truncateText = (text: string, maxW: number) => {
                if (doc.getTextWidth(text) <= maxW) return text;
                let t = text;
                while (t.length > 0 && doc.getTextWidth(t + "...") > maxW) t = t.substring(0, t.length - 1);
                return t + "...";
            };

            const clientStr = `Client Name: ${floorPlan.clientName}`;
            doc.text(truncateText(clientStr, 75), margin + 5, footerY + 8);
            
            // Center Canvas (Compass and North Direction with degrees)
            // (Removed per request)

            // Consultant Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            const consultantStr = `Consultant Name: ${floorPlan.consultantName}`;
            doc.text(truncateText(consultantStr, 75), W - margin - 5, footerY + 8, { align: "right" });
        }
    };

    const addHeader = (title: string, subtitle: string) => {
        const headerY = margin + 15;
        
        // Separator line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, headerY + 5, W - margin - 5, headerY + 5);

        // Left
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(floorPlan.name.substring(0, 30), margin + 5, headerY);
        
        // Center
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(14);
        doc.text(title, W / 2, headerY, { align: "center" });
        
        // Right
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        
        const dateObj = new Date();
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        doc.text(dateStr, W - margin - 5, headerY, { align: "right" });
    };

    // Calculate map dimensions
    let svgW = 800;
    let svgH = 800;
    if (svgElement.viewBox && svgElement.viewBox.baseVal && svgElement.viewBox.baseVal.width > 0) {
        svgW = svgElement.viewBox.baseVal.width;
        svgH = svgElement.viewBox.baseVal.height;
    }
    const mapAspect = svgH / svgW;

    const cw = margin + 6;  
    const cy = margin + 24; // top padding after updated 16px header
    const mw = W - (cw * 2); 
    const maxMh = H - cy - margin - 30; // space for footer and charts
    const mh = Math.min(mw * mapAspect, maxMh);

    // ==========================================
    // PAGE 1: COVER
    // ==========================================
    generatePageBorder(false);

    // Cream background
    doc.setFillColor(252, 250, 245);
    doc.rect(margin + 2.1, margin + 2.1, W - 2*margin - 4.2, H - 2*margin - 4.2, "F");

    // ---- Decorative Double Border (Cover Page Only) ----
    const bm = margin + 2; // border margin from page edge

    // Outer border — thick maroon line
    doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setLineWidth(0.8);
    doc.rect(bm, bm, W - 2 * bm, H - 2 * bm, "S");

    // Inner border — thin maroon line, 4mm inset from outer
    const innerInset = 4;
    doc.setLineWidth(0.35);
    doc.rect(bm + innerInset, bm + innerInset, W - 2 * (bm + innerInset), H - 2 * (bm + innerInset), "S");
    // ---- End Decorative Border ----

    const cx = W / 2;
    const cy_cover = H / 2 - 10;

    // Main Titles
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    const clientName = floorPlan.clientName ? `${floorPlan.clientName.toUpperCase()}'S` : "CLIENT'S";
    doc.text(clientName, cx, cy_cover - 15, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(30, 40, 60); // Slate blue subtitle
    doc.text("VASTU ANALYSIS REPORT", cx, cy_cover + 8, { align: "center" });

    // Consultant Info Bottom Center
    const footerY = H - margin - 30;
    
    // Faint horizontal line above consultant
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(cx - 30, footerY - 5, cx + 30, footerY - 5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 60, 70); 
    doc.text("Prepared By", cx, footerY + 2, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(floorPlan.consultantName.toUpperCase(), cx, footerY + 10, { align: "center" });

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.text("VASTU, ASTROLOGY AND NUMEROLOGY CONSULTANT", cx, footerY + 15, { align: "center" });

    // North Compass Icon Bottom Right
    const compX = W - margin - 15;
    const compY = H - margin - 15;
    const cr = 6;
    
    // Compass Circle
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setLineWidth(0.3);
    doc.circle(compX, compY, cr, "S");
    
    // Compass Cross lines inside
    doc.setLineWidth(0.1);
    doc.line(compX - cr, compY, compX + cr, compY);
    doc.line(compX, compY - cr, compX, compY + cr);

    // Compass Pointers (Triangles)
    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]); // Top pointer - Maroon
    doc.triangle(compX - 1.5, compY - cr, compX + 1.5, compY - cr, compX, compY - cr - 3, "F");
    
    doc.setFillColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]); // Others - Gold
    doc.triangle(compX - 1.5, compY + cr, compX + 1.5, compY + cr, compX, compY + cr + 3, "F");
    doc.triangle(compX - cr, compY - 1.5, compX - cr, compY + 1.5, compX - cr - 3, compY, "F");
    doc.triangle(compX + cr, compY - 1.5, compX + cr, compY + 1.5, compX + cr + 3, compY, "F");
    
    // "N" Label
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("N", compX, compY - cr - 4, { align: "center" });

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

    doc.addImage(imgChakra, "JPEG", cw, cy, mw, mh);

    if (cy + mh + 10 < H - margin - 20) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        doc.text("16 directional energy zones — Shakti Chakra overlay on floor plan.", margin + 6, cy + mh + 10);
    }

    // ==========================================
    // PAGE 4: MARMA ANALYSIS & TABLE
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("MARMA ANALYSIS", "Vital Energy Nodes & Body Mapping");

    doc.addImage(imgMarma, "JPEG", cw, cy, mw, mh);

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

    let tY = cy + mh + 10;
    
    // Check if table fits, if not, push to next page - map could be very tall
    if (tY + 60 > H - margin - 20) {
        doc.addPage();
        generatePageBorder();
        addHeader("MARMA IDENTIFICATION Table", "Detailed Body Mapping");
        tY = cy;
    }

    const tGroupW = (W - 2 * margin - 10) / 3;
    
    // Header
    doc.setFillColor(242, 242, 242);
    doc.rect(margin + 2, tY, W - 2*margin - 4, 8, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);

    for (let g = 0; g < 3; g++) {
        const oX = margin + 5 + g * tGroupW;
        doc.text("Point", oX, tY + 5.5);
        doc.text("Body Part", oX + 11, tY + 5.5);
        doc.text("Zones", oX + tGroupW - 14, tY + 5.5);
    }
    tY += 8;

    // Remove text color override so body is dark text
    doc.setTextColor(30, 30, 30);
    marmaTableData.forEach((row, i) => {
        if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin + 2, tY, W - 2*margin - 4, 6, "F");
        }

        const drawCol = (oX: number, p: string, b: string, z: string) => {
            doc.setFont("helvetica", "bold");
            doc.text(p, oX, tY + 4);
            doc.setFont("helvetica", "normal");
            doc.text(b, oX + 11, tY + 4);
            doc.text(z, oX + tGroupW - 14, tY + 4);
        };

        drawCol(margin + 5, row.p1, row.b1, row.z1);
        drawCol(margin + 5 + tGroupW, row.p2, row.b2, row.z2);
        drawCol(margin + 5 + 2*tGroupW, row.p3, row.b3, row.z3);

        tY += 6;
        
        // Very subtle row border
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.line(margin + 2, tY, W - margin - 2, tY);
    });

    // ==========================================
    // PAGE 5: ZONE ANALYSIS
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("ZONE ANALYSIS", "Spatial Distribution & Area Strengths");

    doc.addImage(imgZones, "JPEG", cw, cy, mw, mh);

    {
        let chartY = cy + mh + 10;
        let maxAllowed = (H - margin - 15) - chartY - 2;
        if (maxAllowed < 35) {
            doc.addPage();
            generatePageBorder();
            addHeader("ZONE ANALYSIS", "Spatial Distribution & Area Strengths");
            chartY = margin + 30;
            maxAllowed = (H - margin - 15) - chartY - 2;
        }
        const chartH = Math.max(35, Math.min(65, maxAllowed));
        const chartW = mw;
        const cwGraph = cw;

        const internalOrder = ["NNW", "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW"];
        const directionMap: Record<string, string> = {
            "N": "North", "E": "East", "S": "South", "W": "West"
        };

        let chartData: { dir: string; label: string; val: number }[] = [];
        if (analysis.zoneResults && analysis.zoneResults.length > 0) {
             internalOrder.forEach(dir => {
                 const match = analysis.zoneResults!.find(z => z.direction === dir);
                 chartData.push({ dir, label: directionMap[dir] || dir, val: match ? match.areaReal : 0 });
             });
        } else {
             internalOrder.forEach(dir => {
                 const match = analysis.evaluations.find(e => e.direction === dir);
                 chartData.push({ dir, label: directionMap[dir] || dir, val: match ? match.areaPercent : 0 });
             });
        }
        
        const vals = chartData.map(d => d.val);
        const minVal = Math.min(...vals.filter(v => v > 0)); // avoid 0 if some empty
        const maxVal = Math.max(...vals, 1);
        const avgVal = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
        
        // Target Axis maximum
        const maxAxis = Math.ceil(maxVal * 1.2 / 5) * 5; 
        
        const graphAreaW = chartW - 20;
        const graphAreaH = chartH - 20;
        const startX = cwGraph + 15;
        const startY = chartY + 5;
        const barW = graphAreaW / 16;
        
        doc.setFont("helvetica", "normal");
        
        // Draw horizontal grid lines and Y Axis values
        const ticks = 5;
        doc.setFontSize(6);
        for(let i = 0; i < ticks; i++) {
             const tVal = (maxAxis / (ticks-1)) * i;
             const ty = startY + graphAreaH - (tVal / maxAxis) * graphAreaH;
             doc.setDrawColor(240, 240, 240);
             doc.setLineWidth(0.1);
             doc.line(startX, ty, startX + graphAreaW, ty);
             doc.setTextColor(100, 100, 100);
             doc.text(tVal.toFixed(1), startX - 2, ty + 2, { align: "right" });
        }
        
        // Y Axis Label
        doc.setTextColor(100, 100, 100);
        doc.text("Area (sq. ft)", startX - 10, startY + graphAreaH / 2 + 5, { angle: 90 });

        // Draw Y=0 explicitly solid
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.line(startX, startY + graphAreaH, startX + graphAreaW, startY + graphAreaH); // X axis line
        doc.line(startX, startY, startX, startY + graphAreaH); // Y axis solid line

        // Draw dashed lines function
        const drawDashedLine = (val: number, color: number[]) => {
             const ly = startY + graphAreaH - (val / maxAxis) * graphAreaH;
             doc.setDrawColor(color[0], color[1], color[2]);
             doc.setLineWidth(0.2);
             for (let x = startX; x < startX + graphAreaW; x += 3) {
                  doc.line(x, ly, Math.min(x + 1.5, startX + graphAreaW), ly);
             }
        };
        
        // Draw Min, Avg, Max dashed lines
        drawDashedLine(minVal, [100, 150, 250]); // Blue min
        drawDashedLine(avgVal, [50, 200, 50]);   // Green avg
        drawDashedLine(maxVal, [250, 100, 100]); // Red max

        // Draw Bars
        chartData.forEach((d, i) => {
            const h = (d.val / maxAxis) * graphAreaH;
            const bx = startX + i * barW;
            const by = startY + graphAreaH - h;
            
            doc.setFillColor(DIRECTION_COLORS[d.dir as VastuDirection] || "#666");
            doc.rect(bx + 1, by, barW - 2.5, h, "F");
            
            // Difference from avg text
            const diff = d.val - avgVal;
            const diffText = (diff > 0 ? "+" : "") + diff.toFixed(2);
            if (diff > 0) doc.setTextColor(0, 160, 0);
            else doc.setTextColor(200, 50, 50);
            
            doc.setFontSize(5);
            doc.setFont("helvetica", "bold");
            doc.text(diffText, bx + barW/2 - 0.5, by - 1.5, { align: "center" });
            
            // X-Axis Labels — negative angle rotates clockwise so text hangs downward
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(5);
            doc.text(d.label, bx + barW/2, startY + graphAreaH + 3, { angle: -45 });
        });
        
        // Legend at bottom
        const legendY = startY + graphAreaH + 15;
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setLineWidth(0.3);
        
        const lw = graphAreaW / 3;
        
        // Min
        doc.setDrawColor(40, 120, 230);
        for (let x = startX + lw*0.2; x < startX + lw*0.2 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
        doc.setTextColor(80, 100, 130);
        doc.text(`Min. (${minVal.toFixed(2)})`, startX + lw*0.2 + 10, legendY);
        
        // Avg
        doc.setDrawColor(50, 200, 50);
        for (let x = startX + lw*1.2; x < startX + lw*1.2 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
        doc.setTextColor(80, 130, 80);
        doc.text(`Avg. (${avgVal.toFixed(2)})`, startX + lw*1.2 + 10, legendY);
        
        // Max
        doc.setDrawColor(230, 80, 80);
        for (let x = startX + lw*2.2; x < startX + lw*2.2 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
        doc.setTextColor(130, 80, 80);
        doc.text(`Max. (${maxVal.toFixed(2)})`, startX + lw*2.2 + 10, legendY);
    }

    // ==========================================
    // PAGE 6: DEVTA ANALYSIS & CHART
    // ==========================================
    if (analysis.devtaAreas && analysis.devtaAreas.length > 0) {
        doc.addPage();
        generatePageBorder();
        addHeader("DEVTA ANALYSIS", "32 Outer Devta Energy Fields");

        doc.addImage(imgDevtas, "JPEG", cw, cy, mw, mh);

        {
            let chartY = cy + mh + 10;
            let maxAllowed = (H - margin - 15) - chartY - 2;
            if (maxAllowed < 45) {
                doc.addPage();
                generatePageBorder();
                addHeader("DEVTA ANALYSIS", "32 Outer Devta Energy Fields");
                chartY = margin + 30;
                maxAllowed = (H - margin - 15) - chartY - 2;
            }
            const chartH = Math.max(45, Math.min(75, maxAllowed));
            const chartW = mw;
            
            const devtaOrder = [
                "Shikhi", "Prajanya", "Jayant", "Mahender", "Surya", "Satya", "Bhrisha", "Antriksh",
                "Anil", "Pusha", "Vitasta", "Grispatya", "Yama", "Gandharav", "Bhrigraj", "Mrighah",
                "Pitr", "Dauwarik", "Sugreev", "Pushpdant", "Varun", "Asur", "Shosha", "Papyakshma",
                "Roga", "Ahir", "Mukhya", "Bhallat", "Soma", "Bhujang", "Aditi", "Diti"
            ];
            
            const devtaColors: Record<string, string> = {
                "Roga": "#cfe2f3", "Ahir": "#cfe2f3", "Mukhya": "#cfe2f3", "Bhallat": "#cfe2f3",
                "Soma": "#9fc5e8", "Bhujang": "#d9d2e9", "Aditi": "#d9d2e9", "Diti": "#d9d2e9",
                "Shikhi": "#a2c4c9", "Prajanya": "#a2c4c9", "Jayant": "#b6d7a8", "Mahender": "#b6d7a8",
                "Surya": "#b6d7a8", "Satya": "#b6d7a8", "Bhrisha": "#d5a6bd", "Antriksh": "#d5a6bd",
                "Anil": "#ea9999", "Pusha": "#ea9999", "Vitasta": "#ea9999", "Grispatya": "#ea9999",
                "Yama": "#ea9999", "Gandharav": "#f9cb9c", "Bhrigraj": "#ffe599", "Mrighah": "#d9d2e9",
                "Pitr": "#d9d2e9", "Dauwarik": "#d9d2e9", "Sugreev": "#d9d2e9", "Pushpdant": "#d9d2e9",
                "Varun": "#d9d2e9", "Asur": "#d9d2e9", "Shosha": "#cfe2f3", "Papyakshma": "#cfe2f3"
            };

            const rawData = analysis.devtaAreas || [];
            let chartData: { label: string; val: number }[] = [];
            
            if (rawData.length > 0) {
                devtaOrder.forEach(dName => {
                    const match = rawData.find(d => d.name === dName);
                    chartData.push({ label: dName, val: match ? match.areaReal : 0 });
                });

                const vals = chartData.map(d => d.val);
                const minVal = Math.min(...vals.filter(v => v > 0)); // Avoid 0
                const maxVal = Math.max(...vals, 1);
                const avgVal = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
                
                // Target Axis max
                const maxAxis = Math.ceil(maxVal * 1.2 / 5) * 5; 
                
                const graphAreaW = chartW - 20;
                const graphAreaH = chartH - 25; // plenty of extra bottom padding for long rotated text
                const startX = cw + 15;
                const startY = chartY + 5;
                const barW = graphAreaW / chartData.length;
                
                doc.setFont("helvetica", "normal");
                
                // Y Axis Ticks
                const ticks = 6;
                doc.setFontSize(6);
                for(let i = 0; i < ticks; i++) {
                     const tVal = (maxAxis / (ticks-1)) * i;
                     const ty = startY + graphAreaH - (tVal / maxAxis) * graphAreaH;
                     doc.setDrawColor(245, 245, 245);
                     doc.setLineWidth(0.1);
                     doc.line(startX, ty, startX + graphAreaW, ty);
                     doc.setTextColor(110, 110, 110);
                     doc.text(tVal.toFixed(1), startX - 2, ty + 2, { align: "right" });
                }
                
                // Y Axis Label
                doc.setTextColor(100, 100, 100);
                doc.text("Area (sq. ft)", startX - 10, startY + graphAreaH / 2 + 5, { angle: 90 });

                // Axes lines
                doc.setDrawColor(100, 100, 100);
                doc.setLineWidth(0.3);
                doc.line(startX, startY + graphAreaH, startX + graphAreaW, startY + graphAreaH);
                doc.line(startX, startY, startX, startY + graphAreaH);

                // Dashed line util
                const drawDashedLine = (val: number, color: number[]) => {
                     const ly = startY + graphAreaH - (val / maxAxis) * graphAreaH;
                     doc.setDrawColor(color[0], color[1], color[2]);
                     doc.setLineWidth(0.2);
                     for (let x = startX; x < startX + graphAreaW; x += 3) {
                          doc.line(x, ly, Math.min(x + 1.5, startX + graphAreaW), ly);
                     }
                };
                
                // Draw Dashes
                drawDashedLine(minVal, [100, 150, 250]); // Blue min
                drawDashedLine(avgVal, [50, 200, 50]);   // Green avg
                drawDashedLine(maxVal, [250, 100, 100]); // Red max

                // Draw Bars
                chartData.forEach((d, i) => {
                    const h = (d.val / maxAxis) * graphAreaH;
                    const bx = startX + i * barW;
                    const by = startY + graphAreaH - h;
                    
                    doc.setFillColor(devtaColors[d.label] || "#e3e3e3");
                    doc.rect(bx + 0.5, by, barW - 1, h, "F");
                    
                    // X Labels — negative angle rotates clockwise so text hangs downward
                    doc.setFontSize(5);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80, 80, 80);
                    doc.text(d.label, bx + barW/2, startY + graphAreaH + 3, { angle: -45 });
                });
                
                // Legend at bottom (pushed down to clear diagonal labels)
                const legendY = startY + graphAreaH + 22;
                doc.setFontSize(6.5);
                doc.setFont("helvetica", "bold");
                doc.setLineWidth(0.3);
                
                const lw = graphAreaW / 3;
                
                // Min
                doc.setDrawColor(40, 120, 230);
                for (let x = startX + lw*0.1; x < startX + lw*0.1 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
                doc.setTextColor(80, 100, 130);
                doc.text(`Min. (${minVal.toFixed(2)})`, startX + lw*0.1 + 10, legendY);
                
                // Avg
                doc.setDrawColor(50, 200, 50);
                for (let x = startX + lw*1.1; x < startX + lw*1.1 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
                doc.setTextColor(80, 130, 80);
                doc.text(`Avg. (${avgVal.toFixed(2)})`, startX + lw*1.1 + 10, legendY);
                
                // Max
                doc.setDrawColor(230, 80, 80);
                for (let x = startX + lw*2.1; x < startX + lw*2.1 + 8; x += 2) doc.line(x, legendY - 1, x+1, legendY - 1);
                doc.setTextColor(130, 80, 80);
                doc.text(`Max. (${maxVal.toFixed(2)})`, startX + lw*2.1 + 10, legendY);
            }
        }
    }

    // ==========================================
    // PAGE 7: PLACEMENT & REMEDIES
    // ==========================================
    doc.addPage();
    generatePageBorder();
    addHeader("OBJECT PLACEMENT", "Activities, Utilities & Remedies");

    let placementY = cy;

    const drawTableHeader = (y: number) => {
        doc.setFillColor(242, 242, 242);
        doc.rect(margin + 2, y, W - 2*margin - 4, 8, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text("OBJECT / ACTIVITY", margin + 6, y + 5.5);
        doc.text("ZONE", margin + 50, y + 5.5);
        doc.text("DETAILS & REMEDY", margin + 80, y + 5.5);
        return y + 8;
    };

    placementY = drawTableHeader(placementY);

    analysis.placedItems.forEach((item, index) => {
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
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
            placementY = cy; // reset y
            placementY = drawTableHeader(placementY);
            
            // Reapply alternating bg for new page top row
            if (index % 2 === 0) doc.setFillColor(250, 250, 250);
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


