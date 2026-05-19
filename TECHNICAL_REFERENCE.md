# EyeROV ROI Calculator — Full Technical Reference

> **Purpose:** Independent verification document. Every formula, lookup table, constant, and assumption used in the calculator is listed here with its source and rationale. If any number in this document is wrong, the corresponding output will be wrong — check these first.

---

## 1. Tech Stack

| Layer | Library / Tool | Version |
|---|---|---|
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| Charts | Recharts | 2.x |
| Icons | Lucide React | latest |
| Lead capture | Formspree POST | — |
| Runtime | Client-side JS only | No backend |

**Project path:** `c:\Users\Prajeesh\Downloads\EyeRov\eyerov-roi`

**Dev server:** `npm run dev` → http://localhost:5173

**Production build:** `npm run build` → outputs to `dist/`

**Lead capture endpoint:** `https://formspree.io/f/YOUR_FORM_ID` — replace `YOUR_FORM_ID` in `src/components/LeadCapture.jsx` with a real Formspree form ID.

---

## 2. Source Files

```
src/
  utils/
    divingTables.js       — NDL table, coverage rates, weather fractions
    marketData.js         — crew costs, day rates, mobilisation, ROV rates
    calculationEngine.js  — master calculation function calculateROI(inputs)
  components/
    InputForm.jsx         — 3-step user input form
    ResultsDashboard.jsx  — tabbed output with assumptions panel
    CostWaterfallChart.jsx — Recharts grouped bar chart
    BreakevenChart.jsx    — Recharts area chart with break-even reference
    LeadCapture.jsx       — modal lead form (Formspree POST)
  App.jsx                 — app shell, state management
```

---

## 3. NOAA No-Decompression Limits (NDL Table)

**Status: Hardcoded exact values. Do not derive from formula.**

Source: User-provided reference data (NOAA Diving Manual standard NDL limits).

| Depth (m) | Max bottom time (min) | Classification |
|---|---|---|
| 10 | 219 | No-decompression |
| 15 | 80 | No-decompression |
| 18 | 56 | No-decompression |
| 20 | 45 | No-decompression |
| 25 | 30 | Decompression required |
| 30 | 20 | Decompression required |
| 35 | 14 | Decompression required |
| 40 | 10 | Decompression required |
| 50+ | 0 | Saturation diving required |

**Interpolation rule:** Linear interpolation between adjacent table entries. Example: depth 22m → `45 + (22-20)/(25-20) × (30-45) = 45 - 6 = 39 min`.

**Saturation boundary:** Depth ≥ 50m triggers `requiresSaturation()` → 6× cost multiplier applied (see §10).

---

## 4. Max Dives Per Shift

**Status: IMCA operational guidance, hardcoded.**

| Depth range | Max dives per working diver per 8-hour shift |
|---|---|
| ≤ 25m | 2 dives |
| > 25m | 1 dive |

Rationale: Above 25m, decompression obligations on repeat dives within a shift require extended surface intervals that preclude a second dive within an 8-hour window. Below 25m, NDL is long enough to allow 2 dives with a standard surface interval.

---

## 5. Inspection Coverage Per Dive Session

**Status: Hardcoded reference data. Values are midpoints of stated ranges.**

Coverage per dive = area (or length) a single working diver inspects per dive profile.

| Asset type | Coverage per dive | Unit | Source range |
|---|---|---|---|
| Ship hull | 75 | sq m/dive | 50–100 sq m per dive session |
| Dam face | 45 | sq m/dive | 30–60 sq m per dive session |
| Bridge pier | 40 | sq m/dive | Estimated |
| Offshore oil platform | 40 | sq m/dive | Estimated (complex structure) |
| Subsea pipeline | 125 | lin m/dive | Derived: 1000m ÷ 4 dive-days ÷ 2 divers |
| Port berth structure | 55 | sq m/dive | Estimated |
| Underwater tunnel | 35 | sq m/dive | Estimated (enclosed, low visibility) |

**Pipeline derivation:** User reference states "per km = 3–5 dive days" → use 4 days/km midpoint. With 2 working divers rotating and 1 dive each per shift (depth > 25m assumed): 1000m ÷ 4 days ÷ 2 divers = **125 lin m per dive**.

