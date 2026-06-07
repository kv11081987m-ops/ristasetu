import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { calculateCompleteness } from '../utils/calculateCompleteness';
import { loadAnalytics } from '../utils/analyticsUtils';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const StatCard = ({ emoji, value, label, sub }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center text-center shadow-sm">
    <span className="text-2xl mb-1">{emoji}</span>
    <p className="text-2xl font-black text-gray-800">{value ?? '—'}</p>
    <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const ProfileAnalytics = () => {
  const { currentUser, userProfile } = useAuthContext();
  const { interests, chats } = useAppContext();
  const [analytics, setAnalytics] = useState(null);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const uid = currentUser?.uid;
  const completeness = calculateCompleteness(userProfile);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const [data, shortlistSnap] = await Promise.all([
        loadAnalytics(uid),
        getDocs(query(collection(db, 'shortlists'), where('profileId', '==', uid))),
      ]);
      if (cancelled) return;
      setAnalytics(data);
      setShortlistedCount(shortlistSnap.size);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [uid]);

  const interestsReceived = interests.filter(i => i.receiverId === uid).length;
  const interestsSent = interests.filter(i => i.senderId === uid).length;
  const chatsActive = chats.length;

  // Weekly trend %
  const weeklyViews = analytics?.weeklyViews ?? 0;
  const prevWeekViews = analytics?.prevWeekViews ?? 0;
  const trendPct = prevWeekViews > 0
    ? Math.round(((weeklyViews - prevWeekViews) / prevWeekViews) * 100)
    : null;

  // Tips
  const tips = [];
  if ((analytics?.profileViews ?? 0) < 10) {
    tips.push('💡 Photo add karein — photos wale profiles ko 3x zyada views milte hain');
  }
  if (completeness < 80) {
    tips.push('💡 Peshaa aur gotra add karein — matches improve honge');
  }
  if (interestsReceived === 0) {
    tips.push('💡 Profile boost karein — Premium mein available hai');
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Analytics load ho raha hai...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
          📊 Meri Analytics
        </h3>
        <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full">
          Is Hafte
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard emoji="👁️" value={weeklyViews} label="Profile Views" sub="is hafte" />
        <StatCard emoji="💌" value={interestsReceived} label="Interests Mile" />
        <StatCard emoji="💬" value={chatsActive} label="Chats Active" />
        <StatCard emoji="⭐" value={shortlistedCount} label="Shortlist Kiye Gaye" />
      </div>

      {/* All-time views */}
      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs text-gray-500">Total Profile Views (All Time)</p>
          <p className="text-xl font-black text-gray-800">{analytics?.profileViews ?? 0}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Interest Bheje</p>
          <p className="text-xl font-black text-gray-800">{interestsSent}</p>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-semibold text-gray-600">Profile Completeness</p>
          <p className="text-xs font-black text-gray-800">{completeness}%</p>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completeness}%`,
              background: completeness >= 80
                ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                : completeness >= 50
                ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                : 'linear-gradient(90deg, #DC2626, #EF4444)',
            }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-[11px] text-gray-500 mt-2">
            {100 - completeness}% aur complete karein —{' '}
            <Link to="/complete-profile" className="text-red-600 font-semibold">
              zyada matches milenge!
            </Link>
          </p>
        )}
      </div>

      {/* Weekly Trend */}
      {trendPct !== null && (
        <div className={`rounded-xl px-4 py-3 mb-4 flex items-center gap-3 ${
          trendPct >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
        }`}>
          {trendPct >= 0
            ? <TrendingUp size={18} className="text-green-600 shrink-0" />
            : <TrendingDown size={18} className="text-red-500 shrink-0" />
          }
          <p className={`text-xs font-semibold ${trendPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {trendPct >= 0
              ? `Pichhle hafte se ${trendPct}% zyada log dekh rahe hain 📈`
              : `Pichhle hafte se ${Math.abs(trendPct)}% kam log dekh rahe hain 📉`
            }
          </p>
        </div>
      )}
      {trendPct === null && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-blue-600 font-medium">
            📈 Pehli baar ka data track ho raha hai — agli baar trend dikhega
          </p>
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div className="flex flex-col gap-2">
          {tips.map((tip, i) => (
            <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-800 font-medium">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileAnalytics;
