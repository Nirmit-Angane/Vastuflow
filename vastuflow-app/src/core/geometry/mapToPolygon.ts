export interface MapWallPayload {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: string;
}

interface Point { x: number; y: number }

// Utility to check if two points are exactly identical within a tiny tolerance
function isSame(p1: Point, p2: Point) {
    return Math.abs(p1.x - p2.x) < 0.1 && Math.abs(p1.y - p2.y) < 0.1;
}

// Line intersection
function getIntersection(A: Point, B: Point, C: Point, D: Point): Point | null {
    const denom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
    if (Math.abs(denom) < 1e-6) return null;

    const ua = ((D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x)) / denom;
    const ub = ((B.x - A.x) * (A.y - C.y) - (B.y - A.y) * (A.x - C.x)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            x: A.x + ua * (B.x - A.x),
            y: A.y + ua * (B.y - A.y)
        };
    }
    return null;
}

export function extractOuterPolygon(walls: MapWallPayload[]): Point[] {
    // 1. Only consider standard exterior walls
    const stdWalls = walls.filter(w => w.type === "standard");
    if (stdWalls.length < 3) return [];

    // 2. Extract segments
    const segments: { p1: Point; p2: Point }[] = stdWalls.map(w => ({
        p1: { x: w.x1, y: w.y1 },
        p2: { x: w.x2, y: w.y2 }
    }));

    // 3. Split segments at all intersections
    const splitSegments: typeof segments = [];
    for (const seg of segments) {
        const intersectionPoints: Point[] = [seg.p1, seg.p2];
        for (const other of segments) {
            if (seg === other) continue;
            const pt = getIntersection(seg.p1, seg.p2, other.p1, other.p2);
            if (pt) {
                // Ignore endpoints
                if (!isSame(pt, seg.p1) && !isSame(pt, seg.p2)) {
                    intersectionPoints.push(pt);
                }
            }
        }

        // Sort intersection points along the segment
        intersectionPoints.sort((a, b) => {
            const da = Math.hypot(a.x - seg.p1.x, a.y - seg.p1.y);
            const db = Math.hypot(b.x - seg.p1.x, b.y - seg.p1.y);
            return da - db;
        });

        // Deduplicate
        const uniquePts = [intersectionPoints[0]];
        for (let i = 1; i < intersectionPoints.length; i++) {
            if (!isSame(intersectionPoints[i], intersectionPoints[i - 1])) {
                uniquePts.push(intersectionPoints[i]);
            }
        }

        // Add split pieces
        for (let i = 0; i < uniquePts.length - 1; i++) {
            if (!isSame(uniquePts[i], uniquePts[i + 1])) {
                splitSegments.push({ p1: uniquePts[i], p2: uniquePts[i + 1] });
            }
        }
    }

    // 4. Build Adjacency Graph
    const graph = new Map<string, Point[]>();
    const ptKey = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;

    // Store original points to avoid precision loss issues when referencing
    const pointMap = new Map<string, Point>();

    for (const seg of splitSegments) {
        const k1 = ptKey(seg.p1);
        const k2 = ptKey(seg.p2);

        if (!pointMap.has(k1)) pointMap.set(k1, seg.p1);
        if (!pointMap.has(k2)) pointMap.set(k2, seg.p2);

        if (!graph.has(k1)) graph.set(k1, []);
        if (!graph.has(k2)) graph.set(k2, []);

        if (!graph.get(k1)!.some(p => isSame(p, seg.p2))) graph.get(k1)!.push(seg.p2);
        if (!graph.get(k2)!.some(p => isSame(p, seg.p1))) graph.get(k2)!.push(seg.p1);
    }

    if (graph.size === 0) return [];

    // 5. Find Leftmost Node (Start Node)
    let startKey = "";
    let minX = Infinity;
    let minY = Infinity;

    for (const [key, pt] of pointMap.entries()) {
        if (pt.x < minX || (Math.abs(pt.x - minX) < 1e-3 && pt.y < minY)) {
            minX = pt.x;
            minY = pt.y;
            startKey = key;
        }
    }

    // 6. Trace Outer Boundary (Right-Hand Rule)
    const polygon: Point[] = [];
    let currentKey = startKey;
    // We imagine we came from straight UP so our first edge goes right/down
    let incomingAngle = -Math.PI / 2;

    // Safety limit to prevent infinite loops
    let maxSteps = graph.size * 2;

    do {
        polygon.push(pointMap.get(currentKey)!);
        const neighbors = graph.get(currentKey) || [];

        if (neighbors.length === 0) break; // Dead end

        let bestNeighbor = neighbors[0];
        let bestTurn = Infinity; // We want the smallest turn angle (sharpest right)

        for (const n of neighbors) {
            const pCurrent = pointMap.get(currentKey)!;
            const dx = n.x - pCurrent.x;
            const dy = n.y - pCurrent.y;
            const outAngle = Math.atan2(dy, dx);

            // Calculate turning angle. We want to turn RIGHT.
            // Right turns mean the difference is positive if we normalize correctly.
            let turn = incomingAngle - outAngle;

            // Normalize to [0, 2PI)
            while (turn < 0) turn += 2 * Math.PI;
            while (turn >= 2 * Math.PI) turn -= 2 * Math.PI;

            // If we bounce straight back (PI turn), that's a dead end. We only pick it if no other choice.
            if (turn < bestTurn) {
                bestTurn = turn;
                bestNeighbor = n;
            }
        }

        const nextKey = ptKey(bestNeighbor);

        // Update incoming angle for the next node (it's the opposite of our outgoing angle)
        const pCurrent = pointMap.get(currentKey)!;
        incomingAngle = Math.atan2(bestNeighbor.y - pCurrent.y, bestNeighbor.x - pCurrent.x) + Math.PI;

        currentKey = nextKey;
        maxSteps--;

    } while (currentKey !== startKey && maxSteps > 0);

    // Optional: Filter out co-linear points to simplify the polygon
    const optimizedPolygon: Point[] = [];
    for (let i = 0; i < polygon.length; i++) {
        const prev = polygon[(i - 1 + polygon.length) % polygon.length];
        const curr = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        // Cross product to check colinearity
        const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
        if (Math.abs(cross) > 1e-3) {
            // Not colinear, keep it
            optimizedPolygon.push(curr);
        }
    }

    return optimizedPolygon.length >= 3 ? optimizedPolygon : polygon;
}
