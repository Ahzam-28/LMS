import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import "./Quiz.css";

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const fetchQuiz = async () => {
      try {
        const response = await API.get(`/quiz/${id}/`);
        setQuiz(response.data);
        setTimeRemaining(response.data.duration * 60); 

        const questionsResponse = await API.get(`/question/?quiz=${id}`);
        setQuestions(questionsResponse.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load quiz");
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (!quizStarted || submitted || timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, submitted, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId,
    });
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleSubmitQuiz = async () => {
    setSubmitted(true);

    try {
      
      let score = 0;
      let totalMarks = 0;

      questions.forEach((question) => {
        totalMarks += question.marks; 
        const selectedAnswerId = answers[question.id];
        const selectedAnswer = question.answers?.find((ans) => ans.id === selectedAnswerId);

        if (selectedAnswer?.is_correct) {
          score += question.marks; 
        }
      });

      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      let grade = "F";
      if (percentage >= 90) grade = "A";
      else if (percentage >= 80) grade = "B";
      else if (percentage >= 70) grade = "C";
      else if (percentage >= 60) grade = "D";
      else if (percentage >= 50) grade = "E";

      // Marks obtained should be proportional to total quiz marks
      const marksObtained = (score / totalMarks) * quiz.total_marks;

      setResult({
        score: score,
        totalMarks: totalMarks,
        marksEarned: marksObtained.toFixed(2),
        quizTotalMarks: quiz.total_marks,
        percentage: percentage.toFixed(2),
        grade: grade,
      });

      if (user && user.profile && user.profile.id) {
        try {
          const resultPayload = {
            quiz: id,
            student: user.profile.id,
            score: marksObtained.toFixed(2),
            grade_awarded: grade,
          };
          const resultResponse = await API.post("/result/", resultPayload);
        } catch (error) {
        
        }
      }
    } catch (error) {
      alert("Failed to submit quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="alert alert-info">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Quiz not found</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5 quiz-container">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        â† Back
      </button>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">{quiz.title}</h3>
          <p className="mb-0 small">{quiz.description}</p>
        </div>

        <div className="card-body">
          {!quizStarted && !submitted && (
            <div className="quiz-start-section">
              <div className="alert alert-info">
                <h5>Quiz Instructions</h5>
                <ul>
                  <li>Total Questions: {questions.length}</li>
                  <li>Total Marks: {quiz.total_marks}</li>
                  <li>Duration: {quiz.duration} minutes</li>
                  <li>You cannot pause the quiz once started</li>
                  <li>Select the correct answer for each question</li>
                  <li>Review your answers before submitting</li>
                </ul>
              </div>
              <button
                className="btn btn-lg btn-success"
                onClick={handleStartQuiz}
              >
                <i className="fas fa-play me-2"></i>Start Quiz
              </button>
            </div>
          )}

          {quizStarted && !submitted && (
            <>
              <div className="quiz-header mb-4">
                <div className="timer-section">
                  <h5 className="mb-0">
                    Time Remaining:
                    <span className={`ms-2 ${timeRemaining <= 60 ? "text-danger" : "text-success"}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </h5>
                </div>
                <div className="progress-section">
                  <small className="text-muted">
                    Answered: {Object.keys(answers).length} / {questions.length}
                  </small>
                </div>
              </div>

              <div className="questions-section">
                {questions.map((question, index) => (
                  <div key={question.id} className="question-card mb-4">
                    <div className="question-number">
                      Question {index + 1} of {questions.length}
                      <span className="question-marks">({question.marks} marks)</span>
                    </div>
                    <h5 className="question-text">{question.text}</h5>

                    <div className="answers-list">
                      {question.answers?.map((answer) => (
                        <div key={answer.id} className="answer-option">
                          <input
                            type="radio"
                            id={`answer-${answer.id}`}
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={answers[question.id] === answer.id}
                            onChange={() =>
                              handleAnswerSelect(question.id, answer.id)
                            }
                            disabled={submitted}
                          />
                          <label htmlFor={`answer-${answer.id}`}>
                            {answer.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="quiz-footer mt-4">
                <button
                  className="btn btn-lg btn-primary"
                  onClick={handleSubmitQuiz}
                >
                  <i className="fas fa-check-circle me-2"></i>Submit Quiz
                </button>
              </div>
            </>
          )}

          {submitted && result && (
            <div className="quiz-result-section">
              <div className={`alert alert-${result.grade === "A" || result.grade === "B" ? "success" : result.grade === "C" || result.grade === "D" ? "warning" : "danger"}`}>
                <h4 className="mb-3">Quiz Submitted!</h4>

                <div className="result-grid">
                  <div className="result-item">
                    <span className="result-label">Marks Earned</span>
                    <span className="result-value">
                      {result.marksEarned} / {result.quizTotalMarks}
                    </span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Percentage</span>
                    <span className="result-value">{result.percentage}%</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Grade</span>
                    <span className="result-value badge bg-primary p-2">
                      {result.grade}
                    </span>
                  </div>
                </div>

                <hr />

                <h5 className="mt-4 mb-3">Answer Summary</h5>
                <div className="answers-summary">
                  {questions.map((question, index) => {
                    const selectedAnswerId = answers[question.id];
                    const selectedAnswer = question.answers?.find(
                      (ans) => ans.id === selectedAnswerId
                    );
                    const correctAnswer = question.answers?.find(
                      (ans) => ans.is_correct
                    );
                    const isCorrect = selectedAnswer?.is_correct;
                    const marksAwarded = isCorrect ? question.marks : 0;

                    return (
                      <div key={question.id} className="summary-item">
                        <div className={`summary-question ${isCorrect ? "correct" : "incorrect"}`}>
                          <span className="question-num">Q{index + 1}.</span>
                          <span className="question-text">{question.text}</span>
                          <span className="marks-badge">({marksAwarded}/{question.marks} marks)</span>
                          <span className={`status ${isCorrect ? "badge bg-success" : "badge bg-danger"}`}>
                            {isCorrect ? "âœ“ Correct" : "âœ— Incorrect"}
                          </span>
                        </div>
                        <div className="summary-answer">
                          <p>
                            <strong>Your Answer:</strong> {selectedAnswer?.text || "Not answered"}
                          </p>
                          {!isCorrect && (
                            <p>
                              <strong>Correct Answer:</strong> {correctAnswer?.text}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="quiz-footer mt-4">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(-1)}
                >
                  <i className="fas fa-arrow-left me-2"></i>Back to Course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Quiz;
