import React from 'react';
import { Link } from 'react-router-dom';
import { X, Gem } from 'lucide-react';

const PLANS = [
  { emoji: '🥉', name: 'Bronze', price: '₹299', duration: '3 Months' },
  { emoji: '🥈', name: 'Silver', price: '₹499', duration: '6 Months', popular: true },
  { emoji: '🥇', name: 'Gold',   price: '₹799', duration: '1 Year' },
];

const PremiumModal = ({ onClose, feature = null }) => (
  <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #8B1A2F, #5C0E1E)' }} className="p-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <X size={18} />
        </button>
        <Gem size={32} className="mx-auto mb-2 text-yellow-400" />
        <h3 className="text-lg font-black text-white">RistaSetu Premium</h3>
        {feature && (
          <p className="text-white/70 text-xs mt-1">{feature} — Premium feature hai</p>
        )}
      </div>

      <div className="p-5">
        {/* Coming Soon notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center mb-4">
          <p className="text-xl mb-1">🎉</p>
          <p className="font-bold text-amber-800 text-sm">Coming Soon!</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Hum payment gateway integrate kar rahe hain.<br />
            Tab tak app enjoy karein!
          </p>
        </div>

        {/* Mini plan cards */}
        <div className="flex gap-2 mb-4">
          {PLANS.map(p => (
            <div
              key={p.name}
              className={`flex-1 rounded-xl p-2.5 text-center border ${
                p.popular ? 'border-red-300 bg-red-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="text-lg mb-0.5">{p.emoji}</div>
              <div className="font-bold text-xs text-gray-800">{p.name}</div>
              <div className="text-xs font-black text-red-700">{p.price}</div>
              <div className="text-[10px] text-gray-400">{p.duration}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Link to="/premium" onClick={onClose} className="flex-1">
            <button
              className="w-full py-2.5 font-bold rounded-xl text-sm text-white border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #8B1A2F, #C0392B)' }}
            >
              Plans Dekho
            </button>
          </Link>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 font-semibold rounded-xl text-sm text-gray-600 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Baad Mein
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default PremiumModal;
