// ═══════════════════════════════════════════════════════
// 32 Devta Zones — Placeholder (disabled)
// ═══════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Point, DevtaZone } from "./types";

/** Returns empty — Devta layer is disabled. */
export function compute32Devtas(
    _centroid: Point,
    _radius: number,
    _polygonBound: Point[],
    _rotation?: number
): DevtaZone[] {
    return [];
}

/** Returns undefined — Devta lookup is disabled. */
export function getDevtaForPoint(
    _centroid: Point,
    _p: Point,
    _polygonBound: Point[],
    _rotation?: number
): string | undefined {
    return undefined;
}

export const OUTER_32_DEVTAS: { name: string; color: string; side: string }[] = [];
export const MANDALA_CELLS: { col: number; row: number; name: string; ring: string; color: string }[] = [];