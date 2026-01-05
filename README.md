## PARHAI WARHAI - Learning Management System

---

## 1. TITLE PAGE

**Project Title:** PARHAI WARHAI - Learning Management System

**Project Type:** Full-Stack Web Application

**Technology Stack:** 
- Frontend: React.js, React Router, CSS3
- Backend: Django, Django REST Framework
- Database: SQLite

**Author:** Ahsan Ahzam Ali

**Date:** November 24, 2025

**Version:** 1.0.0

---

## 2. INTRODUCTION

PARHAI WARHAI is a Learning Management System designed to facilitate online education. The platform enables students to enroll in courses, access learning materials, take quizzes, and track progress. Teachers can create courses, add lessons with multimedia content, create assessments, and monitor student performance. The system uses modern technologies with a dark-themed user interface and implements secure authentication with JWT tokens and OTP verification for transactions.

---

## 3. TARGETED AUDIENCE

**Students:** Learners aged 15-65 who want to acquire new skills, advance their careers, or pursue educational interests. They can browse courses, enroll in classes, access learning materials, take quizzes, and track their progress.

**Teachers:** Instructors and subject matter experts who create and manage courses. They can add lessons with content and files, create quizzes, monitor student enrollments, and view student performance metrics.

**Administrators:** System managers responsible for user management, platform configuration, and system monitoring.

---

## 4. PROJECT SCOPE

**Included Features:**
- User registration and authentication for students and teachers
- Course creation, management, and enrollment
- Lesson organization with multimedia support (video, files)
- Quiz creation with multiple-choice questions and automatic grading
- Progress tracking with visual indicators
- Payment processing with multiple methods (Credit Card, Easypaisa, Bank Transfer)
- OTP verification for secure transactions
- User dashboard showing enrolled/created courses
- Teacher profile viewing
- Responsive design for all devices

**Excluded Features:**
- Real-time messaging system
- Advanced analytics and reporting
- Video hosting and streaming
- Mobile native applications
- Gamification features

---

## 5. FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS

**Functional Requirements:**
- User registration with role selection (Student/Teacher)
- Secure login with JWT authentication
- Course creation, editing, and deletion
- Lesson management with categories and multimedia
- Quiz creation with multiple-choice questions
- Course enrollment (free and paid)
- Payment processing with OTP verification
- Lesson access for enrolled students
- Quiz participation with auto-grading
- Progress tracking and reporting
- Teacher profile viewing
- Dashboard for both student and teacher roles

**Non-Functional Requirements:**
- Page load time less than 3 seconds
- Support 100+ concurrent users
- HTTPS encryption for data transmission
- Password hashing with bcrypt
- JWT token expiration after 24 hours
- SQL injection prevention
- 99% system uptime
- Responsive design (Desktop, Tablet, Mobile)
- Dark theme with high contrast UI
- Accessible navigation and clear error messages
- Modular architecture for feature expansion

---

## 6. ER DIAGRAM

```
CustomUser (User Registration)
├── Student (One-to-One with CustomUser)
└── Teacher (One-to-One with CustomUser)

Category (Course Categories)
└── Course (One-to-Many)
    ├── Enrollment (One-to-Many) → Student
    ├── Payment (One-to-Many)
    ├── LessonCategory (One-to-Many)
    │   └── Lesson (One-to-Many)
    │       └── LessonFile (One-to-Many)
    └── Quiz (One-to-Many)
        ├── Question (One-to-Many)
        │   └── Answer (One-to-Many)
        └── Result (One-to-Many) → Student

OTP (For Payment Verification)
```

**Key Relationships:**
- CustomUser → Student (1:1)
- CustomUser → Teacher (1:1)
- Teacher → Course (1:Many)
- Course → Enrollment (1:Many)
- Course → Quiz (1:Many)
- Student → Enrollment (1:Many)
- Lesson → LessonFile (1:Many)
- Quiz → Question (1:Many)
- Question → Answer (1:Many)

---

## 7. NORMALIZED SCHEMA

The database follows **Third Normal Form (3NF)** with 15 normalized tables:

**Tables:**
1. `CustomUser` - User authentication and basic info
2. `Student` - Student profile data
3. `Teacher` - Teacher profile data
4. `Category` - Course categories
5. `Course` - Course information and details
6. `LessonCategory` - Organization of lessons within courses
7. `Lesson` - Individual lesson content
8. `LessonFile` - Attachments to lessons
9. `Enrollment` - Student course enrollments
10. `Quiz` - Course quizzes
11. `Question` - Quiz questions
12. `Answer` - Answer options for questions
13. `Result` - Student quiz results and scores
14. `Payment` - Course payment records
15. `OTP` - One-time passwords for verification

**Normalization Benefits:**
- Eliminates data redundancy
- Ensures data consistency and integrity
- Enables efficient queries through proper indexing
- Supports scalability and maintainability

---

## 8. CONCLUSION

PARHAI WARHAI successfully delivers a complete Learning Management System with modern technology stack and proper database design. The project demonstrates full-stack development capabilities combining React frontend, Django backend, and normalized database schema.

**Key Achievements:**
- Fully functional LMS with student and teacher portals
- Secure authentication and payment processing
- Responsive UI with dark theme and animations
- Normalized 3NF database with 15 interconnected tables
- Complete RESTful API with 32+ endpoints
- Comprehensive documentation and FAQs

**Technical Excellence:**
- Bootstrap
- Custom CSS styling
- FontAwesome icon integration
- Grid-based responsive layout
- JWT and OTP security implementations
- Proper error handling and validation

The system is ready for production deployment and can serve as foundation for scaling to thousands of users. Future versions can include real-time messaging, advanced analytics, mobile apps, and gamification features.

---

## 9. REFERENCES

**Technology Documentation:**
- React: https://react.dev
- Django: https://www.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- SQLite: https://www.sqlite.org/

**Database Design:**
- Database Normalization: https://en.wikipedia.org/wiki/Database_normalization
- Entity-Relationship Model: https://www.tutorialspoint.com/dbms/er_model_concept.htm

**Security:**
- JWT Authentication: https://jwt.io/
- OWASP Top 10: https://owasp.org/www-project-top-ten/

**Project Repository:**
- GitHub: https://github.com/Ahzam-28/LMS-DB-PROJECT
- License: MIT
- Version: 1.0.0

---


**Authors:** Ahsan Faizan, Ahzam Hassan, Ali samad
