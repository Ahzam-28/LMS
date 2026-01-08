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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    method: "credit-card",
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    easypaisaNumber: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState(null);
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
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get("/category/");
      setCategories(response.data);
    } catch (error) {
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await API.get("/enrollment/my_enrollments/");
      const enrolledIds = response.data.map((enrollment) => enrollment.course);
      setEnrolledCourses(enrolledIds);
    } catch (error) {
    }
  };

  const handleEnrollClick = async (courseId) => {

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      alert("Only students can enroll in courses. Please log in as a student.");
      return;
    }

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (parseFloat(course.price) === 0) {
      try {
        await API.post("/enrollment/enroll_course/", {
          course_id: courseId,
          status: "active",
        });
        setEnrolledCourses([...enrolledCourses, courseId]);
        alert("Successfully enrolled in the course!");
      } catch (error) {
        alert(
          error.response?.data?.error || "Failed to enroll. Please try again."
        );
      }
    } else {
     
      setSelectedCourse(course);
      setShowPaymentModal(true);
      setError(null);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
      setPaymentDetails({
        method: "credit-card",
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        easypaisaNumber: "",
        bankAccountHolder: "",
        bankAccountNumber: "",
      });
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
      setError("Please enter OTP");
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
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedCourse) return;

    if (paymentDetails.method === "credit-card") {
      if (!paymentDetails.cardholderName || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        setError("Please fill in all card details");
        return;
      }
    } else if (paymentDetails.method === "easypaisa") {
      if (!otpVerified) {
        setError("Please verify OTP first");
        return;
      }
    } else if (paymentDetails.method === "bank-transfer") {
      if (!paymentDetails.bankAccountHolder || !paymentDetails.bankAccountNumber) {
        setError("Please fill in all bank details");
        return;
      }
    }

    try {
     
      const paymentResponse = await API.post("/payment/", {
        course: selectedCourse.id,
        amount: parseFloat(selectedCourse.price),
        payment_method: paymentDetails.method === "credit-card" ? "Credit Card" : paymentDetails.method === "easypaisa" ? "Easypaisa" : "Bank Transfer",
        payment_status: "completed"
      });

      await API.post("/enrollment/enroll_course/", {
        course_id: selectedCourse.id,
        status: "active",
      });

      setEnrolledCourses([...enrolledCourses, selectedCourse.id]);
      alert("Payment successful! You have been enrolled in the course.");
      setShowPaymentModal(false);
      setSelectedCourse(null);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || "Payment failed. Please try again.");
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
              {user && user.role === "student" && (
                <button
                  className="btn logout-btn"
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
                        <strong>Price:</strong> PKR {parseFloat(course.price).toFixed(2)}
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

        {/* Payment Modal */}
        {showPaymentModal && selectedCourse && (
          <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Complete Your Payment</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowPaymentModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h6>Course: {selectedCourse.title}</h6>
                    <h6 className="text-primary">Amount: PKR {parseFloat(selectedCourse.price).toFixed(2)}</h6>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentDetails.method}
                      onChange={(e) => {
                        setPaymentDetails({ ...paymentDetails, method: e.target.value });
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpCode("");
                        setError(null);
                      }}
                    >
                      <option value="credit-card">Credit Card</option>
                      <option value="easypaisa">Easypaisa</option>
                      <option value="bank-transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Credit Card Form */}
                  {paymentDetails.method === "credit-card" && (
                    <div className="p-4 text-center bg-light rounded">
                      <h5 className="mb-2">🚀 Coming Soon</h5>
                      <p className="text-muted mb-3">Credit Card payment will be available soon. Please use Easypaisa for now.</p>
                      <span className="badge bg-warning text-dark px-3 py-2">COMING SOON</span>
                    </div>
                  )}

                  {/* Easypaisa Form */}
                  {paymentDetails.method === "easypaisa" && (
                    <div>
                      <div className="mb-3">
                        <label className="form-label">Easypaisa Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="+923001234567"
                          value={paymentDetails.easypaisaNumber}
                          onChange={(e) =>
                            setPaymentDetails({
                              ...paymentDetails,
                              easypaisaNumber: e.target.value,
                            })
                          }
                        />
                      </div>

                      {!otpSent ? (
                        <button
                          className="btn btn-info w-100 mb-3"
                          onClick={handleSendOTP}
                        >
                          Send OTP
                        </button>
                      ) : (
                        <div>
                          <div className="alert alert-info">
                            OTP sent to your email
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Enter OTP</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="000000"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                            />
                          </div>
                          <button
                            className="btn btn-success w-100 mb-3"
                            onClick={handleVerifyOTP}
                            disabled={otpVerifying}
                          >
                            {otpVerifying ? "Verifying..." : "Verify OTP"}
                          </button>
                          {otpVerified && (
                            <div className="alert alert-success">
                              ✓ OTP Verified Successfully
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bank Transfer Form */}
                  {paymentDetails.method === "bank-transfer" && (
                    <div className="p-4 text-center bg-light rounded">
                      <h5 className="mb-2">🚀 Coming Soon</h5>
                      <p className="text-muted mb-3">Bank Transfer payment will be available soon. Please use Easypaisa for now.</p>
                      <span className="badge bg-warning text-dark px-3 py-2">COMING SOON</span>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-success"
                    onClick={handlePayment}
                    disabled={paymentDetails.method === "easypaisa" && !otpVerified || paymentDetails.method === "credit-card" || paymentDetails.method === "bank-transfer"}
                    title={paymentDetails.method === "credit-card" || paymentDetails.method === "bank-transfer" ? "This payment method is coming soon" : ""}
                  >
                    {paymentDetails.method === "credit-card" || paymentDetails.method === "bank-transfer" ? "Coming Soon" : "Pay Now"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseEnrollment;
