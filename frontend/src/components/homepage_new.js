import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import "./HomePage.css";
import './homepage_carousel_fix.css';
import './homepage_carousel_size_fix.css';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const carouselRef = useRef(null);
  const coursesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));

    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [coursesRes, teachersRes] = await Promise.all([
          API.get("/course/"),
          API.get("/teacher/"),
        ]);

        if (!mounted) return;
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, []);

  const viewCourse = (id) => navigate(`/courses/${id}`);

  const scrollTeachers = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const scrollCourses = (dir) => {
    const el = coursesRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to Parhai Warhai</h1>
            <p className="lead">Explore curated courses and learn from industry experts.</p>
            {!user && (
              <div className="hero-buttons">
                <Link to="/login" className="btn btn-primary btn-lg">Login</Link>
                <Link to="/register" className="btn btn-outline-primary btn-lg">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="courses-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Available Courses</h2>
              <p>Hand-picked courses to level up your skills</p>
            </div>
            <Link to="/courses" className="btn btn-primary">View All Courses</Link>
          </div>

          {loading ? (
            <p className="text-center text-muted">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted">No courses available at the moment.</p>
          ) : (
            <div className="courses-carousel-wrapper">
              <button className="carousel-arrow carousel-arrow-left" style={{ left: '-24px' }} onClick={() => scrollCourses('left')} aria-label="Scroll courses left">
                <i className="fas fa-chevron-left" aria-hidden="true"></i>
              </button>

              <div className="courses-carousel" ref={coursesRef}>
                {courses.slice(0, 12).map((c) => (
                  <article key={c.id} className={`course-grid-card course-carousel-item ${c.code === 'PYINTRO' ? 'fixed-course-size' : ''}`}>
                    <div className="course-card-header">
                      <span className="badge">{c.code}</span>
                      <span className="enrollment-badge-small">👥 {c.enrollment_count}</span>
                    </div>
                    <h3 className="course-card-title">{c.title}</h3>
                    <p className="course-card-description">{(c.description || "").slice(0, 110)}...</p>
                    <p className="course-card-category"><small>{c.category_details?.title || "Uncategorized"}</small></p>
                    <div className="course-card-footer">
                      <span className="price">PKR {parseFloat(c.price || 0).toFixed(2)}</span>
                      <button className="btn btn-sm btn-primary" onClick={() => viewCourse(c.id)}>View Details</button>
                    </div>
                  </article>
                ))}
              </div>

              <button className="carousel-arrow carousel-arrow-right" style={{ right: '-36px' }} onClick={() => scrollCourses('right')} aria-label="Scroll courses right">
                <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="teachers-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Our Expert Instructors</h2>
              <p>Learn from professionals with real-world experience</p>
            </div>
            <Link to="/teachers" className="btn btn-primary">View All Teachers</Link>
          </div>

          {loading ? (
            <p className="text-center text-muted">Loading teachers...</p>
          ) : teachers.length === 0 ? (
            <p className="text-center text-muted">No teachers available at the moment.</p>
          ) : (
            <div className="teachers-carousel-wrapper">
              <button className="carousel-arrow carousel-arrow-left" onClick={() => scrollTeachers('left')} aria-label="Scroll left">
                <i className="fas fa-chevron-left" aria-hidden="true"></i>
              </button>

              <div className="teachers-carousel" ref={carouselRef}>
                {teachers.map((t) => (
                  <div key={t.id} className="teacher-card" onClick={() => navigate(`/teacher/${t.id}`)}>
                    <div className="teacher-card-header">
                      <div className="teacher-avatar"><i className="fas fa-user-circle"/></div>
                    </div>
                    <div className="teacher-card-body">
                      <h5 className="teacher-name">{t.user_details?.name || 'Unnamed'}</h5>
                      <p className="teacher-qualification"><small>{t.qualification}</small></p>
                      <div className="teacher-info">
                        <p><strong>Experience:</strong> {t.experience} years</p>
                        <p><strong>Courses:</strong> {t.courses_count}</p>
                        <p><strong>Expertise:</strong> {(t.expertise || '').slice(0, 60)}...</p>
                      </div>
                    </div>
                    <div className="teacher-card-footer">
                      <button className="btn btn-sm btn-primary w-100">View Profile</button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="carousel-arrow carousel-arrow-right" onClick={() => scrollTeachers('right')} aria-label="Scroll right">
                <i className="fas fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <div className="container text-center">
          <p>
            © Ahsan
            {' '}
            <a href="https://www.linkedin.com/in/ahsan-faizan-32ba76390" target="_blank" rel="noopener noreferrer" aria-label="Ahsan on LinkedIn" className="mx-1 footer-link">
              <i className="fab fa-linkedin" aria-hidden="true"></i>
            </a>
            <a href="https://github.com/Ahsa-n" target="_blank" rel="noopener noreferrer" aria-label="Ahsa on GitHub" className="mx-1 footer-github">
              <i className="fab fa-github" aria-hidden="true"></i>
            </a>
            {' '}
            Ahzam
            {' '}
            <a href="https://www.linkedin.com/in/mohammad-ahzam-hassan-0b6704296/" target="_blank" rel="noopener noreferrer" aria-label="Ahzam on LinkedIn" className="mx-1 footer-link">
              <i className="fab fa-linkedin" aria-hidden="true"></i>
            </a>
            <a href="https://github.com/Ahzam-28" target="_blank" rel="noopener noreferrer" aria-label="Ahzam on GitHub" className="mx-1 footer-github">
              <i className="fab fa-github" aria-hidden="true"></i>
            </a>
            {' '}
            Ali
          </p>
        </div>
      </footer>
    </div>
  );
}

// Ensure course carousel arrows match instructor carousel arrow positions at runtime
// This uses inline styles derived from the instructor arrows so it cannot be overridden by CSS load order.
if (typeof window !== 'undefined') {
  const applyArrowSync = () => {
    try {
      const teacherLeft = document.querySelector('.teachers-carousel-wrapper .carousel-arrow.carousel-arrow-left');
      const teacherRight = document.querySelector('.teachers-carousel-wrapper .carousel-arrow.carousel-arrow-right');
      const courseLeft = document.querySelector('.courses-carousel-wrapper .carousel-arrow.carousel-arrow-left');
      const courseRight = document.querySelector('.courses-carousel-wrapper .carousel-arrow.carousel-arrow-right');
      if (teacherLeft && courseLeft) {
        const cs = window.getComputedStyle(teacherLeft);
        const leftRaw = cs.left || cs.getPropertyValue('left') || '0px';
        const topRaw = cs.top || cs.getPropertyValue('top') || '50%';
        const leftNum = parseFloat(leftRaw) || 0;
        // nudge outward by 12px
        courseLeft.style.left = (leftNum - 12) + 'px';
        courseLeft.style.top = topRaw;
      }
      if (teacherRight && courseRight) {
        const cs2 = window.getComputedStyle(teacherRight);
        const rightRaw = cs2.right || cs2.getPropertyValue('right') || '0px';
        const topRaw2 = cs2.top || cs2.getPropertyValue('top') || '50%';
        const rightNum = parseFloat(rightRaw) || 0;
        // nudge outward by 12px (more negative moves it further right)
        courseRight.style.right = (rightNum - 12) + 'px';
        courseRight.style.top = topRaw2;
      }
    } catch (e) {
      // silent
    }
  };
  window.addEventListener('load', applyArrowSync);
  window.addEventListener('resize', applyArrowSync);
  // apply immediately if DOM already loaded
  setTimeout(applyArrowSync, 250);
}

// Ensure inline arrow nudges are applied reliably; retry a few times
if (typeof window !== 'undefined') {
  const forceCourseArrows = () => {
    try {
      const courseLeft = document.querySelector('.courses-carousel-wrapper .carousel-arrow.carousel-arrow-left');
      const courseRight = document.querySelector('.courses-carousel-wrapper .carousel-arrow.carousel-arrow-right');
      if (courseLeft) {
        courseLeft.style.position = 'absolute';
        courseLeft.style.left = '-12px';
        courseLeft.style.top = '50%';
        courseLeft.style.transform = 'translateY(-50%)';
      }
      if (courseRight) {
        courseRight.style.position = 'absolute';
        courseRight.style.right = '-36px';
        courseRight.style.top = '50%';
        courseRight.style.transform = 'translateY(-50%)';
      }
      return !!(courseLeft || courseRight);
    } catch (e) {
      return false;
    }
  };

  // Try immediately and then a few times after load to cover dynamic rendering
  forceCourseArrows();
  let attempts = 0;
  const intervalId = setInterval(() => {
    attempts += 1;
    const applied = forceCourseArrows();
    if (applied || attempts > 12) clearInterval(intervalId);
  }, 200);

  window.addEventListener('load', forceCourseArrows);
  window.addEventListener('resize', forceCourseArrows);
}
