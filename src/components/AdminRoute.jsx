import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';

const AdminRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuthContext();
  const { showToast } = useToastContext();

  const isAdmin = !loading && currentUser && userProfile?.role === 'admin';
  const isAccessDenied = !loading && currentUser && userProfile && userProfile.role !== 'admin';

  useEffect(() => {
    if (isAccessDenied) {
      showToast('Access Denied: Admins Only', 'error');
    }
  }, [isAccessDenied, showToast]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-blue-600 text-xl font-bold animate-pulse">Verifying Credentials...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (isAccessDenied) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
