import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api";
import "./TeacherProfile.css";

function TeacherProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Fetch teacher details
        const teacherResponse = await API.get(`/teacher/${id}/`);
        setTeacher(teacherResponse.data);

        // Fetch all courses and filter by teacher
        const coursesResponse = await API.get("/course/");
        const teacherCourses = coursesResponse.data.filter(
          (course) => course.teacher === parseInt(id)
        );
        setCourses(teacherCourses);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch teacher data:", error);
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Teacher not found</div>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="teacher-profile">
      {/* Back Button */}
      <div className="container mt-4 mb-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/")}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
      </div>

      {/* Teacher Header */}
      <div className="teacher-header-section">
        <div className="container">
          <div className="teacher-header-content">
            <div className="teacher-avatar-large">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="teacher-header-info">
              <h1>{teacher.user_details.name}</h1>
              <p className="text-muted">{teacher.qualification}</p>
              <div className="teacher-stats">
                <div className="stat">
                  <span className="stat-label">Experience</span>
                  <span className="stat-value">{teacher.experience} years</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Courses</span>
                  <span className="stat-value">{teacher.courses_count}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Email</span>
                  <span className="stat-value">{teacher.user_details.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Details */}
      <div className="teacher-details-section">
        <div className="container">
          <div className="row">
            {/* Left Column - About */}
            <div className="col-lg-8">
              <div className="details-card">
                <h3>About</h3>
                <p className="teacher-expertise">{teacher.expertise}</p>

                {/* Contact Information */}
                <div className="contact-info mt-4">
                  <h5>Contact Information</h5>
                  <div className="info-item">
                    <strong>Email:</strong>
                    <a href={`mailto:${teacher.user_details.email}`}>
                      {teacher.user_details.email}
                    </a>
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {teacher.mobile_no}
                  </div>
                </div>
              </div>

              {/* Courses Section */}
              <div className="details-card courses-card">
                <h3>Courses by {teacher.user_details.name}</h3>
                {courses.length === 0 ? (
                  <p className="text-muted">
                    This teacher has no courses available.
                  </p>
                ) : (
                  <div className="courses-list">
                    {courses.map((course) => (
                      <div key={course.id} className="course-item">
                        <div className="course-item-header">
                          <h5>{course.title}</h5>
                          <span className="badge bg-primary">{course.code}</span>
                        </div>
                        <p className="course-item-description">
                          {course.description.substring(0, 150)}...
                        </p>
                        <div className="course-item-footer">
                          <span className="price">
                            ${parseFloat(course.price).toFixed(2)}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/courses/${course.id}`)}
                          >
                            View Course
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="col-lg-4">
              <div className="summary-card">
                <h5>Teacher Information</h5>
                <div className="info-group">
                  <label>Qualification</label>
                  <p>{teacher.qualification}</p>
                </div>
                <div className="info-group">
                  <label>Experience</label>
                  <p>{teacher.experience} years</p>
                </div>
                <div className="info-group">
                  <label>Mobile Number</label>
                  <p>{teacher.mobile_no}</p>
                </div>
                <div className="info-group">
                  <label>Username</label>
                  <p>{teacher.user_details.username}</p>
                </div>
                <div className="info-group">
                  <label>Expertise</label>
                  <p>{teacher.expertise}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
