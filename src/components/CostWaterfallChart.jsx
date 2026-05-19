import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '../utils/marketData';

const DIVING_COLOR = '#f59e0b';
const ROV_COLOR = '#14b8a6';

const CustomTooltip = ({ active, payload, label, market }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6 mb-1">
          <span style={{ color: p.fill }} className="font-medium">{p.name}</span>
          <span className="text-slate-200 font-mono">{formatCurrency(p.value, market)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-navy-600 flex justify-between gap-6">
          <span className="text-slate-400">ROV saves</span>
          <span className="text-teal-400 font-mono font-semibold">
            {formatCurrency(payload[0].value - payload[1].value, market)}
          </span>
        </div>
      )}
    </div>
  );
};

export default function CostWaterfallChart({ data, market }) {
  const tickFormatter = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return v;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#0f2a47" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#0f2a47' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={tickFormatter}
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip market={market} />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }}
          iconType="square"
          iconSize={10}
        />
        <Bar dataKey="diving" name="Commercial Diving" fill={DIVING_COLOR} radius={[3, 3, 0, 0]} />
        <Bar dataKey="rov" name="EyeROV" fill={ROV_COLOR} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
