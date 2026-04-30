import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { useAuthContext } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';

// Pages
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import ProfileDetails from './pages/ProfileDetails';
import Interests from './pages/Interests';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import CompleteProfile from './pages/CompleteProfile';
import Subscription from './pages/Subscription';

const ProtectedRoute = ({ children }) => {
  const { currentUser, isProfileComplete } = useAuthContext();
  const location = useLocation();
  
  if (!currentUser) return <Navigate to="/splash" replace />;
  
  // Removed strict force redirect to allow users to preview the Dashboard
  // as per requirement #4, where incomplete profiles can view the dashboard but buttons are disabled.
  
  // They are redirected properly post-login by PublicRoute.

  // If they have a completed profile but try to hit the complete-profile page again, direct to dashboard
  if (currentUser && isProfileComplete && location.pathname === '/complete-profile') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser, isProfileComplete } = useAuthContext();
  
  if (currentUser) {
    return isProfileComplete ? <Navigate to="/dashboard" replace /> : <Navigate to="/complete-profile" replace />;
  }
  return children;
};


const App = () => {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/splash" element={<PublicRoute><Splash /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* If user hits root, send them to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetails /></ProtectedRoute>} />
            <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
            <Route path="/my-interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
