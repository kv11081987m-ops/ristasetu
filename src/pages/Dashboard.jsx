import React from 'react';
import ProfileCard from '../components/ProfileCard';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { profiles, interests } = useAppContext();
  const { currentUser, isProfileComplete } = useAuthContext();
  
  if (!currentUser) return null;

  // Basic recommendation: opposite gender, not already sent interest
  const recommendedProfiles = profiles.filter(p => {
    // For demo using mock profiles vs Firebase user - matching by id string format might differ.
    // In a fully integrated app, `profiles` would come from Firestore 'users' collection.
    if (p.id === currentUser.uid) return false;
    
    // Check if interest already exists
    const existingInterest = interests.find(
      i => (i.senderId === currentUser.uid && i.receiverId === p.id) || 
           (i.receiverId === currentUser.uid && i.senderId === p.id)
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
      
      {!isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md mb-6 shadow-sm">
          <p className="font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            Complete your profile to interact!
          </p>
          <p className="text-sm mt-1">You are currently in view-only mode. To send requests and chat, please complete your profile.</p>
        </div>
      )}

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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
