/**
 * Fight Mecca Feature Entitlement Architecture
 * Gating structure for premium capabilities with a seamless development override.
 */

export enum FeatureCapability {
  PERSONALIZED_AVATAR = 'PERSONALIZED_AVATAR',
  VIDEO_IMPORT_ANALYSIS = 'VIDEO_IMPORT_ANALYSIS',
  AUXILIARY_CAMERA = 'AUXILIARY_CAMERA',
  THREE_D_COMPARISON = 'THREE_D_COMPARISON',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
}

export type EntitlementTier = 'FREE' | 'PREMIUM' | 'VIP' | 'DOJO';

export interface UserEntitlementState {
  tier: EntitlementTier;
  capabilities: FeatureCapability[];
  isDevelopmentOverride: boolean;
}

// Default capabilities mapped by tier
export const TIER_CAPABILITIES: Record<EntitlementTier, FeatureCapability[]> = {
  FREE: [],
  PREMIUM: [
    FeatureCapability.PERSONALIZED_AVATAR,
    FeatureCapability.VIDEO_IMPORT_ANALYSIS,
  ],
  VIP: [
    FeatureCapability.PERSONALIZED_AVATAR,
    FeatureCapability.VIDEO_IMPORT_ANALYSIS,
    FeatureCapability.AUXILIARY_CAMERA,
    FeatureCapability.THREE_D_COMPARISON,
  ],
  DOJO: [
    FeatureCapability.PERSONALIZED_AVATAR,
    FeatureCapability.VIDEO_IMPORT_ANALYSIS,
    FeatureCapability.AUXILIARY_CAMERA,
    FeatureCapability.THREE_D_COMPARISON,
    FeatureCapability.ADVANCED_ANALYTICS,
  ],
};

// Global development override state (default true for frictionless developer testing)
let DEVELOPMENT_OVERRIDE = true;

export function setDevelopmentOverride(enabled: boolean) {
  DEVELOPMENT_OVERRIDE = enabled;
}

export function isDevelopmentOverrideEnabled(): boolean {
  return DEVELOPMENT_OVERRIDE;
}

/**
 * Checks whether a named feature capability is accessible.
 */
export function hasCapability(
  capability: FeatureCapability,
  userTier: EntitlementTier = 'FREE'
): boolean {
  if (DEVELOPMENT_OVERRIDE) {
    return true; // All features accessible during dev testing
  }

  const allowedCaps = TIER_CAPABILITIES[userTier] || [];
  return allowedCaps.includes(capability);
}
