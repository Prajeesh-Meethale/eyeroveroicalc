import {
  getBottomTime,
  getDiveType,
  requiresSaturation,
  getMaxDivesPerShift,
  getCoveragePerDive,
  getROVCoverageMultiplier,
  getWeatherFraction,
  getROVWeatherFraction,
} from './divingTables.js';
import { MARKETS, ASSET_TYPES } from './marketData.js';

/**
 * HSE incident expected cost per inspection.
 *
 * Formula (from user brief): expected cost = incident_rate × cost_per_incident × number_of_dives
 *
 * Source data:
 *   - 18 fatalities per 10,000 divers per year (industry statistic)
 *   - Reportable incident rate ≈ 10× fatality rate = 180/10,000/year = 1.8% per diver-year
 *   - Rate per diver per 200 working days = 0.018/200 = 0.00009 per diver-day
 *   - Number of dives = rawDiveDays × divesPerShift × 2 working divers
 *   - Default incident cost: $75,000 (range $45,000–120,000)
 *
 * @param {number} rawDiveDays
 * @param {number} depthMetres
 * @param {number} incidentCostLocal - $75,000 converted to local currency
 * @returns {number} expected HSE provision in local currency
 */
function calcHSEProvision(rawDiveDays, depthMetres, incidentCostLocal) {
  const INCIDENT_RATE_PER_DIVER_DAY = 0.018 / 200; // 1.8% per diver-year ÷ 200 working days
  const divesPerShift = getMaxDivesPerShift(depthMetres);
  const numDives = rawDiveDays * divesPerShift * 2; // 2 working divers
  return numDives * INCIDENT_RATE_PER_DIVER_DAY * incidentCostLocal;
}

/**
 * Master calculation function.
 * Returns a full cost breakdown for both Diving and ROV inspection methods.
 *
 * @param {Object} inputs - User-provided inputs from the form
 * @returns {Object} - Full cost model results
 */
