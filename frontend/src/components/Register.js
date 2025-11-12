import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    qualification: "",
    mobile_no: "",
    experience: "",
    interested_categories: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic, 2: Details

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.qualification || !formData.mobile_no) {
      setError("Qualification and Mobile No are required");
      return false;
    }
    if (formData.role === "student" && !formData.interested_categories) {
      setError("Interested Categories is required for students");
      return false;
    }
    if (formData.role === "teacher" && !formData.experience) {
      setError("Experience is required for teachers");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setError("");

    // Build payload depending on role
    let payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      qualification: formData.qualification,
      mobile_no: formData.mobile_no,
    };

    if (formData.role === "student") {
      payload.interested_categories = formData.interested_categories;
    } else if (formData.role === "teacher") {
      payload.experience = formData.experience;
    }

    try {
      await API.post("register/", payload);
      navigate("/login", { state: { registered: true } });
    } catch (error) {
      setError(error.response?.data?.username?.[0] || error.response?.data?.email?.[0] || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card register-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <h1>Join LMS Portal</h1>
            <p className="auth-subtitle">Create your account and start learning</p>
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`}>
              <div className="step-circle">1</div>
              <p>Account</p>
            </div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>
              <div className="step-circle">2</div>
              <p>Details</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                {/* Role Selection */}
                <div className="form-group">
                  <label>Select Role</label>
                  <div className="role-selector">
                    <button
                      type="button"
                      className={`role-btn ${formData.role === "student" ? "active" : ""}`}
                      onClick={() => handleRoleChange("student")}
                    >
                      <i className="fas fa-graduation-cap"></i>
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${formData.role === "teacher" ? "active" : ""}`}
                      onClick={() => handleRoleChange("teacher")}
                    >
                      <i className="fas fa-chalkboard-user"></i>
                      <span>Teacher</span>
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user input-icon"></i>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <i className={`fas fa-eye${showPassword ? "" : "-slash"}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      <i className={`fas fa-eye${showConfirmPassword ? "" : "-slash"}`}></i>
                    </button>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Continue
                  <i className="fas fa-arrow-right"></i>
                </button>
              </>
            )}

            {/* Step 2: Additional Details */}
            {step === 2 && (
              <>
                {/* Qualification */}
                <div className="form-group">
                  <label htmlFor="qualification">Qualification</label>
                  <div className="input-wrapper">
                    <i className="fas fa-certificate input-icon"></i>
                    <input
                      id="qualification"
                      type="text"
                      name="qualification"
                      placeholder="e.g., Bachelor's in Computer Science"
                      value={formData.qualification}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="form-group">
                  <label htmlFor="mobile_no">Mobile Number</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      id="mobile_no"
                      type="tel"
                      name="mobile_no"
                      placeholder="Your phone number"
                      value={formData.mobile_no}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Conditional Fields */}
                {formData.role === "student" && (
                  <div className="form-group">
                    <label htmlFor="interested_categories">Interested Categories</label>
                    <div className="input-wrapper">
                      <i className="fas fa-book input-icon"></i>
                      <input
                        id="interested_categories"
                        type="text"
                        name="interested_categories"
                        placeholder="e.g., Programming, Data Science"
                        value={formData.interested_categories}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {formData.role === "teacher" && (
                  <div className="form-group">
                    <label htmlFor="experience">Experience (Years)</label>
                    <div className="input-wrapper">
                      <i className="fas fa-briefcase input-icon"></i>
                      <input
                        id="experience"
                        type="number"
                        name="experience"
                        placeholder="Years of teaching experience"
                        value={formData.experience}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Step Buttons */}
                <div className="step-buttons">
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <i className="fas fa-arrow-right"></i>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Divider */}
          <div className="form-divider">
            <span>Already have an account?</span>
          </div>

          {/* Login Link */}
          <Link to="/login" className="btn-secondary">
            Sign in here
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {/* Side Illustration */}
        <div className="auth-side register-side">
          <div className="side-content">
            <h2>Start Your Learning Journey</h2>
            <p>Join thousands of students and educators</p>
            <div className="feature-list">
              <div className="feature-item">
                <i className="fas fa-rocket"></i>
                <span>Quick setup</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-shield-alt"></i>
                <span>Secure account</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-star"></i>
                <span>Premium content</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
