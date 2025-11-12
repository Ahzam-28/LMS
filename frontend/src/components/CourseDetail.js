import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import "./CourseDetail.css";

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [user, setUser] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // Fetch course details
    const fetchCourse = async () => {
      try {
        const response = await API.get(`/course/${id}/`);
        setCourse(response.data);
        
        // Fetch teacher details
        const teacherResponse = await API.get(`/teacher/${response.data.teacher}/`);
        setTeacher(teacherResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch course:", error);
        setLoading(false);
        setError("Failed to load course details");
      }
    };

    fetchCourse();
  }, [id]);

  // Check if student is enrolled
  useEffect(() => {
    if (user?.role === "student" && course) {
      const checkEnrollment = async () => {
        try {
          const response = await API.get("/enrollment/my_enrollments/");
          const enrolled = response.data.some(
            (enrollment) => enrollment.course === course.id
          );
          setIsEnrolled(enrolled);
        } catch (error) {
          console.error("Failed to check enrollment:", error);
        }
      };
      checkEnrollment();
    }
  }, [user, course]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      setError("Only students can enroll in courses");
      return;
    }

    setEnrolling(true);
    try {
      const response = await API.post("/enrollment/enroll_course/", {
        course_id: id,
        status: "active",
      });
      setIsEnrolled(true);
      setError(null);
      alert("Successfully enrolled in the course!");
    } catch (error) {
      console.error("Enrollment failed:", error);
      setError(
        error.response?.data?.error ||
          "Failed to enroll. Please try again."
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (
      window.confirm(
        "Are you sure you want to unenroll from this course?"
      )
    ) {
      setEnrolling(true);
      try {
        await API.delete("/enrollment/unenroll_course/", {
          data: { course_id: id },
        });
        setIsEnrolled(false);
        setError(null);
        alert("Successfully unenrolled from the course!");
      } catch (error) {
        console.error("Unenrollment failed:", error);
        setError(
          error.response?.data?.error ||
            "Failed to unenroll. Please try again."
        );
      } finally {
        setEnrolling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          Course not found.
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5 course-detail">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate("/courses")}
      >
        ← Back to Courses
      </button>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h1 className="card-title">{course.title}</h1>
              <p className="text-muted">
                <strong>Course Code:</strong> {course.code}
              </p>
              <p className="text-muted">
                <strong>Price:</strong> ${parseFloat(course.price).toFixed(2)}
              </p>

              <hr />

              <h5>Course Description</h5>
              <p>{course.description}</p>

              <h5>Instructor</h5>
              {teacher && (
                <div className="instructor-card">
                  <p>
                    <strong>Name:</strong> {teacher.user?.first_name} {teacher.user?.last_name}
                  </p>
                  <p>
                    <strong>Qualification:</strong> {teacher.qualification}
                  </p>
                  <p>
                    <strong>Experience:</strong> {teacher.experience} years
                  </p>
                  <p>
                    <strong>Expertise:</strong> {teacher.expertise}
                  </p>
                  <p>
                    <strong>Contact:</strong> {teacher.mobile_no}
                  </p>
                </div>
              )}

              <h5 className="mt-4">Course Category</h5>
              <p>{course.category_details?.title || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Enrollment</h5>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              {user ? (
                <>
                  <p className="mb-3">
                    <strong>Role:</strong> {user.role}
                  </p>

                  {user.role === "student" ? (
                    <>
                      {isEnrolled ? (
                        <>
                          <div className="alert alert-success" role="alert">
                            ✓ You are enrolled in this course
                          </div>
                          <button
                            className="btn btn-danger w-100"
                            onClick={handleUnenroll}
                            disabled={enrolling}
                          >
                            {enrolling ? "Unenrolling..." : "Unenroll"}
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-success w-100"
                          onClick={handleEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? "Enrolling..." : "Enroll Now"}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-info" role="alert">
                      Only students can enroll in courses.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="btn btn-success w-100"
                    onClick={() => navigate("/login")}
                  >
                    Enroll Now
                  </button>
                  <p className="mt-3 text-center text-muted">
                    <small>Please log in to enroll in this course</small>
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              <h6 className="card-title">Course Info</h6>
              <ul className="list-unstyled">
                <li>
                  <strong>Status:</strong> Active
                </li>
                <li>
                  <strong>Level:</strong> All Levels
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
