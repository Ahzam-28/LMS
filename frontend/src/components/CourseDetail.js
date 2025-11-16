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
  const [lessons, setLessons] = useState([]);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    video_url: "",
  });
  const [submittingLesson, setSubmittingLesson] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // Fetch course details
    const fetchCourse = async () => {
      try {
        const response = await API.get(`/course/${id}/`);
        setCourse(response.data);
        
        // Set teacher from course data (includes teacher_details)
        if (response.data.teacher_details) {
          setTeacher(response.data.teacher_details);
        }

        // Fetch lessons for this course
        const lessonsResponse = await API.get(`/lesson/?course=${id}`);
        console.log("Lessons fetched:", lessonsResponse.data);
        setLessons(lessonsResponse.data);
        
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

  const handleAddLesson = async (e) => {
    e.preventDefault();
    setSubmittingLesson(true);

    try {
      const payload = {
        course: parseInt(id),
        title: lessonFormData.title,
        content: lessonFormData.content,
        video_url: lessonFormData.video_url || null,
      };

      const response = await API.post("/lesson/", payload);
      setLessons([...lessons, response.data]);
      setLessonFormData({ title: "", content: "", video_url: "" });
      setShowAddLesson(false);
      alert("Lesson added successfully!");
    } catch (error) {
      console.error("Failed to add lesson:", error);
      alert("Failed to add lesson. Please try again.");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleLessonFormChange = (e) => {
    const { name, value } = e.target;
    setLessonFormData({
      ...lessonFormData,
      [name]: value,
    });
  };

  const handleToggleLessonCompletion = (lessonId) => {
    // If not logged in, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }

    // If student but not enrolled, show error
    if (user.role === "student" && !isEnrolled) {
      alert("You must be enrolled in this course to interact with lessons");
      return;
    }

    const newCompleted = new Set(completedLessons);
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);
  };

  const handleWatchVideo = (e, videoUrl) => {
    e.preventDefault();
    
    // If not logged in, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }

    // If student but not enrolled, prompt to enroll
    if (user.role === "student" && !isEnrolled) {
      const shouldEnroll = window.confirm(
        "You need to enroll in this course first to watch videos. Would you like to enroll now?"
      );
      if (shouldEnroll) {
        handleEnroll();
      }
      return;
    }

    // If authorized, open video in new tab
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  const handleLessonInteraction = (action) => {
    // Any interaction (checkbox, video) by logged-out user redirects to login
    if (!user) {
      navigate("/login");
      return;
    }

    // Students not enrolled get enrollment prompt or alert
    if (user.role === "student" && !isEnrolled) {
      alert("You must be enrolled in this course to interact with lessons");
      return;
    }

    // Allow action for authorized users
    return true;
  };

  const isTeacher = user && user.role === "teacher" && user.profile?.id === teacher?.id;

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
              <p className="text-muted">
                <strong>Students Enrolled:</strong>{" "}
                <span className="badge bg-info">
                  👥 {course.enrollment_count} {course.enrollment_count === 1 ? "Student" : "Students"}
                </span>
              </p>

              <hr />

              <h5>Course Description</h5>
              <p>{course.description}</p>

              <h5>Instructor</h5>
              {teacher && (
                <div className="instructor-card">
                  <p>
                    <strong>Name:</strong> {teacher.name || "N/A"}
                  </p>
                  <p>
                    <strong>Qualification:</strong> {teacher.qualification || "N/A"}
                  </p>
                  <p>
                    <strong>Experience:</strong> {teacher.experience || "N/A"} years
                  </p>
                  <p>
                    <strong>Expertise:</strong> {teacher.expertise || "N/A"}
                  </p>
                </div>
              )}
              {!teacher && (
                <p className="text-muted">No instructor information available</p>
              )}

              <h5 className="mt-4">Course Category</h5>
              <p>{course.category_details?.title || "N/A"}</p>

              <hr className="my-4" />

              {/* Lessons Section */}
              <div className="lessons-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Course Lessons</h5>
                  {isTeacher && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowAddLesson(!showAddLesson)}
                    >
                      {showAddLesson ? "Cancel" : "+ Add Lesson"}
                    </button>
                  )}
                </div>

                {/* Add Lesson Form */}
                {isTeacher && showAddLesson && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6>Create New Lesson</h6>
                      <form onSubmit={handleAddLesson}>
                        <div className="mb-3">
                          <label className="form-label">Lesson Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={lessonFormData.title}
                            onChange={handleLessonFormChange}
                            placeholder="e.g., Introduction to Variables"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Lesson Content *</label>
                          <textarea
                            className="form-control"
                            name="content"
                            value={lessonFormData.content}
                            onChange={handleLessonFormChange}
                            rows="4"
                            placeholder="Enter lesson content..."
                            required
                          ></textarea>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Video URL (Optional)</label>
                          <input
                            type="url"
                            className="form-control"
                            name="video_url"
                            value={lessonFormData.video_url}
                            onChange={handleLessonFormChange}
                            placeholder="https://example.com/video"
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={submittingLesson}
                        >
                          {submittingLesson ? "Adding..." : "Add Lesson"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Enrollment Required Message */}
                {user && user.role === "student" && !isEnrolled && lessons.length > 0 && (
                  <div className="alert alert-info mb-3" role="alert">
                    <i className="fas fa-info-circle"></i> <strong>Enroll in this course to view lessons</strong>
                  </div>
                )}

                {/* Lessons List */}
                {lessons.length === 0 ? (
                  <p className="text-muted">
                    {isTeacher
                      ? "No lessons yet. Add your first lesson!"
                      : "No lessons available for this course."}
                  </p>
                ) : (
                  <>
                    {!user && (
                      <div className="alert alert-warning mb-3" role="alert">
                        <i className="fas fa-lock"></i> <strong>Log in to interact with lessons</strong>
                      </div>
                    )}
                    <div className="lessons-list">
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="lesson-card">
                        <div className="lesson-header">
                          <input
                            type="checkbox"
                            className="lesson-checkbox"
                            checked={isEnrolled && completedLessons.has(lesson.id)}
                            onChange={() => handleLessonInteraction("checkbox") && handleToggleLessonCompletion(lesson.id)}
                            disabled={!isEnrolled}
                            title={
                              !user
                                ? "Login to mark lessons as complete"
                                : !isEnrolled && user?.role === "student"
                                ? "Enroll to mark lessons as complete"
                                : ""
                            }
                            style={{ cursor: !isEnrolled ? "not-allowed" : "pointer" }}
                          />
                          <h6 className="lesson-title">
                            {lesson.title}
                            {isEnrolled && completedLessons.has(lesson.id) && (
                              <span className="badge bg-success ms-2">
                                <i className="fas fa-check"></i> Completed
                              </span>
                            )}
                          </h6>
                        </div>
                        <p className="lesson-content">{lesson.content}</p>
                        {lesson.video_url && (
                          <div className="lesson-video">
                            <button
                              onClick={(e) => handleLessonInteraction("video") && handleWatchVideo(e, lesson.video_url)}
                              className="btn btn-sm btn-info"
                              disabled={!isEnrolled || !user}
                              title={
                                !user
                                  ? "Login to watch video"
                                  : !isEnrolled
                                  ? "Enroll to watch video"
                                  : ""
                              }
                            >
                              <i className="fas fa-video"></i> Watch Video
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>
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
