import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import InputForm from './components/InputForm';
import ResultsDashboard from './components/ResultsDashboard';
import LeadCapture from './components/LeadCapture';
import { calculateROI } from './utils/calculationEngine';

const PHASE = { INPUT: 'input', RESULTS: 'results' };

export default function App() {
  const [phase, setPhase] = useState(PHASE.INPUT);
  const [results, setResults] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [showLead, setShowLead] = useState(false);

  const handleCalculate = (formInputs) => {
    const r = calculateROI(formInputs);
    setResults(r);
    setInputs(formInputs);
    setPhase(PHASE.RESULTS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setPhase(PHASE.INPUT);
    setResults(null);
    setInputs(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-3 group"
            aria-label="Go to homepage"
          >
            <img
              src="/eyerov-logo.png"
              alt="EyeROV"
              className="h-10 w-auto object-contain brightness-0 invert group-hover:opacity-90 transition-opacity duration-200"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold text-slate-100">EyeROV</span>
              <span className="text-xs text-slate-500">ROI Calculator</span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <a
              href="https://eyerov.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              eyerov.com <ExternalLink size={10} />
            </a>
            {phase === PHASE.RESULTS && (
              <button
                onClick={() => setShowLead(true)}
                className="btn-primary text-xs py-2 px-4"
              >
                Get Assessment
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero (input phase only) ── */}
      {phase === PHASE.INPUT && (
        <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="max-w-2xl">
              <div className="tag mb-4">Engineering-grade cost model · Not a marketing estimate</div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4 leading-tight">
                Commercial Diving vs. ROV Inspection<br />
                <span className="text-cyan-400">True Cost Comparison</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl">
                Built on DCIEM/NOAA dive tables, IMCA crew standards, and real market day rates. 
                Every number is traceable to your inputs or a cited industry parameter — 
                suitable for internal procurement justification.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  'Depth-driven bottom time calculation',
                  'Weather window probability by region',
                  'HSE incident risk provision',
                  'Asset downtime cost modelling',
                ].map(tag => (
                  <span key={tag} className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {phase === PHASE.INPUT && (
          <InputForm onCalculate={handleCalculate} />
        )}
        {phase === PHASE.RESULTS && results && (
          <ResultsDashboard
            results={results}
            inputs={inputs}
            onReset={handleReset}
            onLeadCapture={() => setShowLead(true)}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© 2024 EyeROV Technologies Pvt Ltd · India's leading marine robotics company</span>
          <span>
            Cost model based on DCIEM/NOAA dive tables · IMCA D 014 · Regional market surveys 2023–2024
          </span>
        </div>
      </footer>

      {/* ── Lead Capture Modal ── */}
      {showLead && (
        <LeadCapture
          results={results}
          inputs={inputs}
          onClose={() => setShowLead(false)}
        />
      )}
    </div>
  );
}
