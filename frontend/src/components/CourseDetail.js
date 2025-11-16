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
  const [lessonCategories, setLessonCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    title: "",
    description: "",
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: "",
    content: "",
    video_url: "",
    category: null,
  });
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    code: "",
    price: "",
  });
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [showAddQuiz, setShowAddQuiz] = useState({});
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    total_marks: "",
    duration: "",
    lesson_category: null,
  });
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showAddFile, setShowAddFile] = useState({});
  const [editingFileId, setEditingFileId] = useState(null);
  const [fileFormData, setFileFormData] = useState({
    title: "",
    file_url: "",
    lesson: null,
  });
  const [submittingFile, setSubmittingFile] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // Fetch course details
    const fetchCourse = async () => {
      try {
        const response = await API.get(`/course/${id}/`);
        setCourse(response.data);
        setCourseFormData({
          title: response.data.title,
          description: response.data.description,
          code: response.data.code,
          price: response.data.price,
        });
        
        // Set teacher from course data (includes teacher_details)
        if (response.data.teacher_details) {
          setTeacher(response.data.teacher_details);
        }

        // Fetch lessons for this course
        const lessonsResponse = await API.get(`/lesson/?course=${id}`);
        console.log("Lessons fetched:", lessonsResponse.data);
        setLessons(lessonsResponse.data);

        // Fetch lesson categories for this course
        const categoriesResponse = await API.get(`/lesson-category/?course=${id}`);
        console.log("Lesson categories fetched:", categoriesResponse.data);
        setLessonCategories(categoriesResponse.data);

        // Fetch all quizzes for this course (we'll filter by category in frontend)
        const quizzesResponse = await API.get(`/quiz/`);
        console.log("Quizzes fetched:", quizzesResponse.data);
        setQuizzes(quizzesResponse.data);
        
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
        title: lessonFormData.title,
        content: lessonFormData.content,
        video_url: lessonFormData.video_url || null,
        category: lessonFormData.category || null,
      };

      if (editingLessonId) {
        // Update existing lesson
        await API.patch(`/lesson/${editingLessonId}/`, payload);
        setLessons(
          lessons.map((lesson) =>
            lesson.id === editingLessonId ? { ...lesson, ...payload } : lesson
          )
        );
        setEditingLessonId(null);
        alert("Lesson updated successfully!");
      } else {
        // Create new lesson
        payload.course = parseInt(id);
        const response = await API.post("/lesson/", payload);
        setLessons([...lessons, response.data]);
        alert("Lesson added successfully!");
      }
      
      setLessonFormData({ title: "", content: "", video_url: "", category: null });
      setShowAddLesson(false);
    } catch (error) {
      console.error("Failed to save lesson:", error);
      alert("Failed to save lesson. Please try again.");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);

    try {
      const payload = {
        title: categoryFormData.title,
        description: categoryFormData.description,
      };

      if (editingCategoryId) {
        // Update existing category
        await API.patch(`/lesson-category/${editingCategoryId}/`, payload);
        setLessonCategories(
          lessonCategories.map((cat) =>
            cat.id === editingCategoryId ? { ...cat, ...payload } : cat
          )
        );
        setEditingCategoryId(null);
        alert("Category updated successfully!");
      } else {
        // Create new category
        payload.course = parseInt(id);
        const response = await API.post("/lesson-category/", payload);
        setLessonCategories([...lessonCategories, response.data]);
        alert("Category created successfully!");
      }
      
      setCategoryFormData({ title: "", description: "" });
      setShowAddCategory(false);
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category. Please try again.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleLessonFormChange = (e) => {
    const { name, value } = e.target;
    setLessonFormData({
      ...lessonFormData,
      [name]: value,
    });
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: value,
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      title: category.title,
      description: category.description,
    });
    setShowAddCategory(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setSubmittingCategory(true);

    try {
      const payload = {
        title: categoryFormData.title,
        description: categoryFormData.description,
      };

      await API.patch(`/lesson-category/${editingCategoryId}/`, payload);
      setLessonCategories(
        lessonCategories.map((cat) =>
          cat.id === editingCategoryId ? { ...cat, ...payload } : cat
        )
      );
      setCategoryFormData({ title: "", description: "" });
      setEditingCategoryId(null);
      setShowAddCategory(false);
      alert("Category updated successfully!");
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await API.delete(`/lesson-category/${categoryId}/`);
      setLessonCategories(lessonCategories.filter((cat) => cat.id !== categoryId));
      alert("Category deleted successfully!");
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonFormData({
      title: lesson.title,
      content: lesson.content,
      video_url: lesson.video_url || "",
      category: lesson.category || null,
    });
    setShowAddLesson(true);
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    setSubmittingLesson(true);

    try {
      const payload = {
        title: lessonFormData.title,
        content: lessonFormData.content,
        video_url: lessonFormData.video_url || null,
        category: lessonFormData.category || null,
      };

      await API.patch(`/lesson/${editingLessonId}/`, payload);
      setLessons(
        lessons.map((lesson) =>
          lesson.id === editingLessonId ? { ...lesson, ...payload } : lesson
        )
      );
      setLessonFormData({ title: "", content: "", video_url: "", category: null });
      setEditingLessonId(null);
      setShowAddLesson(false);
      alert("Lesson updated successfully!");
    } catch (error) {
      console.error("Failed to update lesson:", error);
      alert("Failed to update lesson. Please try again.");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) {
      return;
    }

    try {
      await API.delete(`/lesson/${lessonId}/`);
      setLessons(lessons.filter((lesson) => lesson.id !== lessonId));
      alert("Lesson deleted successfully!");
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("Failed to delete lesson. Please try again.");
    }
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

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!course) return;

    setSubmittingCourse(true);
    try {
      const payload = {
        title: courseFormData.title,
        description: courseFormData.description,
        code: courseFormData.code,
        price: courseFormData.price,
      };

      await API.patch(`/course/${course.id}/`, payload);
      setCourse({ ...course, ...payload });
      setEditingCourse(false);
      alert("Course updated successfully!");
    } catch (error) {
      console.error("Failed to update course:", error);
      alert("Failed to update course. Please try again.");
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    try {
      await API.delete(`/course/${course.id}/`);
      alert("Course deleted successfully!");
      navigate("/courses");
    } catch (error) {
      console.error("Failed to delete course:", error);
      alert("Failed to delete course. Please try again.");
    }
  };

  const handleAddQuiz = async (e, categoryId) => {
    e.preventDefault();
    if (!quizFormData.title || !quizFormData.total_marks || !quizFormData.duration) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmittingQuiz(true);
    try {
      const payload = {
        lesson_category: categoryId,
        title: quizFormData.title,
        description: quizFormData.description,
        total_marks: parseInt(quizFormData.total_marks),
        duration: parseInt(quizFormData.duration),
      };

      if (editingQuizId) {
        await API.patch(`/quiz/${editingQuizId}/`, payload);
        setQuizzes(quizzes.map(q => q.id === editingQuizId ? {...q, ...payload} : q));
        setEditingQuizId(null);
        alert("Quiz updated successfully!");
      } else {
        const response = await API.post("/quiz/", payload);
        setQuizzes([...quizzes, response.data]);
        alert("Quiz added successfully!");
      }

      setQuizFormData({
        title: "",
        description: "",
        total_marks: "",
        duration: "",
        lesson_category: null,
      });
      setShowAddQuiz({});
    } catch (error) {
      console.error("Failed to add/update quiz:", error);
      alert("Failed to add/update quiz. Please try again.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuizId(quiz.id);
    setQuizFormData({
      title: quiz.title,
      description: quiz.description,
      total_marks: quiz.total_marks.toString(),
      duration: quiz.duration.toString(),
      lesson_category: quiz.lesson_category,
    });
    setShowAddQuiz({ [quiz.lesson_category]: true });
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      await API.delete(`/quiz/${quizId}/`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      alert("Quiz deleted successfully!");
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    }
  };

  const getQuizzesByCategory = (categoryId) => {
    return quizzes.filter((quiz) => quiz.lesson_category === categoryId);
  };

  const handleAddFile = async (e, lessonId) => {
    e.preventDefault();
    if (!fileFormData.title || !fileFormData.file_url) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmittingFile(true);
    try {
      const payload = {
        lesson: lessonId,
        title: fileFormData.title,
        file_url: fileFormData.file_url,
      };

      if (editingFileId) {
        // Update file
        await API.patch(`/lesson-file/${editingFileId}/`, payload);
        
        setLessons(lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return {
              ...lesson,
              files: lesson.files.map(f => f.id === editingFileId ? {...f, ...payload} : f)
            };
          }
          return lesson;
        }));
        
        setEditingFileId(null);
        alert("File updated successfully!");
      } else {
        // Create new file
        const response = await API.post("/lesson-file/", payload);
        
        setLessons(lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return {
              ...lesson,
              files: [...(lesson.files || []), response.data]
            };
          }
          return lesson;
        }));
        
        alert("File added successfully!");
      }

      setFileFormData({
        title: "",
        file_url: "",
        lesson: null,
      });
      setShowAddFile({});
    } catch (error) {
      console.error("Failed to add/update file:", error);
      alert("Failed to add/update file. Please try again.");
    } finally {
      setSubmittingFile(false);
    }
  };

  const handleEditFile = (file, lessonId) => {
    setEditingFileId(file.id);
    setFileFormData({
      title: file.title,
      file_url: file.file_url,
      lesson: lessonId,
    });
    setShowAddFile({ [lessonId]: true });
  };

  const handleDeleteFile = async (fileId, lessonId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      await API.delete(`/lesson-file/${fileId}/`);
      
      // Update the lesson's files
      setLessons(lessons.map(lesson => {
        if (lesson.id === lessonId) {
          return {
            ...lesson,
            files: lesson.files.filter(f => f.id !== fileId)
          };
        }
        return lesson;
      }));
      
      alert("File deleted successfully!");
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  const handleLessonInteraction = (action) => {
    // Teachers can always interact with their own courses
    if (isTeacher) {
      return true;
    }

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

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getLessonsByCategory = (categoryId) => {
    return lessons.filter((lesson) => lesson.category === categoryId);
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
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h1 className="card-title">{course.title}</h1>
                {isTeacher && (
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => setEditingCourse(!editingCourse)}
                  >
                    <i className="fas fa-edit me-1"></i>{editingCourse ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {editingCourse ? (
                <form onSubmit={handleUpdateCourse} className="mb-3">
                  <div className="mb-3">
                    <label className="form-label">Course Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={courseFormData.code}
                      onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={courseFormData.price}
                      onChange={(e) => setCourseFormData({ ...courseFormData, price: e.target.value })}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingCourse}
                    >
                      {submittingCourse ? "Updating..." : "Update Course"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingCourse(false)}
                      disabled={submittingCourse}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
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
                </>
              )}

              {!editingCourse && (
                <>
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
                </>
              )}

              <hr className="my-4" />

              {/* Lessons Section */}
              <div className="lessons-section">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Course Lessons</h5>
                  {isTeacher && (
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                      >
                        {showAddCategory ? "Cancel" : "+ Add Category"}
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowAddLesson(!showAddLesson)}
                      >
                        {showAddLesson ? "Cancel" : "+ Add Lesson"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Category Form */}
                {isTeacher && showAddCategory && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6>{editingCategoryId ? "Edit Category" : "Create New Category"}</h6>
                      <form onSubmit={handleAddCategory}>
                        <div className="mb-3">
                          <label className="form-label">Category Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={categoryFormData.title}
                            onChange={handleCategoryFormChange}
                            placeholder="e.g., Basic Concepts"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Description (Optional)</label>
                          <textarea
                            className="form-control"
                            name="description"
                            value={categoryFormData.description}
                            onChange={handleCategoryFormChange}
                            rows="3"
                            placeholder="Enter category description..."
                          ></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-success"
                            disabled={submittingCategory}
                          >
                            {submittingCategory ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}
                          </button>
                          {editingCategoryId && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setCategoryFormData({ title: "", description: "" });
                                setShowAddCategory(false);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Add Lesson Form */}
                {isTeacher && showAddLesson && (
                  <div className="card mb-3">
                    <div className="card-body">
                      <h6>{editingLessonId ? "Edit Lesson" : "Create New Lesson"}</h6>
                      <form onSubmit={handleAddLesson}>
                        <div className="mb-3">
                          <label className="form-label">Select Category (Optional)</label>
                          <select
                            className="form-control"
                            name="category"
                            value={lessonFormData.category || ""}
                            onChange={handleLessonFormChange}
                          >
                            <option value="">No Category</option>
                            {lessonCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.title}
                              </option>
                            ))}
                          </select>
                        </div>
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
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-success"
                            disabled={submittingLesson}
                          >
                            {submittingLesson ? "Saving..." : editingLessonId ? "Update Lesson" : "Add Lesson"}
                          </button>
                          {editingLessonId && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setEditingLessonId(null);
                                setLessonFormData({ title: "", content: "", video_url: "", category: null });
                                setShowAddLesson(false);
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
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
                      {/* Render lesson categories */}
                      {lessonCategories.map((category) => {
                        const categoryLessons = getLessonsByCategory(category.id);
                        const isExpanded = expandedCategories.has(category.id);

                        return (
                          <div key={category.id} className="lesson-category-section">
                            <div
                              className="lesson-category-header"
                              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            >
                              <div
                                onClick={() => toggleCategory(category.id)}
                                style={{ flex: 1, display: "flex", alignItems: "center" }}
                              >
                                <i
                                  className={`fas fa-chevron-${isExpanded ? "down" : "right"} me-2`}
                                ></i>
                                <h6 className="mb-0">{category.title}</h6>
                                <span className="badge bg-secondary ms-2">
                                  {categoryLessons.length}
                                </span>
                              </div>
                              {isTeacher && (
                                <div className="category-actions ms-2" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => handleEditCategory(category)}
                                    title="Edit category"
                                  >
                                    <i className="fas fa-edit me-1"></i>Edit
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    title="Delete category"
                                  >
                                    <i className="fas fa-trash me-1"></i>Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="lesson-category-content">
                                {categoryLessons.map((lesson) => (
                                  <div key={lesson.id} className="lesson-card">
                                    <div className="lesson-header">
                                      <input
                                        type="checkbox"
                                        className="lesson-checkbox"
                                        checked={
                                          isEnrolled &&
                                          completedLessons.has(lesson.id)
                                        }
                                        onChange={() =>
                                          handleLessonInteraction("checkbox") &&
                                          handleToggleLessonCompletion(lesson.id)
                                        }
                                        disabled={!isEnrolled && !isTeacher}
                                        title={
                                          isTeacher
                                            ? "Mark as complete"
                                            : !user
                                            ? "Login to mark lessons as complete"
                                            : !isEnrolled &&
                                              user?.role === "student"
                                            ? "Enroll to mark lessons as complete"
                                            : ""
                                        }
                                        style={{
                                          cursor: !isEnrolled && !isTeacher
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                      />
                                      <h6 className="lesson-title">
                                        {lesson.title}
                                        {isEnrolled &&
                                          completedLessons.has(lesson.id) && (
                                            <span className="badge bg-success ms-2">
                                              <i className="fas fa-check"></i>{" "}
                                              Completed
                                            </span>
                                          )}
                                      </h6>
                                    </div>
                                    <p className="lesson-content">
                                      {lesson.content}
                                    </p>

                                    {/* Lesson Files Section */}
                                    {lesson.files && lesson.files.length > 0 && (
                                      <div className="mb-2">
                                        <small className="text-muted d-block mb-2"><strong>📎 Files:</strong></small>
                                        <div className="lesson-files">
                                          {lesson.files.map((file) => (
                                            <div key={file.id} className="file-item mb-2">
                                              {isTeacher || isEnrolled ? (
                                                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                                                  <i className="fas fa-file-download me-1"></i>{file.title}
                                                </a>
                                              ) : (
                                                <button className="btn btn-sm btn-outline-secondary" disabled title="Enroll to download files">
                                                  <i className="fas fa-file-download me-1"></i>{file.title}
                                                </button>
                                              )}
                                              {isTeacher && (
                                                <div className="file-actions ms-2">
                                                  <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => handleEditFile(file, lesson.id)}
                                                    title="Edit file"
                                                  >
                                                    <i className="fas fa-edit me-1"></i>Edit
                                                  </button>
                                                  <button
                                                    className="btn btn-sm btn-outline-danger ms-1"
                                                    onClick={() => handleDeleteFile(file.id, lesson.id)}
                                                    title="Delete file"
                                                  >
                                                    <i className="fas fa-trash me-1"></i>Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Add File Form for Teachers */}
                                    {isTeacher && (
                                      <div className="mb-2">
                                        <button
                                          className="btn btn-sm btn-outline-info"
                                          onClick={() => {
                                            if (showAddFile[lesson.id] && editingFileId) {
                                              setEditingFileId(null);
                                              setFileFormData({ title: "", file_url: "", lesson: null });
                                            }
                                            setShowAddFile({ ...showAddFile, [lesson.id]: !showAddFile[lesson.id] });
                                          }}
                                        >
                                          {showAddFile[lesson.id] ? "Cancel" : "+ Add File"}
                                        </button>
                                        {showAddFile[lesson.id] && (
                                          <form onSubmit={(e) => handleAddFile(e, lesson.id)} className="mt-2">
                                            <div className="row">
                                              <div className="col-6">
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  placeholder="File Name"
                                                  value={fileFormData.title}
                                                  onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                                                  required
                                                />
                                              </div>
                                              <div className="col-6">
                                                <input
                                                  type="url"
                                                  className="form-control form-control-sm"
                                                  placeholder="File URL"
                                                  value={fileFormData.file_url}
                                                  onChange={(e) => setFileFormData({ ...fileFormData, file_url: e.target.value })}
                                                  required
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="submit"
                                              className="btn btn-sm btn-info mt-2"
                                              disabled={submittingFile}
                                            >
                                              {submittingFile ? (editingFileId ? "Updating..." : "Adding...") : (editingFileId ? "Update File" : "Add File")}
                                            </button>
                                          </form>
                                        )}
                                      </div>
                                    )}

                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
                                      <div>
                                        {lesson.video_url && (
                                          <div className="lesson-video">
                                            <button
                                              onClick={(e) =>
                                                handleLessonInteraction("video") &&
                                                handleWatchVideo(
                                                  e,
                                                  lesson.video_url
                                                )
                                              }
                                              className="btn btn-sm btn-info"
                                              disabled={(!isEnrolled && !isTeacher) || (!user && !isTeacher)}
                                              title={
                                                isTeacher
                                                  ? "Watch video"
                                                  : !user
                                                  ? "Login to watch video"
                                                  : !isEnrolled
                                                  ? "Enroll to watch video"
                                                  : ""
                                              }
                                            >
                                              <i className="fas fa-video"></i>{" "}
                                              Watch Video
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {isTeacher && (
                                        <div className="lesson-actions ms-2">
                                          <button
                                            className="btn btn-sm btn-outline-warning"
                                            onClick={() => handleEditLesson(lesson)}
                                            title="Edit lesson"
                                          >
                                            <i className="fas fa-edit me-1"></i>Edit
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            title="Delete lesson"
                                          >
                                            <i className="fas fa-trash me-1"></i>Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Quiz Section */}
                            <div className="mt-3 pt-3 border-top">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">Quizzes</h6>
                                {isTeacher && (
                                  <button
                                    className="btn btn-sm btn-info"
                                    onClick={() => setShowAddQuiz({ ...showAddQuiz, [category.id]: !showAddQuiz[category.id] })}
                                  >
                                    {showAddQuiz[category.id] ? "Cancel" : "+ Add Quiz"}
                                  </button>
                                )}
                              </div>

                              {isTeacher && showAddQuiz[category.id] && (
                                <form onSubmit={(e) => handleAddQuiz(e, category.id)} className="mb-3">
                                  <div className="mb-2">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Quiz Title"
                                      value={quizFormData.title}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="mb-2">
                                    <textarea
                                      className="form-control form-control-sm"
                                      placeholder="Quiz Description"
                                      rows="2"
                                      value={quizFormData.description}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                                    ></textarea>
                                  </div>
                                  <div className="row mb-2">
                                    <div className="col-6">
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="Total Marks"
                                        value={quizFormData.total_marks}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, total_marks: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="col-6">
                                      <input
                                        type="number"
                                        className="form-control form-control-sm"
                                        placeholder="Duration (mins)"
                                        value={quizFormData.duration}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, duration: e.target.value })}
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="d-flex gap-2">
                                    <button
                                      type="submit"
                                      className="btn btn-sm btn-success"
                                      disabled={submittingQuiz}
                                    >
                                      {submittingQuiz ? "Adding..." : "Add Quiz"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => {
                                        setShowAddQuiz({ ...showAddQuiz, [category.id]: false });
                                        setEditingQuizId(null);
                                        setQuizFormData({
                                          title: "",
                                          description: "",
                                          total_marks: "",
                                          duration: "",
                                          lesson_category: null,
                                        });
                                      }}
                                      disabled={submittingQuiz}
                                    >
                                      Cancel
                                      </button>
                                    </div>
                                  </form>
                                )}

                                {/* Display quizzes */}
                                {getQuizzesByCategory(category.id).map((quiz) => (
                                  <div key={quiz.id} className="alert alert-info mb-2" role="alert">
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1">📝 {quiz.title}</h6>
                                        <small>{quiz.description}</small>
                                        <div className="mt-1 small text-muted">
                                          Marks: {quiz.total_marks} | Duration: {quiz.duration} mins
                                        </div>
                                        {isEnrolled && (
                                          <button className="btn btn-sm btn-success mt-2">
                                            <i className="fas fa-play-circle me-1"></i>Take Quiz
                                          </button>
                                        )}
                                        {!isEnrolled && user && user.role === "student" && (
                                          <small className="d-block mt-2 text-warning">
                                            <i className="fas fa-info-circle"></i> Enroll to take this quiz
                                          </small>
                                        )}
                                        {!user && (
                                          <small className="d-block mt-2 text-warning">
                                            <i className="fas fa-info-circle"></i> Login to take this quiz
                                          </small>
                                        )}
                                      </div>
                                      {isTeacher && (
                                        <div className="quiz-actions ms-2">
                                          <button
                                            className="btn btn-sm btn-outline-warning"
                                            onClick={() => handleEditQuiz(quiz)}
                                            title="Edit quiz"
                                          >
                                            <i className="fas fa-edit me-1"></i>Edit
                                          </button>
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                            title="Delete quiz"
                                          >
                                            <i className="fas fa-trash me-1"></i>Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Render uncategorized lessons */}

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isTeacher && (
            <div className="card mt-3 border-danger">
              <div className="card-body">
                <h6 className="card-title text-danger">Danger Zone</h6>
                <p className="text-muted mb-3">
                  Once you delete a course, there is no going back. Please be certain.
                </p>
                <button
                  className="btn btn-lg btn-danger w-100"
                  onClick={handleDeleteCourse}
                >
                  <i className="fas fa-trash me-2"></i>Delete Course Permanently
                </button>
              </div>
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;
