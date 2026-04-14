import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import { useAppContext } from './context/AppContext';

// Pages placeholders
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './Register';
import Home from './pages/Home';
import Search from './pages/Search';
import ProfileDetails from './pages/ProfileDetails';
import Interests from './pages/Interests';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

import Upload from './components/Upload';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext();
  if (!currentUser) return <Navigate to="/splash" replace />;
  return children;
};

const App = () => {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          {/* Component for external image uploads, placed globally per request */}
          <Upload />
          <Routes>
            <Route path="/splash" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><ProfileDetails /></ProtectedRoute>} />
            <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