---

## 6. ROV Coverage Multiplier

**Status: Estimated assumption. Labelled as such.**

Rationale: ROV has no NDL / decompression constraint. At 30m a diver gets 20 min NDL; ROV operates ~200 effective min/day (480 min less repositioning/hovering overhead). Practical coverage ratio is lower than the theoretical time ratio due to ROV manoeuvrability vs diver agility on certain structures.

| Asset type | ROV multiplier vs dive team |
|---|---|
| Ship hull | 4.5× |
| Dam face | 4.0× |
| Bridge pier | 3.5× |
| Offshore platform | 3.0× |
| Subsea pipeline | 5.0× |
| Port berth | 4.0× |
| Underwater tunnel | 3.5× |

---

## 7. Mandatory Crew by Regulation

**Status: Hardcoded exact values.**

Source: User-provided reference data.

| Regulation | Market | Min crew | Breakdown |
|---|---|---|---|
| IMCA D 014 | International / MENA | 5 | 2 working + 1 standby + 1 supervisor + 1 life support technician |
| Indian DGMS | India | 4 | 2 working + 1 standby + 1 supervisor |
| HSE ACOP L107 | UK / Europe | 5 | Same as IMCA D 014 |
| MOM WSH Act | Singapore / Malaysia | 4 | Same as DGMS |

---

## 8. Commercial Diver Day Rates (USD Midpoints)

**Status: Hardcoded from user-provided reference data. Midpoints used as defaults.**

### India (DGMS — 4 crew)
Converted at USD/INR = 83.5

| Role | USD/day | INR/day |
|---|---|---|
| Working diver | $200 (range $150–250) | ₹16,700 |
| Standby diver | ~$180 | ₹15,030 |
| Supervisor | ~$300 | ₹25,050 |
| Life support tech | Not required (DGMS) | ₹0 |
| **Total crew day rate** | | **₹81,460** |

### UAE / Saudi Arabia (IMCA D 014 — 5 crew)
Converted at USD = 1.0 (base currency)

| Role | USD/day |
|---|---|
| Working diver (×2) | $550 each (range $400–700) |
| Standby diver | $500 |
| Supervisor | $800 |
| Life support tech | $600 |
| **Total crew day rate** | **$3,000** |

### Singapore / Malaysia (MOM WSH — 4 crew)
Converted at USD/SGD = 1.35

| Role | USD/day | SGD/day |
|---|---|---|
| Working diver | $450 (range $350–550) | S$607 |
| Standby diver | ~$400 | S$540 |
| Supervisor | ~$650 | S$877 |
| Life support tech | Not required (MOM) | S$0 |
| **Total crew day rate** | | **S$2,631** |

### Europe (HSE ACOP — 5 crew)
Converted at USD/EUR = 0.92

| Role | USD/day | EUR/day |
|---|---|---|
| Working diver (×2) | $800 each (range $600–1,000) | €736 |
| Standby diver | ~$700 | €644 |
| Supervisor | ~$1,100 | €1,012 |
| Life support tech | ~$850 | €782 |
| **Total crew day rate** | | **€3,910** |

---

## 9. Mobilisation Costs (Per Inspection Event)

**Status: Hardcoded midpoints from user-provided reference data.**

| Market | USD midpoint | Local currency | USD range |
|---|---|---|---|
| India domestic | $1,150 | ₹96,025 | $800–1,500 |
| UAE / Saudi Arabia | $4,500 | $4,500 | $3,000–6,000 |
| Singapore / Malaysia | $3,750 | S$5,062 | $2,500–5,000 |
| Europe | $6,000 | €5,520 | $4,000–8,000 |

Covers: travel, equipment shipping, customs, pre-dive mobilisation time.

---

## 10. Other Dive Costs (Estimated Assumptions)

**Status: Estimated. Labelled as assumptions in the UI.**

### Vessel day rates (offshore/pipeline assets only)

| Market | Local currency/day |
|---|---|
| India | ₹80,000 |
| UAE / Saudi | $6,000 |
| Singapore | S$6,750 |
| Europe | €9,200 |

