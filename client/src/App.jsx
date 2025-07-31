// Line 1-25: Complete Enhanced App.jsx - Fixed with src/assets Image Imports
import React, { useEffect, useMemo, useCallback } from "react";
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

// Line 13-25: Image imports from src/assets (FIXED PATHS)
import trainingBg from './assets/images/ogmok/training-1.jpg';
import kidsTraining from './assets/images/ogmok/kids-training.jpg';
import adultTraining from './assets/images/ogmok/adult-training.jpg';
import christmasEvent from './assets/images/ogmok/christmas-celebration.jpg';
import instructorKids from './assets/images/ogmok/instructor-kids.jpg';
import beltCeremony from './assets/images/ogmok/belt-ceremony.jpg';
import teamPhoto from './assets/images/ogmok/team-photo.jpg';
import communityEvent from './assets/images/ogmok/community-event.jpg';
import training2 from './assets/images/ogmok/training-2.jpg';

// Line 26-70: Enhanced Home Redirect Component
const HomeRedirect = React.memo(() => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const redirectUser = useCallback(() => {
    if (loading) return;

    if (user) {
      if (user.role === "STUDENT") {
        navigate("/student-dashboard", { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    redirectUser();
  }, [redirectUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
          </div>
          <div className="text-white text-xl">Loading OGMOK...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <OGMOKLandingPage />;
  }

  return null;
});

// Line 71-600: Complete OGMOK BJJ Landing Page Component with Asset Imports
const OGMOKLandingPage = React.memo(() => {
  const navigate = useNavigate();
  
  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);
  
  const handleJoinNow = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const [isScrolled, setIsScrolled] = React.useState(false);
  
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);
  
  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Image preloading with imported assets
  React.useEffect(() => {
    const imageUrls = [
      trainingBg,
      kidsTraining,
      adultTraining,
      christmasEvent,
      instructorKids,
      beltCeremony,
      teamPhoto,
      communityEvent,
      training2
    ];
    
    imageUrls.forEach(url => {
      const img = new Image();
      img.onload = () => console.log(`Loaded: ${url}`);
      img.onerror = () => console.error(`Failed to load: ${url}`);
      img.src = url;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white bg-opacity-95 backdrop-blur-md shadow-xl' : 'bg-transparent'
      }`}>
        <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
            </div>
            <div className={`text-2xl font-bold transition-colors duration-300 ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
              OGMOK <span className={isScrolled ? 'text-red-600' : 'text-red-400'}>JIU-JITSU</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogin}
              className={`px-6 py-2 border-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${
                isScrolled 
                  ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'border-white text-white hover:bg-white hover:text-gray-900'
              }`}
            >
              Student Portal
            </button>
            
            <button
              onClick={handleJoinNow}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Join Our Family
            </button>
          </div>
        </nav>
      </header>

      {/* Hero section with imported training photo background */}
      <main>
        <section className="relative min-h-screen flex items-center justify-center px-6 py-32 text-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${trainingBg})`,
            }}
          />
          
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 gap-px h-full">
              {Array.from({length: 144}).map((_, i) => (
                <div key={i} className="bg-white"></div>
              ))}
            </div>
          </div>
          
          <div className="relative max-w-6xl mx-auto z-10">
            <div className="inline-flex items-center bg-white bg-opacity-10 border border-white border-opacity-30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm">
              <span className="text-white font-semibold text-sm tracking-wide">🏆 CEBU'S PREMIER BJJ ACADEMY</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Train with the
              <span className="text-red-400 block">OGMOK Family</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience authentic Brazilian Jiu-Jitsu in Cebu's most welcoming academy. 
              From our youngest champions to seasoned competitors, we build character, strength, 
              and lasting friendships on and off the mats.
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-400">300+</div>
                <div className="text-gray-400 text-sm">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-400">8+</div>
                <div className="text-gray-400 text-sm">Years Strong</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-400">50+</div>
                <div className="text-gray-400 text-sm">Kids Program</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-400">24/7</div>
                <div className="text-gray-400 text-sm">Family Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Programs section with imported OGMOK photos */}
        <section className="px-6 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Where Families Grow Together
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Inspired by the warmth and community spirit captured in our family celebrations, 
                OGMOK is more than training - it's where lifelong bonds are forged.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Kids Program */}
              <div className="text-center group">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 group-hover:scale-105 transition-transform duration-300 shadow-xl ring-4 ring-blue-100">
                  <img 
                    src={kidsTraining}
                    alt="Kids BJJ Training at OGMOK"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Little Champions (4-12)</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Building confidence, discipline, and respect in our youngest warriors. 
                  Age-appropriate curriculum focusing on character development, fun, and fundamental BJJ skills.
                </p>
                <ul className="text-left text-gray-600 space-y-3 max-w-sm mx-auto">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Character building & respect
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Anti-bullying confidence
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Physical fitness & coordination
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Social skills & teamwork
                  </li>
                </ul>
              </div>

              {/* Adult Program */}
              <div className="text-center group">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 group-hover:scale-105 transition-transform duration-300 shadow-xl ring-4 ring-red-100">
                  <img 
                    src={adultTraining}
                    alt="Adult BJJ Training at OGMOK"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Teen & Adult Program</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Comprehensive BJJ training for all skill levels. From fundamentals to advanced techniques, 
                  build strength, technique, mental resilience, and competitive skills.
                </p>
                <ul className="text-left text-gray-600 space-y-3 max-w-sm mx-auto">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Technical skill development
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Competition preparation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Self-defense applications
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Mental & physical fitness
                  </li>
                </ul>
              </div>

              {/* Community Events */}
              <div className="text-center group">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 group-hover:scale-105 transition-transform duration-300 shadow-xl ring-4 ring-green-100">
                  <img 
                    src={christmasEvent}
                    alt="OGMOK Christmas Celebration"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Family Celebrations</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Regular events that bring our community together - from holiday parties to belt promotions, 
                  creating memories and bonds that last a lifetime.
                </p>
                <ul className="text-left text-gray-600 space-y-3 max-w-sm mx-auto">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Belt promotion ceremonies
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Holiday celebrations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Tournament support
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-3 text-lg font-bold">✓</span>
                    Family bonding activities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Training philosophy section */}
        <section className="px-6 py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
                  Professional Instruction,<br />
                  <span className="text-red-600">Family Atmosphere</span>
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Our experienced instructors bring world-class technique with the warmth of family mentorship. 
                  Every student receives personalized attention in our supportive, clean, and safe environment.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Expert Guidance</h4>
                      <p className="text-gray-600 leading-relaxed">Learn from certified instructors with years of competition experience.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Supportive Community</h4>
                      <p className="text-gray-600 leading-relaxed">Train alongside teammates who become family.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Clean, Safe Environment</h4>
                      <p className="text-gray-600 leading-relaxed">Train in our spotless, well-maintained facility.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <img 
                  src={instructorKids}
                  alt="OGMOK Instructor Teaching Kids"
                  className="w-full h-96 object-cover rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent rounded-2xl opacity-60"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">World-Class Training</h3>
                  <p className="text-gray-200 leading-relaxed">
                    Experience authentic BJJ instruction with international standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Photo gallery */}
        <section className="px-6 py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our OGMOK Family in Action
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See the joy, dedication, and community spirit that makes OGMOK special
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="group cursor-pointer">
                <img 
                  src={beltCeremony}
                  alt="OGMOK Belt Promotion Ceremony"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                  loading="lazy"
                />
                <p className="text-center mt-4 text-gray-700 font-medium">Belt Promotion Day</p>
              </div>
              
              <div className="group cursor-pointer">
                <img 
                  src={teamPhoto}
                  alt="OGMOK Team Photo"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                  loading="lazy"
                />
                <p className="text-center mt-4 text-gray-700 font-medium">Our Growing Family</p>
              </div>
              
              <div className="group cursor-pointer">
                <img 
                  src={communityEvent}
                  alt="OGMOK Community Event"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                  loading="lazy"
                />
                <p className="text-center mt-4 text-gray-700 font-medium">Community Gathering</p>
              </div>
              
              <div className="group cursor-pointer md:col-span-3">
                <img 
                  src={training2}
                  alt="OGMOK Daily Training"
                  className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300"
                  loading="lazy"
                />
                <p className="text-center mt-4 text-gray-700 font-medium">Daily Training Excellence</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-24 bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Invest in Your Journey</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Choose the membership that fits your commitment to excellence
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-800 bg-opacity-90 p-10 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-white mb-6">Monthly Membership</h3>
                  <div className="text-5xl md:text-6xl font-bold text-red-400 mb-3">₱1,400</div>
                  <div className="text-gray-400 text-lg">per month</div>
                </div>
                <ul className="text-gray-200 space-y-4 mb-10">
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Unlimited training sessions
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    All programs included
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Student portal access
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Community events
                  </li>
                </ul>
                <button onClick={handleJoinNow} className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-semibold text-lg">
                  Start Training
                </button>
              </div>
              
              <div className="bg-gray-800 bg-opacity-90 p-10 rounded-2xl border-2 border-red-500 relative hover:border-red-400 transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg">BEST VALUE</div>
                </div>
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-white mb-6">Annual Membership</h3>
                  <div className="text-5xl md:text-6xl font-bold text-red-400 mb-3">₱14,000</div>
                  <div className="text-gray-400 text-lg">per year</div>
                  <div className="text-green-400 font-semibold mt-3 text-lg">Save ₱2,800!</div>
                </div>
                <ul className="text-gray-200 space-y-4 mb-10">
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Everything in monthly plan
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    2 months completely FREE
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Priority class scheduling
                  </li>
                  <li className="flex items-center text-lg">
                    <span className="text-green-400 mr-4 text-xl font-bold">✓</span>
                    Exclusive seminars & workshops
                  </li>
                </ul>
                <button onClick={handleJoinNow} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 font-semibold text-lg transform hover:scale-105">
                  Join Annual
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-6 py-24 bg-gradient-to-r from-red-600 to-red-700">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Join the OGMOK Family?
            </h2>
            <p className="text-lg md:text-xl text-red-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Take the first step towards transforming your life through Brazilian Jiu-Jitsu. 
              Join hundreds of families who have found their home, strength, and purpose at OGMOK Jiu-Jitsu.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleJoinNow}
                className="px-12 py-5 bg-white text-red-600 text-xl font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                Begin Your Journey Today
              </button>
              <button
                onClick={() => window.open('tel:+639123456789', '_self')}
                className="px-12 py-5 border-3 border-white text-white text-xl font-bold rounded-xl hover:bg-white hover:text-red-600 transition-all duration-300"
              >
                Call Us Now
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center shadow-lg">
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
                More than training - it's transformation, community, and lifelong growth.
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
                <div className="hover:text-white cursor-pointer transition-colors">Private Lessons</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 text-lg">Contact Info</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center hover:text-white transition-colors">
                  <span className="mr-3">📍</span>
                  Cebu City, Philippines
                </div>
                <div className="flex items-center hover:text-white transition-colors">
                  <span className="mr-3">📞</span>
                  +63 912 345 6789
                </div>
                <div className="flex items-center hover:text-white transition-colors">
                  <span className="mr-3">✉️</span>
                  info@ogmok.com
                </div>
                <div className="flex items-center hover:text-white transition-colors">
                  <span className="mr-3">⏰</span>
                  Mon-Sat: 6AM-9PM
                </div>
                <div className="flex items-center hover:text-white transition-colors">
                  <span className="mr-3">📅</span>
                  Sunday: Rest Day
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 leading-relaxed">
              © 2025 OGMOK Jiu-Jitsu. All rights reserved. | Building champions and character since 2017
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
});

// Line 601-655: AppContent with comprehensive routing system
const AppContent = React.memo(() => {
  const { toast, hideToast } = useToast();
  
  const previousToast = React.useRef();
  React.useEffect(() => {
    if (previousToast.current !== toast && process.env.NODE_ENV === 'development') {
      console.log("Toast state changed:", toast?.message || 'hidden');
      previousToast.current = toast;
    }
  }, [toast]);

  const routes = useMemo(() => (
    <Routes>
      {/* Public authentication routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected student routes */}
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected admin routes */}
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
      
      {/* Legacy route compatibility */}
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
      
      {/* Root route shows landing page for unauthenticated users */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      } />
    </Routes>
  ), []);

  return (
    <div>
      {routes}
      
      {/* Optimized toast notification system */}
      {toast && (
        <SimpleToast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
});

// Line 657-666: Main App component with provider structure
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