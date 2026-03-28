import { Point } from "./types";
import polygonClipping from "polygon-clipping";
import { computePolygonArea, computeCentroid, distance, pointInPolygon } from "./polygon";

export type DevtaCell = {
    id: string;
    devta: string;
    subtext?: string;
    polygons: Point[][];
    color: string;
    textPos: { x: number; y: number };
    type: "brahmasthan" | "inner" | "outer";
};

type DevtaInfo = { color: string; subtext?: string };
const DEVTA_INFO: Record<string, DevtaInfo> = {
    // Center
    "Brahmasthan": { color: "#ffe599", subtext: "Kesar ka tikka\nRohini" }, // Solid Yellow

    // Inner
    "Bhudhar": { color: "#9fc5e8", subtext: "Gehu ka Aata\nPoorva Ashadha" }, // Solid Blue
    "Aapha": { color: "#f9cb9c", subtext: "Nariyal" }, // Orange
    "Aapaavastha": { color: "#a2c4c9", subtext: "Ghee" }, // Cyan
    "Aryama": { color: "#b6d7a8", subtext: "Chocolate / Shakkar\nUttra Phalguni" }, // Green
    "Savitra": { color: "#d5a6bd", subtext: "Batasha Gheeshakker\nVishakha" }, // Pink
    "Savita": { color: "#b6d7a8", subtext: "Kheer/ Peda\nPoorva Phalguni" }, // Green
    "Vivaswan": { color: "#ea9999", subtext: "lit a Diya\nAshwini" }, // Red
    "Indra": { color: "#a2c4c9", subtext: "Pilli sarso" }, // Cyan
    "Jaya": { color: "#d5a6bd", subtext: "kali sarso" }, // Pink
    "Mitra": { color: "#d9d2e9", subtext: "Gud / Kheer\nAnuradha" }, // Grey
    "Rajyakshma": { color: "#9fc5e8", subtext: "Supari (Sabut)\nDhanishta" }, // Blue
    "Rudra": { color: "#b6d7a8", subtext: "Onion\nArdra" }, // Green

    // Outer
    "Roga": { color: "#cfe2f3", subtext: "Khopra / sukha nariyal\nSwati" },
    "Ahir": { color: "#cfe2f3", subtext: "Fresh fruits\nAslesha" },
    "Mukhya": { color: "#cfe2f3", subtext: "Mango / wheat / Brinjal" },
    "Bhallat": { color: "#cfe2f3", subtext: "Moong Daal\nUttra Bhadrapada" },
    "Soma": { color: "#9fc5e8", subtext: "Makhana / Butter\nMrigashira" },
    "Bhujang": { color: "#d9d2e9", subtext: "Tulsi Patta" },
    "Aditi": { color: "#d9d2e9", subtext: "Puri and Kheer / Dhai\nPunarvasu" },
    "Diti": { color: "#d9d2e9", subtext: "Basi Khana\nPushya" },
    "Shikhi": { color: "#a2c4c9", subtext: "Ghee ka Diya\nPushya" },
    "Prajanya": { color: "#a2c4c9", subtext: "Makhana" },
    "Jayant": { color: "#b6d7a8", subtext: "Chandan" },
    "Mahender": { color: "#b6d7a8", subtext: "Panchamrit" },
    "Surya": { color: "#b6d7a8", subtext: "Gud\nHast" },
    "Satya": { color: "#b6d7a8", subtext: "Wheat Ghee mixed\nUttarashad" },
    "Bhrisha": { color: "#d5a6bd", subtext: "Fish oil / Badam oil\nBharani" },
    "Antriksh": { color: "#d5a6bd", subtext: "Clove" },
    "Anil": { color: "#ea9999", subtext: "Lal Chandan\nKrittika" },
    "Pusha": { color: "#ea9999", subtext: "Kheel\nRevati" },
    "Vitasta": { color: "#ea9999", subtext: "Chane" },
    "Grispatya": { color: "#ea9999", subtext: "Wheat and honey mix" },
    "Yama": { color: "#ea9999", subtext: "Paneer" },
    "Gandharav": { color: "#f9cb9c", subtext: "Any beautiful designed f" },
    "Bhrigraj": { color: "#ffe599", subtext: "Alcohol\nJyestha" },
    "Mrighah": { color: "#d9d2e9", subtext: "Jaun\nChitra" },
    "Pitr": { color: "#d9d2e9", subtext: "Almounds\nMagha" },
    "Dauwarik": { color: "#d9d2e9", subtext: "Pani ka kalash / keel\nMoola" },
    "Sugreev": { color: "#d9d2e9", subtext: "5 types grains" },
    "Pushpdant": { color: "#d9d2e9", subtext: "Jawar" },
    "Varun": { color: "#d9d2e9", subtext: "Water\nShatabhisha" },
    "Asur": { color: "#d9d2e9", subtext: "Curd\nPoorva Bhadrapada" },
    "Shosha": { color: "#cfe2f3", subtext: "Paan / Supari\nShravana" },
    "Papyakshma": { color: "#cfe2f3", subtext: "Onion" }
};

