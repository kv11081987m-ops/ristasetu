import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useToastContext } from '../context/ToastContext';
import { useEffect } from 'react';

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

  // If logged in but not an admin, redirect with toast
  const { showToast } = useToastContext();

  useEffect(() => {
    if (!loading && currentUser && userProfile && userProfile.role !== 'admin') {
      showToast('Access Denied: Admins Only', 'error');
    }
  }, [loading, currentUser, userProfile, showToast]);

  if (!loading && currentUser && userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized
  return children;
};

export default AdminRoute;
