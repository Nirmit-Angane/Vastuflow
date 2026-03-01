
import { DevtaZone } from '@/core/geometry/types';

interface DevtasLayerProps {
    zones: DevtaZone[];
    visible: boolean;
    showNames: boolean;
    showNumbers: boolean;
}

/** Devta layer — currently disabled. */
export default function DevtasLayer({ visible }: DevtasLayerProps) {
    if (!visible) return null;
    return null;
}
