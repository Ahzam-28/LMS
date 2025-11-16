import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api";
import "./CourseEnrollment.css";

function CourseEnrollment() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      setUser(userObj);
    }
    
    fetchCourses();
    fetchCategories();
    
    // Only fetch enrolled courses if user is logged in as student
    if (savedUser) {
      const userObj = JSON.parse(savedUser);
      if (userObj.role === "student") {
        fetchEnrolledCourses();
      }
    }
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      const response = await API.get("/course/");
      setCourses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get("/category/");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await API.get("/enrollment/my_enrollments/");
      const enrolledIds = response.data.map((enrollment) => enrollment.course);
      setEnrolledCourses(enrolledIds);
    } catch (error) {
      console.error("Failed to fetch enrolled courses:", error);
    }
  };

  const handleEnrollClick = async (courseId) => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is a student
    if (user.role !== "student") {
      alert("Only students can enroll in courses. Please log in as a student.");
      return;
    }

    try {
      await API.post("/enrollment/enroll_course/", {
        course_id: courseId,
        status: "active",
      });
      setEnrolledCourses([...enrolledCourses, courseId]);
      alert("Successfully enrolled in the course!");
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert(
        error.response?.data?.error || "Failed to enroll. Please try again."
      );
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || course.category === parseInt(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="course-enrollment">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="enrollment-header mb-5">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1>Available Courses</h1>
              <p className="text-muted">
                Explore and enroll in courses from our top instructors
              </p>
            </div>
            <div className="col-md-4 text-end">
              <Link
                to="/"
                className="btn btn-outline-primary me-2"
              >
                Home
              </Link>
              {user && user.role === "student" && (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate("/student-dashboard")}
                >
                  My Courses
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="filter-section mb-4">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Search courses by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <select
                className="form-select form-select-lg"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="alert alert-info text-center" role="alert">
            <h5>No courses found</h5>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="col-md-6 col-lg-4">
                <div className="course-card h-100">
                  <div className="course-card-body">
                    <div className="course-header">
                      <div>
                        <span className="course-code">{course.code}</span>
                        {enrolledCourses.includes(course.id) && (
                          <span className="badge bg-success ms-2">Enrolled</span>
                        )}
                      </div>
                      <span className="enrollment-count" title="Students enrolled">
                        👥 {course.enrollment_count}
                      </span>
                    </div>

                    <h5 className="course-title">{course.title}</h5>

                    <p className="course-description">
                      {course.description.substring(0, 100)}
                      {course.description.length > 100 ? "..." : ""}
                    </p>

                    <p className="course-category">
                      <small className="text-muted">
                        Category: {course.category_details?.title || "Uncategorized"}
                      </small>
                    </p>

                    <div className="course-meta">
                      <p className="mb-2">
                        <strong>Price:</strong> ${parseFloat(course.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="course-footer mt-auto">
                      <button
                        className="btn btn-outline-primary w-100 mb-2"
                        onClick={() =>
                          navigate(`/courses/${course.id}`)
                        }
                      >
                        View Details
                      </button>
                      {enrolledCourses.includes(course.id) ? (
                        <button
                          className="btn btn-outline-secondary w-100"
                          onClick={() =>
                            navigate(`/courses/${course.id}`)
                          }
                        >
                          View Course
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleEnrollClick(course.id)}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="row mt-5">
          <div className="col-md-12">
            <div className="stats-card">
              <div className="row text-center">
                <div className="col-md-4">
                  <h5>{courses.length}</h5>
                  <p>Total Courses</p>
                </div>
                <div className="col-md-4">
                  <h5>{enrolledCourses.length}</h5>
                  <p>Courses Enrolled</p>
                </div>
                <div className="col-md-4">
                  <h5>{courses.length - enrolledCourses.length}</h5>
                  <p>Available to Enroll</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseEnrollment;
