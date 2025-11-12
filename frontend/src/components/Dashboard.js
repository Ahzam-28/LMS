import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import "./Dashboard.css";

function Dashboard({ user, setUser }) {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // safety check

    const fetchData = async () => {
      try {
        if (user.role === "student") {
          // Fetch student enrollments
          const enrollmentResponse = await API.get("/enrollment/my_enrollments/");
          setEnrollments(enrollmentResponse.data);
        } else if (user.role === "teacher") {
          // Fetch teacher's courses
          const courseResponse = await API.get(`/course/?teacher=${user.profile.id}`);
          setCourses(courseResponse.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleBrowseCourses = () => {
    navigate("/courses");
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">LMS Portal</span>
          <div className="d-flex align-items-center">
            <Link to="/" className="btn btn-outline-light btn-sm me-2">
              Home
            </Link>
            <span className="text-white me-3">Welcome, {user.username}!</span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="container-fluid py-4">
          {/* Profile Card */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card profile-card">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <h3 className="card-title mb-2">
                        {user.role === "student" ? "Student Profile" : "Teacher Profile"}
                      </h3>
                      <p className="mb-1">
                        <strong>Name:</strong> {user.username}
                      </p>
                      <p className="mb-1">
                        <strong>Email:</strong> {user.email || "N/A"}
                      </p>
                      <p className="mb-1">
                        <strong>Qualification:</strong> {user.profile?.qualification || "N/A"}
                      </p>
                      <p className="mb-1">
                        <strong>Mobile:</strong> {user.profile?.mobile_no || "N/A"}
                      </p>
                      {user.role === "student" && (
                        <p className="mb-0">
                          <strong>Interested Categories:</strong>{" "}
                          {user.profile?.interested_categories || "Not specified"}
                        </p>
                      )}
                      {user.role === "teacher" && (
                        <>
                          <p className="mb-0">
                            <strong>Experience:</strong> {user.profile?.experience || "N/A"} years
                          </p>
                          <p className="mb-0">
                            <strong>Expertise:</strong> {user.profile?.expertise || "N/A"}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="col-md-4 text-end">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Section */}
          <div className="row">
            <div className="col-md-12">
              <h2 className="section-title">
                {user.role === "student" ? "Enrolled Courses" : "My Courses"}
              </h2>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : user.role === "student" ? (
                enrollments.length === 0 ? (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <h5 className="card-title">No Courses Enrolled</h5>
                      <p className="card-text text-muted mb-3">
                        You haven't enrolled in any courses yet.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={handleBrowseCourses}
                      >
                        Browse Available Courses
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="row g-4">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="col-md-6 col-lg-4">
                        <div className="course-card h-100">
                          <div className="course-card-inner">
                            <div className="course-badge">
                              {enrollment.course_details?.code}
                            </div>
                            <h5 className="course-title">
                              {enrollment.course_details?.title}
                            </h5>
                            <p className="course-description">
                              {enrollment.course_details?.description.substring(0, 80)}...
                            </p>
                            <p className="course-category">
                              <small className="text-muted">
                                {enrollment.course_details?.category_details?.title || "Uncategorized"}
                              </small>
                            </p>
                            <div className="course-info mt-3">
                              <p className="mb-1">
                                <small className="text-muted">
                                  <strong>Enrolled:</strong> {enrollment.enrollment_date}
                                </small>
                              </p>
                              <p className="mb-0">
                                <small className="text-muted">
                                  <strong>Status:</strong>{" "}
                                  <span className="badge bg-success">{enrollment.status}</span>
                                </small>
                              </p>
                            </div>
                            <button
                              className="btn btn-outline-primary btn-sm w-100 mt-3"
                              onClick={() =>
                                handleViewCourse(enrollment.course_details?.id)
                              }
                            >
                              View Course
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : courses.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-5">
                    <h5 className="card-title">No Courses</h5>
                    <p className="card-text text-muted">
                      You haven't created any courses yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="row g-4">
                  {courses.map((course) => (
                    <div key={course.id} className="col-md-6 col-lg-4">
                      <div className="course-card h-100">
                        <div className="course-card-inner">
                          <div className="course-badge">{course.code}</div>
                          <h5 className="course-title">{course.title}</h5>
                          <p className="course-description">
                            {course.description.substring(0, 80)}...
                          </p>
                          <p className="course-category">
                            <small className="text-muted">
                              {course.category_details?.title || "Uncategorized"}
                            </small>
                          </p>
                          <div className="course-info mt-3">
                            <p className="mb-1">
                              <small className="text-muted">
                                <strong>Price:</strong> ${parseFloat(course.price).toFixed(2)}
                              </small>
                            </p>
                          </div>
                          <button
                            className="btn btn-outline-primary btn-sm w-100 mt-3"
                            onClick={() => handleViewCourse(course.id)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

