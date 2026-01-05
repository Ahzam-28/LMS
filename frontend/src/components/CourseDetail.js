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
  const [expandedQuizzes, setExpandedQuizzes] = useState(new Set());
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [completedQuizzes, setCompletedQuizzes] = useState(new Set());
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
  const [quizQuestions, setQuizQuestions] = useState([]); // Questions for current quiz being created
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    marks: 1,
  });
  const [currentAnswers, setCurrentAnswers] = useState([]);
  const [currentAnswerText, setCurrentAnswerText] = useState("");
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState(false);
  const [quizResults, setQuizResults] = useState({});
  const [showAddFile, setShowAddFile] = useState({});
  const [editingFileId, setEditingFileId] = useState(null);
  const [fileFormData, setFileFormData] = useState({
    title: "",
    file_url: "",
    lesson: null,
  });
  const [submittingFile, setSubmittingFile] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
    easypaisaNumber: "",
    bankAccountNumber: "",
    bankAccountHolder: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    const handleFocus = () => {
    
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedCompletedLessons = localStorage.getItem(`completedLessons_${id}`);
    if (savedCompletedLessons) {
      setCompletedLessons(new Set(JSON.parse(savedCompletedLessons)));
    }
    
    const savedCompletedQuizzes = localStorage.getItem(`completedQuizzes_${id}`);
    if (savedCompletedQuizzes) {
      setCompletedQuizzes(new Set(JSON.parse(savedCompletedQuizzes)));
    }

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
        
        if (response.data.teacher_details) {
          setTeacher(response.data.teacher_details);
        }

        const lessonsResponse = await API.get(`/lesson/?course=${id}`);
        setLessons(lessonsResponse.data);

        const categoriesResponse = await API.get(`/lesson-category/?course=${id}`);
        setLessonCategories(categoriesResponse.data);

        const quizzesResponse = await API.get(`/quiz/`);
        
        const categoryIds = categoriesResponse.data.map(cat => cat.id);
        const courseQuizzes = quizzesResponse.data.filter(quiz => 
          categoryIds.includes(quiz.lesson_category)
        );
        setQuizzes(courseQuizzes);
        
        if (user && user.role === "student") {
          try {
            const resultsResponse = await API.get(`/result/`);
            const resultsMap = {};
            resultsResponse.data.forEach(result => {
              resultsMap[result.quiz] = result;
            });
            setQuizResults(resultsMap);
          } catch (err) {
          }
        }
        
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError("Failed to load course details");
      }
    };

    fetchCourse();
  }, [id]);

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
        }
      };
      checkEnrollment();
    }
  }, [user, course]);

  useEffect(() => {
    if (user?.role === "student" && quizzes.length > 0) {
      const fetchResults = async () => {
        try {
          const resultsResponse = await API.get(`/result/`);
          const resultsMap = {};
          resultsResponse.data.forEach(result => {
            resultsMap[result.quiz] = result;
          });
          setQuizResults(resultsMap);
        } catch (err) {
        }
      };
      fetchResults();
    }
  }, [user, quizzes, refreshTrigger]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      setError("Only students can enroll in courses");
      return;
    }

    if (course && course.price > 0) {
      setShowPaymentModal(true);
    } else {
 
      await enrollCourse();
    }
  };

  const enrollCourse = async () => {
    setEnrolling(true);
    try {
      const response = await API.post("/enrollment/enroll_course/", {
        course_id: id,
        status: "active",
      });
      setIsEnrolled(true);
      setError(null);
      setShowPaymentModal(false);
    
      setOtpSent(false);
      setOtpCode("");
      setOtpVerified(false);
      setPaymentDetails({
        cardNumber: "",
        cardHolder: "",
        expiry: "",
        cvv: "",
        easypaisaNumber: "",
        bankAccountNumber: "",
        bankAccountHolder: ""
      });
      alert("Successfully enrolled in the course!");
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Failed to enroll. Please try again."
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!user || !course) {
      alert("Missing user or course information");
      return;
    }

    setPaymentProcessing(true);
    try {

      const paymentResponse = await API.post("/payment/", {
        course: course.id,
        amount: parseFloat(course.price),
        payment_status: "completed",
      });
      
      await enrollCourse();
    } catch (error) {
      setError(
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message ||
          "Payment processing failed. Please try again."
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSendOTP = async () => {
    if (!paymentDetails.easypaisaNumber) {
      setError("Please enter Easypaisa number");
      return;
    }

    if (!user?.email) {
      setError("Email address not found. Please update your profile.");
      return;
    }

    try {
      const response = await API.post("/otp/send_otp/", {
        phone_number: paymentDetails.easypaisaNumber,
        email: user.email
      });

      if (response.data.success) {
        setOtpSent(true);
        setError(null);
        alert("OTP sent to your email!");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      setError("Please enter OTP code");
      return;
    }

    setOtpVerifying(true);
    try {
      const response = await API.post("/otp/verify_otp/", {
        phone_number: paymentDetails.easypaisaNumber,
        otp_code: otpCode
      });

      if (response.data.success) {
        setOtpVerified(true);
        setError(null);
        alert("OTP verified successfully!");
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
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
       
        await API.patch(`/lesson/${editingLessonId}/`, payload);
        setLessons(
          lessons.map((lesson) =>
            lesson.id === editingLessonId ? { ...lesson, ...payload } : lesson
          )
        );
        setEditingLessonId(null);
        alert("Lesson updated successfully!");
      } else {
     
        payload.course = parseInt(id);
        const response = await API.post("/lesson/", payload);
        setLessons([...lessons, response.data]);
        alert("Lesson added successfully!");
      }
      
      setLessonFormData({ title: "", content: "", video_url: "", category: null });
      setShowAddLesson(false);
    } catch (error) {
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
      
        await API.patch(`/lesson-category/${editingCategoryId}/`, payload);
        setLessonCategories(
          lessonCategories.map((cat) =>
            cat.id === editingCategoryId ? { ...cat, ...payload } : cat
          )
        );
        setEditingCategoryId(null);
        alert("Category updated successfully!");
      } else {
    
        payload.course = parseInt(id);
        const response = await API.post("/lesson-category/", payload);
        setLessonCategories([...lessonCategories, response.data]);
        alert("Category created successfully!");
      }
      
      setCategoryFormData({ title: "", description: "" });
      setShowAddCategory(false);
    } catch (error) {
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
      
      const lessonsToRemove = lessons.filter((lesson) => lesson.category === categoryId);
      const updatedLessons = lessons.filter((lesson) => lesson.category !== categoryId);
      setLessons(updatedLessons);
      
      const newCompleted = new Set(completedLessons);
      lessonsToRemove.forEach((lesson) => newCompleted.delete(lesson.id));
      setCompletedLessons(newCompleted);
      
      alert("Category deleted successfully!");
    } catch (error) {
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
      
      const newCompleted = new Set(completedLessons);
      newCompleted.delete(lessonId);
      setCompletedLessons(newCompleted);
      
      alert("Lesson deleted successfully!");
    } catch (error) {
      alert("Failed to delete lesson. Please try again.");
    }
  };

  const handleToggleLessonCompletion = (lessonId) => {
  
    if (!user) {
      navigate("/login");
      return;
    }

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
  
    localStorage.setItem(`completedLessons_${id}`, JSON.stringify(Array.from(newCompleted)));
  };

  const handleToggleQuizCompletion = (quizId) => {
  
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "student" && !isEnrolled) {
      alert("You must be enrolled in this course to complete quizzes");
      return;
    }

    const newCompleted = new Set(completedQuizzes);
    if (newCompleted.has(quizId)) {
      newCompleted.delete(quizId);
    } else {
      newCompleted.add(quizId);
    }
    setCompletedQuizzes(newCompleted);
  
    localStorage.setItem(`completedQuizzes_${id}`, JSON.stringify(Array.from(newCompleted)));
  };

  const handleWatchVideo = (e, videoUrl) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "student" && !isEnrolled) {
      const shouldEnroll = window.confirm(
        "You need to enroll in this course first to watch videos. Would you like to enroll now?"
      );
      if (shouldEnroll) {
        handleEnroll();
      }
      return;
    }

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
      alert("Failed to delete course. Please try again.");
    }
  };

  const handleAddQuiz = async (e, categoryId) => {
    e.preventDefault();
    if (!quizFormData.title || !quizFormData.total_marks || !quizFormData.duration) {
      alert("Please fill in all required fields");
      return;
    }

    if (quizQuestions.length === 0) {
      alert("Please add at least one question to the quiz");
      return;
    }

    const totalQuestionMarks = quizQuestions.reduce((sum, q) => sum + q.marks, 0);
    if (totalQuestionMarks > parseInt(quizFormData.total_marks)) {
      alert(`Total question marks (${totalQuestionMarks}) cannot exceed quiz total marks (${quizFormData.total_marks})`);
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

      let quizId;
      if (editingQuizId) {
        await API.patch(`/quiz/${editingQuizId}/`, payload);
        setQuizzes(quizzes.map(q => q.id === editingQuizId ? {...q, ...payload} : q));
        quizId = editingQuizId;
        setEditingQuizId(null);
      } else {
        const response = await API.post("/quiz/", payload);
        setQuizzes([...quizzes, response.data]);
        quizId = response.data.id;
      }

      for (const question of quizQuestions) {
        try {
          const questionPayload = {
            quiz: quizId,
            text: question.text,
            marks: question.marks,
          };
          const questionResponse = await API.post("/question/", questionPayload);
          const questionId = questionResponse.data.id;

          for (const answer of question.answers) {
            const answerPayload = {
              question: questionId,
              text: answer.text,
              is_correct: answer.is_correct,
            };
            await API.post("/answer/", answerPayload);
          }
        } catch (error) {
          throw new Error("Failed to save questions and answers");
        }
      }

      alert("Quiz with questions added successfully!");

      setQuizFormData({
        title: "",
        description: "",
        total_marks: "",
        duration: "",
        lesson_category: null,
      });
      setQuizQuestions([]);
      setCurrentQuestion({ text: "", marks: 1 });
      setCurrentAnswers([]);
      setCurrentAnswerText("");
      setCurrentAnswerCorrect(false);
      setShowAddQuiz({});
    } catch (error) {
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
      
      const newCompleted = new Set(completedQuizzes);
      newCompleted.delete(quizId);
      setCompletedQuizzes(newCompleted);
      
      alert("Quiz deleted successfully!");
    } catch (error) {
      alert("Failed to delete quiz. Please try again.");
    }
  };

  const getQuizzesByCategory = (categoryId) => {
    return quizzes.filter((quiz) => quiz.lesson_category === categoryId);
  };

  const handleAddAnswer = () => {
    if (!currentAnswerText.trim()) {
      alert("Please enter answer text");
      return;
    }
    
    let newAnswers = currentAnswers.map(a => ({ ...a, is_correct: false }));
    newAnswers.push({
      id: Date.now(), 
      text: currentAnswerText,
      is_correct: currentAnswerCorrect,
    });
    
    setCurrentAnswers(newAnswers);
    setCurrentAnswerText("");
    setCurrentAnswerCorrect(false);
  };

  const handleRemoveAnswer = (answerId) => {
    setCurrentAnswers(currentAnswers.filter(a => a.id !== answerId));
  };

  const handleToggleCorrectAnswer = (answerId) => {
    setCurrentAnswers(currentAnswers.map(a => ({
      ...a,
      is_correct: a.id === answerId ? true : false,
    })));
  };

  const handleAddQuestionToQuiz = () => {
    if (!currentQuestion.text.trim()) {
      alert("Please enter question text");
      return;
    }
    
    if (currentAnswers.length === 0) {
      alert("Please add at least one answer");
      return;
    }
    
    if (!currentAnswers.some(a => a.is_correct)) {
      alert("Please mark at least one answer as correct");
      return;
    }
    
    setQuizQuestions([
      ...quizQuestions,
      {
        id: Date.now(),
        text: currentQuestion.text,
        marks: currentQuestion.marks,
        answers: currentAnswers,
      }
    ]);
    
    setCurrentQuestion({ text: "", marks: 1 });
    setCurrentAnswers([]);
    setCurrentAnswerText("");
    setCurrentAnswerCorrect(false);
  };

  const handleRemoveQuestionFromQuiz = (questionId) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
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
      alert("Failed to delete file. Please try again.");
    }
  };

  const handleLessonInteraction = (action) => {
    
    if (isTeacher) {
      return true;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "student" && !isEnrolled) {
      alert("You must be enrolled in this course to interact with lessons");
      return;
    }

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

  const toggleQuizzes = (categoryId) => {
    const newExpanded = new Set(expandedQuizzes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedQuizzes(newExpanded);
  };

  const getLessonsByCategory = (categoryId) => {
    return lessons.filter((lesson) => lesson.category === categoryId);
  };

  const isTeacher = user && user.role === "teacher" && user.profile?.id === teacher?.id;

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="loading-spinner" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-container">
        <div className="alert-box alert-danger" role="alert">
          Course not found.
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="course-detail-container course-detail">
      <button
        className="btn-outline-secondary"
        onClick={() => navigate("/courses")}
      >
        â† Back to Courses
      </button>

      <div className="course-detail-row">
        <div className="course-detail-col-main">
          <div className="custom-card">
            <div className="custom-card-body">
              <div className="flex-between">
                <h1>{course.title}</h1>
                {isTeacher && (
                  <button
                    className="btn-warning btn-sm"
                    onClick={() => setEditingCourse(!editingCourse)}
                  >
                    <i className="fas fa-edit"></i>{editingCourse ? "Cancel" : "Edit"}
                  </button>
                )}
              </div>

              {editingCourse ? (
                <form onSubmit={handleUpdateCourse} className="">
                  <div className="">
                    <label className="input-label">Course Title</label>
                    <input
                      type="text"
                      className="input-field"
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="">
                    <label className="input-label">Course Code</label>
                    <input
                      type="text"
                      className="input-field"
                      value={courseFormData.code}
                      onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="">
                    <label className="input-label">Price</label>
                    <input
                      type="number"
                      className="input-field"
                      value={courseFormData.price}
                      onChange={(e) => setCourseFormData({ ...courseFormData, price: e.target.value })}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="">
                    <label className="input-label">Description</label>
                    <textarea
                      className="input-field"
                      rows="4"
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="flex-container flex-gap-2">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submittingCourse}
                    >
                      {submittingCourse ? "Updating..." : "Update Course"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditingCourse(false)}
                      disabled={submittingCourse}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="course-meta">
                    <strong>Course Code:</strong> {course.code}
                  </p>
                  <p className="course-meta">
                    <strong>Students Enrolled:</strong>{" "}
                    <span className="badge badge-info">
                      ðŸ‘¥ {course.enrollment_count} {course.enrollment_count === 1 ? "Student" : "Students"}
                    </span>
                  </p>

                  {}
                  {isEnrolled && (
                    <div className="progress-section">
                      {(() => {
                        const totalLessons = lessons.length;
                        const totalQuizzes = quizzes.length;
                        const totalItems = totalLessons + totalQuizzes;
                        
                        let completedItems = 0;
                        lessons.forEach(lesson => {
                          if (completedLessons.has(lesson.id)) {
                            completedItems++;
                          }
                        });
                        quizzes.forEach(quiz => {
                          if (completedQuizzes.has(quiz.id)) {
                            completedItems++;
                          }
                        });
                        
                        const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
                        
                        return (
                          <>
                            <div className="flex-between">
                              <strong>Course Progress</strong>
                              <span className="badge badge-primary">
                                {completedItems} / {totalItems} Items ({totalLessons} Lessons, {totalQuizzes} Quizzes)
                              </span>
                            </div>
                            <div className="progress-bar-container" style={{ height: "30px" }}>
                              <div
                                className="progress-bar-fill"
                                role="progressbar"
                                style={{
                                  width: `${progressPercentage}%`,
                                  transition: "width 0.3s ease",
                                }}
                                aria-valuenow={completedItems}
                                aria-valuemin="0"
                                aria-valuemax={totalItems}
                              >
                                {totalItems > 0 && progressPercentage > 5 && (
                                  <span style={{ color: "#000000", fontSize: "0.85rem", fontWeight: "600", marginLeft: "5px" }}>
                                    {Math.round(progressPercentage)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            {totalItems === 0 && (
                              <p className="file-label">No lessons or quizzes yet</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

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
                    <p className="course-meta">No instructor information available</p>
                  )}

                  <h5 className="mt-4">Course Category</h5>
                  <p>{course.category_details?.title || "N/A"}</p>
                </>
              )}

              <hr className="my-4" />

              {}
              <div className="lessons-section">
                <div className="flex-between">
                  <h5>Course Lessons</h5>
                  {isTeacher && (
                    <div className="flex-container flex-gap-2" role="group">
                      <button
                        className="btn-secondary"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                      >
                        {showAddCategory ? "Cancel" : "+ Add Category"}
                      </button>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => setShowAddLesson(!showAddLesson)}
                      >
                        {showAddLesson ? "Cancel" : "+ Add Lesson"}
                      </button>
                    </div>
                  )}
                </div>

                {}
                {isTeacher && showAddCategory && (
                  <div className="card">
                    <div className="custom-card-body">
                      <h6>{editingCategoryId ? "Edit Category" : "Create New Category"}</h6>
                      <form onSubmit={handleAddCategory}>
                        <div className="">
                          <label className="input-label">Category Title *</label>
                          <input
                            type="text"
                            className="input-field"
                            name="title"
                            value={categoryFormData.title}
                            onChange={handleCategoryFormChange}
                            placeholder="e.g., Basic Concepts"
                            required
                          />
                        </div>
                        <div className="">
                          <label className="input-label">Description (Optional)</label>
                          <textarea
                            className="input-field"
                            name="description"
                            value={categoryFormData.description}
                            onChange={handleCategoryFormChange}
                            rows="3"
                            placeholder="Enter category description..."
                          ></textarea>
                        </div>
                        <div className="flex-container flex-gap-2">
                          <button
                            type="submit"
                            className="btn-success"
                            disabled={submittingCategory}
                          >
                            {submittingCategory ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}
                          </button>
                          {editingCategoryId && (
                            <button
                              type="button"
                              className="btn-secondary"
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

                {}
                {isTeacher && showAddLesson && (
                  <div className="card">
                    <div className="custom-card-body">
                      <h6>{editingLessonId ? "Edit Lesson" : "Create New Lesson"}</h6>
                      <form onSubmit={handleAddLesson}>
                        <div className="">
                          <label className="input-label">Select Category (Optional)</label>
                          <select
                            className="input-field"
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
                        <div className="">
                          <label className="input-label">Lesson Title *</label>
                          <input
                            type="text"
                            className="input-field"
                            name="title"
                            value={lessonFormData.title}
                            onChange={handleLessonFormChange}
                            placeholder="e.g., Introduction to Variables"
                            required
                          />
                        </div>
                        <div className="">
                          <label className="input-label">Lesson Content *</label>
                          <textarea
                            className="input-field"
                            name="content"
                            value={lessonFormData.content}
                            onChange={handleLessonFormChange}
                            rows="4"
                            placeholder="Enter lesson content..."
                            required
                          ></textarea>
                        </div>
                        <div className="">
                          <label className="input-label">Video URL (Optional)</label>
                          <input
                            type="url"
                            className="input-field"
                            name="video_url"
                            value={lessonFormData.video_url}
                            onChange={handleLessonFormChange}
                            placeholder="https://example.com/video"
                          />
                        </div>
                        <div className="flex-container flex-gap-2">
                          <button
                            type="submit"
                            className="btn-success"
                            disabled={submittingLesson}
                          >
                            {submittingLesson ? "Saving..." : editingLessonId ? "Update Lesson" : "Add Lesson"}
                          </button>
                          {editingLessonId && (
                            <button
                              type="button"
                              className="btn-secondary"
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

                {}
                {user && user.role === "student" && !isEnrolled && lessons.length > 0 && (
                  <div className="alert-box alert-info" role="alert">
                    <i className="fas fa-info-circle"></i> <strong>Enroll in this course to view lessons</strong>
                  </div>
                )}

                {}
                {lessons.length === 0 ? (
                  <p className="course-meta">
                    {isTeacher
                      ? "No lessons yet. Add your first lesson!"
                      : "No lessons available for this course."}
                  </p>
                ) : (
                  <>
                    {!user && (
                      <div className="alert-box alert-warning" role="alert">
                        <i className="fas fa-lock"></i> <strong>Log in to interact with lessons</strong>
                      </div>
                    )}
                    <div className="lessons-list">
                      {}
                      {lessonCategories
                        .filter((category) => {
                          const categoryLessons = getLessonsByCategory(category.id);
                          
                          return isTeacher || categoryLessons.length > 0;
                        })
                        .map((category) => {
                        const categoryLessons = getLessonsByCategory(category.id);
                        const isExpanded = expandedCategories.has(category.id);

                        return (
                          <div key={category.id} className="lesson-category-section">
                            <div className="lesson-category-header">
                              <div style={{ flex: 1 }}>
                                <h6 className="mb-0">{category.title}</h6>
                                <small className="course-meta">{category.description}</small>
                              </div>
                              {isTeacher && (
                                <div className="category-actions">
                                  <button
                                    className="btn-outline-warning btn-sm"
                                    onClick={() => handleEditCategory(category)}
                                    title="Edit category"
                                  >
                                    <i className="fas fa-edit"></i>Edit
                                  </button>
                                  <button
                                    className="btn-outline-danger btn-sm"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    title="Delete category"
                                  >
                                    <i className="fas fa-trash"></i>Delete
                                  </button>
                                </div>
                              )}
                              <button
                                className={`btn btn-sm ${isExpanded ? "btn-info" : "btn-outline-info"} ms-2`}
                                onClick={() => toggleCategory(category.id)}
                                title={isExpanded ? "Hide category" : "Show category"}
                              >
                                <i className={`fas fa-chevron-${isExpanded ? "up" : "down"} me-1`}></i>
                                {isExpanded ? "Hide" : "Show"}
                              </button>
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
                                            <span className="badge badge-success">
                                              <i className="fas fa-check"></i>{" "}
                                              Completed
                                            </span>
                                          )}
                                      </h6>
                                    </div>
                                    <p className="lesson-content">
                                      {lesson.content}
                                    </p>

                                    {}
                                    {lesson.files && lesson.files.length > 0 && (
                                      <div className="mb-2">
                                        <small className="file-label"><strong>ðŸ“Ž Files:</strong></small>
                                        <div className="lesson-files">
                                          {lesson.files.map((file) => (
                                            <div key={file.id} className="file-item">
                                              {isTeacher || isEnrolled ? (
                                                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="btn-outline-secondary">
                                                  <i className="fas fa-file-download"></i>{file.title}
                                                </a>
                                              ) : (
                                                <button className="btn-outline-secondary" disabled title="Enroll to download files">
                                                  <i className="fas fa-file-download"></i>{file.title}
                                                </button>
                                              )}
                                              {isTeacher && (
                                                <div className="file-actions">
                                                  <button
                                                    className="btn-outline-warning btn-sm"
                                                    onClick={() => handleEditFile(file, lesson.id)}
                                                    title="Edit file"
                                                  >
                                                    <i className="fas fa-edit"></i>Edit
                                                  </button>
                                                  <button
                                                    className="btn-outline-danger"
                                                    onClick={() => handleDeleteFile(file.id, lesson.id)}
                                                    title="Delete file"
                                                  >
                                                    <i className="fas fa-trash"></i>Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {}
                                    {isTeacher && (
                                      <div className="mb-2">
                                        <button
                                          className="btn-outline-info btn-sm"
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
                                            <div className="course-detail-row">
                                              <div className="col-half">
                                                <input
                                                  type="text"
                                                  className="input-field input-sm"
                                                  placeholder="File Name"
                                                  value={fileFormData.title}
                                                  onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                                                  required
                                                />
                                              </div>
                                              <div className="col-half">
                                                <input
                                                  type="url"
                                                  className="input-field input-sm"
                                                  placeholder="File URL"
                                                  value={fileFormData.file_url}
                                                  onChange={(e) => setFileFormData({ ...fileFormData, file_url: e.target.value })}
                                                  required
                                                />
                                              </div>
                                            </div>
                                            <button
                                              type="submit"
                                              className="btn-info"
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
                                              className="btn-info"
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
                                        <div className="lesson-actions">
                                          <button
                                            className="btn-outline-warning btn-sm"
                                            onClick={() => handleEditLesson(lesson)}
                                            title="Edit lesson"
                                          >
                                            <i className="fas fa-edit"></i>Edit
                                          </button>
                                          <button
                                            className="btn-outline-danger btn-sm"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            title="Delete lesson"
                                          >
                                            <i className="fas fa-trash"></i>Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {}
                            <div className="mt-3 pt-3">
                              <div className="flex-between">
                                <h6 className="mb-0">Quizzes</h6>
                                <div className="flex-container flex-gap-2">
                                  {isTeacher && (
                                    <button
                                      className="btn-success"
                                      onClick={() => setShowAddQuiz({ ...showAddQuiz, [category.id]: !showAddQuiz[category.id] })}
                                    >
                                      {showAddQuiz[category.id] ? "Cancel" : "+ Add Quiz"}
                                    </button>
                                  )}
                                  {getQuizzesByCategory(category.id).length > 0 && (
                                    <button
                                      className={`btn btn-sm ${expandedQuizzes.has(category.id) ? "btn-info" : "btn-outline-info"}`}
                                      onClick={() => toggleQuizzes(category.id)}
                                    >
                                      <i className={`fas fa-chevron-${expandedQuizzes.has(category.id) ? "up" : "down"} me-1`}></i>
                                      {expandedQuizzes.has(category.id) ? "Hide" : "Show"} Quizzes
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isTeacher && showAddQuiz[category.id] && (
                                <form onSubmit={(e) => handleAddQuiz(e, category.id)} className="">
                                  <div className="mb-2">
                                    <input
                                      type="text"
                                      className="input-field input-sm"
                                      placeholder="Quiz Title"
                                      value={quizFormData.title}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="mb-2">
                                    <textarea
                                      className="input-field input-sm"
                                      placeholder="Quiz Description"
                                      rows="2"
                                      value={quizFormData.description}
                                      onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                                    ></textarea>
                                  </div>
                                  <div className="course-detail-row">
                                    <div className="col-half">
                                      <input
                                        type="number"
                                        className="input-field input-sm"
                                        placeholder="Total Marks"
                                        value={quizFormData.total_marks}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, total_marks: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="col-half">
                                      <input
                                        type="number"
                                        className="input-field input-sm"
                                        placeholder="Duration (mins)"
                                        value={quizFormData.duration}
                                        onChange={(e) => setQuizFormData({ ...quizFormData, duration: e.target.value })}
                                        required
                                      />
                                    </div>
                                  </div>

                                  {}
                                  <div className="custom-box p-2 mb-3">
                                    <h6 className="mb-2">Questions ({quizQuestions.length})</h6>
                                    
                                    {}
                                    <div className="mb-3 p-2 bg-white border rounded">
                                      <div className="mb-2">
                                        <label className="input-label">Question Text</label>
                                        <textarea
                                          className="input-field input-sm"
                                          placeholder="Enter question text"
                                          rows="2"
                                          value={currentQuestion.text}
                                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                        ></textarea>
                                      </div>
                                      <div className="mb-2">
                                        <label className="input-label">Marks</label>
                                        <input
                                          type="number"
                                          min="1"
                                          className="input-field input-sm"
                                          value={currentQuestion.marks}
                                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) || 1 })}
                                        />
                                      </div>

                                      {}
                                      <div className="mb-2">
                                        <label className="input-label">Answers</label>
                                        {currentAnswers.map((answer, idx) => (
                                          <div key={answer.id} className="d-flex gap-2 mb-2 align-items-center">
                                            <input
                                              type="checkbox"
                                              checked={answer.is_correct}
                                              onChange={() => handleToggleCorrectAnswer(answer.id)}
                                              title="Mark as correct answer"
                                            />
                                            <span className="flex-grow-1">{answer.text}</span>
                                            <button
                                              type="button"
                                              className="btn-outline-danger btn-sm"
                                              onClick={() => handleRemoveAnswer(answer.id)}
                                              title="Delete this answer"
                                            >
                                              <i className="fas fa-trash"></i>Delete
                                            </button>
                                          </div>
                                        ))}
                                        <div className="flex-container flex-gap-2">
                                          <input
                                            type="text"
                                            className="input-field input-sm"
                                            placeholder="Answer text"
                                            value={currentAnswerText}
                                            onChange={(e) => setCurrentAnswerText(e.target.value)}
                                          />
                                          <button
                                            type="button"
                                            className="btn-outline-primary"
                                            onClick={handleAddAnswer}
                                          >
                                            Add
                                          </button>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        className="btn-primary btn-sm"
                                        onClick={handleAddQuestionToQuiz}
                                      >
                                        Add Question to Quiz
                                      </button>
                                    </div>

                                    {}
                                    {quizQuestions.length > 0 && (
                                      <div>
                                        {quizQuestions.map((question, idx) => (
                                          <div key={question.id} className="mb-2 p-2 bg-white border rounded">
                                            <div className="flex-between">
                                              <div className="flex-grow-1">
                                                <div className="mb-1">
                                                  <strong>Q{idx + 1}:</strong> {question.text}
                                                  <span className="badge badge-info">{question.marks} marks</span>
                                                </div>
                                                <div className="course-meta">
                                                  {question.answers.length} answers
                                                  {question.answers.some(a => a.is_correct) && (
                                                    <span className="badge badge-success">Correct answer set</span>
                                                  )}
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn-outline-danger btn-sm"
                                                onClick={() => handleRemoveQuestionFromQuiz(question.id)}
                                                title="Delete this question"
                                              >
                                                <i className="fas fa-trash"></i>Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-container flex-gap-2">
                                    <button
                                      type="submit"
                                      className="btn-success"
                                      disabled={submittingQuiz}
                                    >
                                      {submittingQuiz ? "Adding..." : "Add Quiz"}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-secondary"
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
                                        setQuizQuestions([]);
                                        setCurrentQuestion({ text: "", marks: 1 });
                                        setCurrentAnswers([]);
                                        setCurrentAnswerText("");
                                        setCurrentAnswerCorrect(false);
                                      }}
                                      disabled={submittingQuiz}
                                    >
                                      Cancel
                                      </button>
                                    </div>
                                  </form>
                                )}

                                {}
                                {expandedQuizzes.has(category.id) && getQuizzesByCategory(category.id).map((quiz) => (
                                  <div key={quiz.id} className="alert-box alert-info" role="alert">
                                    <div className="flex-between">
                                      <div className="flex-grow-1">
                                        <div className="quiz-header">
                                          <input
                                            type="checkbox"
                                            className="quiz-checkbox"
                                            checked={completedQuizzes.has(quiz.id)}
                                            onChange={() => handleToggleQuizCompletion(quiz.id)}
                                            disabled={!isEnrolled && user?.role === "student"}
                                            title={
                                              !isEnrolled && user?.role === "student"
                                                ? "Enroll to mark quizzes as complete"
                                                : isEnrolled || isTeacher
                                                ? "Mark as complete"
                                                : !user
                                                ? "Login to mark quizzes as complete"
                                                : ""
                                            }
                                            style={{
                                              cursor: isEnrolled || isTeacher || !user ? "pointer" : "not-allowed",
                                            }}
                                          />
                                          <h6 className="quiz-title">
                                            ðŸ“ {quiz.title}
                                            {isEnrolled && completedQuizzes.has(quiz.id) && (
                                              <span className="badge badge-success">
                                                <i className="fas fa-check"></i> Completed
                                              </span>
                                            )}
                                          </h6>
                                        </div>
                                        <small>{quiz.description}</small>
                                        <div className="mt-1">
                                          Marks: {quiz.total_marks} | Duration: {quiz.duration} mins
                                        </div>
                                        {quizResults[quiz.id] && (
                                          <div className="mt-2 p-2 bg-light rounded">
                                            <div className="mb-1">
                                              <strong>Score:</strong> {quizResults[quiz.id].score}/{quiz.total_marks} marks
                                            </div>
                                            <div>
                                              <strong>Grade:</strong>
                                              <span className={`badge ms-2 ${
                                                quizResults[quiz.id].grade_awarded === 'A' ? 'bg-success' :
                                                quizResults[quiz.id].grade_awarded === 'B' ? 'bg-info' :
                                                quizResults[quiz.id].grade_awarded === 'C' ? 'bg-warning' :
                                                quizResults[quiz.id].grade_awarded === 'D' ? 'bg-warning text-dark' :
                                                'bg-danger'
                                              }`}>
                                                {quizResults[quiz.id].grade_awarded}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {isEnrolled && (
                                          <button 
                                            className="btn-success"
                                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                                          >
                                            <i className="fas fa-play-circle"></i>Take Quiz
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
                                        <div className="quiz-actions">
                                          <button
                                            className="btn-outline-warning btn-sm"
                                            onClick={() => handleEditQuiz(quiz)}
                                            title="Edit quiz"
                                          >
                                            <i className="fas fa-edit"></i>Edit
                                          </button>
                                          <button
                                            className="btn-outline-danger btn-sm"
                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                            title="Delete quiz"
                                          >
                                            <i className="fas fa-trash"></i>Delete
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

                      {}

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isTeacher && (
            <div className="card mt-3 border-danger">
              <div className="custom-card-body">
                <h6 className="card-title text-danger">Danger Zone</h6>
                <p className="course-meta">
                  Once you delete a course, there is no going back. Please be certain.
                </p>
                <button
                  className="btn-lg btn-danger w-100"
                  onClick={handleDeleteCourse}
                >
                  <i className="fas fa-trash me-2"></i>Delete Course Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="course-detail-col-sidebar">
        <div className="custom-card">
            <div className="custom-card-body">
              <h5 >Enrollment</h5>

              {error && (
                <div className="alert-danger alert-dismissible fade show" role="alert">
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
                  <p className="">
                    <strong>Role:</strong> {user.role}
                  </p>

                  {user.role === "student" ? (
                    <>
                      {isEnrolled ? (
                        <>
                          <div className="alert-success" role="alert">
                            âœ“ You are enrolled in this course
                          </div>
                          <button
                            className="btn-danger w-100"
                            onClick={handleUnenroll}
                            disabled={enrolling}
                          >
                            {enrolling ? "Unenrolling..." : "Unenroll"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-success w-100"
                            onClick={handleEnroll}
                            disabled={enrolling}
                          >
                            {enrolling ? "Enrolling..." : "Enroll Now"}
                          </button>
                          <p className="mt-2">
                            <small>Price: PKR {parseFloat(course.price).toFixed(2)}</small>
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="alert-box alert-info" role="alert">
                      Only students can enroll in courses.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="btn-success w-100"
                    onClick={() => navigate("/login")}
                  >
                    Enroll Now
                  </button>
                  <p className="mt-3">
                    <small>Please log in to enroll in this course</small>
                  </p>
                </>
              )}
            </div>
          </div>
      </div>

      {}
      <div className="feedback-section mt-5 py-5">
        <div className="container">
          <div className="feedback-card">
            <div className="feedback-icon">
              <i className="fas fa-comments"></i>
            </div>
            <h3>Course Feedback</h3>
            <p>Share your learning experience and help us improve</p>
            <span className="badge-coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>

      {}
      {showPaymentModal && course && (
        <div className="custom-modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <div className="">
                  <h6>Course: {course.title}</h6>
                  <p className="course-meta">{course.description}</p>
                </div>
                
                <div className="">
                  <div className="flex-between">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong className="text-success" style={{ fontSize: "1.5rem" }}>
                      PKR {parseFloat(course.price).toFixed(2)}
                    </strong></span>
                  </div>
                </div>

                <div className="">
                  <label className="input-label"><strong>Payment Method</strong></label>
                  <div className="custom-checkbox">
                    <input
                      className="custom-checkbox-input"
                      type="radio"
                      name="paymentMethod"
                      id="creditCard"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={paymentProcessing}
                    />
                    <label className="custom-checkbox-label" htmlFor="creditCard">
                      Credit/Debit Card
                    </label>
                  </div>
                  <div className="custom-checkbox">
                    <input
                      className="custom-checkbox-input"
                      type="radio"
                      name="paymentMethod"
                      id="easypaisa"
                      value="easypaisa"
                      checked={paymentMethod === "easypaisa"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={paymentProcessing}
                    />
                    <label className="custom-checkbox-label" htmlFor="easypaisa">
                      Easypaisa
                    </label>
                  </div>
                  <div className="custom-checkbox">
                    <input
                      className="custom-checkbox-input"
                      type="radio"
                      name="paymentMethod"
                      id="bank"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={paymentProcessing}
                    />
                    <label className="custom-checkbox-label" htmlFor="bank">
                      Bank Transfer
                    </label>
                  </div>
                </div>

                {}
                {paymentMethod === "credit_card" && (
                  <div className="mb-3 p-4 text-center bg-light rounded border-2" style={{borderColor: '#ffc107'}}>
                    <h5 className="mb-2">ðŸš€ Coming Soon</h5>
                    <p className="course-meta">Credit Card payment will be available soon. Please use Easypaisa for now.</p>
                    <span className="badge badge-warning text-dark px-3 py-2" style={{fontSize: '0.95rem'}}>COMING SOON</span>
                  </div>
                )}

                {paymentMethod === "easypaisa" && (
                  <div className="">
                    <label className="input-label"><strong>Easypaisa Account</strong></label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Enter Easypaisa Mobile Number (11 digits)"
                        value={paymentDetails.easypaisaNumber}
                        onChange={(e) => setPaymentDetails({...paymentDetails, easypaisaNumber: e.target.value})}
                        disabled={paymentProcessing || otpSent}
                      />
                      <button
                        className="btn-outline-primary"
                        type="button"
                        onClick={handleSendOTP}
                        disabled={paymentProcessing || otpSent || !paymentDetails.easypaisaNumber}
                      >
                        {otpSent ? "OTP Sent" : "Send OTP"}
                      </button>
                    </div>

                    {otpSent && !otpVerified && (
                      <div className="mt-3 p-3 bg-light rounded">
                        <label className="input-label"><strong>Enter OTP Code</strong></label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Enter 6-digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength="6"
                            disabled={otpVerifying}
                          />
                          <button
                            className="btn-success"
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpVerifying || otpCode.length !== 6}
                          >
                            {otpVerifying ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      </div>
                    )}

                    {otpVerified && (
                      <div className="alert-success">
                        <i className="fas fa-check-circle me-2"></i>
                        Phone number verified successfully!
                      </div>
                    )}

                    <small className="file-label">
                      <i className="fas fa-info-circle"></i>
                      Verification code will be sent to your email address.
                    </small>
                  </div>
                )}

                {paymentMethod === "bank_transfer" && (
                  <div className="mb-3 p-4 text-center bg-light rounded border-2" style={{borderColor: '#ffc107'}}>
                    <h5 className="mb-2">ðŸš€ Coming Soon</h5>
                    <p className="course-meta">Bank Transfer payment will be available soon. Please use Easypaisa for now.</p>
                    <span className="badge badge-warning text-dark px-3 py-2" style={{fontSize: '0.95rem'}}>COMING SOON</span>
                  </div>
                )}

                <div className="alert-box alert-info">
                  <small>
                    <i className="fas fa-lock me-2"></i>
                    Your payment information is secure and encrypted.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success btn-lg w-100"
                  onClick={handleProcessPayment}
                  disabled={
                    paymentProcessing ||
                    (paymentMethod === "easypaisa" && !otpVerified) ||
                    paymentMethod === "credit_card" ||
                    paymentMethod === "bank_transfer"
                  }
                  title={
                    paymentMethod === "credit_card" || paymentMethod === "bank_transfer"
                      ? "This payment method is coming soon"
                      : paymentMethod === "easypaisa" && !otpVerified
                      ? "Please verify your Easypaisa number first"
                      : ""
                  }
                >
                  {paymentProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle me-2"></i>
                      Pay PKR {parseFloat(course.price).toFixed(2)}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentProcessing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CourseDetail;









