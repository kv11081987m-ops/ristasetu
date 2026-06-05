import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { useAuthContext } from './context/AuthContext';
import { useToastContext } from './context/ToastContext';
import AdminRoute from './components/AdminRoute';

// Route-level code splitting — each page loads only when navigated to
const Splash        = lazy(() => import('./pages/Splash'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./Register'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const Search        = lazy(() => import('./pages/Search'));
const ProfileDetails = lazy(() => import('./pages/ProfileDetails'));
const Interests     = lazy(() => import('./pages/Interests'));
const Chat          = lazy(() => import('./pages/Chat'));
const Settings      = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Subscription  = lazy(() => import('./pages/Subscription'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const KYC           = lazy(() => import('./pages/KYC'));
const AboutPage     = lazy(() => import('./pages/AboutPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const SetupPassword  = lazy(() => import('./pages/SetupPassword'));
const FamilyDashboard = lazy(() => import('./pages/FamilyDashboard'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, isProfileComplete, familyMode } = useAuthContext();
  const location = useLocation();

  if (!currentUser) return <Navigate to="/splash" replace />;
  // Family accounts should stay in their own dashboard
  if (familyMode) return <Navigate to="/family-dashboard" replace />;
  if (currentUser && isProfileComplete && location.pathname === '/complete-profile') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { currentUser, isProfileComplete, familyMode } = useAuthContext();

  if (currentUser) {
    if (familyMode) return <Navigate to="/family-dashboard" replace />;
    return isProfileComplete ? <Navigate to="/dashboard" replace /> : <Navigate to="/complete-profile" replace />;
  }
  return children;
};

// Only family accounts can access this route
const FamilyRoute = ({ children }) => {
  const { currentUser, familyMode } = useAuthContext();
  if (!currentUser) return <Navigate to="/splash" replace />;
  if (!familyMode) return <Navigate to="/dashboard" replace />;
  return children;
};


const SessionWatcher = () => {
  const { userProfile } = useAuthContext();
  const { showToast } = useToastContext();

  useEffect(() => {
    const serverToken = userProfile?.currentSessionToken;
    if (!serverToken) return;
    const localToken = localStorage.getItem('rsSessionToken');
    if (!localToken) return; // Old user without session tracking
    if (localToken !== serverToken) {
      showToast('Aapka account kisi naye device pe login hua hai. Aap nahi the to password change karein.', 'info', 8000);
      localStorage.setItem('rsSessionToken', serverToken);
    }
  }, [userProfile?.currentSessionToken, showToast]);

  return null;
};

const App = () => {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <SessionWatcher />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/splash" element={<PublicRoute><Splash /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/setup-password" element={<ProtectedRoute><SetupPassword /></ProtectedRoute>} />
              <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetails /></ProtectedRoute>} />
              <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
              <Route path="/my-interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

              <Route path="/family-dashboard" element={<FamilyRoute><FamilyDashboard /></FamilyRoute>} />

              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
