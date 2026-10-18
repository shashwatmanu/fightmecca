import { KeyMomentEvent, KeyMomentType } from './events';
import { MotionTemplate } from './template';

export interface EventComparisonResult {
  event_type: KeyMomentType;
  label: string;
  reference_timestamp_ms: number | null;
  attempt_timestamp_ms: number | null;
  delta_ms: number | null;
  reference_normalized_time: number | null;
  attempt_normalized_time: number | null;
  delta_normalized_time: number | null; // attempt_norm - ref_norm
  observable: boolean;
}

export type GenericPhaseType = 'PREPARATION' | 'ACCELERATION' | 'EXTENSION' | 'RECOVERY';

export interface PhaseComparisonResult {
  phase_type: GenericPhaseType;
  label: string;
  reference_duration_ms: number | null;
  attempt_duration_ms: number | null;
  delta_ms: number | null;
  reference_normalized_fraction: number | null; // Phase duration as fraction of total movement [0, 1]
  attempt_normalized_fraction: number | null;
  delta_normalized_fraction: number | null;
  observable: boolean;
}

/**
 * Compares key temporal events between reference and attempt templates.
 */
export function compareKeyEvents(
  refTemplate: MotionTemplate,
  attTemplate: MotionTemplate
): EventComparisonResult[] {
  const refEvents = refTemplate.key_temporal_events || [];
  const attEvents = attTemplate.key_temporal_events || [];

  const refDuration = refTemplate.duration_ms || 1;
  const attDuration = attTemplate.duration_ms || 1;

  const eventTypes: Array<{ type: KeyMomentType; label: string }> = [
    { type: 'MOTION_START', label: 'Motion Onset' },
    { type: 'PEAK_WRIST_VELOCITY', label: 'Peak Wrist Velocity' },
    { type: 'MAXIMUM_EXTENSION', label: 'Maximum Extension' },
    { type: 'RECOVERY', label: 'Recovery / Return' },
  ];

  return eventTypes.map(({ type, label }) => {
    const refEvt = refEvents.find((e) => e.event_type === type);
    const attEvt = attEvents.find((e) => e.event_type === type);

    if (!refEvt || !attEvt) {
      const refNormTime = refEvt ? Number((refEvt.timestamp_ms / refDuration).toFixed(2)) : null;
      const attNormTime = attEvt ? Number((attEvt.timestamp_ms / attDuration).toFixed(2)) : null;
      return {
        event_type: type,
        label,
        reference_timestamp_ms: refEvt ? refEvt.timestamp_ms : null,
        attempt_timestamp_ms: attEvt ? attEvt.timestamp_ms : null,
        delta_ms: null,
        reference_normalized_time: refNormTime,
        attempt_normalized_time: attNormTime,
        delta_normalized_time: null,
        observable: false,
      };
    }

    const refNormTime = Number((refEvt.timestamp_ms / refDuration).toFixed(2));
    const attNormTime = Number((attEvt.timestamp_ms / attDuration).toFixed(2));
    const deltaMs = attEvt.timestamp_ms - refEvt.timestamp_ms;
    const deltaNormTime = Number((attNormTime - refNormTime).toFixed(2));

    return {
      event_type: type,
      label,
      reference_timestamp_ms: refEvt.timestamp_ms,
      attempt_timestamp_ms: attEvt.timestamp_ms,
      delta_ms: deltaMs,
      reference_normalized_time: refNormTime,
      attempt_normalized_time: attNormTime,
      delta_normalized_time: deltaNormTime,
      observable: true,
    };
  });
}

/**
 * Derives generic movement phase boundaries and compares phase durations between reference and attempt.
 */
export function compareGenericPhases(
  refTemplate: MotionTemplate,
  attTemplate: MotionTemplate,
  eventComparisons: EventComparisonResult[]
): PhaseComparisonResult[] {
  const getEventNormTime = (events: EventComparisonResult[], type: KeyMomentType, isRef: boolean) => {
    const evt = events.find((e) => e.event_type === type);
    if (!evt) return null;
    return isRef ? evt.reference_normalized_time : evt.attempt_normalized_time;
  };

  const getEventTimeMs = (events: EventComparisonResult[], type: KeyMomentType, isRef: boolean) => {
    const evt = events.find((e) => e.event_type === type);
    if (!evt) return null;
    return isRef ? evt.reference_timestamp_ms : evt.attempt_timestamp_ms;
  };

  const phaseDefs: Array<{
    type: GenericPhaseType;
    label: string;
    startType: KeyMomentType | 'START_OF_SESSION';
    endType: KeyMomentType;
  }> = [
    { type: 'PREPARATION', label: 'Preparation', startType: 'START_OF_SESSION', endType: 'MOTION_START' },
    { type: 'ACCELERATION', label: 'Acceleration', startType: 'MOTION_START', endType: 'PEAK_WRIST_VELOCITY' },
    { type: 'EXTENSION', label: 'Extension', startType: 'PEAK_WRIST_VELOCITY', endType: 'MAXIMUM_EXTENSION' },
    { type: 'RECOVERY', label: 'Recovery', startType: 'MAXIMUM_EXTENSION', endType: 'RECOVERY' },
  ];

  return phaseDefs.map(({ type, label, startType, endType }) => {
    const refStartNorm = startType === 'START_OF_SESSION' ? 0.0 : getEventNormTime(eventComparisons, startType, true);
    const refEndNorm = getEventNormTime(eventComparisons, endType, true);

    const attStartNorm = startType === 'START_OF_SESSION' ? 0.0 : getEventNormTime(eventComparisons, startType, false);
    const attEndNorm = getEventNormTime(eventComparisons, endType, false);

    const refStartMs = startType === 'START_OF_SESSION' ? 0.0 : getEventTimeMs(eventComparisons, startType, true);
    const refEndMs = getEventTimeMs(eventComparisons, endType, true);

    const attStartMs = startType === 'START_OF_SESSION' ? 0.0 : getEventTimeMs(eventComparisons, startType, false);
    const attEndMs = getEventTimeMs(eventComparisons, endType, false);

    if (
      refStartNorm === null ||
      refEndNorm === null ||
      attStartNorm === null ||
      attEndNorm === null ||
      refStartMs === null ||
      refEndMs === null ||
      attStartMs === null ||
      attEndMs === null
    ) {
      return {
        phase_type: type,
        label,
        reference_duration_ms: null,
        attempt_duration_ms: null,
        delta_ms: null,
        reference_normalized_fraction: null,
        attempt_normalized_fraction: null,
        delta_normalized_fraction: null,
        observable: false,
      };
    }

    const refDurMs = Math.max(0, refEndMs - refStartMs);
    const attDurMs = Math.max(0, attEndMs - attStartMs);
    const refFrac = Math.max(0, refEndNorm - refStartNorm);
    const attFrac = Math.max(0, attEndNorm - attStartNorm);

    return {
      phase_type: type,
      label,
      reference_duration_ms: Math.round(refDurMs),
      attempt_duration_ms: Math.round(attDurMs),
      delta_ms: Math.round(attDurMs - refDurMs),
      reference_normalized_fraction: Number(refFrac.toFixed(2)),
      attempt_normalized_fraction: Number(attFrac.toFixed(2)),
      delta_normalized_fraction: Number((attFrac - refFrac).toFixed(2)),
      observable: true,
    };
  });
}