// Remove old colors since we don't need them


const OUTER_DEVTAS = [
    "Roga", "Ahir", "Mukhya", "Bhallat", "Soma", "Bhujang", "Aditi", "Diti",
    "Shikhi", "Prajanya", "Jayant", "Mahender", "Surya", "Satya", "Bhrisha", "Antriksh",
    "Anil", "Pusha", "Vitasta", "Grispatya", "Yama", "Gandharav", "Bhrigraj", "Mrighah",
    "Pitr", "Dauwarik", "Sugreev", "Pushpdant", "Varun", "Asur", "Shosha", "Papyakshma"
];

const INNER_DEVTAS = [
    { name: "Rudra", start: 0, count: 2 },
    { name: "Bhudhar", start: 2, count: 4 },
    { name: "Aapha", start: 6, count: 2 },
    { name: "Aapaavastha", start: 8, count: 2 },
    { name: "Aryama", start: 10, count: 4 },
    { name: "Savitra", start: 14, count: 2 },
    { name: "Savita", start: 16, count: 2 },
    { name: "Vivaswan", start: 18, count: 4 },
    { name: "Indra", start: 22, count: 2 }, // Inner Indra
    { name: "Jaya", start: 24, count: 2 },
    { name: "Mitra", start: 26, count: 4 },
    { name: "Rajyakshma", start: 30, count: 2 }
];

function scalePolygon(poly: Point[], centroid: Point, scale: number): Point[] {
    return poly.map(p => ({
        x: centroid.x + (p.x - centroid.x) * scale,
        y: centroid.y + (p.y - centroid.y) * scale
    }));
}

function toPolyCoords(poly: Point[]): polygonClipping.Polygon[] {
    if (poly.length < 3) return [];
    const ring = poly.map(p => [p.x, p.y] as [number, number]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
    }
    return [[ring]];
}

function extractPolys(multipoly: polygonClipping.MultiPolygon): Point[][] {
    const result: Point[][] = [];
    for (const poly of multipoly) {
        const outerRing = poly[0];
        if (outerRing && outerRing.length >= 3) {
            const pts: Point[] = outerRing.map(pt => ({ x: pt[0], y: pt[1] }));
            if (pts.length > 0) {
                const first = pts[0];
                const last = pts[pts.length - 1];
                if (first.x === last.x && first.y === last.y) {
                    pts.pop(); // Remove duplicate last point for clean rendering
                }
            }
            if (pts.length >= 3) {
                result.push(pts);
            }
        }
    }
    return result;
}

function createWedge(c: Point, r: number, startDeg: number, endDeg: number): Point[] {
    const pts: Point[] = [c];
    let d = startDeg;
    while (d < endDeg) {
        const rad = (d - 90) * Math.PI / 180;
        pts.push({ x: c.x + Math.cos(rad) * r, y: c.y + Math.sin(rad) * r });
        d += 2;
    }
    const radE = (endDeg - 90) * Math.PI / 180;
    pts.push({ x: c.x + Math.cos(radE) * r, y: c.y + Math.sin(radE) * r });
    return pts; // The format function closes the ring automatically
}

