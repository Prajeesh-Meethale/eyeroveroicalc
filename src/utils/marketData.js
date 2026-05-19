/**
 * Market-specific cost parameters, regulatory frameworks, and currency settings.
 *
 * DAY RATES — hardcoded from user-provided reference data (USD midpoints):
 *   India:              $200/diver/day  (range $150–250)
 *   UAE / Saudi Arabia: $550/diver/day  (range $400–700)
 *   Singapore:          $450/diver/day  (range $350–550)
 *   Europe:             $800/diver/day  (range $600–1,000)
 * All rates converted to local currency at exchange rates below.
 *
 * MOBILISATION — hardcoded midpoints per inspection event:
 *   India domestic:  $1,150   (range $800–1,500)
 *   MENA:            $4,500   (range $3,000–6,000)
 *   SE Asia:         $3,750   (range $2,500–5,000)
 *   Europe:          $6,000   (range $4,000–8,000)
 *
 * CREW — mandatory minimum by regulation (hardcoded):
 *   IMCA D 014:  5 (2 working + 1 standby + 1 supervisor + 1 life support technician)
 *   DGMS:        4 (2 working + 1 standby + 1 supervisor)
 *   HSE ACOP:    5 (same as IMCA)
 *   MOM WSH:     4 (same as DGMS)
 *
 * ROV RATES — indicative placeholder, labelled as such:
 *   $800–1,200/day → $1,000 midpoint used.
 *   Label: "indicative EyeROV RaaS rate — contact for exact quote"
 */

export const MARKETS = {
  india: {
    label: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    symbol: '₹',
    usdRate: 83.5,
    regulation: 'DGMS',
    regulationFull: 'Directorate General of Mines Safety (DGMS)',

    diving: {
      // $200/day × 83.5 = ₹16,700 per working diver
      diverDayRate:    16700,
      // standby diver ~$180/day
      standbyDayRate:  15030,
      // supervisor ~$300/day
      supervisorDayRate: 25050,
      // life support technician not required under DGMS
      lifeSupportDayRate: 0,
      // DGMS mandatory minimum: 2 working + 1 standby + 1 supervisor = 4
      crewSize: { workers: 2, standby: 1, supervisor: 1, lifeSupport: 0 },
      crewLabel: '2 working divers + 1 standby + 1 supervisor (DGMS minimum = 4)',
      // Mobilisation: $1,150 midpoint × 83.5
      mobilisationBase: 96025,
      vesselDayRate: 80000,
      equipmentDayRate: 20000,
    },

    rov: {
      // $1,000/day × 83.5 — INDICATIVE
      dayRate: 83500,
      dayRateLabel: 'indicative EyeROV RaaS rate — contact for exact quote',
      dayRateRangeUSD: '$800–1,200/day',
      // Single operator ~$150/day × 83.5
      operatorDayRate: 12525,
      // Domestic mobilisation: $650 midpoint × 83.5
      mobilisationBase: 54275,
      // Vessel: 40% of diving vessel rate (80,000 × 0.4)
      vesselDayRate: 32000,
      // Capital purchase default: ₹55,00,000 (indicative EyeROV purchase price)
      capitalCostDefault: 5500000,
    },
  },

  uae_saudi: {
    label: 'UAE / Saudi Arabia',
    flag: '🇦🇪',
    currency: 'USD',
    symbol: '$',
    usdRate: 1,
    regulation: 'ADNOC/IMCA',
    regulationFull: 'ADNOC HSE Standards & IMCA D 014',

    diving: {
      // $550/day per working diver (midpoint $400–700)
      diverDayRate:    550,
      standbyDayRate:  500,
      supervisorDayRate: 800,
      // IMCA D 014 requires life support technician
      lifeSupportDayRate: 600,
      // IMCA mandatory minimum: 2 working + 1 standby + 1 supervisor + 1 life support = 5
      crewSize: { workers: 2, standby: 1, supervisor: 1, lifeSupport: 1 },
      crewLabel: '2 working divers + 1 standby + 1 supervisor + 1 life support technician (IMCA D 014 minimum = 5)',
      // Mobilisation: $4,500 midpoint
      mobilisationBase: 4500,
      vesselDayRate: 6000,
      equipmentDayRate: 1600,
    },

    rov: {
      // $1,000/day — INDICATIVE
      dayRate: 1000,
      dayRateLabel: 'indicative EyeROV RaaS rate — contact for exact quote',
      dayRateRangeUSD: '$800–1,200/day',
      // Single operator ~$400/day
      operatorDayRate: 400,
      // International mobilisation: $1,500
      mobilisationBase: 1500,
      // Vessel: 40% of diving vessel rate (6,000 × 0.4)
      vesselDayRate: 2400,
      // Capital purchase default: $65,000 (indicative EyeROV purchase price)
      capitalCostDefault: 65000,
    },
  },

  singapore_malaysia: {
    label: 'Singapore / Malaysia',
    flag: '🇸🇬',
    currency: 'SGD',
    symbol: 'S$',
    usdRate: 1.35,
    regulation: 'MOM',
    regulationFull: 'Ministry of Manpower (MOM) WSH Act',

    diving: {
      // $450/day × 1.35 = S$607 per working diver (midpoint $350–550)
      diverDayRate:    607,
      standbyDayRate:  540,
      supervisorDayRate: 877,
      // MOM WSH: 4 crew — no life support technician mandatory
      lifeSupportDayRate: 0,
      // MOM mandatory minimum: 2 working + 1 standby + 1 supervisor = 4
      crewSize: { workers: 2, standby: 1, supervisor: 1, lifeSupport: 0 },
      crewLabel: '2 working divers + 1 standby + 1 supervisor (MOM WSH minimum = 4)',
      // Mobilisation: $3,750 × 1.35 = S$5,062
      mobilisationBase: 5062,
      vesselDayRate: 6750,
      equipmentDayRate: 2025,
    },

    rov: {
      // $1,000/day × 1.35 = S$1,350 — INDICATIVE
      dayRate: 1350,
      dayRateLabel: 'indicative EyeROV RaaS rate — contact for exact quote',
      dayRateRangeUSD: '$800–1,200/day',
      // Single operator ~$350/day × 1.35
      operatorDayRate: 472,
      // International mobilisation: $1,200 × 1.35
      mobilisationBase: 1620,
      // Vessel: 40% of diving vessel rate (6,750 × 0.4)
      vesselDayRate: 2700,
      // Capital purchase default: $65,000 × 1.35 = S$87,750
      capitalCostDefault: 87750,
    },
  },

  europe: {
    label: 'Europe',
    flag: '🇪🇺',
    currency: 'EUR',
    symbol: '€',
    usdRate: 0.92,
    regulation: 'HSE',
    regulationFull: 'UK HSE ACOP L107 (Diving at Work Regulations 1997)',

    diving: {
      // $800/day × 0.92 = €736 per working diver (midpoint $600–1,000)
      diverDayRate:    736,
      standbyDayRate:  644,
      supervisorDayRate: 1012,
      // HSE ACOP: same as IMCA — life support technician required
      lifeSupportDayRate: 782,
      // HSE ACOP mandatory minimum: 2 working + 1 standby + 1 supervisor + 1 life support = 5
      crewSize: { workers: 2, standby: 1, supervisor: 1, lifeSupport: 1 },
      crewLabel: '2 working divers + 1 standby + 1 supervisor + 1 life support technician (HSE ACOP minimum = 5)',
      // Mobilisation: $6,000 × 0.92 = €5,520
      mobilisationBase: 5520,
      vesselDayRate: 9200,
      equipmentDayRate: 2760,
    },

    rov: {
      // $1,000/day × 0.92 = €920 — INDICATIVE
      dayRate: 920,
      dayRateLabel: 'indicative EyeROV RaaS rate — contact for exact quote',
      dayRateRangeUSD: '$800–1,200/day',
      // Single operator ~$600/day × 0.92
      operatorDayRate: 552,
      // International mobilisation: $2,000 × 0.92
      mobilisationBase: 1840,
      // Vessel: 40% of diving vessel rate (9,200 × 0.4)
      vesselDayRate: 3680,
      // Capital purchase default: $65,000 × 0.92 = €59,800
      capitalCostDefault: 59800,
    },
  },

  other: {
    label: 'Other',
    flag: '🌐',
    currency: 'USD',
    symbol: '$',
    usdRate: 1,
    regulation: 'IMCA',
    regulationFull: 'IMCA D 014 International Diving Standards',

    diving: {
      // Use UAE/Saudi midpoint as proxy
      diverDayRate:    550,
      standbyDayRate:  500,
      supervisorDayRate: 800,
      lifeSupportDayRate: 600,
      crewSize: { workers: 2, standby: 1, supervisor: 1, lifeSupport: 1 },
      crewLabel: '2 working divers + 1 standby + 1 supervisor + 1 life support technician (IMCA D 014 minimum = 5)',
      mobilisationBase: 4500,
      vesselDayRate: 5500,
      equipmentDayRate: 1500,
    },

    rov: {
      dayRate: 1000,
      dayRateLabel: 'indicative EyeROV RaaS rate — contact for exact quote',
      dayRateRangeUSD: '$800–1,200/day',
      operatorDayRate: 400,
      mobilisationBase: 1500,
      // Vessel: 40% of diving vessel rate (5,500 × 0.4)
      vesselDayRate: 2200,
      // Capital purchase default: $65,000
      capitalCostDefault: 65000,
    },
  },
};

