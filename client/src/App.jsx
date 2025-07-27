// Line 1-13: Enhanced App.jsx with Photo-Inspired OGMOK BJJ Landing Page
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

// Line 15-47: Photo-Inspired OGMOK BJJ Landing Page Component
const OGMOKLandingPage = () => {
  const navigate = useNavigate();
  
  // Line 18-25: Navigation handlers for dual CTAs
  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleJoinNow = () => {
    navigate('/register');
  };

  // Line 27-34: Scroll handler for navbar transparency effect
  const [isScrolled, setIsScrolled] = React.useState(false);
  
  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Line 36-64: Header inspired by clean OGMOK gym branding in photos */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white bg-opacity-95 backdrop-blur-md shadow-xl' : 'bg-transparent'
      }`}>
        <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            {/* OGMOK Logo inspired by gym photos */}
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
            </div>
            <div className={`text-2xl font-bold transition-colors ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
              OGMOK <span className="text-red-500">JIU-JITSU</span>
            </div>
          </div>
          
          {/* Navigation buttons with photo-inspired styling */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogin}
              className={`px-6 py-2 border-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                isScrolled 
                  ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'border-white text-white hover:bg-white hover:text-gray-900'
              }`}
            >
              Student Portal
            </button>
            
            <button
              onClick={handleJoinNow}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg"
            >
              Join Our Family
            </button>
          </div>
        </nav>
      </header>

      {/* Line 66-120: Hero section inspired by professional gym atmosphere */}
      <main>
        <section className="relative px-6 py-32 text-center overflow-hidden">
          {/* Clean geometric background inspired by training mats in photos */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 gap-px h-full">
              {Array.from({length: 144}).map((_, i) => (
                <div key={i} className="bg-white"></div>
              ))}
            </div>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            {/* Badge inspired by professional academy status */}
            <div className="inline-flex items-center bg-white bg-opacity-10 border border-white border-opacity-30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
              <span className="text-white font-semibold text-sm">🏆 CEBU'S PREMIER BJJ ACADEMY</span>
            </div>
            
            <h1 className="text-7xl font-bold text-white mb-8 leading-tight">
              Train with the
              <span className="text-red-500 block">OGMOK Family</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience authentic Brazilian Jiu-Jitsu in Cebu's most welcoming academy. 
              From our youngest champions to seasoned competitors, we build character, strength, and lasting friendships on and off the mats.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <button
                onClick={handleJoinNow}
                className="px-12 py-4 bg-red-600 text-white text-lg rounded-xl font-semibold
                  transition-all duration-300 hover:bg-red-700 hover:scale-105 hover:shadow-2xl transform shadow-xl"
              >
                Start Your Journey
              </button>
              
              <button
                onClick={handleLogin}
                className="px-12 py-4 border-2 border-white text-white text-lg rounded-xl font-semibold
                  hover:bg-white hover:text-gray-900 transition-all duration-300 backdrop-blur-sm"
              >
                Student Portal
              </button>
            </div>
            
            {/* Community stats inspired by diverse groups in photos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-500">300+</div>
                <div className="text-gray-400 text-sm">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-500">8+</div>
                <div className="text-gray-400 text-sm">Years Strong</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-500">50+</div>
                <div className="text-gray-400 text-sm">Kids Program</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-500">24/7</div>
                <div className="text-gray-400 text-sm">Family Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Line 122-184: Community section inspired by family photos and celebrations */}
        <section className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Where Families Grow Together
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Inspired by the warmth and community spirit captured in our family celebrations, 
                OGMOK is more than training - it's where lifelong bonds are forged.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Kids Program - inspired by young students in photos */}
              <div className="text-center group">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-200 transition-colors duration-300">
                  <span className="text-4xl">👶</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Little Champions (4-12)
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Building confidence, discipline, and respect in our youngest warriors. 
                  Age-appropriate curriculum focusing on character development and fun.
                </p>
                <ul className="text-left text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Character building & respect
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Anti-bullying confidence
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Physical fitness & coordination
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Social skills & teamwork
                  </li>
                </ul>
              </div>

              {/* Teen/Adult Program - inspired by diverse age groups training */}
              <div className="text-center group">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-red-200 transition-colors duration-300">
                  <span className="text-4xl">🥋</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Teen & Adult Program
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Comprehensive BJJ training for all skill levels. From fundamentals to advanced techniques, 
                  build strength, technique, and mental resilience.
                </p>
                <ul className="text-left text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Technical skill development
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Competition preparation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Self-defense applications
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Mental & physical fitness
                  </li>
                </ul>
              </div>

              {/* Community Events - inspired by Christmas celebration photos */}
              <div className="text-center group">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-green-200 transition-colors duration-300">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Family Celebrations
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Regular events that bring our community together - from holiday parties to belt promotions, 
                  creating memories that last a lifetime.
                </p>
                <ul className="text-left text-gray-600 space-y-3">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Belt promotion ceremonies
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Holiday celebrations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Tournament support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg">✓</span>
                    Family bonding activities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Line 186-243: Training philosophy section inspired by instructor photos */}
        <section className="px-6 py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  Professional Instruction,<br />
                  <span className="text-red-600">Family Atmosphere</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our experienced instructors bring world-class technique with the warmth of family mentorship. 
                  Every student receives personalized attention in our supportive environment.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Expert Guidance</h4>
                      <p className="text-gray-600">Learn from certified instructors with years of competition and teaching experience.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Supportive Community</h4>
                      <p className="text-gray-600">Train alongside teammates who become family, supporting each other's growth.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Clean, Safe Environment</h4>
                      <p className="text-gray-600">Train in our spotless, well-maintained facility designed for optimal learning and safety.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Placeholder for training philosophy visual */}
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-12 text-center">
                <div className="text-6xl mb-6">🥋</div>
                <h3 className="text-2xl font-bold text-white mb-4">World-Class Training</h3>
                <p className="text-gray-300">
                  Experience the same techniques taught in the top academies worldwide, 
                  adapted for our local Cebu community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Line 245-302: Enhanced pricing section with local currency */}
        <section className="px-6 py-24 bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-white mb-6">
                Invest in Your Journey
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Choose the membership that fits your commitment to excellence and personal growth
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800 bg-opacity-80 p-10 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 backdrop-blur-sm">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-white mb-6">Monthly Membership</h3>
                  <div className="text-6xl font-bold text-red-400 mb-3">₱1,400</div>
                  <div className="text-gray-400 text-lg">per month</div>
                </div>
                <ul className="text-gray-300 space-y-4 mb-10">
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Unlimited training sessions
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    All programs included
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Student portal access
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Community events
                  </li>
                </ul>
                <button 
                  onClick={handleJoinNow} 
                  className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg"
                >
                  Start Training
                </button>
              </div>
              
              <div className="bg-gray-800 bg-opacity-80 p-10 rounded-2xl border-2 border-red-500 relative hover:border-red-400 transition-all duration-300 backdrop-blur-sm">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-600 text-white px-8 py-3 rounded-full text-sm font-bold">
                    BEST VALUE
                  </div>
                </div>
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-white mb-6">Annual Membership</h3>
                  <div className="text-6xl font-bold text-red-400 mb-3">₱14,000</div>
                  <div className="text-gray-400 text-lg">per year</div>
                  <div className="text-green-400 font-semibold mt-3 text-lg">Save ₱2,800!</div>
                </div>
                <ul className="text-gray-300 space-y-4 mb-10">
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Everything in monthly plan
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    2 months completely FREE
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Priority class scheduling
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl">✓</span>
                    Exclusive seminars & workshops
                  </li>
                </ul>
                <button 
                  onClick={handleJoinNow} 
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 font-semibold text-lg transform hover:scale-105"
                >
                  Join Annual
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Line 304-330: Final CTA inspired by family unity in photos */}
        <section className="px-6 py-24 bg-gradient-to-r from-red-600 to-red-700">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-white mb-8">
              Ready to Join the OGMOK Family?
            </h2>
            <p className="text-xl text-red-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Take the first step towards transforming your life through Brazilian Jiu-Jitsu. 
              Join hundreds of families who have found their home at OGMOK Jiu-Jitsu.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleJoinNow}
                className="px-12 py-5 bg-white text-red-600 text-xl rounded-xl font-bold
                  hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Begin Your Journey Today
              </button>
              <button
                onClick={() => window.open('tel:+639123456789', '_self')}
                className="px-12 py-5 border-3 border-white text-white text-xl rounded-xl font-bold
                  hover:bg-white hover:text-red-600 transition-all duration-300"
              >
                Call Us Now
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Line 332-370: Footer inspired by professional gym branding */}
      <footer className="bg-black text-white px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  OGMOK <span className="text-red-400">JIU-JITSU</span>
                </div>
              </div>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Cebu's premier Brazilian Jiu-Jitsu academy where champions are born and families are made. 
                More than training - it's transformation.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <span className="text-sm">📘</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <span className="text-sm">📷</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                  <span className="text-sm">▶️</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Programs</h4>
              <div className="space-y-3 text-gray-400">
                <div className="hover:text-white cursor-pointer transition-colors">Kids BJJ (4-12)</div>
                <div className="hover:text-white cursor-pointer transition-colors">Teen Program</div>
                <div className="hover:text-white cursor-pointer transition-colors">Adult Classes</div>
                <div className="hover:text-white cursor-pointer transition-colors">Competition Team</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Contact Info</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <span className="mr-3">📍</span>
                  Cebu City, Philippines
                </div>
                <div className="flex items-center">
                  <span className="mr-3">📞</span>
                  +63 912 345 6789
                </div>
                <div className="flex items-center">
                  <span className="mr-3">✉️</span>
                  info@ogmok.com
                </div>
                <div className="flex items-center">
                  <span className="mr-3">⏰</span>
                  Mon-Sat: 6AM-9PM
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 OGMOK Jiu-Jitsu. All rights reserved. | Building champions and character since 2017
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Line 372-396: Enhanced HomeRedirect with smart routing logic (PRESERVED)
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("HomeRedirect:", { user, loading });
    if (loading) return;
    
    if (!user) {
      console.log("No user - showing OGMOK landing page");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading OGMOK...</div>
      </div>
    );
  }

  return <OGMOKLandingPage />;
};

// Line 398-452: AppContent with comprehensive routing system (PRESERVED)
const AppContent = () => {
  const { toast, hideToast } = useToast();

  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
        
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>

      {/* Enhanced toast notification system */}
      {toast && (
        <SimpleToast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
};

// Line 454-463: Main App component with provider structure (PRESERVED)
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