### Equipment day rates

| Market | Local currency/day |
|---|---|
| India | ₹20,000 |
| UAE / Saudi | $1,600 |
| Singapore | S$2,025 |
| Europe | €2,760 |

---

## 11. Weather Downtime Fractions

**Status: Hardcoded from user-provided reference data.**

Fraction of planned offshore dive days lost to weather / sea state. Onshore/enclosed assets always = 0%.

| Asset type | Region | Fraction | % |
|---|---|---|---|
| Offshore platform / pipeline | North Sea (Europe) | 0.35 | 35% |
| Offshore platform / pipeline | Arabian Gulf (UAE) | 0.15 | 15% |
| Offshore platform / pipeline | India (Bay of Bengal) | 0.15 | 15% |
| Offshore platform / pipeline | SE Asia | 0.18 | 18% |
| Port berth / bridge pier | India | 0.20 | 20% |
| Port berth / bridge pier | SE Asia | 0.18 | 18% |
| Port berth / bridge pier | Europe | 0.25 | 25% |
| Port berth / bridge pier | UAE | 0.12 | 12% |
| Ship hull | Any | 0.05 | 5% (in port) |
| Dam face / underwater tunnel | Any | 0.00 | 0% (inland) |

### ROV Weather Downtime Fractions (offshore/pipeline assets only)

**Status: Hardcoded from user-provided reference data. Market-specific.**

ROV has lower weather exposure than diving (no decompression delays, faster to deploy/recover), but offshore vessel access still creates a residual risk fraction.

| Region | Fraction | % |
|---|---|---|
| UAE / Saudi Arabia (Arabian Gulf) | 0.03 | 3% |
| India (Bay of Bengal / Arabian Sea) | 0.05 | 5% |
| Singapore / SE Asia | 0.05 | 5% |
| Europe (North Sea) | 0.12 | 12% |
| Other | 0.03 | 3% (UAE proxy) |
| Non-offshore / non-coastal | 0.00 | 0% |

---

## 12. HSE Incident Risk Provision

**Status: Calculated from hardcoded rate × cost formula. Toggleable.**

Formula: `expected_cost = num_dives × rate_per_dive × incident_cost_local`

Where:
- `num_dives = rawDiveDays × divesPerShift × 2_working_divers`
- `rate_per_dive = 0.018 / 200`
  - 18 fatalities per 10,000 divers per year (industry statistic)
  - Reportable incident rate ≈ 10× fatality rate = 180/10,000/year = **1.8% per diver-year**
  - Divided by 200 working days/year = **0.009% per diver-day**
  - Per dive (1 dive/day at depth > 25m) = 0.009% per dive
- `incident_cost_local = $75,000 USD × market_usd_rate`
  - Default: $75,000 (range $45,000–$120,000 per user brief)
  - Covers: investigation, compensation, project delay

**Example (30m depth, 5 raw dive days, India):**
- num_dives = 5 × 1 dive/shift × 2 divers = 10 dives
- rate_per_dive = 0.018/200 = 0.00009
- incident_cost_local = $75,000 × 83.5 = ₹6,262,500
- expected_HSE = 10 × 0.00009 × ₹6,262,500 = **₹5,636**

Note: The HSE provision is intentionally a small number relative to crew/mobilisation costs at typical inspection depths. It grows larger at saturation depths with many dive days.

---

## 13. ROV Cost Parameters

**Status: Indicative placeholder. Labelled as such in the UI.**

All ROV rates carry the label: *"indicative EyeROV RaaS rate — contact for exact quote"*

### ROV day rate (equipment)

| Market | USD/day | Local currency/day | Source range |
|---|---|---|---|
| India | $1,000 | ₹83,500 | $800–1,200/day |
| UAE / Saudi | $1,000 | $1,000 | $800–1,200/day |
| Singapore | $1,000 | S$1,350 | $800–1,200/day |
| Europe | $1,000 | €920 | $800–1,200/day |

### ROV operator (single person)

| Market | Local currency/day |
|---|---|
| India | ₹12,525 (~$150/day) |
| UAE / Saudi | $400/day |
| Singapore | S$472 (~$350/day) |
| Europe | €552 (~$600/day) |

