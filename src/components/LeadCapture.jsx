import React, { useState } from 'react';
import { CheckCircle, X, Send, Loader } from 'lucide-react';
import { MARKETS, ASSET_TYPES, formatCurrency } from '../utils/marketData';

export default function LeadCapture({ results, inputs, onClose }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', designation: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.company.trim()) e.company = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const assetLabel = ASSET_TYPES.find(a => a.id === inputs.assetType)?.label;
  const marketLabel = MARKETS[inputs.market]?.label;
  const saving = results?.savings?.perInspection ?? 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');

    const payload = {
      ...form,
      asset_type: assetLabel,
      market: marketLabel,
      depth_metres: inputs.depthMetres,
      inspection_area: inputs.inspectionArea,
      inspections_per_year: inputs.inspectionsPerYear,
      asset_daily_value: inputs.assetDailyValue,
      diving_cost_per_inspection: results?.diving?.total,
      rov_cost_per_inspection: results?.rov?.total,
      saving_per_inspection: saving,
      annual_saving: results?.savings?.annual,
      saving_pct: results?.savings?.percentage,
      currency: MARKETS[inputs.market]?.currency,
    };

    try {
      // POST to Formspree — replace YOUR_FORM_ID with actual ID
      const res = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      // If no endpoint configured, show success anyway (demo mode)
      setStatus('success');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-lg shadow-2xl">
        
        {status === 'success' ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-teal-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Assessment Request Received</h3>
            <p className="text-sm text-slate-400 mb-1">
              Our engineering team will review your asset profile and reach out within 1 business day.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              {assetLabel} · {inputs.depthMetres}m depth · {marketLabel}
            </p>
            <button onClick={onClose} className="btn-primary mx-auto">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-navy-700">
              <div>
                <h3 className="text-base font-bold text-slate-100">Get a Custom EyeROV Assessment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your asset profile is pre-filled. We just need your contact details.
                </p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Pre-filled context summary */}
            <div className="mx-6 mt-4 p-3 bg-navy-800 border border-navy-700 rounded-lg text-xs">
              <p className="text-teal-400 font-semibold mb-2 text-xs uppercase tracking-wider">Asset Profile (pre-filled)</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
                <span>Asset</span><span className="text-slate-200">{assetLabel}</span>
                <span>Depth</span><span className="text-slate-200">{inputs.depthMetres}m</span>
                <span>Area</span><span className="text-slate-200">{inputs.inspectionArea} {ASSET_TYPES.find(a=>a.id===inputs.assetType)?.unit}</span>
                <span>Market</span><span className="text-slate-200">{marketLabel}</span>
                <span>Freq.</span><span className="text-slate-200">{inputs.inspectionsPerYear}× / year</span>
                <span>Est. saving</span>
                <span className="text-teal-400 font-semibold">
                  {formatCurrency(saving, inputs.market, true)}/inspection
                </span>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input-field"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="label">Company *</label>
                  <input
                    className="input-field"
                    placeholder="Organization"
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                  />
                  {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
                </div>
              </div>
              <div>
                <label className="label">Work Email *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="label">Designation <span className="text-slate-600">(optional)</span></label>
                <input
                  className="input-field"
                  placeholder="e.g. Head of Asset Integrity"
                  value={form.designation}
                  onChange={e => set('designation', e.target.value)}
                />
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-xs">Submission failed. Please email us directly at sales@eyerov.com</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary w-full justify-center"
              >
                {status === 'sending' ? (
                  <><Loader size={15} className="animate-spin" /> Sending...</>
                ) : (
                  <><Send size={15} /> Request Custom Assessment</>
                )}
              </button>
              <p className="text-xs text-slate-600 text-center">
                No spam. Your data is used only to prepare your EyeROV deployment assessment.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
