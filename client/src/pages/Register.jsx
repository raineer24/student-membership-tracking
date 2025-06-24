import React, { useState } from "react";
import { Link } from "react-router-dom";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return "First name is required";
    if (!formData.lastName.trim()) return "Last name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.includes("@")) return "Invalid email";
    if (!formData.password.length < 6)
      return "Password must be at least 6 characters";
    if (!formData.password !== formData.confirmPassword)
      return "Passwords don't match";
    if (!formData.phone.trim() && formData.role === "student") {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, "");
      const isValid =
        /^\+639\d{9}$/.test(cleaned) ||
        /^09\d{9}$/.test(cleaned) ||
        /^639\d{9}$/.test(cleaned);
      if (!isValid) return "Please enter a valid Philippine mobile";
    }
    return null;
  };

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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-4">
            You can now login with your credentials
          </p>

          <Link
            to="/login"
            className="inline-block w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 text-center"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <h2 className="text-xl font-bold text-center mb-4">Create Account</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Account Type</label>
                    <select 
                    name=""
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    >
                        <option value="student">Student</option>
                         <option value="admin">Admin</option>
                    </select>
                </div>

                <div>
                    <input 
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>

                 <div>
                    <input 
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>

                 <div>
                    <input 
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>

                 <div>
                    <input 
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>

                 <div>
                    <input 
                    name="firstName"
                    placeholder="First Name *"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                    />
                </div>


            </form>
        </div>
    </div>
  )
};

export default Register;
