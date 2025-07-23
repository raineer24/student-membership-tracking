// Line 1-50: Enhanced Login.jsx with BJJ Landing Page Theme
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Line 15-39: Enhanced login handler with proper role-based navigation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      
      if (success) {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData.role === 'ADMIN') {
          console.log('Login successful, navigating to /admin-dashboard');
          navigate('/admin-dashboard', { replace: true });
        } else if (userData.role === 'STUDENT') {
          console.log('Login successful, navigating to /student-dashboard');
          navigate('/student-dashboard', { replace: true });
        } else {
          console.log('Unknown role, navigating to /');
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Line 41-44: Navigation handler for returning to landing page
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      {/* Line 47-54: Header with back to home navigation */}
      <div className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBackToHome}
            className="text-2xl font-bold text-white hover:text-red-500 transition-colors cursor-pointer"
          >
            🥋 BJJ Academy
          </button>
        </div>
      </div>

      {/* Line 56-149: Main login form with BJJ theme */}
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-300">Sign in to access your BJJ portal</p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Line 114-129: Registration link section with BJJ theme */}
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 mb-4">
              New to BJJ Academy?
            </p>
            <Link 
              to="/register" 
              className="inline-flex items-center px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
            >
              Create Account
            </Link>
          </div>

          {/* Line 131-139: Back to home link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;