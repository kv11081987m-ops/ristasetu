import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-blue-600 text-xl font-bold animate-pulse">Verifying Credentials...</div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but not an admin, show Access Denied
  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-8 animate-bounce">
          <ShieldAlert size={48} />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Access Denied
        </h1>
        
        <p className="text-lg text-gray-500 max-w-md mb-10 leading-relaxed">
          Oops! It looks like you've stumbled into a restricted area. 
          You need administrative privileges to view this page.
        </p>
        
        <Link 
          to="/dashboard" 
          className="flex items-center gap-3 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-gray-200"
        >
          <ArrowLeft size={20} />
          Return to Dashboard
        </Link>
        
        <p className="mt-12 text-sm text-gray-400">
          ID: {currentUser.uid} • Role: {userProfile?.role || 'Guest'}
        </p>
      </div>
    );
  }

  // Authorized
  return children;
};

export default AdminRoute;
