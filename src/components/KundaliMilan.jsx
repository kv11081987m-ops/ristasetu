import React, { useState } from 'react';
import { calculateGunnMilan } from '../utils/kundaliUtils';

const DISCLAIMER = 'Yeh score ek paramparagat padhati par aadharit hai. Vivah ka nirnay keval kundali milan par na karein — aapsi samajh, parivar ki sehmat, aur vyaktigat gun bhi utne hi mahatvapurn hain. Kisi yogya jyotishi se bhi salah zaroor lein.';

const KOOT_ORDER = ['varna','vashya','tara','yoni','grahaMaitri','gana','bhakoot','nadi'];

const ScoreBar = ({ koot, score, max }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = pct >= 67 ? '#15803D' : pct >= 33 ? '#CA8A04' : '#DC2626';
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 600 }}>{koot.label}</span>
        <span style={{ fontSize: '0.72rem', color, fontWeight: 700 }}>{score}/{max}</span>
      </div>
      <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
};

const DoshCard = ({ dosh }) => {
  const colors = { high: { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B' }, medium: { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E' }, low: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534' } };
  const c = colors[dosh.severity] || colors.medium;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.85rem' }}>{dosh.severity === 'high' ? '⚠️' : dosh.severity === 'medium' ? '🔶' : '🔹'}</span>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: c.text }}>{dosh.name}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: c.text, background: c.border + '50', padding: '1px 6px', borderRadius: '999px', textTransform: 'uppercase', fontWeight: 700 }}>{dosh.severity}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#374151', margin: '0 0 4px 0', lineHeight: 1.4 }}>{dosh.description}</p>
      <p style={{ fontSize: '0.68rem', color: '#6B7280', margin: 0, fontStyle: 'italic' }}>Upay: {dosh.remedy}</p>
    </div>
  );
};

const KundaliMilan = ({ userProfile, matchProfile }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const result = calculateGunnMilan(userProfile, matchProfile);

  if (!result) {
    const uHas = userProfile?.kundali?.rashi && userProfile?.kundali?.nakshatra;
    const mHas = matchProfile?.kundali?.rashi && matchProfile?.kundali?.nakshatra;
    if (!uHas && !mHas) return null;
    return (
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.875rem', padding: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
          <span>🪐</span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Kundali Milan</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
          {!uHas ? 'Aapki Kundali details (Rashi + Nakshatra) Profile mein add karein to Milan dekh sakein.' : 'Is profile mein puri Kundali details available nahi hain.'}
        </p>
      </div>
    );
  }

  const { total, scores, doshas, label, color, emoji } = result;
  const highDoshas = doshas.filter(d => d.severity === 'high');

  return (
    <div style={{ border: `2px solid ${color}40`, borderRadius: '0.875rem', overflow: 'hidden', marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)`, padding: '0.875rem 1rem', borderBottom: `1px solid ${color}25` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🪐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>Kundali Milan (36 Gunn)</div>
              <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>8-Koot padhati ke anusaar</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: '1.6rem', color, lineHeight: 1 }}>{total}<span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 500 }}>/36</span></div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{emoji} {label}</div>
          </div>
        </div>
        {highDoshas.length > 0 && (
          <div style={{ marginTop: '0.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: '#991B1B', fontWeight: 600 }}>
            ⚠️ {highDoshas.length} Mahatvapurna Dosh mila — niche dekhen
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem 1rem' }}>
        {/* Toggle breakdown */}
        <button
          onClick={() => setShowBreakdown(s => !s)}
          style={{ width: '100%', background: 'none', border: `1px solid ${color}40`, borderRadius: '0.5rem', padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color, cursor: 'pointer', marginBottom: '0.75rem' }}
        >
          {showBreakdown ? '▲ Breakdown Chhupao' : '▼ 8-Koot Breakdown Dekho'}
        </button>

        {showBreakdown && (
          <div style={{ marginBottom: '0.75rem' }}>
            {KOOT_ORDER.map(key => (
              <ScoreBar key={key} koot={scores[key]} score={scores[key].score} max={scores[key].max} />
            ))}
          </div>
        )}

        {/* Doshas */}
        {doshas.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151', marginBottom: '0.5rem' }}>Dosh Vivaran:</div>
            {doshas.map((d, i) => <DoshCard key={i} dosh={d} />)}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', marginTop: '0.75rem' }}>
          <p style={{ fontSize: '0.65rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: '#6B7280' }}>Disclaimer: </span>{DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KundaliMilan;
