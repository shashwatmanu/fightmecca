import { DeviationDirection, DeviationSignificance, MovementGroup } from './judgement-types';

/**
 * Deterministically generates an explainable natural language description for a parameter deviation.
 */
export function generateParameterExplanation(
  parameterName: string,
  direction: DeviationDirection,
  significance: DeviationSignificance,
  refVal: number | string | null,
  attVal: number | string | null,
  unit: string
): string {
  if (significance === 'UNOBSERVABLE' || refVal === null || attVal === null) {
    return `Insufficient reliable landmark data was available to judge ${parameterName.toLowerCase()}.`;
  }

  if (significance === 'MATCH' || direction === 'SIMILAR') {
    return `${parameterName} closely matched the selected reference (${attVal} ${unit} vs ${refVal} ${unit}).`;
  }

  const directionPhraseMap: Record<DeviationDirection, string> = {
    WIDER: 'was wider than',
    NARROWER: 'was narrower than',
    EARLIER: 'occurred earlier than',
    LATER: 'occurred later than',
    HIGHER: 'was higher than',
    LOWER: 'was lower than',
    MORE: 'showed greater rotation/displacement than',
    LESS: 'showed less rotation/displacement than',
    DIFFERENT_PATTERN: 'followed a different trajectory pattern than',
    SIMILAR: 'was similar to',
    UNKNOWN: 'differed from',
  };

  const phrase = directionPhraseMap[direction] || 'differed from';
  const sigText = significance.toLowerCase();

  return `The attempt's ${parameterName.toLowerCase()} ${phrase} the selected reference (${attVal} ${unit} vs ${refVal} ${unit}; ${sigText} deviation).`;
}

/**
 * Deterministically generates explanation for timing event comparison.
 */
export function generateTimingEventExplanation(
  eventLabel: string,
  deltaMs: number | null,
  deltaNorm: number | null
): string {
  if (deltaMs === null || deltaNorm === null) {
    return `Timing event for ${eventLabel.toLowerCase()} could not be reliably aligned.`;
  }

  if (Math.abs(deltaNorm) <= 0.03) {
    return `${eventLabel} occurred at nearly the exact same normalized time as the reference.`;
  }

  const directionStr = deltaNorm > 0 ? 'later' : 'earlier';
  const absNormPct = Math.round(Math.abs(deltaNorm) * 100);
  const absMs = Math.abs(Math.round(deltaMs));

  return `${eventLabel} occurred ${absNormPct}% (${absMs} ms) ${directionStr} in the normalized movement progress compared to the reference.`;
}

/**
 * Generates group-level summary explanation.
 */
export function generateGroupExplanation(
  groupLabel: string,
  similarity: number | null,
  significantDeviations: string[]
): string {
  if (similarity === null) {
    return `No reliable data available for ${groupLabel.toLowerCase()} group.`;
  }

  if (significantDeviations.length === 0) {
    return `${groupLabel} features showed high overall agreement with the selected reference (${Math.round(similarity)}% similarity).`;
  }

  return `${groupLabel} showed ${Math.round(similarity)}% reference similarity, with noticeable differences in: ${significantDeviations.join(', ')}.`;
}
