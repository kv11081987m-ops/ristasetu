export const ICEBREAKER_CATEGORIES = [
  {
    id: 'parichay',
    label: 'परिचय',
    emoji: '🙏',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    questions: [
      'Apne baare mein 3 khaas baatein bataiye?',
      'Aapka sabse achha childhood memory kya hai?',
      'Apni family ko aap kaise describe karenge?',
      'Weekends mein aap kya karna pasand karte hain?',
      'Zindagi mein aapke liye sabse important cheez kya hai?',
    ],
  },
  {
    id: 'peshaa',
    label: 'पेशा',
    emoji: '💼',
    color: '#0369A1',
    bg: 'rgba(3,105,161,0.08)',
    questions: [
      'Apne kaam mein aapko kya sabse zyada pasand hai?',
      'Agle 5 saalon mein aap khud ko professionally kahan dekhte hain?',
      'Work-life balance ke baare mein aapki kya soch hai?',
      'Apna career field aapne kyun choose kiya?',
      'Kaam ke alawa aap kisme kaafi acche hain?',
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    emoji: '🌟',
    color: '#B45309',
    bg: 'rgba(180,83,9,0.08)',
    questions: [
      'Favorite khana kya hai — ghar ka ya bahar ka?',
      'Ek hafta ki chhutti mile toh kahan jaana chahenge?',
      'Movies zyada dekhte hain ya kitaabein padhte hain?',
      'Koi aisi hobby hai jo log jaankar hairan ho jaayein?',
      'Subah uthte hi pehle kya karte hain?',
    ],
  },
  {
    id: 'shaadi',
    label: 'शादी',
    emoji: '💍',
    color: '#B91C1C',
    bg: 'rgba(185,28,28,0.08)',
    questions: [
      'Life partner mein aap kya qualities dekhna chahte hain?',
      'Shaadi ke baad kaisa ghar banana chahenge?',
      'Joint family ya nuclear family — aapki kya preference hai?',
      'Rishte mein communication kitni zaroori lagti hai aapko?',
      'Kya aap shaadi ke baad bhi apna career continue karna chahenge?',
    ],
  },
];

export const getSmartSuggestions = (me, other) => {
  if (!me || !other) return [];
  const out = [];
  const sameCity =
    me.city && other.city &&
    me.city.toLowerCase().trim() === other.city.toLowerCase().trim();
  const myProf = (me.profession || me.occupation || '').toLowerCase().trim();
  const otherProf = (other.profession || other.occupation || '').toLowerCase().trim();
  const sameProf = myProf && otherProf && myProf === otherProf;
  const sameReligion =
    me.religion && other.religion &&
    me.religion.toLowerCase() === other.religion.toLowerCase();

  if (sameCity) {
    out.push(`Hum dono ${other.city} mein rehte hain — aapka sabse favorite jagah kaunsi hai yaahan?`);
  }
  if (sameProf) {
    out.push(`Hum dono ${other.profession || other.occupation} field mein hain — aapka experience kaisa raha?`);
  }
  if (sameReligion && out.length === 0) {
    out.push(`Hamare dharm mein aapka kaunsa tyohaar sabse khaas lagta hai?`);
  }
  if (out.length === 0) {
    out.push('Aapka ek favorite quote ya kahavat kaunsi hai jo aapko inspire karti hai?');
    out.push('Haal mein koi achhi movie, show ya kitaab dekhi/padhi aapne?');
  }
  return out.slice(0, 3);
};
