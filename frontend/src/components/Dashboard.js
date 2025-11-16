import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import "./Dashboard.css";

function Dashboard({ user, setUser }) {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    code: "",
    title: "",
    description: "",
    price: "",
    is_available: true,
  });
  const [categories, setCategories] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]); // For teacher stats
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    qualification: "",
    mobile_no: "",
    interested_categories: "",
    experience: "",
    expertise: "",
  });
  const [editLoading, setEditLoading] = useState(false);
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
          // Fetch teacher's own courses (including unavailable ones)
          const courseResponse = await API.get("/course/my_courses/");
          setCourses(courseResponse.data);
          
          const categoryResponse = await API.get("/category/");
          setCategories(categoryResponse.data);
          
          // Fetch all enrollments to count total students
          const allEnrollmentsResponse = await API.get("/enrollment/");
          setAllEnrollments(allEnrollmentsResponse.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Initialize edit form with current user data
  const handleOpenEditModal = () => {
    setEditFormData({
      qualification: user.profile?.qualification || "",
      mobile_no: user.profile?.mobile_no || "",
      interested_categories: user.profile?.interested_categories || "",
      experience: user.profile?.experience || "",
      expertise: user.profile?.expertise || "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const payload = {
        qualification: editFormData.qualification,
        mobile_no: editFormData.mobile_no,
      };

      if (user.role === "student") {
        payload.interested_categories = editFormData.interested_categories;
      } else {
        payload.experience = editFormData.experience;
        payload.expertise = editFormData.expertise;
      }

      const endpoint = user.role === "student" ? `/student/${user.profile?.id}/` : `/teacher/${user.profile?.id}/`;
      const response = await API.patch(endpoint, payload);

      // Update local user state
      const updatedUser = {
        ...user,
        profile: response.data,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

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

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        category: parseInt(formData.category),
        code: formData.code,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
      };

      const response = await API.post("/course/", payload);
      
      // Add the new course to the list
      setCourses([...courses, response.data]);
      
      // Reset form
      setFormData({
        category: "",
        code: "",
        title: "",
        description: "",
        price: "",
        is_available: true,
      });
      setShowCreateForm(false);
      
      alert("Course created successfully!");
    } catch (error) {
      console.error("Error creating course:", error.response?.data || error.message);
      
      // Better error messaging
      let errorMessage = "Failed to create course";
      
      if (error.response?.data?.code?.[0]) {
        errorMessage = error.response.data.code[0];
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // Handle other validation errors
        const firstError = Object.values(error.response.data)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAvailability = async (courseId, currentStatus) => {
    // Show confirmation if marking as unavailable
    if (currentStatus) {
      const confirmed = window.confirm(
        "Marking this course as unavailable will unenroll all currently enrolled students. Continue?"
      );
      if (!confirmed) return;
    }

    try {
      const updatedData = {
        is_available: !currentStatus,
      };

      const response = await API.patch(`/course/${courseId}/`, updatedData);
      
      // Update the course in the list
      setCourses(
        courses.map((course) =>
          course.id === courseId ? response.data : course
        )
      );
      
      if (!currentStatus) {
        // Made available
        alert(`Course made available successfully!`);
      } else {
        // Made unavailable
        alert(
          `Course made unavailable successfully!\nAll enrolled students have been automatically unenrolled.`
        );
      }
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course availability");
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`
      )
    ) {
      try {
        await API.delete(`/course/${courseId}/`);
        
        // Remove the course from the list
        setCourses(courses.filter((course) => course.id !== courseId));
        
        alert("Course deleted successfully!");
      } catch (error) {
        console.error("Error deleting course:", error);
        alert(
          error.response?.data?.error ||
          "Failed to delete course. Please try again."
        );
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Calculate teacher statistics
  const getTeacherStats = () => {
    const totalCourses = courses.length;
    const availableCourses = courses.filter(course => course.is_available).length;
    
    // Count total enrollments in teacher's courses
    const courseIds = new Set(courses.map(c => c.id));
    let totalEnrollments = 0;
    
    allEnrollments.forEach(enrollment => {
      if (courseIds.has(enrollment.course)) {
        totalEnrollments++;
      }
    });
    
    return {
      totalCourses,
      availableCourses,
      totalEnrollments,
    };
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
                      <button
                        className="btn btn-primary"
                        onClick={handleOpenEditModal}
                      >
                        <i className="fas fa-edit me-2"></i> Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {user.role === "student" ? (
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="stat-card">
                  <div className="stat-value">{enrollments.length}</div>
                  <div className="stat-label">Courses Enrolled</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row mb-4 g-4">
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-value">{getTeacherStats().totalCourses}</div>
                  <div className="stat-label">Total Courses Created</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-value">{getTeacherStats().availableCourses}</div>
                  <div className="stat-label">Available Courses</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-value">{getTeacherStats().totalEnrollments}</div>
                  <div className="stat-label">Total Enrollments</div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Section */}
          <div className="row">
            <div className="col-md-12">
              <h2 className="section-title">
                {user.role === "student" ? "Enrolled Courses" : "My Courses"}
              </h2>

              {/* Add Course Section for Teachers */}
              {user.role === "teacher" && (
                <div className="mb-4">
                  <button
                    className="btn btn-primary mb-3"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                  >
                    {showCreateForm ? "Cancel" : "+ Add New Course"}
                  </button>

                  {showCreateForm && (
                    <div className="card mb-4">
                      <div className="card-body">
                        <h5 className="card-title">Create New Course</h5>
                        <form onSubmit={handleCreateCourse}>
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Course Category *</label>
                              <select
                                className="form-select"
                                name="category"
                                value={formData.category}
                                onChange={handleFormChange}
                                required
                              >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Course Code *</label>
                              <input
                                type="text"
                                className="form-control"
                                name="code"
                                value={formData.code}
                                onChange={handleFormChange}
                                placeholder="e.g., CS101"
                                required
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Course Title *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="title"
                              value={formData.title}
                              onChange={handleFormChange}
                              placeholder="e.g., Introduction to Computer Science"
                              required
                            />
                          </div>

                          <div className="mb-3">
                            <label className="form-label">Description *</label>
                            <textarea
                              className="form-control"
                              name="description"
                              value={formData.description}
                              onChange={handleFormChange}
                              rows="4"
                              placeholder="Describe your course..."
                              required
                            ></textarea>
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Price ($) *</label>
                              <input
                                type="number"
                                className="form-control"
                                name="price"
                                value={formData.price}
                                onChange={handleFormChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">Availability</label>
                              <div className="form-check mt-2">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id="isAvailable"
                                  name="is_available"
                                  checked={formData.is_available}
                                  onChange={handleFormChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="isAvailable"
                                >
                                  Make this course available
                                </label>
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="btn btn-success w-100"
                            disabled={creating}
                          >
                            {creating ? "Creating..." : "Create Course"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                      You haven't created any courses yet. Click "Add New Course" to get started!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="row g-4">
                  {courses.map((course) => (
                    <div key={course.id} className="col-md-6 col-lg-4">
                      <div className="course-card h-100">
                        <div className="course-card-inner">
                          <div className="course-badge">
                            {course.code}
                            <span
                              className={`badge ms-2 ${
                                course.is_available
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {course.is_available ? "Available" : "Not Available"}
                            </span>
                          </div>
                          <div className="enrollment-badge">
                            <span className="badge bg-info">
                              👥 {course.enrollment_count} {course.enrollment_count === 1 ? "Student" : "Students"}
                            </span>
                          </div>
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
                          <div className="btn-group w-100 mt-3" role="group">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleViewCourse(course.id)}
                            >
                              View
                            </button>
                            <button
                              className={`btn btn-sm ${
                                course.is_available
                                  ? "btn-outline-danger"
                                  : "btn-outline-success"
                              }`}
                              onClick={() =>
                                handleToggleAvailability(
                                  course.id,
                                  course.is_available
                                )
                              }
                            >
                              {course.is_available ? "Make Unavailable" : "Make Available"}
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() =>
                                handleDeleteCourse(course.id, course.title)
                              }
                              title="Delete this course"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseEditModal}
                ></button>
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Qualification *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="qualification"
                      value={editFormData.qualification}
                      onChange={handleEditFormChange}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="mobile_no"
                      value={editFormData.mobile_no}
                      onChange={handleEditFormChange}
                      placeholder="e.g., +1-234-567-8900"
                      required
                    />
                  </div>

                  {user.role === "student" && (
                    <div className="mb-3">
                      <label className="form-label">Interested Categories</label>
                      <textarea
                        className="form-control"
                        name="interested_categories"
                        value={editFormData.interested_categories}
                        onChange={handleEditFormChange}
                        placeholder="e.g., Web Development, Machine Learning"
                        rows="3"
                      ></textarea>
                    </div>
                  )}

                  {user.role === "teacher" && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Experience (years) *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="experience"
                          value={editFormData.experience}
                          onChange={handleEditFormChange}
                          placeholder="e.g., 5"
                          min="0"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Expertise *</label>
                        <textarea
                          className="form-control"
                          name="expertise"
                          value={editFormData.expertise}
                          onChange={handleEditFormChange}
                          placeholder="Describe your expertise and specializations"
                          rows="4"
                          required
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

