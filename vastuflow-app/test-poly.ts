// tmp-test.ts
import { extractOuterPolygon } from "./src/core/geometry/mapToPolygon.js"; // Need to transpile to run or use ts-node

const walls = [
    { id: "w1", x1: 0, y1: 0, x2: 100, y2: 0, type: "standard" },
    { id: "w2", x1: 100, y1: 0, x2: 100, y2: 100, type: "standard" },
    { id: "w3", x1: 100, y1: 100, x2: 0, y2: 100, type: "standard" },
    { id: "w4", x1: 0, y1: 100, x2: 0, y2: 0, type: "standard" }
];

const poly = extractOuterPolygon(walls as any);
console.log("Returned polygon:", poly.length, "points");
console.log(poly);
