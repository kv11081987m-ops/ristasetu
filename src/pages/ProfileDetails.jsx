import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';
import { BadgeCheck, Heart, ShieldAlert, ArrowLeft } from 'lucide-react';

const ProfileDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profiles, currentUser, interests, sendInterest, toggleShortlist, shortlists } = useAppContext();
  
  const profile = profiles.find(p => p.id === id);
  
  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  const isShortlisted = shortlists.some(s => s.userId === currentUser.id && s.profileId === profile.id);
  const existingInterest = interests.find(
    i => (i.senderId === currentUser.id && i.receiverId === profile.id) || 
         (i.receiverId === currentUser.id && i.senderId === profile.id)
  );

  const renderContactAction = () => {
    if (existingInterest) {
      if (existingInterest.status === 'accepted') {
        return <Button onClick={() => navigate('/chat')} className="w-full">Chat Now</Button>;
      }
      return <Button variant="outline" className="w-full" disabled>Interest {existingInterest.status.charAt(0).toUpperCase() + existingInterest.status.slice(1)}</Button>;
    }
    return <Button variant="primary" className="w-full" onClick={() => sendInterest(profile.id)}>Send Interest</Button>;
  };

  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary mb-4 bg-transparent border-none cursor-pointer font-bold">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-surface rounded-lg shadow-md border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3" style={{ position: 'relative' }}>
            <img src={profile.photoUrl} alt={profile.name} style={{ width: '100%', height: '100%', minHeight: '300px', objectFit: 'cover' }} />
            {profile.isVerified && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BadgeCheck size={20} color="var(--secondary)" />
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
