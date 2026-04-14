import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ProfileCard from '../components/ProfileCard';
import { Filter } from 'lucide-react';

const Search = () => {
  const { profiles, currentUser } = useAppContext();
  const [filters, setFilters] = useState({
    minAge: 18, maxAge: 50,
    religion: 'All', maritalStatus: 'All'
  });
  
  const handleFilterChange = (e) => setFilters({...filters, [e.target.name]: e.target.value});

  const filteredProfiles = profiles.filter(p => {
    // Only opposite gender for demo
    if (p.id === currentUser.id) return false;
    if (p.gender === currentUser.gender) return false;
    
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;
    if (filters.religion !== 'All' && p.religion !== filters.religion) return false;
    if (filters.maritalStatus !== 'All' && p.maritalStatus !== filters.maritalStatus) return false;
    
    return true;
  });

  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-surface p-4 rounded-lg shadow-sm border" style={{ position: 'sticky', top: '100px' }}>
            <div className="flex items-center gap-2 font-bold text-lg mb-4 text-primary border-b pb-2">
              <Filter size={20} /> Search Filters
            </div>
            
            <div className="form-group">
              <label className="form-label">Age Range</label>
              <div className="flex items-center gap-2">
                <input type="number" name="minAge" className="form-input" style={{ width: '50%' }} value={filters.minAge} onChange={handleFilterChange} />
                <span>to</span>
                <input type="number" name="maxAge" className="form-input" style={{ width: '50%' }} value={filters.maxAge} onChange={handleFilterChange} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Religion</label>
              <select name="religion" className="form-select" value={filters.religion} onChange={handleFilterChange}>
                <option>All</option>
                <option>Hindu</option>
                <option>Muslim</option>
                <option>Sikh</option>
                <option>Christian</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Marital Status</label>
              <select name="maritalStatus" className="form-select" value={filters.maritalStatus} onChange={handleFilterChange}>
                <option>All</option>
                <option>Never Married</option>
                <option>Divorced</option>
                <option>Awaiting Divorce</option>
                <option>Widowed</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="w-full md:w-3/4">
          <h2 className="text-xl font-bold mb-4">Search Results ({filteredProfiles.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
