import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./HomePage.css";

function HomePage() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherScrollPosition, setTeacherScrollPosition] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchCourses = async () => {
      try {
        const response = await API.get("/course/");
        setCourses(response.data);
      } catch (error) {
      }
    };
    
    const fetchTeachers = async () => {
      try {
        const response = await API.get("/teacher/");
        setTeachers(response.data);
      } catch (error) {
      }
    };
    
    fetchCourses();
    fetchTeachers();
  }, []);

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const scrollTeachers = (direction) => {
    const container = document.getElementById("teachers-carousel");
    if (!container) return;
    
    const scrollAmount = 320; 
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      setTeacherScrollPosition(Math.max(0, teacherScrollPosition - scrollAmount));
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTeacherScrollPosition(teacherScrollPosition + scrollAmount);
    }
  };

  return (
    <div className="home-page">
      {}
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>WELCOME TO PARHAI WARHAI</h1>
            <p className="lead">
              Explore a wide range of courses and enhance your skills
            </p>
            {!user && (
              <div className="hero-buttons">
                <Link to="/login" className="btn btn-primary btn-lg me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline-primary btn-lg">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="courses-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Available Courses</h2>
              <p>Explore our curated collection of courses</p>
            </div>
            <Link to="/courses" className="btn btn-primary">
              View All Courses
            </Link>
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
                    <span className="enrollment-badge-small">
                      ðŸ‘¥ {course.enrollment_count}
                    </span>
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
                      PKR {parseFloat(course.price).toFixed(2)}
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

      {}
      <div className="teachers-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Our Expert Instructors</h2>
              <p>Learn from industry professionals and experienced educators</p>
            </div>
            <Link to="/teachers" className="btn btn-primary">
              View All Teachers
            </Link>
          </div>

          {teachers.length === 0 ? (
            <p className="text-center text-muted">
              No teachers available at the moment.
            </p>
          ) : (
            <div className="teachers-carousel-wrapper">
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={() => scrollTeachers("left")}
                aria-label="Scroll left"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="teachers-carousel" id="teachers-carousel">
                {teachers.map((teacher) => (
                  <div 
                    key={teacher.id} 
                    className="teacher-card"
                    onClick={() => navigate(`/teacher/${teacher.id}`)}
                  >
                    <div className="teacher-card-header">
                      <div className="teacher-avatar">
                        <i className="fas fa-user-circle"></i>
                      </div>
                    </div>
                    <div className="teacher-card-body">
                      <h5 className="teacher-name">
                        {teacher.user_details.name}
                      </h5>
                      <p className="teacher-qualification">
                        <small>{teacher.qualification}</small>
                      </p>
                      <div className="teacher-info">
                        <p className="mb-2">
                          <strong>Experience:</strong> {teacher.experience} years
                        </p>
                        <p className="mb-2">
                          <strong>Courses:</strong> {teacher.courses_count}
                        </p>
                        <p>
                          <strong>Expertise:</strong> {teacher.expertise.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    <div className="teacher-card-footer">
                      <button className="btn btn-sm btn-primary w-100">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => scrollTeachers("right")}
                aria-label="Scroll right"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {}
      <footer className="footer">
        <div className="container text-center">
          <p>Â© Ahsan Ahzam Ali</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