export const ASSET_TYPES = [
  { id: 'dam_face',          label: 'Dam Face',              icon: '🏗️', unit: 'sq m',  needsVessel: false },
  { id: 'bridge_pier',       label: 'Bridge Pier',           icon: '🌉', unit: 'sq m',  needsVessel: false },
  { id: 'ship_hull',         label: 'Ship Hull',             icon: '🚢', unit: 'sq m',  needsVessel: false },
  { id: 'offshore_platform', label: 'Offshore Oil Platform', icon: '🛢️', unit: 'sq m',  needsVessel: true  },
  { id: 'subsea_pipeline',   label: 'Subsea Pipeline',       icon: '🔩', unit: 'lin m', needsVessel: true  },
  { id: 'port_berth',        label: 'Port Berth Structure',  icon: '⚓', unit: 'sq m',  needsVessel: false },
  { id: 'underwater_tunnel', label: 'Underwater Tunnel',     icon: '🕳️', unit: 'sq m',  needsVessel: false },
];

export function formatCurrency(value, market, compact = false) {
  const m = MARKETS[market];
  const num = Math.round(value);
  if (compact && num >= 1000000) {
    return `${m.symbol}${(num / 1000000).toFixed(2)}M`;
  }
  if (compact && num >= 100000) {
    return `${m.symbol}${(num / 1000).toFixed(0)}K`;
  }
  return `${m.symbol}${num.toLocaleString()}`;
}

export function formatCurrencyUSD(value, market) {
  const m = MARKETS[market];
  const inUSD = value / m.usdRate;
  if (inUSD >= 1000000) return `$${(inUSD / 1000000).toFixed(2)}M USD`;
  if (inUSD >= 1000) return `$${(inUSD / 1000).toFixed(0)}K USD`;
  return `$${Math.round(inUSD).toLocaleString()} USD`;
}
