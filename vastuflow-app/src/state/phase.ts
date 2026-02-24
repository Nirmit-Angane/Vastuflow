// ═══════════════════════════════════════════════════════
// State — Strict Phase State Machine
// No phase skipping. Linear progression only.
// ═══════════════════════════════════════════════════════

export enum Phase {
    IDLE = "IDLE",
    IMAGE_LOADED = "IMAGE_LOADED",
    ALIGNED = "ALIGNED",
    SCALED = "SCALED",
    TRACING = "TRACING",
    POLYGON_CLOSED = "POLYGON_CLOSED",
    CENTROID_COMPUTED = "CENTROID_COMPUTED",
    SECTORS_GENERATED = "SECTORS_GENERATED",
    ANALYZED = "ANALYZED",
    REPORT_READY = "REPORT_READY",
}

/**
 * Valid phase transitions.
 * No skipping allowed. Each phase can only advance to the next.
 * IMAGE_LOADED is optional — can go directly from IDLE to TRACING
 * (image upload is optional per requirements).
 */
const VALID_TRANSITIONS: Record<Phase, Phase[]> = {
    [Phase.IDLE]: [Phase.IMAGE_LOADED, Phase.TRACING],
    [Phase.IMAGE_LOADED]: [Phase.ALIGNED],
    [Phase.ALIGNED]: [Phase.SCALED],
    [Phase.SCALED]: [Phase.TRACING],
    [Phase.TRACING]: [Phase.POLYGON_CLOSED, Phase.TRACING], // can stay in tracing
    [Phase.POLYGON_CLOSED]: [Phase.CENTROID_COMPUTED],
    [Phase.CENTROID_COMPUTED]: [Phase.SECTORS_GENERATED],
    [Phase.SECTORS_GENERATED]: [Phase.ANALYZED],
    [Phase.ANALYZED]: [Phase.REPORT_READY],
    [Phase.REPORT_READY]: [Phase.IDLE, Phase.TRACING], // restart
};

/**
 * Check if a transition is valid.
 */
export function canTransition(from: Phase, to: Phase): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Ordered phase index for comparison (is phase >= some other phase?)
 */
const PHASE_ORDER: Phase[] = [
    Phase.IDLE,
    Phase.IMAGE_LOADED,
    Phase.ALIGNED,
    Phase.SCALED,
    Phase.TRACING,
    Phase.POLYGON_CLOSED,
    Phase.CENTROID_COMPUTED,
    Phase.SECTORS_GENERATED,
    Phase.ANALYZED,
    Phase.REPORT_READY,
];

export function phaseIndex(phase: Phase): number {
    return PHASE_ORDER.indexOf(phase);
}

export function isPhaseAtLeast(current: Phase, minimum: Phase): boolean {
    return phaseIndex(current) >= phaseIndex(minimum);
}
