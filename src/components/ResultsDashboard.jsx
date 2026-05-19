import React, { useState } from 'react';
import {
  TrendingDown, ChevronDown, ChevronUp, AlertTriangle,
  BarChart2, GitBranch, Layers, BookOpen, RefreshCcw,
} from 'lucide-react';
import { MARKETS, ASSET_TYPES, formatCurrency, formatCurrencyUSD } from '../utils/marketData';
import { BOTTOM_TIME_TABLE } from '../utils/divingTables';
import CostWaterfallChart from './CostWaterfallChart';
import BreakevenChart from './BreakevenChart';

function MetricValue({ label, diving, rov, market, highlight }) {
  const sym = MARKETS[market]?.symbol;
  return (
    <div className={`grid grid-cols-3 items-center py-2.5 border-b border-navy-700/50 ${highlight ? 'bg-teal-900/10 -mx-5 px-5 rounded' : ''}`}>
      <span className="text-xs text-slate-400 col-span-1">{label}</span>
      <span className="text-xs font-mono text-amber-400 text-right">{formatCurrency(diving, market)}</span>
      <span className="text-xs font-mono text-teal-400 text-right">{formatCurrency(rov, market)}</span>
    </div>
  );
}

function ScenarioBar({ label, value, max, color, market }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-semibold`} style={{ color }}>{formatCurrency(value, market)}</span>
      </div>
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ResultsDashboard({ results, inputs, onReset, onLeadCapture }) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [activeTab, setActiveTab] = useState('breakdown');
  const { diving, rov, savings, waterfallData, breakEvenData, params } = results;
  const { market, assetDailyValue } = inputs;
  const m = MARKETS[market];

  const hasDowntime = assetDailyValue > 0;
  const scenarioMax = diving.worstCase * 1.05;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Headline Summary Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="section-card text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cost Saving / Inspection</p>
          <p className="text-3xl font-bold text-teal-400 font-mono">{formatCurrency(savings.perInspection, market, true)}</p>
          <p className="text-xs text-slate-400 mt-1">{savings.percentage}% lower than diving</p>
        </div>
        <div className="section-card text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Annual Saving</p>
          <p className="text-3xl font-bold text-teal-400 font-mono">{formatCurrency(savings.annual, market, true)}</p>
          <p className="text-xs text-slate-400 mt-1">at {inputs.inspectionsPerYear}× inspections/yr</p>
        </div>
        <div className="section-card text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Break-even After</p>
          <p className="text-3xl font-bold text-indigo-400 font-mono">
            {inputs.isRaaS ? '1st insp.' : (savings.breakEvenInspections ? `${savings.breakEvenInspections} insp.` : 'Day 1')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {inputs.isRaaS ? 'No capital outlay — RaaS model' : 'Capital purchase recovered vs. repeat diving'}
          </p>
        </div>
      </div>

      {/* ── Downtime Hero (if entered) ── */}
      {hasDowntime && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="text-red-400 mt-0.5 shrink-0" size={22} />
          <div>
            <p className="text-sm font-semibold text-red-300 mb-1">Asset Downtime Cost — The Largest Variable</p>
            <p className="text-2xl font-bold font-mono text-red-400 mb-2">
              {formatCurrency(diving.downtimeCost, market, true)} per diving inspection
            </p>
            <p className="text-xs text-slate-400">
              {params.diveDaysWithWeather} days of asset downtime × {formatCurrency(assetDailyValue, market)}/day.
              ROV inspection requires only {params.rovActualDays} days, saving{' '}
              <strong className="text-teal-400">{formatCurrency(savings.downtimeSaving, market, true)}</strong> in downtime cost per inspection
              ({formatCurrency(savings.downtimeSaving * inputs.inspectionsPerYear, market, true)}/year).
            </p>
          </div>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-navy-900 border border-navy-700 rounded-lg p-1 w-fit">
        {[
          { key: 'breakdown', icon: <Layers size={14} />, label: 'Cost Breakdown' },
          { key: 'breakeven', icon: <GitBranch size={14} />, label: 'Break-even' },
          { key: 'scenarios', icon: <BarChart2 size={14} />, label: 'Scenarios' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-navy-700 text-teal-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Cost Breakdown Tab ── */}
      {activeTab === 'breakdown' && (
        <div className="section-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Cost Component Breakdown — Per Inspection</h3>
          <p className="text-xs text-slate-500 mb-5">
            Each bar represents a single cost component. The gap between Diving and EyeROV bars is your engineering-grade saving.
          </p>
          <CostWaterfallChart data={waterfallData} market={market} />

          {/* Numeric table below chart */}
          <div className="mt-6">
            <div className="grid grid-cols-3 mb-2 pb-2 border-b border-navy-600">
              <span className="text-xs text-slate-500">Component</span>
              <span className="text-xs text-amber-400/70 text-right">Diving</span>
              <span className="text-xs text-teal-400/70 text-right">EyeROV</span>
            </div>
            <MetricValue label="Crew Cost" diving={diving.crewCost} rov={rov.crewCost} market={market} />
            <MetricValue label="Mobilisation" diving={diving.mobilisation} rov={rov.mobilisation} market={market} />
            <MetricValue label="Equipment / Vessel" diving={diving.equipment} rov={rov.equipment} market={market} />
            <MetricValue label="Weather Delay Cost" diving={diving.weatherDelayCost} rov={0} market={market} />
            {inputs.includeHSERisk && (
              <MetricValue label="HSE Risk Provision" diving={diving.hseProvision} rov={0} market={market} />
            )}
            {hasDowntime && (
              <MetricValue label="Asset Downtime" diving={diving.downtimeCost} rov={rov.downtimeCost} market={market} highlight />
            )}
            <div className="grid grid-cols-3 items-center pt-3 mt-1">
              <span className="text-xs font-bold text-slate-300">TOTAL</span>
              <span className="text-sm font-bold font-mono text-amber-400 text-right">
                {formatCurrency(hasDowntime ? diving.totalWithDowntime : diving.total, market)}
              </span>
              <span className="text-sm font-bold font-mono text-teal-400 text-right">
                {formatCurrency(hasDowntime ? rov.totalWithDowntime : rov.total, market)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Break-even Tab ── */}
      {activeTab === 'breakeven' && (
        <div className="section-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Cumulative Cost — Diving vs EyeROV</h3>
          <p className="text-xs text-slate-500 mb-5">
            Solid lines show most-likely cost. Dashed lines show worst-case upper bounds.
            {inputs.isRaaS
              ? ' RaaS model — no capital barrier. EyeROV is cheaper from the very first inspection.'
              : (savings.breakEvenInspections && savings.breakEvenInspections <= 20
                  ? ` Capital cost recovered at inspection #${savings.breakEvenInspections} — every inspection after that is pure saving.`
                  : ' ROV saves money from the very first inspection.')}
          </p>
          <BreakevenChart
            data={breakEvenData}
            breakEvenAt={savings.breakEvenInspections}
            market={market}
            isRaaS={inputs.isRaaS}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-navy-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-0.5">After 5 inspections</p>
              <p className="text-sm font-mono font-semibold text-teal-400">{formatCurrency(savings.perInspection * 5, market, true)} saved</p>
            </div>
            <div className="p-3 bg-navy-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-0.5">After 10 inspections</p>
              <p className="text-sm font-mono font-semibold text-teal-400">{formatCurrency(savings.perInspection * 10, market, true)} saved</p>
            </div>
            <div className="p-3 bg-navy-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-0.5">After 20 inspections</p>
              <p className="text-sm font-mono font-semibold text-teal-400">{formatCurrency(savings.perInspection * 20, market, true)} saved</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenarios Tab ── */}
      {activeTab === 'scenarios' && (
        <div className="section-card space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">Commercial Diving — Cost Scenarios</h3>
            <p className="text-xs text-slate-500 mb-4">
              Diving costs vary significantly with weather, crew availability, and incident risk.
              The range reflects realistic operational variability — not a padding estimate.
            </p>
            <ScenarioBar label="Best case (ideal conditions, no weather loss)" value={diving.bestCase} max={scenarioMax} color="#86efac" market={market} />
            <ScenarioBar label="Most likely (weather-adjusted, standard crew)" value={diving.mostLikely} max={scenarioMax} color="#f59e0b" market={market} />
            <ScenarioBar label="Worst case (weather delays + incident provision)" value={diving.worstCase} max={scenarioMax} color="#f87171" market={market} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">EyeROV — Cost Scenarios</h3>
            <p className="text-xs text-slate-500 mb-4">
              ROV cost is narrow-band because it is not weather-dependent and requires a single operator.
            </p>
            <ScenarioBar label="Best case" value={rov.bestCase} max={scenarioMax} color="#5eead4" market={market} />
            <ScenarioBar label="Most likely" value={rov.mostLikely} max={scenarioMax} color="#14b8a6" market={market} />
            <ScenarioBar label="Worst case (minor logistical delays)" value={rov.worstCase} max={scenarioMax} color="#0d9488" market={market} />
          </div>
          <div className="p-4 bg-navy-800 border border-navy-700 rounded-lg">
            <p className="text-xs text-slate-400">
              Worst-case diving ({formatCurrency(diving.worstCase, market)}) vs. worst-case ROV ({formatCurrency(rov.worstCase, market)}) —
              even in the worst ROV scenario vs. the best diving scenario, EyeROV saves{' '}
              <strong className="text-teal-400">{formatCurrency(diving.bestCase - rov.worstCase, market)}</strong> per inspection.
            </p>
          </div>
        </div>
      )}

      {/* ── Assumptions Panel ── */}
      <div className="section-card">
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Model Assumptions &amp; Parameters</span>
          </div>
          {showAssumptions ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </button>

        {showAssumptions && (
          <div className="mt-5 space-y-4 text-xs">
            <p className="text-slate-400 italic">
              Every number below is a traceable parameter. Where industry standard assumptions are used, the source is cited.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-teal-400 font-semibold mb-2">Diving Parameters</p>
                <table className="w-full text-xs">
                  <tbody className="space-y-1">
                    {[
                      ['Dive type', params.diveType],
                      ['NDL bottom time / dive', params.isSaturation ? 'N/A — saturation diving required' : `${params.bottomTimePerDive} min (NOAA NDL table)`],
                      ['Max dives / shift / diver', params.isSaturation ? 'N/A' : `${params.divesPerShift} dive${params.divesPerShift > 1 ? 's' : ''} (IMCA guidance)`],
                      ['Coverage / dive / diver', `${params.coveragePerDive} ${ASSET_TYPES.find(a=>a.id===params.assetType)?.unit ?? 'units'} (hardcoded reference)`],
                      ['Daily team coverage', `${params.dailyCoverage} ${ASSET_TYPES.find(a=>a.id===params.assetType)?.unit ?? 'units'} (2 divers × dives × coverage)`],
                      ['Raw dive days needed', `${params.rawDiveDays} days`],
                      ['Weather loss rate', params.weatherFraction > 0 ? `${(params.weatherFraction*100).toFixed(0)}% (hardcoded by asset + region)` : '0% — inland/enclosed asset'],
                      ['Weather-adjusted days', `${params.diveDaysWithWeather} days (${params.weatherLostDays} idle)`],
                      ['Mandatory crew', params.crewComposition],
                      ['Regulatory framework', params.regulationFull],
                      ...(params.isSaturation ? [['⚠ Saturation multiplier', `${params.saturationMultiplier}× applied — depth ≥ 50m requires saturation systems`]] : []),
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-navy-700/40">
                        <td className="py-1.5 pr-3 text-slate-500 align-top w-2/5">{k}</td>
                        <td className="py-1.5 text-slate-300">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-teal-400 font-semibold mb-2">ROV Parameters</p>
                <table className="w-full text-xs">
                  <tbody>
                    {[
                      ['ROV days needed', `${params.rovActualDays} days`],
                      ['Coverage multiplier vs diving', `${params.rovMultiplier}× (no NDL / decompression constraint)`],
                      ['Day rate used', `${params.rovDayRateRangeUSD} — ${params.rovDayRateLabel}`],
                      ['Weather impact', params.rovWeatherFraction > 0 ? `${(params.rovWeatherFraction * 100).toFixed(0)}% offshore residual (market-specific)` : 'None — inland / enclosed asset'],
                      ['ROV vessel cost', params.needsVessel ? `${formatCurrency(params.rovVesselCost, market)} (${params.rovActualDays} day${params.rovActualDays > 1 ? 's' : ''} × 40% of dive vessel rate)` : 'Not required — non-offshore asset'],
                      ['Break-even basis', params.isRaaS ? 'RaaS — no capital purchase; break-even at 1st inspection' : `${formatCurrency(params.effectiveCapitalCost, market)} capital ÷ ${formatCurrency(savings.perInspection, market)} saving/insp.`],
                      ['Crew required', '1 operator (vs. 4–5 mandatory for diving)'],
                      ['HSE risk', 'No decompression exposure; lower incident profile'],
                      ['Data output', 'Sonar imaging + defect report — included'],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b border-navy-700/40">
                        <td className="py-1.5 pr-3 text-slate-500 align-top w-2/5">{k}</td>
                        <td className="py-1.5 text-slate-300">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {inputs?.includeHSERisk && (
                  <div className="mt-4 p-3 bg-navy-900 border border-navy-700 rounded-lg">
                    <p className="text-teal-400 font-semibold mb-1">HSE Provision Formula</p>
                    <p className="text-slate-400 text-xs">{params.hseFormula}</p>
                    <p className="text-slate-500 text-xs mt-1">Incident cost: $75,000 USD default (range $45K–$120K). Rate: 1.8%/diver-year reportable incidents (10× fatality rate). Toggle off to exclude.</p>
                  </div>
                )}
                <p className="text-teal-400 font-semibold mt-4 mb-2">NOAA NDL Reference (exact hardcoded values)</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-navy-700">
                      <th className="text-left pb-1">Depth</th>
                      <th className="text-left pb-1">Bottom time</th>
                      <th className="text-left pb-1">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BOTTOM_TIME_TABLE.filter(r => [10,15,20,25,30,35,40].includes(r.depth)).map(r => (
                      <tr key={r.depth} className="border-b border-navy-700/40">
                        <td className="py-1 text-slate-300">{r.depth}m</td>
                        <td className="py-1 text-slate-300 font-mono">{r.bottomMinutes > 0 ? `${r.bottomMinutes} min` : 'Sat. required'}</td>
                        <td className="py-1 text-slate-500">{r.dive_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CTA + Reset ── */}
      <div className="section-card bg-gradient-to-br from-teal-900/30 to-navy-900 border-teal-700/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-100 mb-1">
              Your asset inspection profile has been saved.
            </p>
            <p className="text-xs text-slate-400">
              Get a free custom EyeROV deployment assessment for this asset — our engineers will validate this estimate against your actual site conditions.
            </p>
          </div>
          <button
            onClick={onLeadCapture}
            className="btn-primary whitespace-nowrap shrink-0"
          >
            Get Custom Assessment →
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={onReset} className="btn-secondary text-xs">
          <RefreshCcw size={13} /> Recalculate with different parameters
        </button>
      </div>
    </div>
  );
}
