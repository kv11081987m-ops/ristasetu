import React from 'react';
import { calculateCompatibility } from '../utils/matchUtils';

// Circular SVG progress ring
const Ring = ({ total, color }) => {
  const r = 38, cx = 48, cy = 48;
  const circumference = 2 * Math.PI * r;
  const dash = Math.min(1, total / 100) * circumference;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1F2937">
        {total}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="#6B7280">
        / 100
      </text>
    </svg>
  );
};

const Bar = ({ label, score, max, color }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-12 text-right shrink-0">
        {score}/{max}
      </span>
    </div>
  );
};

const CompatibilityBreakdown = ({ user, profile }) => {
  const compat = calculateCompatibility(user, profile);
  const { total, breakdown, label, color, emoji } = compat;

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6">
      <h3 className="font-black text-gray-800 text-base mb-4">Compatibility Breakdown</h3>

      {/* Circular score + label */}
      <div className="flex items-center gap-5 mb-5">
        <Ring total={total} color={color} />
        <div>
          <p className="text-2xl font-black" style={{ color }}>{emoji} {label}</p>
          <p className="text-sm text-gray-500 mt-1">
            {total}/100 points — {total >= 70 ? 'Ek achha rishta ho sakta hai!' : 'Thodi alag pasand hai.'}
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="flex flex-col gap-3">
        {Object.values(breakdown).map((cat) => (
          <Bar key={cat.label} label={cat.label} score={cat.score} max={cat.max} color={color} />
        ))}
        {/* Total row */}
        <div className="border-t pt-3 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-700 w-28 shrink-0">Total</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${total}%`, background: color }} />
          </div>
          <span className="text-xs font-black w-12 text-right shrink-0" style={{ color }}>
            {total}/100
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityBreakdown;