### ROV mobilisation (per inspection event)

| Market | Local currency | USD equiv |
|---|---|---|
| India | ₹54,275 | ~$650 (domestic) |
| UAE / Saudi | $1,500 | international |
| Singapore | S$1,620 | ~$1,200 international |
| Europe | €1,840 | ~$2,000 international |

### ROV vessel day rate (offshore/pipeline assets only — 40% of diving vessel rate)

| Market | Local currency/day | Basis |
|---|---|---|
| India | ₹32,000 | 40% × ₹80,000 |
| UAE / Saudi | $2,400 | 40% × $6,000 |
| Singapore | S$2,700 | 40% × S$6,750 |
| Europe | €3,680 | 40% × €9,200 |
| Other | $2,200 | 40% × $5,500 |

Rationale: ROV requires a smaller workboat/support vessel vs. the full dive support vessel.

### ROV capital purchase price (default for break-even calculation)

**Label in UI:** *“indicative EyeROV purchase price — contact for exact quote”*

| Market | Local currency | USD equiv |
|---|---|---|
| India | ₹55,00,000 (₹55 lakh) | ~$65,900 |
| UAE / Saudi | $65,000 | $65,000 |
| Singapore | S$87,750 | ~$65,000 |
| Europe | €59,800 | ~$65,000 |
| Other | $65,000 | $65,000 |

User can override the default in the Financial Parameters step. If **RaaS Model** toggle is on, capital cost is ignored and break-even defaults to 1st inspection.

---

## 14. Calculation Engine — Step by Step

File: `src/utils/calculationEngine.js`, function: `calculateROI(inputs)`

### Input variables

| Variable | Type | Description |
|---|---|---|
| `assetType` | string | One of the 7 asset IDs |
| `depthMetres` | number | Inspection depth in metres |
| `inspectionArea` | number | sq m (most assets) or lin m (pipeline) |
| `inspectionsPerYear` | number | Annual inspection frequency |
| `market` | string | One of: india, uae_saudi, singapore_malaysia, europe, other |
| `assetDailyValue` | number | Optional: daily revenue/cost of asset being offline |
| `includeHSERisk` | boolean | Toggle HSE provision line item |
| `rovCapitalCost` | number | EyeROV purchase price; defaults to market value from §13 |
| `isRaaS` | boolean | If true, break-even = 1st inspection (no capital purchase) |

---

### Step 1 — Saturation check

```
isSaturation = (depthMetres >= 50)
saturationMultiplier = isSaturation ? 6 : 1
```

If saturation: crew cost, mobilisation, and equipment costs are multiplied by 6 (midpoint of 5–8× stated range).

---

### Step 2 — Dive parameters

```
bottomTimePerDive = getBottomTime(depthMetres)    // NOAA NDL table lookup
divesPerShift     = getMaxDivesPerShift(depthMetres)  // 1 if depth > 25m, else 2
coveragePerDive   = getCoveragePerDive(assetType)  // sq m or lin m per dive
```

---

### Step 3 — Daily coverage (dive team)

```
dailyCoverage = divesPerShift × coveragePerDive × 2
```

The `× 2` accounts for both working divers rotating through dives. Only one diver is in the water at any time, but both contribute dives over a shift.

**Example (ship hull, 30m depth):**
- `divesPerShift = 1` (depth > 25m)
- `coveragePerDive = 75 sq m`
- `dailyCoverage = 1 × 75 × 2 = 150 sq m/day`

---

### Step 4 — Raw dive days

```
rawDiveDays = ceil(inspectionArea / dailyCoverage)
```

No weather or overhead adjustment yet.

**Example (ship hull 500 sq m, 30m):**
- `rawDiveDays = ceil(500 / 150) = ceil(3.33) = 4 days`

---

### Step 5 — Weather adjustment

```
weatherFraction     = getWeatherFraction(market, assetType)  // from §11
diveDaysWithWeather = weatherFraction > 0 ? ceil(rawDiveDays / (1 - weatherFraction)) : rawDiveDays
weatherLostDays     = diveDaysWithWeather - rawDiveDays
```

