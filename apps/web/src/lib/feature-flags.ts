import featureFlagsConfig from "@/config/feature-flags.json";

export type FeatureFlag = keyof typeof featureFlagsConfig.flags;

/**
 * Central access point for feature flags.
 * Keep consumers behind this helper so the JSON source can later be replaced
 * by an admin API without changing feature code.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlagsConfig.flags[flag].enabled;
}
