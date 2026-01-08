import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [activeLink, setActiveLink] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMessagesClick = () => {
    setShowComingSoon(true);
  };

  const handleCloseModal = () => {
    setShowComingSoon(false);
  };

  return (
    <>
      <nav className={`navbar navbar-expand-lg ${scrolled ? "scrolled" : ""}`}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-book-open navbar-brand-icon me-2" aria-hidden="true"></i>
            <strong>PARHAI WARHAI</strong>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/courses">
                  Explore
                </Link>
              </li>

              {user ? (
                <>
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to={
                        user.role === "student"
                          ? "/student-dashboard"
                          : "/teacher-dashboard"
                      }
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link messages-btn"
                      onClick={handleMessagesClick}
                    >
                      <i className="fas fa-envelope me-2" aria-hidden="true"></i>Messages
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link logout-btn"
                      onClick={handleLogout}
                    >
                      Logout ({user.username})
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {showComingSoon && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coming-soon-content">
              <button
                className="close-btn"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <i className="fas fa-times"></i>
              </button>
              <div className="coming-soon-icon">
                <i className="fas fa-envelope-open-text"></i>
              </div>
              <h2>Messages Coming Soon</h2>
              <p>
                We're working hard to bring you messaging features. Stay tuned!
              </p>
              <button
                className="btn btn-primary mt-3"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;

