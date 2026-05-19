/**
 * NOAA No-Decompression Limits (NDL) — exact hardcoded values.
 * Source: User-provided reference data. Do not derive from formula — use as lookup only.
 * Depths > 40m interpolate to 50m boundary; 50m+ requires saturation diving.
 */
export const BOTTOM_TIME_TABLE = [
  { depth: 10, bottomMinutes: 219, dive_type: 'No-decompression' },
  { depth: 15, bottomMinutes: 80,  dive_type: 'No-decompression' },
  { depth: 18, bottomMinutes: 56,  dive_type: 'No-decompression' },
  { depth: 20, bottomMinutes: 45,  dive_type: 'No-decompression' },
  { depth: 25, bottomMinutes: 30,  dive_type: 'Decompression required' },
  { depth: 30, bottomMinutes: 20,  dive_type: 'Decompression required' },
  { depth: 35, bottomMinutes: 14,  dive_type: 'Decompression required' },
  { depth: 40, bottomMinutes: 10,  dive_type: 'Decompression required' },
  { depth: 50, bottomMinutes: 0,   dive_type: 'Saturation diving required' },
];

/**
 * Returns usable NDL bottom time in minutes for a given depth.
 * Linearly interpolates between exact table entries.
 * Returns 0 for depths >= 50m (saturation diving required — entirely different cost model).
 */
export function getBottomTime(depthMetres) {
  if (depthMetres >= 50) return 0;
  const d = Math.max(10, depthMetres);

  for (let i = 0; i < BOTTOM_TIME_TABLE.length - 1; i++) {
    const a = BOTTOM_TIME_TABLE[i];
    const b = BOTTOM_TIME_TABLE[i + 1];
    if (d >= a.depth && d <= b.depth) {
      const t = (d - a.depth) / (b.depth - a.depth);
      return Math.round(a.bottomMinutes + t * (b.bottomMinutes - a.bottomMinutes));
    }
  }
  return BOTTOM_TIME_TABLE[BOTTOM_TIME_TABLE.length - 1].bottomMinutes;
}

/**
 * Returns dive type label for a given depth.
 */
export function getDiveType(depthMetres) {
  if (depthMetres >= 50) return 'Saturation diving required';
  if (depthMetres > 24) return 'Decompression required';
  return 'No-decompression (NDL)';
}

/**
 * Whether depth requires saturation diving (>= 50m).
 * At saturation, cost multiplies 5–8x vs standard commercial diving.
 */
export function requiresSaturation(depthMetres) {
  return depthMetres >= 50;
}

/**
 * Max individual dives per working diver per 8-hour shift.
 * Based on IMCA operational guidance and mandatory surface intervals.
 *  > 25m: 1 dive (extended decompression obligations on repeat dives)
 * 15–25m: 2 dives
 *  < 15m: 2 dives (NDL is long enough but shift logistics cap at 2)
 */
export function getMaxDivesPerShift(depthMetres) {
  if (depthMetres > 25) return 1;
  return 2;
}

/**
 * Inspection coverage achieved per single dive profile (per diver per dive).
 * Source: User-provided hardcoded reference data.
 *   ship_hull:         50–100 sq m  → midpoint 75
 *   dam_face:          30–60 sq m   → midpoint 45
 *   subsea_pipeline:   per km = 3–5 dive days → at 1 dive/shift/diver, 2 divers:
 *                      1000m / 4 days / 2 divers = 125 lin m per dive
 * All other types estimated from structural complexity.
 */
export function getCoveragePerDive(assetType) {
  const coverage = {
    ship_hull:         75,   // sq m per dive (50–100 midpoint)
    dam_face:          45,   // sq m per dive (30–60 midpoint)
    bridge_pier:       40,   // sq m per dive
    offshore_platform: 40,   // sq m per dive (complex structure)
    subsea_pipeline:   125,  // lin m per dive (based on 4 dive days/km, 2 divers)
    port_berth:        55,   // sq m per dive
    underwater_tunnel: 35,   // sq m per dive (enclosed, low visibility)
  };
  return coverage[assetType] ?? 45;
}

/**
 * ROV daily coverage multiplier vs. dive team daily coverage.
 * ROV has no NDL / decompression constraint — operates continuously for full shift.
 * Multiplier represents (ROV daily area) / (dive team daily area).
 * At 30m depth: diver gets 1 dive × 20 min NDL. ROV operates ~200 effective min/day.
 * Practical multiplier accounts for ROV repositioning and camera adjustment overhead.
 */
export function getROVCoverageMultiplier(assetType) {
  const multipliers = {
    ship_hull:         4.5,
    dam_face:          4.0,
    bridge_pier:       3.5,
    offshore_platform: 3.0,
    subsea_pipeline:   5.0,
    port_berth:        4.0,
    underwater_tunnel: 3.5,
  };
  return multipliers[assetType] ?? 4.0;
}

/**
 * Weather loss fraction by market and asset type (commercial diving).
 * Source: User-provided hardcoded reference data.
 * Onshore/enclosed assets (dam, tunnel) = 0%.
 */
export function getWeatherFraction(market, assetType) {
  if (['dam_face', 'underwater_tunnel'].includes(assetType)) return 0;
  if (assetType === 'ship_hull') return 0.05; // in port, minimal exposure

  const isOffshore = ['offshore_platform', 'subsea_pipeline'].includes(assetType);
  const isCoastal  = ['port_berth', 'bridge_pier'].includes(assetType);

  if (isOffshore) {
    if (market === 'europe')             return 0.35; // North Sea
    if (market === 'uae_saudi')          return 0.15; // Arabian Gulf
    if (market === 'india')              return 0.15; // Bay of Bengal / Arabian Sea
    if (market === 'singapore_malaysia') return 0.18;
    return 0.20;
  }
  if (isCoastal) {
    if (market === 'india')              return 0.20;
    if (market === 'singapore_malaysia') return 0.18;
    if (market === 'europe')             return 0.25;
    if (market === 'uae_saudi')          return 0.12;
    return 0.15;
  }
  return 0.10;
}

/**
 * ROV weather loss fraction by market for offshore deployments.
 * ROV is less weather-sensitive than diving (no decompression delays, faster deployment)
 * but still subject to vessel access constraints at offshore assets.
 * Market-specific values per user-provided reference data.
 * Non-offshore and non-coastal assets = 0%.
 */
export function getROVWeatherFraction(market, assetType) {
  const isOffshore = ['offshore_platform', 'subsea_pipeline'].includes(assetType);
  if (!isOffshore) return 0;
  if (market === 'uae_saudi')          return 0.03; // Arabian Gulf — benign conditions
  if (market === 'india')              return 0.05; // Bay of Bengal / Arabian Sea
  if (market === 'singapore_malaysia') return 0.05; // SE Asia
  if (market === 'europe')             return 0.12; // North Sea — significant swell exposure
  return 0.03; // 'other' — use UAE proxy
}
