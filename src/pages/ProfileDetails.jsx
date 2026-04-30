import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { BadgeCheck, Heart, ShieldAlert, ArrowLeft, Lock, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/formatDate';

const ProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profiles, loading, currentUser, interests, sendInterest, toggleShortlist, shortlists } = useAppContext();
  const { userProfile: currentUserProfile } = useAuthContext();
  
  const profile = profiles.find(p => p.id === id);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-light font-medium">Fetching profile details...</p>
      </div>
    );
  }

  if (!profile) {
    console.error(`Profile not found for ID: ${id}. Available IDs:`, profiles.map(p => p.id));
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

  const isShortlisted = shortlists.some(s => s.userId === currentUser?.id && s.profileId === profile.id);
  const existingInterest = interests.find(
    i => (i.senderId === currentUser?.id && i.receiverId === profile.id) || 
         (i.receiverId === currentUser?.id && i.senderId === profile.id)
  );

  const isOwner = currentUserProfile?.uid === profile.id || currentUserProfile?.uid === profile.uid;
  const isAdmin = currentUserProfile?.role === 'admin';
  const isMatch = existingInterest?.status === 'accepted';
  const isPhotoHidden = profile.showPhotoToAll === false && !isOwner && !isAdmin && !isMatch;

  const renderContactAction = () => {
    if (existingInterest) {
      if (existingInterest.status === 'accepted') {
        return <Button onClick={() => navigate('/chat')} className="w-full">Chat Now</Button>;
      }
      return <Button variant="outline" className="w-full" disabled>Interest {existingInterest.status.charAt(0).toUpperCase() + existingInterest.status.slice(1)}</Button>;
    }
    return <Button variant="primary" className="w-full" onClick={() => sendInterest(profile.id, currentUserProfile.uid)}>Send Interest</Button>;
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary hover:text-primary-hover mb-6 bg-transparent border-none cursor-pointer font-bold transition-colors">
        <ArrowLeft size={20} /> Back to Results
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/5 relative">
            <img 
              src={isPhotoHidden ? 'https://placehold.co/600x800/png?text=Photo+Protected' : (profile.photoUrl || 'https://placehold.co/600x800/png?text=No+Photo')} 
              alt={profile.name} 
              className={`w-full h-full min-h-[400px] object-cover transition-all duration-700 ${isPhotoHidden ? 'blur-xl scale-110' : ''}`} 
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x800/png?text=No+Photo'; }}
            />
            {isPhotoHidden && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-4 border border-white/30">
                  <Lock size={32} className="text-white" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Photo Protected</h3>
                <p className="text-white/80 text-sm">This user has restricted photo visibility. Send an interest to request access.</p>
              </div>
            )}
            {profile.isVerified && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg border border-white">
                <BadgeCheck size={20} className="text-secondary" />
                <span className="text-sm font-bold text-secondary">Verified Profile</span>
              </div>
            )}
          </div>
          
          <div className="md:w-2/3 p-6 md:p-8">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
                <p className="text-light text-lg">{profile.age} yrs • {profile.height} • {profile.maritalStatus}</p>
                <p className="text-light text-lg">{profile.city}, {profile.state}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => toggleShortlist(profile.id)}
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
                <p><strong>Education:</strong> {profile.education}</p>
                <p><strong>Profession:</strong> {profile.profession}</p>
                <p><strong>Income:</strong> {profile.incomeRange}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-light mb-8 bg-gray-50 p-2 rounded-lg w-fit">
              <Calendar size={14} className="text-secondary" />
              <span>Member Since: {formatDate(profile.createdAt)}</span>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2 text-primary">About Me</h3>
              <p className="text-light leading-relaxed">{profile.aboutMe}</p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-2 text-primary">Family Details</h3>
              <p className="text-light leading-relaxed">{profile.familyDetails}</p>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-lg mb-2 text-primary">Partner Preferences</h3>
              <p className="text-light leading-relaxed">{profile.partnerPreferences}</p>
            </div>

            {existingInterest?.status === 'accepted' && (
              <div className="bg-green-50 p-4 rounded-lg mb-6 border" style={{ borderColor: 'var(--secondary)', backgroundColor: '#F0FDF4' }}>
                <h3 className="font-bold text-secondary mb-2 flex items-center gap-2"><BadgeCheck size={20} /> Contact Details Revealed</h3>
                <p><strong>Phone:</strong> {profile.phone}</p>
                <p><strong>Email:</strong> {profile.email}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t items-center justify-between">
              <div className="w-full md:w-1/2">
                {renderContactAction()}
              </div>
              <button className="flex items-center gap-2 text-sm text-light bg-transparent border-none cursor-pointer" onClick={() => alert('Report submitted.')}>
                <ShieldAlert size={16} /> Report Profile
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
