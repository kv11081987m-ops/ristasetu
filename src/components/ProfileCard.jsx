import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, BadgeCheck, Send, MessageCircle, Lock } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';
import Button from './Button';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

import { calculateMatchPercentage } from '../utils/matchUtils';
import { CheckCircle, Clock } from 'lucide-react';

const ProfileCard = ({ profile, actionButton }) => {
  const { isProfileComplete, userProfile } = useAuthContext();
  const { sendInterest, interests } = useAppContext();

  const existingInterest = interests.find(
    i => (i.senderId === userProfile?.uid && i.receiverId === profile.id) || 
         (i.receiverId === userProfile?.uid && i.senderId === profile.id)
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
    timerRef.current = setTimeout(() => {
      sendInterest(profile.id, userProfile.uid);
      setInterestStatus('sent');
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

  const matchPercentage = calculateMatchPercentage(userProfile, profile);
  const isOwner = userProfile?.uid === profile.id || userProfile?.uid === profile.uid;
  const isAdmin = userProfile?.role === 'admin';
  const isPhotoHidden = profile.showPhotoToAll === false && !isOwner && !isAdmin;

  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden border flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <div className="relative overflow-hidden group">
        <img 
          src={isPhotoHidden ? 'https://placehold.co/300x400/png?text=Photo+Protected' : (profile.photoUrl || 'https://placehold.co/300x400/png?text=No+Photo')} 
          alt={profile.name} 
          className={`w-full h-64 object-cover transition-all duration-500 ${isPhotoHidden ? 'blur-md scale-110' : ''}`} 
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x400/png?text=No+Photo'; }}
        />
        {isPhotoHidden && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full mb-2">
              <Lock size={20} className="text-white" />
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-wider">Photo Private</p>
            <p className="text-white/70 text-[10px] mt-1">Send Interest to view</p>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-red-500">
          <span className="text-xs font-bold text-white">{matchPercentage}% Match</span>
        </div>
        {profile.isVerified && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <BadgeCheck size={16} className="text-secondary" />
            <span className="text-xs font-bold text-secondary">Verified</span>
          </div>
        )}
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
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
