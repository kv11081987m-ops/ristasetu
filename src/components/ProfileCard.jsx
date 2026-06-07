import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, BadgeCheck, Send, MessageCircle } from 'lucide-react';
import PhotoSlider from './PhotoSlider';
import VerifiedBadge from './VerifiedBadge';
import Button from './Button';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useToastContext } from '../context/ToastContext';
import { useNotificationContext } from '../context/NotificationContext';

import { calculateCompatibility } from '../utils/matchUtils';
import { CheckCircle, Clock } from 'lucide-react';
import { isTodayBirthday, getBirthdayWishKey } from '../utils/birthdayUtils';

const ProfileCard = ({ profile, actionButton }) => {
  const { isProfileComplete, userProfile, currentUser } = useAuthContext();
  const { sendInterest, interests, chats, sendMessage } = useAppContext();
  const { showToast } = useToastContext();
  const { sendNotification } = useNotificationContext();

  const existingInterest = interests.find(
    i => (i.senderId === currentUser?.uid && i.receiverId === profile.id) ||
         (i.receiverId === currentUser?.uid && i.senderId === profile.id)
  );

  const [interestStatus, setInterestStatus] = useState('idle'); // 'idle', 'sending', 'sent'
  const [countdown, setCountdown] = useState(15);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleSendInterest = () => {
    if (!isProfileComplete) return;
    
    setInterestStatus('sending');
    setCountdown(15);

    // Save to Firestore after 15 seconds
    timerRef.current = setTimeout(async () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      try {
        await sendInterest(profile.id, currentUser?.uid);
        setInterestStatus('sent');
        sendNotification(profile.id, 'interest', userProfile?.name || 'Someone', userProfile?.photoUrl || null, null).catch(() => {});
      } catch (err) {
        setInterestStatus('idle');
        setCountdown(15);
        if (err.message === 'DAILY_LIMIT') {
          showToast('Aaj ki limit poori ho gayi (10 interests/day)', 'error');
        } else if (err.message === 'PENDING_LIMIT') {
          showToast('Bahut saare pending interests hain. Pehle kuch responses ka wait karein.', 'error');
        } else {
          showToast('Interest bhejne mein error. Dobara try karein.', 'error');
        }
      }
    }, 15000);

    // Update visual countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setInterestStatus('idle');
    setCountdown(15);
  };

  const compat = calculateCompatibility(userProfile, profile);
  const { total: matchPercentage, label: compatLabel, color: compatColor } = compat;
  const isOwner = currentUser?.uid === profile.id || currentUser?.uid === profile.uid;
  const isAdmin = userProfile?.role === 'admin';
  const isMatch = existingInterest?.status === 'accepted';
  const isPhotoHidden = profile.showPhotoToAll === false && !isOwner && !isAdmin;

  const isPremiumProfile = profile.isPremium;

  const isMatchBirthday = isTodayBirthday(profile.dob);
  const matchChat = isMatch && chats
    ? chats.find(c => c.participants?.includes(currentUser?.uid) && c.participants?.includes(profile.id))
    : null;

  const [wishSent, setWishSent] = useState(() => {
    if (!isMatchBirthday || !currentUser?.uid || !profile.id) return false;
    return !!localStorage.getItem(getBirthdayWishKey(currentUser.uid, profile.id));
  });

  const handleBirthdayWish = async () => {
    if (!matchChat || !currentUser?.uid || wishSent) return;
    const key = getBirthdayWishKey(currentUser.uid, profile.id);
    localStorage.setItem(key, '1');
    setWishSent(true);
    try {
      await sendMessage(matchChat.id, 'Janam Din ki Shubhkamnayein! 🎂', currentUser.uid);
      showToast('Birthday wish bheja gaya! 🎂', 'success');
    } catch {
      showToast('Wish bhejne mein error. Dobara try karein.', 'error');
    }
  };

  return (
    <div
      className="bg-surface rounded-lg shadow-md overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow duration-300"
      style={isPremiumProfile ? { border: '2px solid #D4AF37', boxShadow: '0 2px 16px rgba(212,175,55,0.2)' } : { border: '1px solid var(--border)' }}
    >
      <div className="relative group">
        <PhotoSlider
          photos={profile.photos?.length > 0 ? profile.photos : profile.photoUrl ? [profile.photoUrl] : []}
          isFirstVisible={!isPhotoHidden}
          canViewAll={isOwner || isAdmin || isMatch}
          imgClassName="w-full h-64 object-cover"
        />
        {/* Compatibility score ring */}
        <div className="absolute top-2 right-2 pointer-events-none flex flex-col items-center gap-0.5">
          {(() => {
            const r = 18, cx = 22, cy = 22;
            const circ = 2 * Math.PI * r;
            const dash = (matchPercentage / 100) * circ;
            return (
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.55)" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3.5" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={compatColor} strokeWidth="3.5"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`} />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="800" fill="white">
                  {matchPercentage}%
                </text>
              </svg>
            );
          })()}
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                style={{ background: compatColor, color: '#fff', whiteSpace: 'nowrap' }}>
            {compatLabel}
          </span>
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          {isPremiumProfile && (
            <div className="px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                 style={{ background: 'linear-gradient(90deg, #D4AF37, #F0C040)', color: '#7A4F00' }}>
              <span className="text-xs font-black">💎 Premium</span>
            </div>
          )}
          {profile.isVerified && (
            <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <BadgeCheck size={13} className="text-secondary" />
              <span className="text-xs font-bold text-secondary">Verified</span>
            </div>
          )}
          {isMatchBirthday && (
            <div className="px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                 style={{ background: 'linear-gradient(90deg, #7B1C1C, #B7860B)', color: '#FFE66D' }}>
              <span className="text-xs font-black">🎂 Birthday</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg text-primary mb-1 flex items-center gap-1">
          {profile.name}, {profile.age}
          <VerifiedBadge isVerified={profile.isVerified} />
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-light mb-1">
          <MapPin size={16} className="text-secondary" />
          <span>{profile.city}{profile.state ? `, ${profile.state}` : ''}</span>
        </div>
        {isMatchBirthday && (
          <div className="flex items-center gap-1.5 text-xs font-semibold mb-1 px-2 py-1 rounded-md"
               style={{ background: 'linear-gradient(90deg, #fff1f1, #fffbeb)', color: '#92400e' }}>
            <span>🎂</span>
            <span>Aaj inका janam din hai!</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-light mb-3">
          <Briefcase size={16} className="text-secondary" />
          <span>{profile.profession || profile.occupation}</span>
        </div>

        <div className="flex gap-2 text-xs font-medium text-light mb-5 flex-wrap">
          <span className="bg-gray-100 px-3 py-1 rounded-full">{profile.religion}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">{profile.community || profile.caste}</span>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {actionButton && <div>{actionButton}</div>}
          {!actionButton && (
            <div className="flex gap-2">
              <Link to={`/profile/${profile.id}`} className="flex-1">
                <Button variant="outline" className="w-full h-10 flex items-center justify-center">View</Button>
              </Link>
              
              <div className="flex-1 relative group">
                {(existingInterest || interestStatus === 'sent') ? (
                  <Button 
                    disabled={true}
                    className="w-full h-10 flex items-center justify-center gap-2 opacity-80 cursor-default"
                    variant={existingInterest?.status === 'accepted' ? 'secondary' : 'outline'}
                    style={{ 
                      padding: '0.5rem',
                      backgroundColor: existingInterest?.status === 'accepted' ? 'var(--secondary)' : '#F3F4F6',
                      color: existingInterest?.status === 'accepted' ? 'white' : '#6B7280',
                      border: 'none'
                    }}
                  >
                    {existingInterest?.status === 'accepted' ? (
                      <><MessageCircle size={16} /> <span className="hidden sm:inline">Connected</span></>
                    ) : (
                      <><Clock size={16} /> <span className="hidden sm:inline">Interest Sent</span></>
                    )}
                  </Button>
                ) : interestStatus === 'sending' ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Button 
                      disabled={true}
                      className={`w-full h-10 flex items-center justify-center gap-2 bg-green-600 text-white cursor-not-allowed`}
                      style={{ padding: '0.5rem', backgroundColor: '#16A34A', color: 'white', border: 'none' }}
                    >
                      <CheckCircle size={16} /> <span className="hidden sm:inline">Interest Sent</span>
                    </Button>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleUndo}
                        className="flex-1 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer bg-white"
                      >
                        Undo ({countdown}s)
                      </button>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-1000 ease-linear"
                          style={{ width: `${(countdown / 15) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSendInterest}
                    disabled={!isProfileComplete}
                    className={`w-full h-10 flex items-center justify-center gap-2 ${
                      !isProfileComplete ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 border-none' : 'bg-red-600 text-white'
                    }`}
                    variant="primary"
                    style={{ 
                      padding: '0.5rem',
                      backgroundColor: !isProfileComplete ? '#E5E7EB' : '#DC2626'
                    }}
                  >
                    <Send size={16} /> <span className="hidden sm:inline">Connect</span>
                  </Button>
                )}
                
                {!isProfileComplete && !existingInterest && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded text-center z-10 shadow-lg">
                    Please complete your profile to interact
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isMatchBirthday && isMatch && matchChat && (
            <button
              onClick={handleBirthdayWish}
              disabled={wishSent}
              className="w-full mt-1 py-2 text-xs font-bold rounded-lg transition-all border-none cursor-pointer"
              style={wishSent
                ? { background: '#D1FAE5', color: '#065F46', cursor: 'default' }
                : { background: 'linear-gradient(90deg, #7B1C1C, #B7860B)', color: '#FFE66D' }
              }
            >
              {wishSent ? '🎉 Wish Bheja Ja Chuka Hai' : '🎂 Birthday Wish Bhejo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
