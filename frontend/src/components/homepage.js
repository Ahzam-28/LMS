import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./HomePage.css";

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await API.get("/course/");
        setCourses(response.data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    fetchCourses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="home-page">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <strong>LMS Portal</strong>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to={
                        user.role === "student"
                          ? "/student-dashboard"
                          : "/teacher-dashboard"
                      }
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link"
                      onClick={handleLogout}
                    >
                      Logout ({user.username})
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to LMS Portal</h1>
            <p className="lead">
              Explore a wide range of courses and enhance your skills
            </p>
            {!user ? (
              <div className="hero-buttons">
                <Link to="/login" className="btn btn-primary btn-lg me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline-primary btn-lg">
                  Register
                </Link>
              </div>
            ) : user.role === "teacher" ? (
              <Link to="/teacher-dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="courses-section">
        <div className="container">
          <div className="section-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Available Courses</h2>
                <p>Explore our curated collection of courses</p>
              </div>
              <Link to="/courses" className="btn btn-outline-primary btn-lg">
                View All Courses
              </Link>
            </div>
          </div>

          {courses.length === 0 ? (
            <p className="text-center text-muted">
              No courses available at the moment.
            </p>
          ) : (
            <div className="courses-grid">
              {courses.slice(0, 6).map((course) => (
                <div key={course.id} className="course-grid-card">
                  <div className="course-card-header">
                    <span className="badge">{course.code}</span>
                  </div>
                  <h5 className="course-card-title">{course.title}</h5>
                  <p className="course-card-description">
                    {course.description.substring(0, 100)}...
                  </p>
                  <p className="course-card-category">
                    <small className="text-muted">
                      {course.category_details?.title || "Uncategorized"}
                    </small>
                  </p>
                  <div className="course-card-footer">
                    <span className="price">
                      ${parseFloat(course.price).toFixed(2)}
                    </span>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewCourse(course.id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container text-center">
          <p>&copy; 2024 LMS Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

