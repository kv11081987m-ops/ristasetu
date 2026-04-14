import React from 'react';
import ProfileCard from '../components/ProfileCard';
import { useAppContext } from '../context/AppContext';

const Home = () => {
  const { profiles, currentUser, sendInterest, interests } = useAppContext();
  
  // Basic recommendation: opposite gender, not already sent interest
  const recommendedProfiles = profiles.filter(p => {
    if (p.id === currentUser.id) return false;
    if (p.gender === currentUser.gender) return false; // simple demo logic
    
    // Check if interest already exists
    const existingInterest = interests.find(
      i => (i.senderId === currentUser.id && i.receiverId === p.id) || 
           (i.receiverId === currentUser.id && i.senderId === p.id)
    );
    if (existingInterest) return false;
    
    return true;
  });

  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Recommended Matches</h2>
        <p className="text-light text-sm">Profiles selected based on your preferences</p>
      </div>
      
      {recommendedProfiles.length === 0 ? (
        <div className="bg-surface border p-8 rounded-lg text-center shadow-sm">
          <p className="text-light">No new recommendations at the moment. Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProfiles.map(profile => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              actionButton={
                <button 
                  className="bg-primary text-white text-sm font-bold rounded-md"
                  style={{ padding: '0.5rem', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={() => {
                    sendInterest(profile.id);
                    alert(`Interest sent to ${profile.name}`);
                  }}
                >
                  Send Interest
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
