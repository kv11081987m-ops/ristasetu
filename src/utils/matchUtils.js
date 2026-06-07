// ── helpers ──────────────────────────────────────────────────────────────────

const norm = (s) => (s || '').toLowerCase().trim();

// 1. Dharmic Match — 30 pts
const calcDharmic = (user, profile) => {
  let pts = 0;
  if (norm(user.religion) === norm(profile.religion) && norm(user.religion)) pts += 15;
  const uc = norm(user.caste || user.community);
  const pc = norm(profile.caste || profile.community);
  if (uc && pc && uc === pc) pts += 10;
  const ug = norm(user.gotra);
  const pg = norm(profile.gotra);
  // Gotra should NOT match (sapinda rule) — award 5 pts only when different
  if (ug && pg) {
    if (ug !== pg) pts += 5;
    // else gotra same → 0 pts for this sub-factor
  } else {
    pts += 5; // gotra unknown → give benefit of doubt
  }
  return pts;
};

// 2. Location Match — 20 pts
const calcLocation = (user, profile) => {
  if (norm(user.city) && norm(user.city) === norm(profile.city)) return 20;
  if (norm(user.state) && norm(user.state) === norm(profile.state)) return 10;
  return 0;
};

// 3. Age Compatibility — 20 pts (traditional: ladka bada hona chahiye)
const calcAge = (user, profile) => {
  const ua = parseInt(user.age) || 0;
  const pa = parseInt(profile.age) || 0;
  if (!ua || !pa) return 0;

  const ug = norm(user.gender);
  const pg = norm(profile.gender);

  let maleAge = 0, femaleAge = 0, knownGender = true;
  if (ug === 'male' && pg === 'female')       { maleAge = ua; femaleAge = pa; }
  else if (ug === 'female' && pg === 'male')  { maleAge = pa; femaleAge = ua; }
  else knownGender = false;

  if (!knownGender) {
    const diff = Math.abs(ua - pa);
    if (diff <= 2) return 20;
    if (diff <= 5) return 15;
    if (diff <= 10) return 10;
    return 5;
  }

  const diff = maleAge - femaleAge; // positive = male older
  if (diff >= 1 && diff <= 5)  return 20;
  if (diff >= 6 && diff <= 10) return 15;
  if (diff === 0)              return 10;
  return 5; // female older or diff > 10
};

// 4. Education Match — 15 pts
const EDU_LEVELS = ['high school', 'diploma', 'bachelor', 'master', 'phd'];
const eduLevel = (s) => {
  const v = norm(s);
  if (!v) return -1;
  if (v.includes('phd') || v.includes('doctorate')) return 4;
  if (v.includes('master') || v.includes('mba') || v.includes('m.tech') || v.includes('msc')) return 3;
  if (v.includes('bachelor') || v.includes('b.tech') || v.includes('bsc') || v.includes('bca') || v.includes('ba') || v.includes('bcom') || v.includes('graduate')) return 2;
  if (v.includes('diploma') || v.includes('polytechnic') || v.includes('iti')) return 1;
  if (v.includes('high school') || v.includes('12th') || v.includes('10th') || v.includes('inter')) return 0;
  return -1;
};
const calcEducation = (user, profile) => {
  const ul = eduLevel(user.education);
  const pl = eduLevel(profile.education);
  if (ul === -1 || pl === -1) return 0;
  const diff = Math.abs(ul - pl);
  if (diff === 0) return 15;
  if (diff === 1) return 10;
  return 5;
};

// 5. Profession Match — 15 pts
const PROF_FIELDS = [
  ['tech', ['engineer', 'developer', 'programmer', 'software', 'it ', 'data', 'computer', 'tech']],
  ['medical', ['doctor', 'nurse', 'medical', 'health', 'pharma', 'dentist', 'surgeon']],
  ['education', ['teacher', 'professor', 'lecturer', 'tutor', 'principal']],
  ['business', ['business', 'entrepreneur', 'trader', 'merchant', 'shop', 'vyapar', 'self']],
  ['govt', ['government', 'sarkari', 'police', 'army', 'defence', 'ias', 'ips', 'bank', 'railway']],
  ['finance', ['accountant', ' ca ', 'finance', 'insurance', 'audit', 'chartered']],
  ['law', ['lawyer', 'advocate', 'judge', 'legal']],
  ['agri', ['farmer', 'agriculture', 'kisan', 'farming']],
];
const profField = (s) => {
  const v = norm(s);
  if (!v) return null;
  for (const [field, keywords] of PROF_FIELDS) {
    if (keywords.some(k => v.includes(k))) return field;
  }
  return 'other';
};
const calcProfession = (user, profile) => {
  const uf = profField(user.occupation || user.profession);
  const pf = profField(profile.occupation || profile.profession);
  if (!uf || !pf) return 0;
  if (uf === pf) return 15;
  // Broadly compatible pairs
  const compatible = [['tech', 'business'], ['govt', 'finance'], ['medical', 'education']];
  const isCompat = compatible.some(([a, b]) => (uf === a && pf === b) || (uf === b && pf === a));
  return isCompat ? 10 : 5;
};

// ── public API ────────────────────────────────────────────────────────────────

export const calculateCompatibility = (user, profile) => {
  if (!user || !profile) {
    return {
      total: 0,
      breakdown: {
        dharmic:   { score: 0, max: 30, label: 'Dharm / Jaati' },
        location:  { score: 0, max: 20, label: 'Location' },
        age:       { score: 0, max: 20, label: 'Aayu' },
        education: { score: 0, max: 15, label: 'Shiksha' },
        profession:{ score: 0, max: 15, label: 'Peshaa' },
      },
      label: 'Milan Sambhav', color: '#EF4444', emoji: '❤️',
    };
  }

  const dharmic    = calcDharmic(user, profile);
  const location   = calcLocation(user, profile);
  const age        = calcAge(user, profile);
  const education  = calcEducation(user, profile);
  const profession = calcProfession(user, profile);
  const total = dharmic + location + age + education + profession;

  let label, color, emoji;
  if      (total >= 90) { label = 'Ati Uttam Milan'; color = '#16A34A'; emoji = '💚'; }
  else if (total >= 70) { label = 'Uttam Milan';     color = '#CA8A04'; emoji = '💛'; }
  else if (total >= 50) { label = 'Sadharan Milan';  color = '#EA580C'; emoji = '🧡'; }
  else                  { label = 'Milan Sambhav';   color = '#EF4444'; emoji = '❤️'; }

  return {
    total,
    breakdown: {
      dharmic:    { score: dharmic,    max: 30, label: 'Dharm / Jaati' },
      location:   { score: location,   max: 20, label: 'Location' },
      age:        { score: age,        max: 20, label: 'Aayu' },
      education:  { score: education,  max: 15, label: 'Shiksha' },
      profession: { score: profession, max: 15, label: 'Peshaa' },
    },
    label,
    color,
    emoji,
  };
};

// Backward-compatible wrapper used by Dashboard sort + any other callers
export const calculateMatchPercentage = (user, profile) =>
  calculateCompatibility(user, profile).total;
