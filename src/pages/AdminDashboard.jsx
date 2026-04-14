import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Button from '../components/Button';
import { ShieldAlert, CheckCircle, Trash2, LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { currentUser, profiles, verifyProfile, banProfile, logout } = useAppContext();
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  const filteredProfiles = profiles.filter(p => p.role !== 'admin' && (activeTab === 'all' || (activeTab === 'unverified' && !p.isVerified)));

  return (
    <div className="container page-transition" style={{ padding: '2rem 1rem' }}>
      <div className="bg-primary text-white p-6 rounded-lg mb-6 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert /> Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ opacity: 0.9 }}>Manage profiles and moderation.</p>
        </div>
        <Button variant="outline" style={{ color: 'white', borderColor: 'white' }} onClick={handleLogout} className="flex items-center gap-2">
          <LogOut size={16} /> Logout
        </Button>
      </div>

      <div className="flex gap-4 mb-6 border-b pb-2">
        <button 
          className={`font-bold pb-2 cursor-pointer border-none bg-transparent ${activeTab === 'all' ? 'text-primary' : 'text-light'}`}
          style={{ borderBottom: activeTab === 'all' ? '2px solid var(--primary)' : '2px solid transparent' }}
          onClick={() => setActiveTab('all')}
        >
          All Profiles ({profiles.filter(p=>p.role!=='admin').length})
        </button>
        <button 
          className={`font-bold pb-2 cursor-pointer border-none bg-transparent ${activeTab === 'unverified' ? 'text-primary' : 'text-light'}`}
          style={{ borderBottom: activeTab === 'unverified' ? '2px solid var(--primary)' : '2px solid transparent' }}
          onClick={() => setActiveTab('unverified')}
        >
          Unverified ({profiles.filter(p=>p.role!=='admin' && !p.isVerified).length})
        </button>
      </div>

      <div className="bg-surface border rounded-lg shadow-sm overflow-x-auto">
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr className="border-b" style={{ backgroundColor: '#F9FAFB' }}>
              <th className="p-4 font-bold text-sm text-light">Profile</th>
              <th className="p-4 font-bold text-sm text-light">Details</th>
              <th className="p-4 font-bold text-sm text-light">Status</th>
              <th className="p-4 font-bold text-sm text-light">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <img src={p.photoUrl} alt="" className="rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-light">{p.id}</div>
                  </div>
                </td>
                <td className="p-4 text-sm text-light">
                  <div className="mb-1">{p.age} yrs, {p.gender}</div>
                  <div>{p.city}, {p.state}</div>
                </td>
                <td className="p-4">
                  {p.isVerified ? (
                    <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#16A34A' }}>
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-light">
                      Pending
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!p.isVerified && (
                      <Button variant="outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => verifyProfile(p.id)}>Verify</Button>
                    )}
                    <Button variant="danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                        if(confirm('Are you sure you want to ban this profile?')) banProfile(p.id);
                    }}>
                      <Trash2 size={14} /> Ban
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProfiles.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-light">No profiles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
