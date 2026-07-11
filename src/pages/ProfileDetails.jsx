import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { BadgeCheck, Heart, ShieldAlert, ArrowLeft, Lock, Calendar, Loader2 } from 'lucide-react';
import PhotoSlider from '../components/PhotoSlider';
import { formatDate } from '../utils/formatDate';
import BiodataDownloadButton from '../components/BiodataDownloadButton';
import { incrementProfileView } from '../utils/analyticsUtils';
import CompatibilityBreakdown from '../components/CompatibilityBreakdown';
import KundaliMilan from '../components/KundaliMilan';
import { subscribeToContact } from '../utils/contactUtils';
import { cloudinaryThumb } from '../utils/cloudinaryUrl';

const ProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profiles, loading, interests, sendInterest, toggleShortlist, shortlists } = useAppContext();
  const { currentUser, userProfile: currentUserProfile } = useAuthContext();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [contact, setContact] = useState(null);

  const profile = profiles.find(p => p.id === id);

  // Track view — non-owner only, once per day per viewer (localStorage-guarded)
  useEffect(() => {
    if (!profile?.id || !currentUser?.uid) return;
    if (currentUser.uid === profile.id || currentUser.uid === profile.uid) return;
    incrementProfileView(profile.id, currentUser.uid);
  }, [profile?.id, currentUser?.uid, profile?.uid]);

  // Contact (phone/email) is no longer stored on the profile doc — it lives
  // in users/{id}/private/contact and is server-rule-gated to the owner,
  // an admin, or a user with a mutual accepted interest. Subscribing here
  // (rather than trusting a `profile.phone` field) means the reveal is
  // actually enforced by Firestore, not just hidden in the UI.
  useEffect(() => {
    if (!profile?.id) {
      setContact(prev => prev ? null : prev); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    return subscribeToContact(profile.id, setContact);
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-light font-medium">Fetching profile details...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <ShieldAlert size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-light mb-6">The profile you are looking for might have been removed or the link is incorrect.</p>
          <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // interests/shortlists are already scoped to current user by AppContext queries
  const isShortlisted = shortlists.some(s => s.profileId === profile.id);
  const existingInterest = interests.find(
    i => i.receiverId === profile.id || i.senderId === profile.id
  );

  const isOwner = currentUser?.uid === profile.id || currentUser?.uid === profile.uid;
  const isAdmin = currentUserProfile?.role === 'admin';
  const isMatch = existingInterest?.status === 'accepted';
  const isPhotoHidden = profile.showPhotoToAll === false && !isOwner && !isAdmin && !isMatch;
  const canViewAll = isOwner || isAdmin || isMatch;
  const photos = profile.photos?.length > 0 ? profile.photos : profile.photoUrl ? [profile.photoUrl] : [];

  const renderContactAction = () => {
    if (existingInterest) {
      if (existingInterest.status === 'accepted') {
        return <Button onClick={() => navigate('/chat')} className="w-full">Chat Now</Button>;
      }
      return <Button variant="outline" className="w-full" disabled>Interest {existingInterest.status.charAt(0).toUpperCase() + existingInterest.status.slice(1)}</Button>;
    }
    return <Button variant="primary" className="w-full" disabled={!currentUserProfile?.uid} onClick={() => currentUserProfile?.uid && sendInterest(profile.id, currentUserProfile.uid)}>Send Interest</Button>;
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:text-primary-hover mb-6 bg-transparent border-none cursor-pointer font-bold transition-colors">
        <ArrowLeft size={20} /> Back to Results
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/5 relative">
            <PhotoSlider
              photos={photos}
              isFirstVisible={!isPhotoHidden}
              canViewAll={canViewAll}
              imgClassName="w-full min-h-[400px] object-cover"
              currentIndex={activePhotoIdx}
              onIndexChange={setActivePhotoIdx}
            />
            {photos.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto bg-black/30">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhotoIdx(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-all ${activePhotoIdx === i ? 'border-red-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    {canViewAll || i === 0 ? (
                      <img src={cloudinaryThumb(url, 150)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Lock size={14} className="text-white/60" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {profile.isVerified && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg border border-white pointer-events-none">
                <BadgeCheck size={20} className="text-secondary" />
                <span className="text-sm font-bold text-secondary">Verified Profile</span>
              </div>
            )}
          </div>
          
          <div className="md:w-2/3 p-6 md:p-8">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                <p className="text-light text-lg">{profile.age} yrs</p>
                <p className="text-light text-lg">{profile.city}, {profile.state}</p>
                {profile.maritalStatus === 'married' && (
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-sm font-bold" style={{ background: '#FFFBF0', border: '1.5px solid #D4AF37', color: '#92610A' }}>
                    💍 Shaadi Ho Gayi
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => toggleShortlist(profile.id, currentUserProfile?.uid)}
                  className="bg-transparent border-none cursor-pointer flex items-center justify-center p-2 rounded-full"
                  title="Shortlist Profile"
                  style={{ background: 'var(--bg-color)' }}
                >
                  <Heart size={28} fill={isShortlisted ? 'var(--primary)' : 'none'} color={isShortlisted ? 'var(--primary)' : 'var(--text-light)'} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
              <div>
                <h3 className="font-bold text-sm text-light mb-1 border-b pb-1">BACKGROUND</h3>
                <p><strong>Religion:</strong> {profile.religion}</p>
                <p><strong>Community:</strong> {profile.community || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-bold text-sm text-light mb-1 border-b pb-1">EDUCATION & CAREER</h3>
                {profile.education && <p><strong>Education:</strong> {profile.education}</p>}
                <p><strong>Profession:</strong> {profile.occupation || profile.profession || 'Not specified'}</p>
                {profile.incomeRange && <p><strong>Income:</strong> {profile.incomeRange}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-light mb-8 bg-gray-50 p-2 rounded-lg w-fit">
              <Calendar size={14} className="text-secondary" />
              <span>Member Since: {formatDate(profile.createdAt)}</span>
            </div>

            {(profile.about || profile.aboutMe) && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2 text-primary">About Me</h3>
                <p className="text-light leading-relaxed">{profile.about || profile.aboutMe}</p>
              </div>
            )}

            {profile.familyDetails && (
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2 text-primary">Family Details</h3>
                <p className="text-light leading-relaxed">{profile.familyDetails}</p>
              </div>
            )}

            {profile.partnerPreferences && (
              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2 text-primary">Partner Preferences</h3>
                <p className="text-light leading-relaxed">{profile.partnerPreferences}</p>
              </div>
            )}

            {existingInterest?.status === 'accepted' && (
              <div className="bg-green-50 p-4 rounded-lg mb-6 border" style={{ borderColor: 'var(--secondary)', backgroundColor: '#F0FDF4' }}>
                <h3 className="font-bold text-secondary mb-2 flex items-center gap-2"><BadgeCheck size={20} /> Contact Details Revealed</h3>
                <p><strong>Phone:</strong> {contact?.phone || 'Loading...'}</p>
                <p><strong>Email:</strong> {contact?.email || '—'}</p>
              </div>
            )}

            {/* Compatibility breakdown — shown to non-owners */}
            {!isOwner && currentUserProfile && (
              <CompatibilityBreakdown user={currentUserProfile} profile={profile} />
            )}

            {/* Kundali Milan — shown to non-owners */}
            {!isOwner && currentUserProfile && (
              <KundaliMilan userProfile={currentUserProfile} matchProfile={profile} />
            )}

            <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t items-center justify-between">
              <div className="w-full md:w-1/2">
                {renderContactAction()}
              </div>
              <div className="flex flex-col items-end gap-2">
                {(isOwner || isMatch) && (
                  <BiodataDownloadButton
                    profile={{ ...profile, ...(contact || {}) }}
                    showContact={isOwner || isMatch}
                  />
                )}
                {!isOwner && !isMatch && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock size={12} /> Interest accept hone ke baad biodata download hoga
                  </div>
                )}
                <button
                  className="flex items-center gap-2 text-sm text-light bg-transparent border-none cursor-pointer"
                  onClick={() => window.open(`mailto:ristasetu@gmail.com?subject=Report Profile ${profile.id}&body=I want to report the profile of ${profile.name} (ID: ${profile.id}). Reason: `, '_blank')}
                >
                  <ShieldAlert size={16} /> Report Profile
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
