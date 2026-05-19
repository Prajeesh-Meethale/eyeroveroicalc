import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Info, AlertTriangle } from 'lucide-react';
import { MARKETS, ASSET_TYPES } from '../utils/marketData';
import { getBottomTime, getDiveType } from '../utils/divingTables';

const STEPS = ['Asset & Location', 'Inspection Details', 'Financial Parameters'];

export default function InputForm({ onCalculate }) {
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState({
    assetType: '',
    market: '',
    depthMetres: '',
    inspectionArea: '',
    inspectionsPerYear: 1,
    assetDailyValue: '',
    includeHSERisk: true,
    isRaaS: false,
    rovCapitalCost: '',
  });
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    if (key === 'market') {
      const defaultCapital = MARKETS[value]?.rov?.capitalCostDefault ?? '';
      setInputs(prev => ({ ...prev, market: value, rovCapitalCost: defaultCapital }));
    } else {
      setInputs(prev => ({ ...prev, [key]: value }));
    }
  };

  const validate = (currentStep) => {
    const e = {};
    if (currentStep === 0) {
      if (!inputs.assetType) e.assetType = 'Select an asset type';
      if (!inputs.market) e.market = 'Select a geographic market';
    }
    if (currentStep === 1) {
      if (!inputs.depthMetres || isNaN(inputs.depthMetres) || +inputs.depthMetres <= 0)
        e.depthMetres = 'Enter a valid depth (metres)';
      if (!inputs.inspectionArea || isNaN(inputs.inspectionArea) || +inputs.inspectionArea <= 0)
        e.inspectionArea = 'Enter a valid inspection area';
      if (!inputs.inspectionsPerYear || +inputs.inspectionsPerYear < 1)
        e.inspectionsPerYear = 'At least 1 inspection per year';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = () => {
    if (validate(step)) {
      const defaultCapital = MARKETS[inputs.market]?.rov?.capitalCostDefault ?? 65000;
      onCalculate({
        ...inputs,
        depthMetres: +inputs.depthMetres,
        inspectionArea: +inputs.inspectionArea,
        inspectionsPerYear: +inputs.inspectionsPerYear,
        assetDailyValue: +inputs.assetDailyValue || 0,
        rovCapitalCost: inputs.isRaaS ? 0 : (+inputs.rovCapitalCost || defaultCapital),
        isRaaS: inputs.isRaaS,
      });
    }
  };

  const selectedAsset = ASSET_TYPES.find(a => a.id === inputs.assetType);
  const depth = +inputs.depthMetres;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-teal-500 text-navy-950' :
                i === step ? 'bg-teal-500 text-navy-950 ring-2 ring-teal-400 ring-offset-2 ring-offset-navy-950' :
                'bg-navy-700 text-slate-500'
              }`}>{i < step ? '✓' : i + 1}</div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-teal-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-teal-500' : 'bg-navy-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="section-card min-h-[380px] flex flex-col">
        <h2 className="text-lg font-semibold text-slate-200 mb-6">{STEPS[step]}</h2>

        {/* ── STEP 0: Asset & Location ── */}
        {step === 0 && (
          <div className="flex-1 space-y-6">
            <div>
              <label className="label">Asset Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ASSET_TYPES.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => set('assetType', asset.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-center ${
                      inputs.assetType === asset.id
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-navy-600 bg-navy-800 text-slate-400 hover:border-navy-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-xl">{asset.icon}</span>
                    <span className="text-xs font-medium leading-tight">{asset.label}</span>
                  </button>
                ))}
              </div>
              {errors.assetType && <p className="text-red-400 text-xs mt-1.5">{errors.assetType}</p>}
            </div>

            <div>
              <label className="label">Geographic Market</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(MARKETS).map(([key, m]) => (
                  <button
                    key={key}
                    onClick={() => set('market', key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      inputs.market === key
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-navy-600 bg-navy-800 text-slate-400 hover:border-navy-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="text-lg">{m.flag}</span>
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs opacity-60">{m.currency} · {m.regulation}</div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.market && <p className="text-red-400 text-xs mt-1.5">{errors.market}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 1: Inspection Details ── */}
        {step === 1 && (
          <div className="flex-1 space-y-5">
            <div>
              <label className="label">Water Depth at Inspection Point (metres)</label>
              <input
                type="number"
                min="1"
                max="100"
                className="input-field"
                placeholder="e.g. 30"
                value={inputs.depthMetres}
                onChange={e => set('depthMetres', e.target.value)}
              />
              {errors.depthMetres && <p className="text-red-400 text-xs mt-1">{errors.depthMetres}</p>}
              {depth > 0 && (
                <div className={`mt-2 flex items-start gap-2 text-xs rounded-lg p-2.5 border ${
                  depth >= 50 ? 'bg-red-900/20 border-red-800/50 text-red-300' :
                  depth > 24 ? 'bg-amber-900/20 border-amber-800/50 text-amber-300' :
                  'bg-teal-900/20 border-teal-800/50 text-teal-300'
                }`}>
                  {depth >= 50 ? <AlertTriangle size={13} className="mt-0.5 shrink-0" /> : <Info size={13} className="mt-0.5 shrink-0" />}
                  <span>
                    <strong>{getDiveType(depth)}</strong>{depth < 50 && <> — NOAA NDL: <strong>{getBottomTime(depth)} min/dive</strong></>}.
                    {depth >= 50 && ' Saturation diving systems required — cost multiplies 5–8× vs standard commercial diving. This is modelled as a 6× cost multiplier.'}
                    {depth > 24 && depth < 50 && ' Decompression stops required. At 30m a diver gets only 20 min NDL; at 40m just 10 min — severely limiting daily coverage.'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="label">
                Inspection Area / Length
                {selectedAsset && <span className="text-teal-500 ml-1">({selectedAsset.unit})</span>}
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder={selectedAsset?.unit === 'lin m' ? 'e.g. 500 linear metres' : 'e.g. 2000 sq metres'}
                value={inputs.inspectionArea}
                onChange={e => set('inspectionArea', e.target.value)}
              />
              {errors.inspectionArea && <p className="text-red-400 text-xs mt-1">{errors.inspectionArea}</p>}
            </div>

            <div>
              <label className="label">Number of Inspections Per Year</label>
              <div className="flex items-center gap-3">
                {[1, 2, 4, 6, 12].map(n => (
                  <button
                    key={n}
                    onClick={() => set('inspectionsPerYear', n)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      inputs.inspectionsPerYear === n
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-navy-600 bg-navy-800 text-slate-400 hover:border-navy-500'
                    }`}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              {errors.inspectionsPerYear && <p className="text-red-400 text-xs mt-1">{errors.inspectionsPerYear}</p>}
            </div>

            <div className="flex items-center gap-3 p-3 bg-navy-800 border border-navy-600 rounded-lg">
              <button
                onClick={() => set('includeHSERisk', !inputs.includeHSERisk)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${inputs.includeHSERisk ? 'bg-teal-500' : 'bg-navy-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${inputs.includeHSERisk ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <div className="text-sm font-medium text-slate-200">Include HSE Incident Risk Provision</div>
                <div className="text-xs text-slate-500">Adds statistically expected cost of a reportable diving incident</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Financial Parameters ── */}
        {step === 2 && (
          <div className="flex-1 space-y-5">

            {/* RaaS Toggle */}
            <div className="flex items-center gap-3 p-3 bg-navy-800 border border-navy-600 rounded-lg">
              <button
                onClick={() => set('isRaaS', !inputs.isRaaS)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${inputs.isRaaS ? 'bg-teal-500' : 'bg-navy-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${inputs.isRaaS ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <div className="text-sm font-medium text-slate-200">RaaS Model (Robotics-as-a-Service)</div>
                <div className="text-xs text-slate-500">No upfront capital purchase — break-even from 1st inspection</div>
              </div>
            </div>

            {/* ROV Capital Cost — hidden for RaaS */}
            {!inputs.isRaaS && (
              <div>
                <label className="label">
                  EyeROV Purchase Price
                  <span className="text-xs text-slate-400 ml-2 font-normal">indicative EyeROV purchase price — contact for exact quote</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
                    {inputs.market ? MARKETS[inputs.market]?.symbol : '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="input-field pl-8"
                    value={inputs.rovCapitalCost}
                    onChange={e => set('rovCapitalCost', e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  Used to calculate how many inspections recover the capital purchase cost vs. continuing to hire divers.
                </p>
              </div>
            )}

            <div>
              <label className="label">
                Asset Operational Value Per Day <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">
                  {inputs.market ? MARKETS[inputs.market]?.symbol : '$'}
                </span>
                <input
                  type="number"
                  min="0"
                  className="input-field pl-8"
                  placeholder="Revenue or cost of downtime per day"
                  value={inputs.assetDailyValue}
                  onChange={e => set('assetDailyValue', e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5">
                <Info size={11} className="mt-0.5 shrink-0" />
                If the asset must be taken offline during inspection, enter its daily production/revenue value. 
                This surfaces the true cost of inspection duration — often the largest single number.
              </p>
            </div>

            {inputs.market && (
              <div className="p-4 bg-navy-800 border border-navy-700 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Market Parameters Applied</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="text-slate-500">Regulation framework</span>
                  <span className="text-slate-200 font-medium">{MARKETS[inputs.market]?.regulationFull}</span>
                  <span className="text-slate-500">Weather loss rate</span>
                  <span className="text-slate-200">{(MARKETS[inputs.market]?.diving.weatherLossFraction * 100).toFixed(0)}% of planned dive days</span>
                  <span className="text-slate-500">HSE incident probability</span>
                  <span className="text-slate-200">{(MARKETS[inputs.market]?.diving.hseIncidentProbability * 100).toFixed(1)}% per inspection</span>
                  <span className="text-slate-500">Currency</span>
                  <span className="text-slate-200">{MARKETS[inputs.market]?.currency}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-900/10 border border-amber-800/40 rounded-lg text-xs text-amber-300/80 flex items-start gap-2">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                All cost parameters are drawn from published IMCA DCR day rate surveys and regional market data (2023–2024). 
                Assumptions are fully visible in the results panel so your team can audit every number.
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-navy-700">
          <button
            onClick={back}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} className="btn-primary">
              Calculate ROI <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
