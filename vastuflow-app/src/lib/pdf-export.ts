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
            // Scale up for better print quality (3x)
            const canvas = document.createElement("canvas");
            canvas.width = w * 3;
            canvas.height = h * 3;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Fill background white
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/png", 1.0));
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

    const cw = margin + 12; // left padding
    const cy = margin + 45; // top padding after header
    const mw = W - (cw * 2); // available width
    const mh = mw * mapAspect; // maintain aspect ratio

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
    
    doc.addImage(imgLayout, "PNG", cw, cy, mw, mh);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Project details:", margin + 10, cy + mh + 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    
    const detailsLines = doc.splitTextToSize(analysis.summary || "Geometrically aligned layout representing the physical boundaries of the property.", W - 2*margin - 20);
    doc.text(detailsLines, margin + 10, cy + mh + 28);

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
    doc.addImage(imgChakra, "PNG", cw, cy, mw, mh);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Directional Alignment", margin + 10, cy + mh + 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text("The Shakti Chakra divides the space into 16 distinct energy zones. This map illustrates the physical orientation and proportional influence of each direction across the property.", margin + 10, cy + mh + 28, { maxWidth: W - 2*margin - 20 });

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
    doc.addImage(imgMarma, "PNG", cw, cy, mw, mh);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Energy Nodes", margin + 10, cy + mh + 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text("Marma points represent highly sensitive intersections of energy lines within the Vastu Mandala. They should remain clear of heavy structures, pillars, or internal walls to avoid energetic blockages.", margin + 10, cy + mh + 28, { maxWidth: W - 2*margin - 20 });

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
    doc.text("Marma Points Identification Table", W / 2, cy - 5, { align: "center" });

    let tY = cy;
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

    // Map on top - Fixed height to avoid overlapping footer
    const zh = 80; 
    const zw = zh / mapAspect;
    const zx = W / 2 - zw / 2;
    
    doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
    doc.setFillColor(250, 248, 245);
    doc.rect(zx - 2, cy - 2, zw + 4, zh + 4, "FD");
    doc.addImage(imgZones, "PNG", zx, cy, zw, zh);

    // Barchart Title
    const by = cy + zh + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text("Zonal Distribution Graph", margin + 10, by);

    // Draw Bar Chart Area
    const graphX = margin + 25; // Leave 25mm space for left labels
    const graphH = 45;
    const graphY = by + 12 + graphH; // Base line of bars
    const graphW = W - margin - 5 - graphX;

    const orderedDirections: string[] = [
        "NNW", "N", "NNE", "NE", 
        "ENE", "E", "ESE", "SE", 
        "SSE", "S", "SSW", "SW", 
        "WSW", "W", "WNW", "NW"
    ];

    const dirColors: Record<string, number[]> = {
        "NNW": [74, 144, 217], "N": [74, 144, 217], "NNE": [74, 144, 217], "NE": [74, 144, 217], 
        "ENE": [46, 184, 86], "E": [46, 184, 86], "ESE": [46, 184, 86], "SE": [46, 184, 86],       
        "SSE": [232, 60, 60], "S": [232, 60, 60],                                                  
        "SSW": [240, 175, 20], "SW": [240, 175, 20],                                               
        "WSW": [115, 115, 122], "W": [115, 115, 122], "WNW": [115, 115, 122], "NW": [115, 115, 122] 
    };

    // Use actual area (Sq. Ft or raw values) instead of percentages if 'zoneResults' is available
    let vals = orderedDirections.map(d => {
        // Fallback to sector overlaps if zoneResults is missing
        const matched = analysis.zoneResults ? 
            analysis.zoneResults.find(o => o.direction === d)?.areaReal :
            analysis.sectorOverlaps.find(o => o.direction === d)?.percentOfTotal;
        return matched || 0;
    });
    
    if (vals.every(v => v === 0)) vals = orderedDirections.map(() => 10);

    const minArea = Math.min(...vals);
    const maxArea = Math.max(...vals);
    const avgArea = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rangeHeight = Math.max(10, maxArea * 1.05); // Give a little headroom

    const drawDottedLine = (yVal: number, color: number[], label: string) => {
        const yPos = graphY - (yVal / rangeHeight) * graphH;
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(graphX - 2, yPos, graphX + graphW, yPos);
        doc.setLineDashPattern([], 0);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, graphX - 4, yPos + 2, { align: "right" });
    };

    // Reference lines
    drawDottedLine(0, [150, 150, 150], "0.0");
    drawDottedLine(minArea, [74, 144, 217], `-- Min. (${minArea.toFixed(2)})`);
    drawDottedLine(avgArea, [46, 184, 86], `-- Avg. (${avgArea.toFixed(2)})`);
    drawDottedLine(maxArea, [232, 60, 60], `-- Max. (${maxArea.toFixed(2)})`);

    const numBars = vals.length;
    const barW = (graphW / numBars) - 2;

    vals.forEach((val, i) => {
        const h = (val / rangeHeight) * graphH;
        const bx = graphX + i * (barW + 2) + 1;
        const bY = graphY - h;

        const dir = orderedDirections[i];
        const fill = dirColors[dir] || COLOR_PRIMARY;

        doc.setFillColor(fill[0], fill[1], fill[2]);
        doc.rect(bx, bY, barW, h, "F");

        const diff = val - avgArea;
        const diffText = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
        const tColor = diff > 0 ? [46, 184, 86] : [232, 60, 60];
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(tColor[0], tColor[1], tColor[2]);
        doc.text(diffText, bx + barW/2, bY - 2, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text(dir, bx + barW/2, graphY + 6, { align: "center" });
    });

    // Sublabels for Min/Avg/Max at bottom layout symmetrically
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    doc.setTextColor(74, 144, 217);
    doc.text(`--- Min. (${minArea.toFixed(2)})`, graphX + 10, graphY + 20);
    
    doc.setTextColor(46, 184, 86);
    doc.text(`--- Avg. (${avgArea.toFixed(2)})`, graphX + graphW/2 - 10, graphY + 20, { align: "center" });
    
    doc.setTextColor(232, 60, 60);
    doc.text(`--- Max. (${maxArea.toFixed(2)})`, graphX + graphW - 10, graphY + 20, { align: "right" });

    // ==========================================
    // PAGE 7: DEVTA ANALYSIS
    // ==========================================
    if (analysis.devtaAreas && analysis.devtaAreas.length > 0) {
        doc.addPage();
        generatePageBorder();
        addHeader("DEVTA ANALYSIS", "32 Outer Energy Fields");

        const dh = 110; 
        const dw = dh / mapAspect;
        const dx = W / 2 - dw / 2;
        
        doc.setDrawColor(COLOR_ACCENT[0], COLOR_ACCENT[1], COLOR_ACCENT[2]);
        doc.setFillColor(250, 248, 245);
        doc.rect(dx - 2, cy - 2, dw + 4, dh + 4, "FD");
        doc.addImage(imgDevtas, "PNG", dx, cy, dw, dh);

        // Barchart Title
        const dby = cy + dh + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text("Devta Area Distribution Graph", margin + 10, dby);

        // Draw Bar Chart Area
        const dGraphX = margin + 18; 
        const dGraphH = 42;
        const dGraphY = dby + 12 + dGraphH; // Base line of bars
        const dGraphW = W - margin - 5 - dGraphX;

        const devtaVals = analysis.devtaAreas.map(d => d.areaReal);
        const dMinArea = Math.min(...devtaVals);
        const dMaxArea = Math.max(...devtaVals);
        const dAvgArea = devtaVals.reduce((a, b) => a + b, 0) / devtaVals.length;
        // Scale bars relative to actual data — no hard-coded floor
        const dRangeHeight = dMaxArea * 1.05;

        const drawDevtaDottedLine = (yVal: number, color: number[], label: string) => {
            const yPos = dGraphY - (yVal / dRangeHeight) * dGraphH;
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setLineWidth(0.2);
            doc.setLineDashPattern([1, 1], 0);
            doc.line(dGraphX - 2, yPos, dGraphX + dGraphW, yPos);
            doc.setLineDashPattern([], 0);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(label, dGraphX - 4, yPos + 2, { align: "right" });
        };

        drawDevtaDottedLine(0, [150, 150, 150], "0.0");
        drawDevtaDottedLine(dMinArea, [74, 144, 217], `-- Min. (${dMinArea.toFixed(1)})`);
        drawDevtaDottedLine(dAvgArea, [46, 184, 86], `-- Avg. (${dAvgArea.toFixed(1)})`);
        drawDevtaDottedLine(dMaxArea, [232, 60, 60], `-- Max. (${dMaxArea.toFixed(1)})`);

        const dNumBars = analysis.devtaAreas.length;
        const dBarW = (dGraphW / dNumBars) - 1.5;

        analysis.devtaAreas.forEach((d, i) => {
            const h = (d.areaReal / dRangeHeight) * dGraphH;
            const bx = dGraphX + i * (dBarW + 1.5) + 0.5;
            const bY = dGraphY - h;

            doc.setFillColor(184, 146, 58); // Gold
            doc.rect(bx, bY, dBarW, h, "F");

            // Name
            const subName = d.name.substring(0, 3).toUpperCase();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(5.5);
            doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
            doc.text(subName, bx + dBarW/2 + 0.5, dGraphY + 5, { align: "center", angle: -45 });
        });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        
        doc.setTextColor(74, 144, 217);
        doc.text(`--- Min. (${dMinArea.toFixed(1)})`, dGraphX + 10, dGraphY + 15);
        
        doc.setTextColor(46, 184, 86);
        doc.text(`--- Avg. (${dAvgArea.toFixed(1)})`, dGraphX + dGraphW/2 - 10, dGraphY + 15, { align: "center" });
        
        doc.setTextColor(232, 60, 60);
        doc.text(`--- Max. (${dMaxArea.toFixed(1)})`, dGraphX + dGraphW - 10, dGraphY + 15, { align: "right" });
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