Logic: if 15% of planned days are lost to weather, you need to plan 4 / 0.85 = 4.7 → 5 days to get 4 productive days.

**Example (15% weather, 4 raw days):**
- `diveDaysWithWeather = ceil(4 / 0.85) = ceil(4.71) = 5 days`
- `weatherLostDays = 5 - 4 = 1 day`

---

### Step 6 — Crew day rate

```
crewDayRate = (workers × diverDayRate)
            + (standby × standbyDayRate)
            + (supervisor × supervisorDayRate)
            + (lifeSupport × lifeSupportDayRate)
```

All values from the market data in §8. `lifeSupport = 0` for India and Singapore.

---

### Step 7 — Crew cost

```
crewCost = crewDayRate × diveDaysWithWeather × saturationMultiplier
```

---

### Step 8 — Mobilisation

```
mobilisationDiving = mobilisationBase × saturationMultiplier
```

Saturation multiplier applied because sat diving requires specialist support vessel positioning, system mobilisation, and extended standby.

---

### Step 9 — Equipment cost

```
equipmentCost = equipmentDayRate × diveDaysWithWeather × saturationMultiplier
```

---

### Step 10 — Vessel cost

```
needsVessel = assetInfo.needsVessel   // true for offshore_platform, subsea_pipeline
vesselCost  = needsVessel ? (vesselDayRate × diveDaysWithWeather) : 0
```

Vessel cost is NOT multiplied by `saturationMultiplier` (sat diving uses a dedicated saturation barge already factored into the multiplier; this line represents the workboat/support vessel cost).

---

### Step 11 — Weather delay cost

```
weatherDelayCost = (crewDayRate × weatherLostDays)
                 + (needsVessel ? vesselDayRate × weatherLostDays : 0)
```

Crew and vessel are mobilised and on standby during weather delays. This cost is shown separately in the waterfall chart for transparency.

---

### Step 12 — HSE provision

```
incidentCostLocal = 75000 × usdRate
numDives          = rawDiveDays × divesPerShift × 2
hseProvision      = numDives × (0.018 / 200) × incidentCostLocal   (if toggle on)
                  = 0                                                (if toggle off)
```

Uses `rawDiveDays` (not `diveDaysWithWeather`) because HSE risk accrues during actual dives, not weather idle days.

---

### Step 13 — Downtime cost (diving)

```
downtimeCostDiving = assetDailyValue × diveDaysWithWeather   (if assetDailyValue > 0)
```

Shown separately (not in base total) unless the user enters an asset daily value. Rationale: asset must be offline during diving inspection.

---

### Step 14 — Total diving per inspection

```
totalDivingPerInspection = crewCost + mobilisationDiving + equipmentCost
                         + vesselCost + hseProvision
```

Note: `weatherDelayCost` is already embedded in `crewCost` and `vesselCost` (they use `diveDaysWithWeather`). The waterfall chart shows it as a separate bar by isolating `crewDayRate × weatherLostDays` — this is a display decomposition, not double-counting.

Annual cost: `totalDivingAnnual = totalDivingPerInspection × inspectionsPerYear`

---

### Step 15 — ROV calculation

```
rovMultiplier    = getROVCoverageMultiplier(assetType)   // from §6
rovDailyCoverage = dailyCoverage × rovMultiplier
rovDaysNeeded    = ceil(inspectionArea / rovDailyCoverage)

rovWeatherFraction = getROVWeatherFraction(market, assetType)  // from §11 ROV table
                   // offshore: UAE 3%, India 5%, SG 5%, EU 12% | all others: 0%
rovActualDays      = rovWeatherFraction > 0 ? ceil(rovDaysNeeded / (1 - rovWeatherFraction)) : rovDaysNeeded

rovCrewCost      = operatorDayRate × rovActualDays      // single operator
rovEquipmentCost = rovDayRate × rovActualDays            // ROV day rate (indicative)
rovMobilisation  = mobilisationBase                      // flat, not multiplied
rovVesselCost    = needsVessel ? (rovVesselDayRate × rovActualDays) : 0
                 // rovVesselDayRate = 40% of corresponding diving vesselDayRate per market

totalROVPerInspection = rovCrewCost + rovMobilisation + rovEquipmentCost + rovVesselCost
totalROVAnnual        = totalROVPerInspection × inspectionsPerYear
```

