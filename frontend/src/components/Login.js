import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api";
import "./Auth.css";

function Login({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await API.post("login/", {
        username: formData.username,
        password: formData.password,
      });

      // Save token
      localStorage.setItem("token", response.data.token);

      // Save full user object
      const userData = {
        username: response.data.username,
        role: response.data.role,
        profile: response.data.profile,
        email: response.data.email,
      };
      localStorage.setItem("user", JSON.stringify(userData));

      // Update App state
      setUser(userData);

      // Redirect to previous location or default dashboard
      const previousLocation = location.state?.from?.pathname;

      if (previousLocation && (previousLocation === "/courses" || previousLocation.startsWith("/courses/"))) {
        if (response.data.role === "student") {
          navigate(previousLocation);
        } else {
          navigate("/teacher-dashboard");
        }
      } else {
        if (response.data.role === "student") {
          navigate("/student-dashboard");
        } else {
          navigate("/teacher-dashboard");
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card login-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Error Message */}
            {error && (
              <div className="error-alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={error ? "input-error" : ""}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={error ? "input-error" : ""}
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

            {/* Remember & Forgot */}
            <div className="form-footer-row">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="forgot-password">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="form-divider">
            <span>New to LMS Portal?</span>
          </div>

          {/* Register Link */}
          <Link to="/register" className="btn-secondary">
            Create an account
            <i className="fas fa-arrow-right"></i>
          </Link>

          {/* Footer */}
          <div className="auth-footer">
            <p>By signing in, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></p>
          </div>
        </div>

        {/* Side Illustration */}
        <div className="auth-side login-side">
          <div className="side-content">
            <h2>Learning Made Easy</h2>
            <p>Access a world of knowledge and skills at your fingertips</p>
            <div className="feature-list">
              <div className="feature-item">
                <i className="fas fa-book"></i>
                <span>Thousands of courses</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-certificate"></i>
                <span>Get certified</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-users"></i>
                <span>Expert instructors</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

