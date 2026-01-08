import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./components/homepage_new";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import CourseDetail from "./components/CourseDetail";
import CourseEnrollment from "./components/CourseEnrollment";
import TeacherProfile from "./components/TeacherProfile";
import Quiz from "./components/Quiz";

function ProtectedRoute({ user, requiredRole, children, redirectTo = "/login" }) {
  const location = useLocation();
  
  if (!user) {
    localStorage.setItem("redirectPath", location.pathname + location.search);
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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/courses" element={<CourseEnrollment />} />
        <Route path="/teacher/:id" element={<TeacherProfile />} />
        {user?.role === "student" && (
          <Route path="/student-dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        )}
        {user?.role === "teacher" && (
          <Route path="/teacher-dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
