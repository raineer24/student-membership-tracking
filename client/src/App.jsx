// Line 1-13: Enhanced App.jsx with BJJ Landing Page - Fixed dual navigation
import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from './pages/Register';
import StudentDashboard from "./pages/StudentDashboard";
import MembershipPage from "./pages/MembershipPage";
import DashboardPage from "./components/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useToast, ToastProvider } from "./hooks/useToast";
import SimpleToast from "./components/SimpleToast";

// Line 15-179: BJJ Landing Page Component with DUAL NAVIGATION
const BJJLandingPage = () => {
  const navigate = useNavigate();
  
  // Line 18-25: Navigation handlers for dual CTAs
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleJoinNow = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Line 29-48: Header with DUAL NAVIGATION BUTTONS */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="text-2xl font-bold text-white">
            🥋 BJJ Academy
          </div>
          
          {/* DUAL NAVIGATION BUTTONS */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogin}
              className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-200 font-semibold"
            >
              Login
            </button>
            
            <button
              onClick={handleJoinNow}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
            >
              Join Now
            </button>
          </div>
        </nav>
      </header>

      {/* Line 50-81: Hero section with dual call-to-action buttons */}
      <main>
        <section className="px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">
              Master the Art of 
              <span className="text-red-500"> Brazilian Jiu-Jitsu</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join our academy and embark on your martial arts journey. Track your progress, 
              manage your membership, and connect with our BJJ community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleJoinNow}
                className="px-8 py-4 bg-red-600 text-white text-lg rounded-lg font-semibold
                  transition-all duration-300 hover:bg-red-700 hover:scale-105 hover:shadow-lg"
              >
                Join Now
              </button>
              
              <button
                onClick={handleLogin}
                className="px-8 py-4 border-2 border-gray-400 text-gray-300 text-lg rounded-lg font-semibold
                  hover:border-red-500 hover:text-red-500 transition-colors duration-200"
              >
                Access Your Account
              </button>
            </div>
          </div>
        </section>

        {/* Line 83-131: Features section showcasing portal functionality */}
        <section className="px-6 py-20 bg-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">
              Student Portal Features
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-2xl">🥋</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Membership Management
                </h3>
                <p className="text-gray-600">
                  Track your monthly or yearly membership status, view payment history, and receive renewal reminders.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Progress Tracking
                </h3>
                <p className="text-gray-600">
                  Monitor your BJJ journey, belt progression, attendance records, and personal achievements.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <span className="text-2xl">💳</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Payment Management
                </h3>
                <p className="text-gray-600">
                  Secure payment processing, automatic membership extensions, and detailed transaction history.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Line 133-171: Pricing section with membership options */}
        <section className="px-6 py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-16">
              Membership Options
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4">Monthly</h3>
                <div className="text-4xl font-bold text-red-500 mb-6">₱1,400</div>
                <ul className="text-gray-300 space-y-3 mb-8">
                  <li>• Unlimited training sessions</li>
                  <li>• Access to all facilities</li>
                  <li>• Beginner-friendly classes</li>
                  <li>• Progress tracking</li>
                </ul>
                <button 
                  onClick={handleJoinNow} 
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
              
              <div className="bg-gray-800 p-8 rounded-xl border border-red-500">
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
                  Best Value
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Yearly</h3>
                <div className="text-4xl font-bold text-red-500 mb-2">₱16,800</div>
                <div className="text-gray-400 mb-6">Save ₱800 per year</div>
                <ul className="text-gray-300 space-y-3 mb-8">
                  <li>• Everything in monthly plan</li>
                  <li>• 2 months free</li>
                  <li>• Priority class booking</li>
                  <li>• Advanced seminars included</li>
                </ul>
                <button 
                  onClick={handleJoinNow} 
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Line 173-187: Final call-to-action section */}
        <section className="px-6 py-20 bg-red-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your BJJ Journey?
            </h2>
            <p className="text-xl text-red-100 mb-8">
              Join our community of dedicated martial artists and experience the transformative power of Brazilian Jiu-Jitsu.
            </p>
            <button
              onClick={handleJoinNow}
              className="px-8 py-4 bg-white text-red-600 text-lg rounded-lg font-semibold
                hover:bg-gray-100 transition-colors duration-200"
            >
              Join Our Academy
            </button>
          </div>
        </section>
      </main>

      {/* Line 189-201: Footer section */}
      <footer className="bg-black text-white px-6 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl font-bold mb-4">🥋 BJJ Academy</div>
          <p className="text-gray-400 mb-6">
            Forging champions on and off the mats
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>© 2025 BJJ Academy. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Line 203-227: Enhanced HomeRedirect with smart routing logic
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HomeRedirect:", { user, loading });
    if (loading) return;
    
    if (!user) {
      // No user - show landing page (no redirect needed)
      console.log("No user - showing landing page");
      return;
    } else if (user.role === "STUDENT") {
      console.log("Redirecting to /student-dashboard - student role");
      navigate("/student-dashboard", { replace: true });
    } else if (user.role === "ADMIN") {
      console.log("Redirecting to /admin-dashboard - admin role");
      navigate("/admin-dashboard", { replace: true });
    } else {
      console.log("Unknown role, showing landing page for:", user.role);
      return;
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        Loading...
      </div>
    );
  }

  // Line 231: Return landing page for unauthenticated users
  return <BJJLandingPage />;
};

// Line 233-277: AppContent with comprehensive routing system
const AppContent = () => {
  const { toast, hideToast } = useToast();
  console.log("AppContent render - toast state:", toast);
  console.log("AppContent render - toast exists?", !!toast);

  return (
    <div>
      <Routes>
        {/* Line 241-243: Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Line 245-263: Protected student and admin routes */}
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/memberships" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MembershipPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Line 265-281: Legacy route compatibility for existing URLs */}
        <Route 
          path="/membership" 
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Line 283-285: Root and fallback routes */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>

      {/* Line 287-297: Enhanced toast notification system */}
      {toast && (
        <>
          {console.log("Rendering toast:", toast)}
          <SimpleToast 
            message={toast.message} 
            type={toast.type} 
            onClose={hideToast} 
          />
        </>
      )}
    </div>
  );
};

// Line 299-308: Main App component with provider structure
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;