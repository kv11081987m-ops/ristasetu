import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { auth, db } from '../firebase/firebaseConfig';
import {
  collection, doc, onSnapshot, addDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { calculateMatchPercentage } from '../utils/matchUtils';
import BiodataDownloadButton from '../components/BiodataDownloadButton';
import { cloudinaryThumb } from '../utils/cloudinaryUrl';
import {
  Users, Heart, LogOut, Eye, MessageCircleOff, PenOff,
  BadgeCheck, Loader2, Star, StarOff,
} from 'lucide-react';

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, familyMode } = useAuthContext();
  const { profiles } = useAppContext();

  const { linkedUserId, memberName, relation } = familyMode || {};

  const [linkedProfile, setLinkedProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const interestMapRef = useRef(new Map());

  // Load linked user's profile
  useEffect(() => {
    if (!linkedUserId) return;
    return onSnapshot(doc(db, 'users', linkedUserId), (snap) => {
      setLinkedProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoadingProfile(false);
    });
  }, [linkedUserId]);

  // Load linked user's interests (sent + received)
  useEffect(() => {
    if (!linkedUserId) return;
    const map = interestMapRef.current;
    const sync = () => setInterests([...map.values()]);
    const handle = (snap) => {
      snap.docChanges().forEach(c => {
        if (c.type === 'removed') map.delete(c.doc.id);
        else map.set(c.doc.id, { id: c.doc.id, ...c.doc.data() });
      });
      sync();
    };
    const u1 = onSnapshot(query(collection(db, 'interests'), where('senderId', '==', linkedUserId)), handle);
    const u2 = onSnapshot(query(collection(db, 'interests'), where('receiverId', '==', linkedUserId)), handle);
    return () => { u1(); u2(); map.clear(); };
  }, [linkedUserId]);

  // Load linked user's shortlists
  useEffect(() => {
    if (!linkedUserId) return;
    return onSnapshot(
      query(collection(db, 'shortlists'), where('userId', '==', linkedUserId)),
      (snap) => setShortlists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [linkedUserId]);

  // Compute recommended matches based on linked user's profile
  const matches = useMemo(() => {
    if (!linkedProfile || !profiles.length) return [];
    return profiles
      .filter(p => p.id !== linkedUserId && p.role !== 'admin' && p.isProfileComplete)
      .map(p => ({ ...p, matchScore: calculateMatchPercentage(linkedProfile, p) }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 30);
  }, [profiles, linkedProfile, linkedUserId]);

  const isShortlisted = (profileId) => shortlists.some(s => s.profileId === profileId);

  const handleShortlist = async (profileId) => {
    if (!linkedUserId || !currentUser) return;
    const existing = shortlists.find(s => s.profileId === profileId);
    if (existing) {
      await deleteDoc(doc(db, 'shortlists', existing.id));
    } else {
      await addDoc(collection(db, 'shortlists'), {
        userId: linkedUserId,
        profileId,
        addedByFamily: true,
        familyMemberName: memberName,
        createdAt: serverTimestamp(),
      });
      // Notify linked user
      const profile = profiles.find(p => p.id === profileId);
      await addDoc(collection(db, 'notifications'), {
        userId: linkedUserId,
        fromId: currentUser.uid,
        type: 'family_shortlist',
        message: `${memberName} (${relation}) ne ek profile pasand ki — ${profile?.name || 'Unknown'}`,
        profileId,
        status: 'unread',
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Family view se logout karein?')) return;
    await signOut(auth);
    navigate('/login');
  };

  const sentCount     = interests.filter(i => i.senderId === linkedUserId).length;
  const receivedCount = interests.filter(i => i.receiverId === linkedUserId).length;
  const acceptedCount = interests.filter(i => i.status === 'accepted').length;

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-red-700" size={44} />
        <p className="text-gray-500 font-medium">Family view load ho raha hai...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl page-transition">

      {/* ── Family Banner ── */}
      <div className="rounded-2xl mb-6 overflow-hidden shadow-md"
           style={{ background: 'linear-gradient(135deg, #8B1A2F, #5C0E1E)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white/75 text-xs font-medium">Family View</p>
              <p className="text-white font-bold text-lg leading-tight">
                {linkedProfile?.name || '...'} ka Profile
              </p>
              <p className="text-white/70 text-xs mt-0.5">
                Logged in as: <span className="font-semibold text-white/90">{memberName}</span> ({relation})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {linkedProfile && (
              <BiodataDownloadButton
                profile={linkedProfile}
                showContact={false}
                className="flex-1 sm:flex-none text-sm py-2 px-3"
              />
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all border-none cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* Read-only notice */}
        <div className="bg-black/20 px-5 py-2 flex flex-wrap gap-4 text-xs text-white/70">
          <span className="flex items-center gap-1"><Eye size={11} /> Profiles dekh sakte hain</span>
          <span className="flex items-center gap-1"><Star size={11} /> Shortlist kar sakte hain</span>
          <span className="flex items-center gap-1"><MessageCircleOff size={11} /> Chat nahi kar sakte</span>
          <span className="flex items-center gap-1"><PenOff size={11} /> Profile edit nahi kar sakte</span>
        </div>
      </div>

      {/* ── Linked User's Profile Card ── */}
      {linkedProfile && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex gap-4 items-center">
          <img
            src={cloudinaryThumb(linkedProfile.photoUrl, 120) || 'https://placehold.co/80x80/png?text=RS'}
            alt={linkedProfile.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-red-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg text-gray-900">{linkedProfile.name}</h2>
              {linkedProfile.isVerified && (
                <BadgeCheck size={16} className="text-green-600 shrink-0" />
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {linkedProfile.age} yrs · {linkedProfile.city}, {linkedProfile.state}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {linkedProfile.occupation || linkedProfile.profession} · {linkedProfile.religion}
            </p>
          </div>
          <div className="hidden sm:flex flex-col gap-1 text-center shrink-0">
            <p className="text-xs text-gray-400">RS ID</p>
            <p className="font-mono font-bold text-sm text-gray-700">{linkedProfile.ristaSetuId}</p>
          </div>
        </div>
      )}

      {/* ── Interest Summary ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Interest Bheje', value: sentCount, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Interest Mili', value: receivedCount, color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Match Bane', value: acceptedCount, color: 'bg-green-50 text-green-700 border-green-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs font-medium mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Suggested Matches ── */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Suggested Matches ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 shadow-sm">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Koi match nahi mila</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map(profile => {
              const shortlisted = isShortlisted(profile.id);
              return (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={cloudinaryThumb(profile.photoUrl, 400) || 'https://placehold.co/400x240/png?text=RS'}
                      alt={profile.name}
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-white/90 backdrop-blur-sm text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-100">
                        {profile.matchScore}% match
                      </span>
                    </div>
                    <button
                      onClick={() => handleShortlist(profile.id)}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    >
                      {shortlisted
                        ? <Star size={15} fill="#DC2626" className="text-red-600" />
                        : <StarOff size={15} className="text-gray-400" />
                      }
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-bold text-gray-900 truncate">{profile.name}</p>
                      {profile.isVerified && <BadgeCheck size={13} className="text-green-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">
                      {profile.age} yrs · {profile.city}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {profile.occupation || profile.profession}
                    </p>
                    <button
                      onClick={() => navigate(`/profile/${profile.id}`)}
                      className="mt-3 w-full text-xs font-semibold text-red-700 border border-red-200 rounded-lg py-1.5 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Profile Dekho
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shortlists summary */}
      {shortlists.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={18} className="text-red-600" />
            <h3 className="font-bold text-gray-800">Shortlisted Profiles ({shortlists.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {shortlists.map(s => {
              const p = profiles.find(pr => pr.id === s.profileId);
              if (!p) return null;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/profile/${p.id}`)}
                  className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <img src={cloudinaryThumb(p.photoUrl, 40)} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;
