import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CourseDetail from "./components/CourseDetail";
import CourseEnrollment from "./components/CourseEnrollment";
import TeacherProfile from "./components/TeacherProfile";

// Protected route wrapper component
function ProtectedRoute({ user, requiredRole, children, redirectTo = "/login" }) {
  const location = useLocation();
  
  if (!user) {
    // Store the attempted path in localStorage so user is redirected there after login
    localStorage.setItem("redirectPath", location.pathname + location.search);
    // Pass the current location so Login can redirect back after authentication
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        {/* Public homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Login/Register pages accessible even if logged in */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />

        {/* Course details - public, but enrollment requires login */}
        <Route path="/courses/:id" element={<CourseDetail />} />

        {/* Course enrollment page - always accessible, but redirects handle login requirements */}
        <Route path="/courses" element={<CourseEnrollment />} />

        {/* Teacher profile page */}
        <Route path="/teacher/:id" element={<TeacherProfile />} />

        {/* Dashboards */}
        {user?.role === "student" && (
          <Route path="/student-dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        )}
        {user?.role === "teacher" && (
          <Route path="/teacher-dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        )}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