function computeTextCentroid(polygons: Point[][]): Point {
    if (polygons.length === 0) return { x: 0, y: 0 };
    let largestPoly = polygons[0];
    let maxArea = -1;

    for (const poly of polygons) {
        const area = computePolygonArea(poly);
        if (area > maxArea) {
            maxArea = area;
            largestPoly = poly;
        }
    }
    return computeCentroid(largestPoly);
}

/**
 * Computes the Radial MahaVastu Devta Mandala mapping.
 * 32 11.25° radial divisions over concentric polygon rings scaled at 1/3, 7/9 and 1.
 */
export function computeDevtaMandala(
    centroid: Point,
    floorPolygon: Point[],
    rotation: number = 0
): DevtaCell[] {
    if (floorPolygon.length < 3) return [];

    const polyBrahma = scalePolygon(floorPolygon, centroid, 1 / 3);
    const polyInner = scalePolygon(floorPolygon, centroid, 7 / 9);

    const floorCoords = toPolyCoords(floorPolygon);
    const brahmaCoords = toPolyCoords(polyBrahma);
    const innerCoords = toPolyCoords(polyInner);

    // Get max radius directly bridging bounding limits
    let maxDist = 0;
    for (const p of floorPolygon) {
        const d = distance(centroid, p);
        if (d > maxDist) maxDist = d;
    }
    const maxR = maxDist * 2; // overshoot safely to bound everything

    const cells: DevtaCell[] = [];

    // 1. Brahma
    cells.push({
        id: "Brahmasthan", devta: "Brahmasthan", subtext: DEVTA_INFO["Brahmasthan"]?.subtext,
        polygons: [polyBrahma], color: DEVTA_INFO["Brahmasthan"]?.color || "#fff", type: "brahmasthan", textPos: centroid
    });

    // 2. Inner Devtas
    for (const def of INNER_DEVTAS) {
        const startDeg = 315 + def.start * 11.25 + rotation;
        const endDeg = 315 + (def.start + def.count) * 11.25 + rotation;
        const wedge = createWedge(centroid, maxR, startDeg, endDeg);
        const wedgeCoords = toPolyCoords(wedge);

        try {
            const intInner = polygonClipping.intersection(wedgeCoords, innerCoords);
            const finalCoords = polygonClipping.difference(intInner, brahmaCoords);

            const polygons = extractPolys(finalCoords);
            if (polygons.length > 0) {
                cells.push({
                    id: def.name, devta: def.name, subtext: DEVTA_INFO[def.name]?.subtext,
                    polygons, color: DEVTA_INFO[def.name]?.color || "#eee", type: "inner",
                    textPos: computeTextCentroid(polygons)
                });
            }
        } catch (err) {
            console.warn("Intersection failed for inner devta", def.name, err);
        }
    }

    // 3. Outer Devtas
    for (let i = 0; i < 32; i++) {
        const devtaName = OUTER_DEVTAS[i];
        const startDeg = 315 + i * 11.25 + rotation;
        const endDeg = 315 + (i + 1) * 11.25 + rotation;
        const wedge = createWedge(centroid, maxR, startDeg, endDeg);
        const wedgeCoords = toPolyCoords(wedge);

        try {
            const intOuter = polygonClipping.intersection(wedgeCoords, floorCoords);
            const finalCoords = polygonClipping.difference(intOuter, innerCoords);

            const polygons = extractPolys(finalCoords);
            if (polygons.length > 0) {
                cells.push({
                    id: devtaName, devta: devtaName, subtext: DEVTA_INFO[devtaName]?.subtext,
                    polygons, color: DEVTA_INFO[devtaName]?.color || "#ddd", type: "outer",
                    textPos: computeTextCentroid(polygons)
                });
            }
        } catch (err) {
            console.warn("Intersection failed for outer devta", devtaName, err);
        }
    }

    return cells;
}

/**
 * Identify which devta a placed item falls into by testing polygons.
 */
export function getDevtaForPoint(
    centroid: Point,
    p: Point,
    polygonBound: Point[],
    rotation: number = 0
): string | undefined {
    const cells = computeDevtaMandala(centroid, polygonBound, rotation);
    for (const cell of cells) {
        for (const poly of cell.polygons) {
            if (pointInPolygon(p, poly)) return cell.devta;
        }
    }
    return undefined;
}