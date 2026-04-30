export interface MapWallPayload {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: string;
}

interface Point { x: number; y: number }

const SNAP_TOLERANCE = 3; // pixels — tolerance for merging near-identical points

// Round a value to the nearest tolerance bucket to merge near-identical values
function snapVal(v: number): number {
    return Math.round(v / SNAP_TOLERANCE) * SNAP_TOLERANCE;
}

function ptKey(p: Point): string {
    return `${snapVal(p.x)},${snapVal(p.y)}`;
}

function isSame(a: Point, b: Point): boolean {
    return Math.abs(a.x - b.x) < SNAP_TOLERANCE && Math.abs(a.y - b.y) < SNAP_TOLERANCE;
}

// Returns true if two segments share both endpoints (in either direction)
function edgeKey(p1: Point, p2: Point): string {
    const k1 = ptKey(p1);
    const k2 = ptKey(p2);
    return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
}

export function extractOuterPolygon(walls: MapWallPayload[]): Point[] {
    // 1. Only consider standard exterior walls
    const stdWalls = walls.filter(w => w.type === "standard");
    if (stdWalls.length < 3) return [];

    // 2. Snap all endpoints to a grid to merge near-identical vertices
    type Seg = { p1: Point; p2: Point };
    const segments: Seg[] = stdWalls.map(w => ({
        p1: { x: snapVal(w.x1), y: snapVal(w.y1) },
        p2: { x: snapVal(w.x2), y: snapVal(w.y2) }
    })).filter(s => !isSame(s.p1, s.p2));

    // 3. Count edge usage — interior walls shared by two rooms should be used twice
    //    Exterior (outer boundary) edges will be used exactly once
    const edgeCount = new Map<string, { segs: Seg[] }>();
    for (const seg of segments) {
        const key = edgeKey(seg.p1, seg.p2);
        if (!edgeCount.has(key)) edgeCount.set(key, { segs: [] });
        edgeCount.get(key)!.segs.push(seg);
    }

    // 4. Keep only edges that appear exactly ONCE (outer boundary)
    const outerEdges: Seg[] = [];
    for (const { segs } of edgeCount.values()) {
        if (segs.length === 1) {
            outerEdges.push(segs[0]);
        }
        // edges with count > 1 are interior shared walls — discard
    }

    if (outerEdges.length < 3) {
        // Fallback: maybe all edges are unique (no room sharing). Use all segments.
        for (const seg of segments) {
            outerEdges.push(seg);
        }
    }

    // 5. Build adjacency graph from outer edges
    const graph = new Map<string, Point[]>();
    const pointMap = new Map<string, Point>();

    for (const seg of outerEdges) {
        const k1 = ptKey(seg.p1);
        const k2 = ptKey(seg.p2);

        if (!pointMap.has(k1)) pointMap.set(k1, { x: snapVal(seg.p1.x), y: snapVal(seg.p1.y) });
        if (!pointMap.has(k2)) pointMap.set(k2, { x: snapVal(seg.p2.x), y: snapVal(seg.p2.y) });

        if (!graph.has(k1)) graph.set(k1, []);
        if (!graph.has(k2)) graph.set(k2, []);

        const p1Ref = pointMap.get(k1)!;
        const p2Ref = pointMap.get(k2)!;

        if (!graph.get(k1)!.some(p => isSame(p, p2Ref))) graph.get(k1)!.push(p2Ref);
        if (!graph.get(k2)!.some(p => isSame(p, p1Ref))) graph.get(k2)!.push(p1Ref);
    }

    if (graph.size === 0) return [];

    // 6. Find leftmost-then-topmost node as start (guaranteed to be on outer boundary)
    let startKey = "";
    let minX = Infinity;
    let minY = Infinity;

    for (const [key, pt] of pointMap.entries()) {
        if (pt.x < minX || (Math.abs(pt.x - minX) < SNAP_TOLERANCE && pt.y < minY)) {
            minX = pt.x;
            minY = pt.y;
            startKey = key;
        }
    }

    if (!startKey) return [];

    // 7. Trace outer boundary using rightmost-turn (smallest left turn = rightmost path)
    const polygon: Point[] = [];
    let currentKey = startKey;
    // Start direction: coming from above (straight up) → initial angle = -90° = -π/2
    let incomingAngle = -Math.PI / 2;

    const maxSteps = graph.size * 3 + 10;
    let steps = 0;

    do {
        const current = pointMap.get(currentKey)!;
        polygon.push(current);

        const neighbors = graph.get(currentKey) || [];
        if (neighbors.length === 0) break;

        // Filter out going back to our last position
        const lastPt = polygon.length >= 2 ? polygon[polygon.length - 2] : null;
        const candidates = neighbors.filter(n => !lastPt || !isSame(n, lastPt));
        const pool = candidates.length > 0 ? candidates : neighbors;

        // Pick the neighbor that turns most to the right (smallest clockwise angle)
        let bestNeighbor = pool[0];
        let bestTurn = Infinity;

        for (const n of pool) {
            const dx = n.x - current.x;
            const dy = n.y - current.y;
            const outAngle = Math.atan2(dy, dx);

            // Turn angle: how much we turn left from incoming direction
            // We want the MINIMUM left turn (= rightmost path = outer boundary)
            let turn = outAngle - (incomingAngle - Math.PI);
            // Normalize to [0, 2π)
            while (turn < 0) turn += 2 * Math.PI;
            while (turn >= 2 * Math.PI) turn -= 2 * Math.PI;

            if (turn < bestTurn) {
                bestTurn = turn;
                bestNeighbor = n;
            }
        }

        const nextKey = ptKey(bestNeighbor);
        incomingAngle = Math.atan2(bestNeighbor.y - current.y, bestNeighbor.x - current.x);
        currentKey = nextKey;
        steps++;
    } while (currentKey !== startKey && steps < maxSteps);

    if (polygon.length < 3) return [];

    // 8. Remove collinear points (points that are on a straight line between neighbors)
    const simplified: Point[] = [];
    for (let i = 0; i < polygon.length; i++) {
        const prev = polygon[(i - 1 + polygon.length) % polygon.length];
        const curr = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
        if (Math.abs(cross) > 0.1) {
            simplified.push(curr);
        }
    }

    return simplified.length >= 3 ? simplified : polygon;
}
