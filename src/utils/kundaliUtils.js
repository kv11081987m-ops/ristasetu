// 8-Koot Kundali Milan scoring — traditional 36 Gunn system

export const RASHI_LIST = [
  'Mesh','Vrishabh','Mithun','Kark','Simha','Kanya',
  'Tula','Vrishchik','Dhanu','Makar','Kumbh','Meen'
];

export const NAKSHATRA_LIST = [
  'Ashwini','Bharani','Kritika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Moola','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
  'Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

export const MANGLIK_OPTIONS = [
  { value: 'non-manglik', label: 'Non-Manglik' },
  { value: 'manglik', label: 'Manglik' },
  { value: 'anshik-manglik', label: 'Anshik Manglik (Partial)' },
];

// Nadi for each of 27 nakshatras (repeating aadi/madhya/antya cycle)
const NADI = [
  'aadi','madhya','antya','antya','madhya','aadi',
  'aadi','madhya','antya','antya','madhya','aadi',
  'aadi','madhya','antya','antya','madhya','aadi',
  'aadi','madhya','antya','antya','madhya','aadi',
  'aadi','madhya','antya',
];

// Gana for each nakshatra
const GANA = [
  'dev','manav','rakshasa','dev','dev','rakshasa',
  'dev','dev','rakshasa','rakshasa','manav','manav',
  'dev','rakshasa','dev','rakshasa','dev','rakshasa',
  'rakshasa','manav','manav','dev','rakshasa','rakshasa',
  'manav','manav','dev',
];

// Yoni animal for each nakshatra
const YONI = [
  'ashwa','gaj','mesh','sarpa','sarpa','shwan',
  'marjar','mesh','marjar','mushak','mushak','gau',
  'mahish','vyaghra','mahish','vyaghra','shasha','mrig',
  'shwan','vanara','nakula','vanara','simha','ashwa',
  'simha','gau','gaj',
];

// Varna by rashi index (1=Shudra, 2=Vaishya, 3=Kshatriya, 4=Brahmin)
// Fire(Mesh,Simha,Dhanu)=3, Earth(Vrishabh,Kanya,Makar)=2, Air(Mithun,Tula,Kumbh)=1, Water(Kark,Vrishchik,Meen)=4
const VARNA = [3,2,1,4,3,2,1,4,3,2,1,4];

// Ruling planet for each rashi
const RASHI_LORD = [
  'Mangal','Shukra','Budh','Chandra','Surya','Budh',
  'Shukra','Mangal','Guru','Shani','Shani','Guru'
];

// Planet friendship: 1=friend, 0=neutral, -1=enemy
// Order: Surya, Chandra, Mangal, Budh, Guru, Shukra, Shani
const PLANETS = ['Surya','Chandra','Mangal','Budh','Guru','Shukra','Shani'];
const FRIENDSHIP = [
  // Su  Ch  Ma  Bu  Gu  Sh  Sa
  [  1,  1,  1,  0,  1, -1, -1], // Surya
  [  1,  1,  0,  0,  1,  0, -1], // Chandra
  [  1,  1,  1,  0,  1,  0, -1], // Mangal
  [  1,  0,  0,  1,  0,  1,  1], // Budh
  [  1,  1,  1,  0,  1, -1, -1], // Guru
  [  0,  0,  0,  1,  0,  1,  1], // Shukra
  [ -1, -1, -1,  1, -1,  1,  1], // Shani
];

const getPlanetIdx = (planet) => PLANETS.indexOf(planet);
const getFriendship = (p1, p2) => {
  const i = getPlanetIdx(p1), j = getPlanetIdx(p2);
  if (i < 0 || j < 0) return 0;
  return FRIENDSHIP[i][j];
};

// Vashya groups
const VASHYA_GROUPS = [
  { rashi: [0,4], controls: [3,10] },          // Mesh,Simha → Kark,Kumbh
  { rashi: [1], controls: [8,10] },             // Vrishabh → Dhanu,Kumbh
  { rashi: [2,5,6], controls: [2,5,6] },        // Mithun,Kanya,Tula → self-group
  { rashi: [3,10], controls: [0,4] },           // Kark,Kumbh → Mesh,Simha
  { rashi: [7,11], controls: [7,11] },          // Vrishchik,Meen → each other
  { rashi: [8,9], controls: [1] },              // Dhanu,Makar → Vrishabh
];

function getVashyaScore(mR, fR) {
  let mControls = false, fControls = false;
  for (const g of VASHYA_GROUPS) {
    if (g.rashi.includes(mR) && g.controls.includes(fR)) mControls = true;
    if (g.rashi.includes(fR) && g.controls.includes(mR)) fControls = true;
  }
  if (mControls && fControls) return 2;
  if (mControls || fControls) return 1;
  return 0;
}

// Yoni enemy pairs (0 points) and hostile pairs (1 point)
const YONI_EXTREME_ENEMY = [['sarpa','nakula'],['marjar','mushak']];
const YONI_HOSTILE = [
  ['ashwa','mahish'], ['gaj','simha'], ['mesh','vanara'],
  ['shwan','shasha'], ['gau','vyaghra']
];

function getYoniScore(mNak, fNak) {
  const my = YONI[mNak], fy = YONI[fNak];
  if (my === fy) return 4;
  for (const [a, b] of YONI_EXTREME_ENEMY) {
    if ((my === a && fy === b) || (my === b && fy === a)) return 0;
  }
  for (const [a, b] of YONI_HOSTILE) {
    if ((my === a && fy === b) || (my === b && fy === a)) return 1;
  }
  return 2;
}

// Tara: count from boy's nakshatra to girl's, divide by 9 → remainder position
const GOOD_TARA = new Set([2, 4, 6, 8, 9]); // 1-indexed positions
function getTaraScore(mNak, fNak) {
  const diff = ((fNak - mNak + 27) % 27) + 1; // 1–27
  const pos = ((diff - 1) % 9) + 1;            // 1–9
  return GOOD_TARA.has(pos) ? 3 : 0;
}

// Bhakoot dosh rashi intervals causing dosh
const BHAKOOT_DOSH_INTERVALS = [[2,12],[12,2],[6,8],[8,6]];
function getBhakootScore(mR, fR) {
  const mIdx = mR + 1, fIdx = fR + 1;
  // Inclusive count: same rashi = 1, adjacent = 2, ..., opposite = 7
  const forwardDiff = ((fIdx - mIdx + 12) % 12) + 1;
  const backwardDiff = ((mIdx - fIdx + 12) % 12) + 1;
  for (const [a, b] of BHAKOOT_DOSH_INTERVALS) {
    if (forwardDiff === a && backwardDiff === b) return 0;
    if (forwardDiff === b && backwardDiff === a) return 0;
  }
  return 7;
}

function scoreVarna(mR, fR) {
  return VARNA[mR] >= VARNA[fR] ? 1 : 0;
}

function scoreVashya(mR, fR) {
  return getVashyaScore(mR, fR);
}

function scoreTara(mNak, fNak) {
  return getTaraScore(mNak, fNak);
}

function scoreYoni(mNak, fNak) {
  return getYoniScore(mNak, fNak);
}

function scoreGrahaMaitri(mR, fR) {
  const mLord = RASHI_LORD[mR], fLord = RASHI_LORD[fR];
  if (mLord === fLord) return 5;
  const mToF = getFriendship(mLord, fLord);
  const fToM = getFriendship(fLord, mLord);
  const sum = mToF + fToM;
  if (sum >= 2) return 5;
  if (sum === 1) return 4;
  if (sum === 0) return 3;
  if (sum === -1) return 1;
  return 0;
}

function scoreGana(mNak, fNak) {
  const mg = GANA[mNak], fg = GANA[fNak];
  if (mg === fg) return 6;
  if (mg === 'dev' && fg === 'manav') return 5;
  if (mg === 'manav' && fg === 'dev') return 5;
  if (mg === 'dev' && fg === 'rakshasa') return 1;
  if (mg === 'rakshasa' && fg === 'dev') return 1;
  if (mg === 'manav' && fg === 'rakshasa') return 1;
  if (mg === 'rakshasa' && fg === 'manav') return 1;
  return 1;
}

function scoreBhakoot(mR, fR) {
  return getBhakootScore(mR, fR);
}

function scoreNadi(mNak, fNak) {
  return NADI[mNak] !== NADI[fNak] ? 8 : 0;
}

export function calculateGunnMilan(userProfile, matchProfile) {
  // Determine which is male/female
  let male, female;
  const uGender = (userProfile.gender || '').toLowerCase();
  const mGender = (matchProfile.gender || '').toLowerCase();

  if (uGender === 'male' || uGender === 'ladka') {
    male = userProfile; female = matchProfile;
  } else if (uGender === 'female' || uGender === 'ladki') {
    male = matchProfile; female = userProfile;
  } else {
    male = userProfile; female = matchProfile;
  }

  const mKundali = male?.kundali || {};
  const fKundali = female?.kundali || {};

  const mRashiName = mKundali.rashi;
  const fRashiName = fKundali.rashi;
  const mNakName = mKundali.nakshatra;
  const fNakName = fKundali.nakshatra;

  if (!mRashiName || !fRashiName || !mNakName || !fNakName) return null;

  const mR = RASHI_LIST.indexOf(mRashiName);
  const fR = RASHI_LIST.indexOf(fRashiName);
  const mNak = NAKSHATRA_LIST.indexOf(mNakName);
  const fNak = NAKSHATRA_LIST.indexOf(fNakName);

  if (mR < 0 || fR < 0 || mNak < 0 || fNak < 0) return null;

  const scores = {
    varna:       { score: scoreVarna(mR, fR),       max: 1,  label: 'Varna' },
    vashya:      { score: scoreVashya(mR, fR),      max: 2,  label: 'Vashya' },
    tara:        { score: scoreTara(mNak, fNak),    max: 3,  label: 'Tara' },
    yoni:        { score: scoreYoni(mNak, fNak),    max: 4,  label: 'Yoni' },
    grahaMaitri: { score: scoreGrahaMaitri(mR, fR), max: 5,  label: 'Graha Maitri' },
    gana:        { score: scoreGana(mNak, fNak),    max: 6,  label: 'Gana' },
    bhakoot:     { score: scoreBhakoot(mR, fR),     max: 7,  label: 'Bhakoot' },
    nadi:        { score: scoreNadi(mNak, fNak),    max: 8,  label: 'Nadi' },
  };

  const total = Object.values(scores).reduce((s, k) => s + k.score, 0);

  const doshas = getDoshas(mKundali, fKundali, mR, fR, mNak, fNak);

  let label, color, emoji;
  if (total >= 32) { label = 'Ati Uttam'; color = '#15803D'; emoji = '💚'; }
  else if (total >= 28) { label = 'Uttam'; color = '#CA8A04'; emoji = '💛'; }
  else if (total >= 18) { label = 'Sadharan'; color = '#EA580C'; emoji = '🧡'; }
  else { label = 'Milap Kathin'; color = '#DC2626'; emoji = '🔴'; }

  return { total, scores, doshas, label, color, emoji, maleName: male.name, femaleName: female.name };
}

function getDoshas(mKundali, fKundali, mR, fR, mNak, fNak) {
  const doshas = [];

  // Nadi Dosh
  if (NADI[mNak] === NADI[fNak]) {
    doshas.push({
      name: 'Nadi Dosh',
      severity: 'high',
      description: `Dono ki Nadi ek hi hai (${NADI[mNak]}). Yeh vivaah mein svaasthya evam santaan ke liye kathin maana jaata hai.`,
      remedy: 'Nadi Dosh Nivaaran Puja karaaein. Pandit se salah lein.',
    });
  }

  // Bhakoot Dosh
  if (scoreBhakoot(mR, fR) === 0) {
    doshas.push({
      name: 'Bhakoot Dosh',
      severity: 'medium',
      description: 'Rashi antar Bhakoot dosh utpann kar raha hai. Arthik aur swasthya kathinaaiyon ki sambhavana.',
      remedy: 'Vishnu Sahastranaam paath aur Bhakoot Dosh Shanti puja se dosh kam ho sakta hai.',
    });
  }

  // Manglik Dosh
  const mManglik = mKundali.manglik;
  const fManglik = fKundali.manglik;
  if (mManglik && fManglik) {
    const mIsManglik = mManglik !== 'non-manglik';
    const fIsManglik = fManglik !== 'non-manglik';
    if (mIsManglik && !fIsManglik) {
      doshas.push({
        name: 'Manglik Dosh',
        severity: mManglik === 'anshik-manglik' ? 'low' : 'high',
        description: `Ladke ko ${mManglik === 'anshik-manglik' ? 'Anshik ' : ''}Mangal Dosh hai, ladki ko nahi. Vaivahik jeevan mein tanav ho sakta hai.`,
        remedy: 'Mangal Shanti Puja, Kumbh Vivah ya Vishnu Vivah se dosh nivaaran sambhav.',
      });
    } else if (!mIsManglik && fIsManglik) {
      doshas.push({
        name: 'Manglik Dosh',
        severity: fManglik === 'anshik-manglik' ? 'low' : 'high',
        description: `Ladki ko ${fManglik === 'anshik-manglik' ? 'Anshik ' : ''}Mangal Dosh hai, ladke ko nahi.`,
        remedy: 'Mangal Shanti Puja, Kumbh Vivah ya Vishnu Vivah se dosh nivaaran sambhav.',
      });
    }
  }

  // Gotra Dosh
  const mGotra = (mKundali.gotra || '').trim().toLowerCase();
  const fGotra = (fKundali.gotra || '').trim().toLowerCase();
  if (mGotra && fGotra && mGotra === fGotra) {
    doshas.push({
      name: 'Gotra Dosh (Sagotra Vivah)',
      severity: 'high',
      description: `Dono ka Gotra "${mKundali.gotra}" ek hi hai. Shaastron mein ek gotra mein vivah varjit maana jaata hai.`,
      remedy: 'Kripaya ek visheshagya pandit ya parivaar ke bujurgon se salah lein.',
    });
  }

  return doshas;
}