---

### Step 16 — Scenario bands

```
divingBestCase    = totalDivingPerInspection × 0.78   // ~22% reduction
divingMostLikely  = totalDivingPerInspection × 1.00
divingWorstCase   = totalDivingPerInspection × 1.38   // ~38% increase

rovBestCase   = totalROVPerInspection × 0.94
rovMostLikely = totalROVPerInspection × 1.00
rovWorstCase  = totalROVPerInspection × 1.08
```

Rationale for diving variability (±25% realistic range): weather variance, crew availability/rate fluctuation, incident probability realisation.
Rationale for ROV narrow band: no weather dependency, no decompression uncertainty, single-operator predictable rate.

---

### Step 17 — Break-even

```
savingPerInspection  = divingMostLikely - rovMostLikely

// RaaS model (no capital purchase)
if isRaaS:
  breakEvenInspections = 1   // ROV cheaper from 1st inspection; chart shows "Break-even: 1st inspection"

// Purchase model
else:
  effectiveCapitalCost   = rovCapitalCost (user input, default from §13)
                         // India default: ₹55,00,000 | international default: $65,000
  breakEvenInspections   = ceil(effectiveCapitalCost / savingPerInspection)   if saving > 0
                         = null                                                 if ROV is more expensive
```

Interpretation: After `breakEvenInspections` cumulative inspections, the savings from switching to ROV inspection have recovered the capital purchase price. The break-even chart plots cumulative cost for both methods; the reference line marks the recovery point.

The `rovCapitalCost` input is labelled *“indicative EyeROV purchase price — contact for exact quote”* and defaults to market-specific values (see §13). Users can override it. RaaS users toggle it off entirely.

---

## 15. Waterfall Chart Data Decomposition

The waterfall chart groups costs into the following bars:

| Bar label | Diving value | ROV value |
|---|---|---|
| Crew | `crewCost` (includes weather-padded days) | `rovCrewCost` |
| Mobilisation | `mobilisationDiving` | `rovMobilisation` |
| Equipment | `equipmentCost + vesselCost` | `rovEquipmentCost + rovVesselCost` |
| Weather Delay | `crewDayRate × weatherLostDays + vesselRate × weatherLostDays` | 0 |
| HSE Risk | `hseProvision` (if toggle on) | 0 |
| Asset Downtime | `assetDailyValue × diveDaysWithWeather` (if entered) | `assetDailyValue × rovActualDays` |

**Important:** "Crew" includes all weather-padded days already. "Weather Delay" isolates the idle-day crew cost for visualisation transparency. Together they sum to the same total as if you just computed `crewDayRate × diveDaysWithWeather`.

---

## 16. Currency & Exchange Rates

All costs stored and displayed in local currency. Exchange rates (hardcoded, 2024 reference):

| Market | Currency | USD rate used |
|---|---|---|
| India | INR (₹) | 83.5 |
| UAE / Saudi | USD ($) | 1.0 |
| Singapore | SGD (S$) | 1.35 |
| Europe | EUR (€) | 0.92 |

These rates affect: day rate conversions from USD midpoints, mobilisation cost conversions, HSE incident cost conversion ($75,000 USD → local), and ROV rate conversions.

---

## 17. Known Limitations & Sanity Checks

1. **Coverage rates are flat** — they don't degrade with depth. In practice, a diver at 35m covers less per dive than one at 15m because the NDL is shorter. The model accounts for this via `divesPerShift × coveragePerDive` (at 35m you get 1 dive × 14 min NDL vs at 15m you get 2 dives × 80 min NDL) — but `coveragePerDive` is a fixed number per asset type. This means coverage is implicitly tied to dive profile, not depth-adjusted per minute.

2. **HSE provision is small** — at shallow depths with few dive days, the HSE line item is a few hundred dollars. This is mathematically correct given the 1.8%/diver-year rate. It grows at saturation depths or many dive days. The purpose is transparency, not magnitude.

