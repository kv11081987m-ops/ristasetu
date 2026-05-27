import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Scale, ArrowLeft, User } from 'lucide-react';

const DisclaimerPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 page-transition max-w-3xl">

      {/* Back link */}
      <Link
        to="/about"
        className="inline-flex items-center gap-2 text-red-600 font-bold mb-6 hover:underline bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={18} /> Wapas jaayein
      </Link>

      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Disclaimer</h1>
        <p className="text-sm text-gray-500 mt-1">Kripya platform use karne se pehle yeh zaroori jaankaari padhein</p>
      </div>

      {/* ── [A] MAHATVAPURN CHETAWANI ───────────────────────── */}
      <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={28} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-red-700">Mahatvapurn Chetawani</h2>
            <p className="text-sm text-red-600 mt-0.5">Yeh jaankari padhna zaroori hai</p>
          </div>
        </div>
        <ul className="space-y-3">
          {[
            'RistaSetu sirf ek madhyam (platform) hai — yeh do parivaaron ko milne ka mauka deta hai, rishta pakka karna aapka kaam hai.',
            'Kisi bhi user ki di gayi jaankari ki poori jaanch karna is platform ke bas mein nahi hai. Hum sirf OTP se mobile verify karte hain.',
            'Agar koi user galat jaankari deta hai — jaise jhootha occupation, galat umar, ya naqli photo — to us ki poori zimmedari usi user ki hogi, platform ki nahi.',
            'Kewal kisi ka profile dekhkar rishta tay nahi karna chahiye. Seedha milna, parivaar se baat karna, aur khud jaanch karna zaroori hai.',
          ].map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-red-800">
              <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── [B] PLATFORM KYA KARTA / NAHI KARTA ────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5 border-b pb-2">Platform kya karta hai — aur kya nahi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Do */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-green-600" />
              <span className="font-bold text-green-700 text-sm">Hum karte hain</span>
            </div>
            <ul className="space-y-2">
              {[
                'OTP se mobile number verify karna',
                'Fake profile report karne ka option dena',
                'Admin dwara profile review karna',
                'Block / Report ki suvidha dena',
                'Aapka data surakshit rakhna',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don't */}
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={20} className="text-red-600" />
              <span className="font-bold text-red-700 text-sm">Hum nahi karte</span>
            </div>
            <ul className="space-y-2">
              {[
                'Aadhar / ID card verify karna',
                'Income ya salary proof check karna',
                'Kisi ka background check karna',
                'Kisi bhi rishte ki guarantee dena',
                'User ki di gayi jaankari ki zimmedari lena',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                  <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── [C] USER KI ZIMMEDARI ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5 border-b pb-2">
          <User size={20} className="text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Aapki Zimmedari</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Rishta tay karne se pehle aap khud yeh zaroori kadam uthaayen:</p>
        <ol className="space-y-4">
          {[
            {
              title: 'Jaankari khud verify karein',
              desc: 'Aadhar card, marksheet, naukri praman patra (job proof) seedha dekhein. Sirf profile par bharosa na karein.',
            },
            {
              title: "Parivaar ke saath milein",
              desc: 'Dono taraf ke parivaar ek jagah milein — seedha baat karna sabse zaroori hai.',
            },
            {
              title: 'Jaanne-pahchaane logo se poochhein',
              desc: 'Agar samne wala aapke sheher ya gaon ka hai to local log se uske baare mein jaankaari lijiye.',
            },
            {
              title: 'Paise pehle kabhi mat dein',
              desc: 'Koi bhi samajhdar vyakti ya parivaar rishte ke liye pehle paise nahi maangta. Yeh fraud ka sanket ho sakta hai.',
            },
            {
              title: 'Shak ho to turant report karein',
              desc: 'Agar koi user galat lagta hai ya pareshan karta hai, to app mein Report/Block ka istemal karein ya humein email karein.',
            },
            {
              title: 'Shaadi se pehle vivah panjiyan karayen',
              desc: 'Kanoonee suraksha ke liye vivah panjiyan (marriage registration) zaroori hai. Yeh aapke hak mein hoga.',
            },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── [D] KANUNI STHITI ────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-6 shadow-sm" style={{ background: '#1A0D3D', border: '1px solid rgba(107,74,175,0.4)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Scale size={22} style={{ color: '#C9A84C' }} />
          <h2 className="text-lg font-bold" style={{ color: '#F0E8FF' }}>Kanuni Sthiti</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Platform ka darja', value: 'Intermediary (IT Act 2000, Section 2(w))' },
            { label: 'Galat info ki zimmedari', value: 'Galat jaankari dene wale user ki hogi, platform ki nahi' },
            { label: 'Vivad kshetra (Jurisdiction)', value: 'Deoria, Uttar Pradesh ki nyay palika (adalat)' },
            { label: 'Lagoo kanoon', value: 'Indian Contract Act 1872 · IT Act 2000 · DPDP Act 2023' },
            { label: 'Rishte ki guarantee', value: 'Platform kisi bhi rishte ki safalta ki zimmedari nahi leta' },
          ].map((row, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:gap-3 py-2.5 border-b" style={{ borderColor: 'rgba(107,74,175,0.2)' }}>
              <span className="text-xs font-bold shrink-0 sm:w-52" style={{ color: '#C9A84C' }}>{row.label}</span>
              <span className="text-sm mt-0.5 sm:mt-0" style={{ color: 'rgba(240,232,255,0.8)' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-5" style={{ color: 'rgba(200,180,255,0.5)' }}>
          Yeh disclaimer India ke sansadhit laws ke antargat hai aur samay-samay par update ho sakta hai.
          Platform ka istemal karke aap in shartein sweekar karte hain.
        </p>
      </div>

      {/* Footer links */}
      <div className="text-center text-sm text-gray-400 mt-4">
        <Link to="/about#privacy" className="text-red-600 hover:underline font-medium">Privacy Policy</Link>
        {' · '}
        <Link to="/about#terms" className="text-red-600 hover:underline font-medium">Terms of Service</Link>
        {' · '}
        <Link to="/about" className="text-red-600 hover:underline font-medium">About RistaSetu</Link>
      </div>
    </div>
  );
};

export default DisclaimerPage;
