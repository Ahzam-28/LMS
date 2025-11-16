from django.urls import path, include
from rest_framework.routers import DefaultRouter 
from .views import TeacherViewSet, StudentViewSet , CourseViewSet , CourseCategoryViewSet , EnrollmentViewSet , LessonViewSet , LessonCategoryViewSet , LessonFileViewSet , AssignmentViewSet , SubmissionViewSet , QuizViewSet , QuestionViewSet , AnswerViewSet , ResultViewSet , PaymentViewSet , FeedbackViewSet , ResourceViewSet , FileSubmissionViewSet , RegisterView, LoginView

router = DefaultRouter()
router.register(r'teacher', TeacherViewSet)
router.register(r'student', StudentViewSet)
router.register(r'course', CourseViewSet)
router.register(r'category', CourseCategoryViewSet)
router.register(r'enrollment', EnrollmentViewSet)
router.register(r'lesson', LessonViewSet)
router.register(r'lesson-category', LessonCategoryViewSet)
router.register(r'lesson-file', LessonFileViewSet)
router.register(r'assignment', AssignmentViewSet)
router.register(r'submission', SubmissionViewSet)
router.register(r'quiz', QuizViewSet)
router.register(r'question', QuestionViewSet)
router.register(r'answer', AnswerViewSet)
router.register(r'result', ResultViewSet)
router.register(r'payment', PaymentViewSet)
router.register(r'feedback', FeedbackViewSet)
router.register(r'resource', ResourceViewSet)
router.register(r'filesubmission', FileSubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