export function calculateROI(inputs) {
  const {
    assetType,
    depthMetres,
    inspectionArea,
    inspectionsPerYear,
    market,
    assetDailyValue,
    includeHSERisk,
    rovCapitalCost,
    isRaaS,
  } = inputs;

  const m = MARKETS[market];
  const assetInfo = ASSET_TYPES.find(a => a.id === assetType);

  const isSaturation = requiresSaturation(depthMetres);
  // Saturation diving cost multiplier: 5–8× standard commercial diving; use 6× midpoint
  const saturationMultiplier = isSaturation ? 6 : 1;

  // ─── DIVING CALCULATION ─────────────────────────────────────────────────────

  const bottomTimePerDive = getBottomTime(depthMetres);
  const divesPerShift = getMaxDivesPerShift(depthMetres);
  const coveragePerDiveUnit = getCoveragePerDive(assetType); // sq m or lin m per dive per diver

  // Daily coverage: each of 2 working divers does divesPerShift dives, each covering coveragePerDiveUnit
  const dailyCoverage = divesPerShift * coveragePerDiveUnit * 2;

  // Raw dive days needed (no weather adjustment yet)
  const rawDiveDays = Math.ceil(inspectionArea / Math.max(dailyCoverage, 1));

  // Weather fraction depends on asset type and market (hardcoded reference data)
  const weatherFraction = getWeatherFraction(market, assetType);
  const diveDaysWithWeather = weatherFraction > 0
    ? Math.ceil(rawDiveDays / (1 - weatherFraction))
    : rawDiveDays;
  const weatherLostDays = diveDaysWithWeather - rawDiveDays;

  // ── Crew cost (mandatory crew by regulation — hardcoded in marketData.js)
  const { workers, standby, supervisor, lifeSupport } = m.diving.crewSize;
  const crewDayRate =
    workers     * m.diving.diverDayRate       +
    standby     * m.diving.standbyDayRate     +
    supervisor  * m.diving.supervisorDayRate  +
    lifeSupport * m.diving.lifeSupportDayRate;

  // Apply saturation multiplier to crew cost (saturation requires specialist teams)
  const crewCost = crewDayRate * diveDaysWithWeather * saturationMultiplier;

  // ── Mobilisation (per inspection event)
  const mobilisationDiving = m.diving.mobilisationBase * saturationMultiplier;

  // ── Equipment
  const equipmentCost = m.diving.equipmentDayRate * diveDaysWithWeather * saturationMultiplier;

  // ── Vessel (only for offshore/pipeline assets)
  const needsVessel = assetInfo?.needsVessel ?? false;
  const vesselCost = needsVessel ? m.diving.vesselDayRate * diveDaysWithWeather : 0;

  // ── Weather delay cost (crew + vessel idle during lost days)
  const weatherDelayCost = crewDayRate * weatherLostDays
    + (needsVessel ? m.diving.vesselDayRate * weatherLostDays : 0);

  // ── HSE incident provision
  // Incident cost $75,000 USD converted to local currency
  const incidentCostLocal = 75000 * m.usdRate;
  const hseProvision = includeHSERisk
    ? calcHSEProvision(rawDiveDays, depthMetres, incidentCostLocal)
    : 0;

  // ── Downtime cost (if user supplied asset daily value)
  const downtimeCostDiving = assetDailyValue > 0
    ? assetDailyValue * diveDaysWithWeather
    : 0;

  const totalDivingPerInspection =
    crewCost + mobilisationDiving + equipmentCost + vesselCost + hseProvision;
  const totalDivingAnnual = totalDivingPerInspection * inspectionsPerYear;

  // ─── ROV CALCULATION ────────────────────────────────────────────────────────

  const rovMultiplier    = getROVCoverageMultiplier(assetType);
  const rovDailyCoverage = dailyCoverage * rovMultiplier;
  const rovDaysNeeded    = Math.ceil(inspectionArea / Math.max(rovDailyCoverage, 1));
  // ROV weather fraction: market-specific for offshore assets (Fix 4)
  const rovWeatherFraction = getROVWeatherFraction(market, assetType);
  const rovActualDays = rovWeatherFraction > 0
    ? Math.ceil(rovDaysNeeded / (1 - rovWeatherFraction))
    : rovDaysNeeded;

  const rovCrewCost      = m.rov.operatorDayRate * rovActualDays;
  const rovMobilisation  = m.rov.mobilisationBase;
  const rovEquipmentCost = m.rov.dayRate * rovActualDays;
  // ROV vessel: only for offshore/pipeline assets, at 40% of diving vessel day rate
  const rovVesselCost    = needsVessel ? m.rov.vesselDayRate * rovActualDays : 0;
  const downtimeCostROV  = assetDailyValue > 0 ? assetDailyValue * rovActualDays : 0;

  const totalROVPerInspection = rovCrewCost + rovMobilisation + rovEquipmentCost + rovVesselCost;
  const totalROVAnnual = totalROVPerInspection * inspectionsPerYear;

  // ─── SCENARIOS ──────────────────────────────────────────────────────────────
  // Diving: ±25% realistic range (weather variance, crew rates, incident probability)
  const divingBestCase    = totalDivingPerInspection * 0.78;
  const divingMostLikely  = totalDivingPerInspection;
  const divingWorstCase   = totalDivingPerInspection * 1.38;

  // ROV: ±8% — predictable, no weather/decompression variance
  const rovBestCase    = totalROVPerInspection * 0.94;
  const rovMostLikely  = totalROVPerInspection;
  const rovWorstCase   = totalROVPerInspection * 1.08;

  // ─── BREAK-EVEN ───────────────────────────────────────────────────────────
  const savingPerInspection = divingMostLikely - rovMostLikely;
  // RaaS: no capital barrier — break-even is inspection #1
  // Purchase: ceil(rovCapitalCost / savingPerInspection)
  const effectiveCapitalCost = isRaaS ? 0 : (rovCapitalCost || m.rov.capitalCostDefault);
  const breakEvenInspections = isRaaS
    ? 1
    : (savingPerInspection > 0
        ? Math.max(1, Math.ceil(effectiveCapitalCost / savingPerInspection))
        : null);

  const breakEvenData = Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return {
      inspection: n,
      diving:       Math.round(divingMostLikely * n),
      rov:          Math.round(rovMostLikely * n),
      divingBest:   Math.round(divingBestCase * n),
      divingWorst:  Math.round(divingWorstCase * n),
      rovBest:      Math.round(rovBestCase * n),
      rovWorst:     Math.round(rovWorstCase * n),
    };
  });

  // ─── WATERFALL DATA ──────────────────────────────────────────────────────────
  const waterfallData = [
    { name: 'Crew',           diving: Math.round(crewCost),                    rov: Math.round(rovCrewCost) },
    { name: 'Mobilisation',   diving: Math.round(mobilisationDiving),          rov: Math.round(rovMobilisation) },
    { name: 'Equipment',      diving: Math.round(equipmentCost + vesselCost),  rov: Math.round(rovEquipmentCost + rovVesselCost) },
    { name: 'Weather Delay',  diving: Math.round(weatherDelayCost),            rov: 0 },
    ...(includeHSERisk ? [{ name: 'HSE Risk', diving: Math.round(hseProvision), rov: 0 }] : []),
    ...(assetDailyValue > 0 ? [{
      name: 'Asset Downtime',
      diving: Math.round(downtimeCostDiving),
      rov:    Math.round(downtimeCostROV),
    }] : []),
  ];

  // HSE formula breakdown for display in assumptions panel
  const divesPerShiftVal = getMaxDivesPerShift(depthMetres);
  const totalDivesForHSE = rawDiveDays * divesPerShiftVal * 2;
  const ratePerDive = 0.018 / 200;

  return {
    params: {
      depthMetres,
      bottomTimePerDive,
      diveType: getDiveType(depthMetres),
      isSaturation,
      saturationMultiplier,
      divesPerShift,
      coveragePerDive: coveragePerDiveUnit,
      dailyCoverage: Math.round(dailyCoverage),
      rawDiveDays,
      diveDaysWithWeather,
      weatherLostDays,
      weatherFraction,
      crewComposition: m.diving.crewLabel,
      regulation: m.regulation,
      regulationFull: m.regulationFull,
      rovDaysNeeded,
      rovActualDays,
      rovWeatherFraction,
      rovMultiplier,
      needsVessel,
      rovVesselCost: Math.round(rovVesselCost),
      assetType,
      market,
      isRaaS,
      effectiveCapitalCost: Math.round(effectiveCapitalCost),
      rovDayRateLabel: m.rov.dayRateLabel,
      rovDayRateRangeUSD: m.rov.dayRateRangeUSD,
      // HSE formula display
      hseFormula: `${totalDivesForHSE} dives × ${(ratePerDive * 100).toFixed(4)}%/dive × ${formatLocalCurrency(incidentCostLocal, m.symbol)} incident cost`,
    },

    diving: {
      crewCost:         Math.round(crewCost),
      mobilisation:     Math.round(mobilisationDiving),
      equipment:        Math.round(equipmentCost + vesselCost),
      weatherDelayCost: Math.round(weatherDelayCost),
      hseProvision:     Math.round(hseProvision),
      downtimeCost:     Math.round(downtimeCostDiving),
      total:            Math.round(totalDivingPerInspection),
      totalWithDowntime: Math.round(totalDivingPerInspection + downtimeCostDiving),
      annual:           Math.round(totalDivingAnnual),
      bestCase:         Math.round(divingBestCase),
      mostLikely:       Math.round(divingMostLikely),
      worstCase:        Math.round(divingWorstCase),
    },

    rov: {
      crewCost:         Math.round(rovCrewCost),
      mobilisation:     Math.round(rovMobilisation),
      equipment:        Math.round(rovEquipmentCost + rovVesselCost),
      weatherDelayCost: 0,
      hseProvision:     0,
      downtimeCost:     Math.round(downtimeCostROV),
      total:            Math.round(totalROVPerInspection),
      totalWithDowntime: Math.round(totalROVPerInspection + downtimeCostROV),
      annual:           Math.round(totalROVAnnual),
      bestCase:         Math.round(rovBestCase),
      mostLikely:       Math.round(rovMostLikely),
      worstCase:        Math.round(rovWorstCase),
    },

    savings: {
      perInspection:        Math.round(divingMostLikely - rovMostLikely),
      annual:               Math.round(totalDivingAnnual - totalROVAnnual),
      percentage:           Math.round(((divingMostLikely - rovMostLikely) / Math.max(divingMostLikely, 1)) * 100),
      breakEvenInspections,
      downtimeSaving:       Math.round(downtimeCostDiving - downtimeCostROV),
    },

    waterfallData,
    breakEvenData,
    inspectionsPerYear,
    assetDailyValue,
  };
}

function formatLocalCurrency(value, symbol) {
  if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}K`;
  return `${symbol}${Math.round(value).toLocaleString()}`;
}
