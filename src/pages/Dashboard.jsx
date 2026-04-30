import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { Filter, UserPlus, Edit3, X } from 'lucide-react';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { calculateMatchPercentage } from '../utils/matchUtils';
import CompletenessMeter from '../components/CompletenessMeter';
import { calculateCompleteness } from '../utils/calculateCompleteness';
import VerifiedBadge from '../components/VerifiedBadge';
import Button from '../components/Button';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200 w-full" />
    <div className="p-4">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded flex-1" />
        <div className="h-8 bg-gray-200 rounded flex-1" />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { interests, profiles, loading } = useAppContext();
  const { currentUser, userProfile, isProfileComplete } = useAuthContext();
  const completenessScore = calculateCompleteness(userProfile);

  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    minAge: '', maxAge: '', city: '', religion: '', profession: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    minAge: '', maxAge: '', city: '', religion: '', profession: ''
  });


  if (!currentUser) return null;

  // Recommendations and filtering logic
  const recommendedProfiles = profiles
    .filter(p => {
      if (p.id === currentUser.uid) return false;
      if (p.role === 'admin') return false;

      // Removed the filter that hides profiles with existing interests.
      // Now the ProfileCard will handle showing the appropriate 'Interest Sent' or 'Connected' status.

      if (activeFilters.minAge && p.age < parseInt(activeFilters.minAge)) return false;
      if (activeFilters.maxAge && p.age > parseInt(activeFilters.maxAge)) return false;
      if (activeFilters.city && p.city && !p.city.toLowerCase().includes(activeFilters.city.toLowerCase())) return false;
      if (activeFilters.religion && p.religion && p.religion.toLowerCase() !== activeFilters.religion.toLowerCase()) return false;
      if (activeFilters.profession && p.profession && !p.profession.toLowerCase().includes(activeFilters.profession.toLowerCase())) return false;

      return true;
    })
    .map(p => ({
      ...p,
      matchScore: calculateMatchPercentage(userProfile, p)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const handleApplyFilters = () => {
    setIsApplyingFilters(true);
    // Simulate a brief delay for a more "professional" feel as requested
    setTimeout(() => {
      setActiveFilters(filters);
      setIsFilterModalOpen(false);
      setIsApplyingFilters(false);
    }, 600);
  };

  const handleClearFilters = () => {
    const clearedFilters = { minAge: '', maxAge: '', city: '', religion: '', profession: '' };
    setFilters(clearedFilters);
    setActiveFilters(clearedFilters);
    setIsFilterModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 page-transition">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-red-600 uppercase tracking-wider">Welcome, {userProfile?.name || 'User'}</h3>
            <VerifiedBadge isVerified={userProfile?.isVerified} size={14} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Recommended Matches</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
            <p className="text-gray-500 text-sm whitespace-nowrap">Profiles based on your preferences</p>
            <CompletenessMeter score={completenessScore} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 font-semibold transition-colors shadow-sm"
          >
            <Filter size={18} />
            Filter
          </button>

          {!isProfileComplete ? (
            <Link
              to="/complete-profile"
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold transition-colors shadow-sm"
            >
              <UserPlus size={18} />
              Update Your Profile
            </Link>
          ) : (
            <Link
              to="/settings"
              className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 font-semibold transition-colors shadow-sm"
            >
              <Edit3 size={18} />
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {!isProfileComplete && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-8 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Profile Incomplete</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>Complete your profile to interact with matches. You are currently in view-only mode.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)}
        </div>
      ) : recommendedProfiles.length === 0 ? (
        <div className="bg-white border border-gray-100 p-12 rounded-xl text-center shadow-sm">
          <Filter className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No matches found</h3>
          <p className="mt-1 text-gray-500">No new recommendations match your current filters. Try adjusting them.</p>
          <button
            onClick={handleClearFilters}
            className="mt-6 text-red-600 font-medium hover:text-red-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendedProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
            />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-red-600" />
                Filter Matches
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAge}
                    onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                <select
                  value={filters.religion}
                  onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors bg-white"
                >
                  <option value="">Any</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Christian">Christian</option>
                  <option value="Jain">Jain</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <input
                  type="text"
                  placeholder="e.g. Engineer, Doctor"
                  value={filters.profession}
                  onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <Button
                onClick={handleApplyFilters}
                loading={isApplyingFilters}
                className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
