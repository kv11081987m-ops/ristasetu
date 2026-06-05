import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Check, Gem, Zap, ArrowLeft } from 'lucide-react';

const MAROON = '#8B1A2F';
const GOLD   = '#D4AF37';

const PLANS = [
  {
    key: 'bronze',
    emoji: '🥉',
    name: 'Bronze',
    price: 299,
    duration: '3 Months',
    color: '#CD7F32',
    bg: '#FDF4EC',
    border: '#E8C5A0',
    features: [
      'Kisne Dekha — Profile viewers',
      'Verified ✅ Badge milega',
      '3 Photos upload kar sakte hain',
      '10 Interests/day',
    ],
  },
  {
    key: 'silver',
    emoji: '🥈',
    name: 'Silver',
    price: 499,
    duration: '6 Months',
    color: '#888',
    bg: '#F8F9FF',
    border: MAROON,
    popular: true,
    features: [
      'Sab Bronze features',
      'Profile Boost — weekly 1 baar',
      'Unlimited Interests bhejo',
      '5 Photos upload kar sakte hain',
    ],
  },
  {
    key: 'gold',
    emoji: '🥇',
    name: 'Gold',
    price: 799,
    duration: '1 Year',
    color: GOLD,
    bg: '#FFFBEC',
    border: GOLD,
    features: [
      'Sab Silver features',
      'Profile Boost — daily',
      'Priority customer support',
      'Biodata PDF — unlimited',
      'Top of search results mein',
    ],
  },
];

const ComingSoonModal = ({ plan, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div style={{ background: `linear-gradient(135deg, ${MAROON}, #5C0E1E)` }} className="p-6 text-center">
        <div className="text-4xl mb-2">{plan.emoji}</div>
        <h3 className="text-xl font-black text-white">{plan.name} Plan</h3>
        <p className="text-white/70 text-sm mt-1">₹{plan.price} / {plan.duration}</p>
      </div>
      <div className="p-6 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h4 className="text-xl font-black text-gray-900 mb-2">Coming Soon!</h4>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Hum payment gateway integrate kar rahe hain.<br />
          <strong>Jald aayega!</strong> Tab tak app enjoy karein aur apni profile complete karein.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 font-bold rounded-xl text-white text-base border-none cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${MAROON}, #C0392B)` }}
        >
          Theek Hai, Samjha!
        </button>
      </div>
    </div>
  </div>
);

const PlanCard = ({ plan, isCurrent, onUpgrade }) => {
  const { popular } = plan;
  return (
    <div
      className={`relative bg-white rounded-2xl flex flex-col overflow-visible transition-all duration-300 hover:-translate-y-1 ${popular ? 'scale-[1.03] z-10' : ''}`}
      style={{ border: `2px solid ${popular ? MAROON : plan.border}`, boxShadow: popular ? `0 8px 30px rgba(139,26,47,0.18)` : '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span
            className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-md"
            style={{ background: `linear-gradient(90deg, ${MAROON}, #C0392B)` }}
          >
            ⭐ Most Popular
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Plan header */}
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">{plan.emoji}</div>
          <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
          <div className="mt-3">
            <span className="text-4xl font-black" style={{ color: MAROON }}>₹{plan.price}</span>
            <span className="text-gray-400 text-sm ml-1">/ {plan.duration}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-3 mb-6 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: popular ? MAROON : '#E5E7EB' }}>
                <Check size={11} className={popular ? 'text-white' : 'text-gray-600'} strokeWidth={3} />
              </div>
              <span className="text-sm text-gray-600 leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onUpgrade(plan)}
          disabled={isCurrent}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all border-none cursor-pointer"
          style={{
            background: isCurrent ? '#E5E7EB' : popular ? `linear-gradient(135deg, ${MAROON}, #C0392B)` : 'transparent',
            color: isCurrent ? '#9CA3AF' : popular ? 'white' : MAROON,
            border: isCurrent ? 'none' : popular ? 'none' : `2px solid ${MAROON}`,
            cursor: isCurrent ? 'default' : 'pointer',
            boxShadow: popular && !isCurrent ? '0 4px 14px rgba(139,26,47,0.3)' : 'none',
          }}
        >
          {isCurrent ? '✓ Current Plan' : 'Abhi Upgrade Karein'}
        </button>
      </div>
    </div>
  );
};

const Subscription = () => {
  const { userProfile } = useAuthContext();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = (plan) => setSelectedPlan(plan);

  return (
    <div className="min-h-screen page-transition" style={{ background: 'linear-gradient(180deg, #FDF2F4 0%, #fff 40%)' }}>
      {selectedPlan && <ComingSoonModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      <div className="container mx-auto max-w-5xl px-4 py-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold mb-6 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: MAROON }}
        >
          <ArrowLeft size={16} /> Wapas Jaao
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
               style={{ background: `linear-gradient(135deg, ${MAROON}, #5C0E1E)` }}>
            <Gem size={30} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            RistaSetu Premium 💎
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
            Apna Rishta Jaldi Dhundho — Premium ke saath apni shaadi ki journey aur tez karein
          </p>

          {/* Coming soon ribbon */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-bold"
               style={{ background: '#FFFBEC', border: `1px solid ${GOLD}`, color: '#92610A' }}>
            <Zap size={14} style={{ color: GOLD }} />
            Payment Gateway jald aayega — Tab tak free mein use karein!
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 items-stretch pt-4">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.key}
              plan={plan}
              isCurrent={userProfile?.premiumPlan === plan.key}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>

        {/* Free vs Premium comparison strip */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h3 className="font-black text-lg text-gray-900 mb-4 text-center">Free vs Premium</h3>
          <div className="grid grid-cols-3 gap-0 text-sm">
            <div className="font-bold text-gray-500 pb-2 border-b">Feature</div>
            <div className="font-bold text-gray-600 pb-2 border-b text-center">Free</div>
            <div className="font-bold pb-2 border-b text-center" style={{ color: MAROON }}>Premium 💎</div>

            {[
              ['Photos',         '2',            '3–5'],
              ['Interests/day',  '10',           'Unlimited'],
              ['Biodata PDF',    '3/month',      'Unlimited'],
              ['Profile Views',  '🔒 Hidden',    '✅ Visible'],
              ['Verified Badge', '❌',           '✅'],
              ['Profile Boost',  '❌',           '✅'],
            ].map(([feat, free, prem]) => (
              <>
                <div key={feat} className="py-2.5 border-b text-gray-700 font-medium">{feat}</div>
                <div key={`${feat}-f`} className="py-2.5 border-b text-center text-gray-500">{free}</div>
                <div key={`${feat}-p`} className="py-2.5 border-b text-center font-semibold" style={{ color: MAROON }}>{prem}</div>
              </>
            ))}
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-400">
          🔒 Aapka data 100% secure hai · Payment gateway integrate hone ke baad instant upgrade milega
        </p>
      </div>
    </div>
  );
};

export default Subscription;
