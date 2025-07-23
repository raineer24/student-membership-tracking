// Line 143-280: Enhanced Register.jsx with BJJ Landing Page Theme
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Line 163-166: Navigation handler for returning to landing page
  const handleBackToHome = () => {
    navigate('/');
  };

  // Line 168-171: Form input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Line 173-187: Form validation logic
  const validateForm = () => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.includes("@")) return "Invalid email";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords don't match";
    if (formData.phone.trim() && formData.role === "student") {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, "");
      const isValid =
        /^\+639\d{9}$/.test(cleaned) ||
        /^09\d{9}$/.test(cleaned) ||
        /^639\d{9}$/.test(cleaned);
      if (!isValid) return "Please enter a valid Philippine mobile";
    }
    return null;
  };

  // Line 189-221: Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          phone: formData.phone.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Line 223-251: Success state with BJJ theme
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-6">🥋</div>
          <h2 className="text-3xl font-bold text-white mb-4">Welcome to BJJ Academy!</h2>
          <p className="text-gray-300 mb-8">
            Your account has been created successfully. You can now sign in and start your martial arts journey.
          </p>

          <Link
            to="/login"
            className="inline-block w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold text-center"
          >
            Sign In Now
          </Link>

          <div className="mt-6">
            <button
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Line 253-430: Main registration form with BJJ theme
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-8">
      {/* Line 255-262: Header with back to home navigation */}
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

      {/* Line 264-430: Main registration form */}
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md border border-gray-700 mt-16">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Join BJJ Academy</h2>
            <p className="text-gray-300">Create your account to start training</p>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Line 280-291: Account type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                required
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Line 293-305: Name input fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                />
              </div>
              <div>
                <input
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Line 307-316: Email input field */}
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                required
              />
            </div>

            {/* Line 318-331: Phone input field (conditional for students) */}
            {formData.role === "student" && (
              <div>
                <input
                  name="phone"
                  placeholder="Phone Number (Optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: +639XXXXXXXXX or 09XXXXXXXXX
                </p>
              </div>
            )}

            {/* Line 333-343: Password input field */}
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password (min 6 characters) *"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                required
              />
            </div>

            {/* Line 345-363: Confirm password input field with validation feedback */}
            <div>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-600 focus:ring-red-500 focus:border-red-500'
                }`}
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-400 mt-2">Passwords don't match</p>
              )}
            </div>

            {/* Line 365-375: Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Line 377-390: Sign in link section */}
            <div className="pt-6 border-t border-gray-700 text-center">
              <p className="text-gray-400 mb-4">
                Already have an account?
              </p>
              <Link
                to='/login'
                className="inline-flex items-center px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
            </div>

            {/* Line 392-400: Back to home link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToHome}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;