3. **Weather idle cost** — the "Weather Delay" bar in the chart is a sub-decomposition of the already-included crew cost (which uses `diveDaysWithWeather`). It is not added on top. This is correctly implemented in the code.

4. **ROV mobilisation not multiplied by saturation** — if the user selects depth ≥ 50m for a diving comparison, the ROV mobilisation stays at the flat market rate. This is intentional: a surface ROV still mobilises the same way regardless of inspection depth.

5. **Break-even uses capital purchase cost** — `rovCapitalCost / savingPerInspection` calculates when cumulative inspection savings recover the capital purchase price. For RaaS users (no purchase), break-even is always inspection #1. The capital cost defaults are indicative; actual pricing requires a quote from EyeROV.

6. **Scenario multipliers are flat** — best/worst case are ×0.78 and ×1.38 applied uniformly. They do not selectively apply to weather or crew sub-components. This is a simplification for display; a full Monte Carlo would vary components independently.

---

## 18. Worked Example (Full)

**Inputs:**
- Asset type: Ship hull
- Depth: 30m
- Inspection area: 500 sq m
- Inspections/year: 2
- Market: UAE / Saudi Arabia
- Asset daily value: $10,000
- Include HSE risk: Yes

**Step 2 — Dive parameters:**
- NDL bottom time: 20 min/dive (30m in NOAA table)
- Dives per shift: 1 (depth > 25m)
- Coverage per dive: 75 sq m

**Step 3 — Daily coverage:**
- `1 × 75 × 2 = 150 sq m/day`

**Step 4 — Raw dive days:**
- `ceil(500 / 150) = ceil(3.33) = 4 days`

**Step 5 — Weather (ship hull, UAE = 5%):**
- `ceil(4 / 0.95) = ceil(4.21) = 5 days`
- Weather lost: 1 day

**Step 6 — Crew day rate (IMCA D 014 — 5 crew):**
- `(2 × $550) + (1 × $500) + (1 × $800) + (1 × $600) = $3,000/day`

**Step 7 — Crew cost:**
- `$3,000 × 5 days × 1 (no saturation) = $15,000`

**Step 8 — Mobilisation:**
- `$4,500 × 1 = $4,500`

**Step 9 — Equipment:**
- `$1,600 × 5 = $8,000`

**Step 10 — Vessel (ship hull = no vessel):**
- `$0`

**Step 11 — Weather delay cost:**
- `$3,000 × 1 idle day = $3,000` (already inside crew cost total)

**Step 12 — HSE provision:**
- numDives = 4 × 1 × 2 = 8 dives
- rate = 0.018/200 = 0.00009
- incidentCostLocal = $75,000 × 1 = $75,000
- `8 × 0.00009 × $75,000 = $54`

**Step 13 — Downtime (diving):**
- `$10,000 × 5 days = $50,000` (shown separately)

**Step 14 — Total diving per inspection:**
- `$15,000 + $4,500 + $8,000 + $0 + $54 = $27,554`
- With downtime: $77,554

**Step 15 — ROV:**
- rovMultiplier = 4.5× (ship hull)
- rovDailyCoverage = 150 × 4.5 = 675 sq m/day
- rovDaysNeeded = ceil(500 / 675) = 1 day
- rovWeatherFraction = 0 (ship hull — not offshore)
- rovActualDays = 1
- rovCrewCost = $400 × 1 = $400
- rovEquipmentCost = $1,000 × 1 = $1,000
- rovMobilisation = $1,500
- rovVesselCost = $0 (ship hull — needsVessel = false)
- **Total ROV = $2,900**
- With downtime: $2,900 + ($10,000 × 1) = $12,900

**Savings per inspection:** $27,554 - $2,900 = **$24,654 (~89%)**

**Annual savings (2 inspections):** $24,654 × 2 = **$49,308**

**Break-even (purchase):** `ceil($65,000 / $24,654) = 3 inspections`

**Break-even (RaaS):** 1st inspection — no capital barrier

---

*Document generated from source code as of: May 2026*
*Verify against: `src/utils/divingTables.js`, `src/utils/marketData.js`, `src/utils/calculationEngine.js`*
