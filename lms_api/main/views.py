from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny , IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import Teacher, Student , Course , CourseCategory , Enrollment , Lesson , LessonCategory , LessonFile , Assignment , Submission , Quiz , Question , Answer , Result , Payment , Feedback , Resource , FileSubmission , OTP
from .serializers import TeacherSerializer, StudentSerializer , CourseSerializer , CourseCategorySerializer , EnrollmentSerializer , LessonSerializer , LessonCategorySerializer , LessonFileSerializer , AssignmentSerializer , SubmissionSerializer , QuizSerializer , QuestionSerializer , AnswerSerializer , ResultSerializer , PaymentSerializer , FeedbackSerializer , ResourceSerializer , FileSubmissionSerializer , RegisterSerializer, LoginSerializer, OTPSerializer
from .otp_service import send_otp_email, verify_otp, is_otp_verified

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        For public endpoints (list, detail): only show available courses
        For update/delete: allow teachers to update their own courses
        """
        # For update/delete operations, allow access to all courses (teacher owns them)
        if self.request.method in ['PATCH', 'PUT', 'DELETE']:
            # For write operations, return all courses - perform_update will check ownership
            return Course.objects.all()
        
        # For read operations, only return available courses
        return Course.objects.filter(is_available=True)
    
    def perform_create(self, serializer):
        """Only teachers can create courses"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            serializer.save(teacher=teacher)
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create courses")
    
    def perform_update(self, serializer):
        """Only the teacher who created the course can update it"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            course = self.get_object()
            
            # Check if the current user is the course teacher
            if course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only update your own courses")
            
            # Check if marking course as unavailable
            is_available_new = serializer.validated_data.get('is_available', course.is_available)
            
            # If marking as unavailable, unenroll all students
            if course.is_available and not is_available_new:
                # Delete all enrollments for this course
                Enrollment.objects.filter(course=course).delete()
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can update courses")
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        """Get the current teacher's courses (including unavailable ones)"""
        user = request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            courses = Course.objects.filter(teacher=teacher)
            serializer = self.get_serializer(courses, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Only teachers can view their courses"},
                status=status.HTTP_403_FORBIDDEN
            )

class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    permission_classes = [AllowAny]
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter enrollments based on user role"""
        user = self.request.user
        if hasattr(user, 'student'):
            return Enrollment.objects.filter(student__user=user)
        return Enrollment.objects.all()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll_course(self, request):
        """
        Endpoint for students to enroll in a course.
        Only students can enroll.
        Request body: {"course_id": <int>, "status": "active"}
        """
        user = request.user
        
        # Check if user is a student
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can enroll in courses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        course_id = request.data.get('course_id')
        enrollment_status = request.data.get('status', 'active')
        
        if not course_id:
            return Response(
                {"error": "course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if course exists
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response(
                {"error": "Course not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student is already enrolled
        enrollment_exists = Enrollment.objects.filter(
            student=student,
            course=course
        ).exists()
        
        if enrollment_exists:
            return Response(
                {"error": "You are already enrolled in this course"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create enrollment
        enrollment = Enrollment.objects.create(
            student=student,
            course=course,
            status=enrollment_status
        )
        
        serializer = EnrollmentSerializer(enrollment)
        return Response(
            {"message": "Successfully enrolled in course", "enrollment": serializer.data},
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_enrollments(self, request):
        """Get the current student's enrollments"""
        user = request.user
        
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can view enrollments"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        enrollments = Enrollment.objects.filter(student=student)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['delete'])
    def unenroll_course(self, request):
        """
        Endpoint for students to unenroll from a course.
        Request body: {"course_id": <int>}
        """
        user = request.user
        
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response(
                {"error": "Only students can unenroll from courses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        course_id = request.data.get('course_id')
        
        if not course_id:
            return Response(
                {"error": "course_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = Enrollment.objects.get(student=student, course_id=course_id)
            enrollment.delete()
            return Response(
                {"message": "Successfully unenrolled from course"},
                status=status.HTTP_200_OK
            )
        except Enrollment.DoesNotExist:
            return Response(
                {"error": "Enrollment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter lessons by course if course parameter is provided"""
        queryset = Lesson.objects.all()
        course_id = self.request.query_params.get('course', None)
        
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Only teachers can create lessons for their own courses"""
        user = self.request.user
        course_id = self.request.data.get('course')
        
        try:
            teacher = Teacher.objects.get(user=user)
            course = Course.objects.get(id=course_id)
            
            # Check if the teacher owns this course
            if course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add lessons to your own courses")
            
            serializer.save(course=course)
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create lessons")
        except Course.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Course not found")
    
    def perform_update(self, serializer):
        """Only the teacher who created the course can update lessons"""
        user = self.request.user
        lesson = self.get_object()
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if the teacher owns the course
            if lesson.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit lessons in your own courses")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can edit lessons")
    
    def perform_destroy(self, instance):
        """Only the teacher who created the course can delete lessons"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if the teacher owns the course
            if instance.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete lessons in your own courses")
            
            instance.delete()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can delete lessons")
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_lessons(self, request):
        """Get all lessons for the current teacher's courses"""
        user = request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            # Get all courses taught by this teacher
            courses = Course.objects.filter(teacher=teacher)
            # Get all lessons for these courses
            lessons = Lesson.objects.filter(course__in=courses)
            serializer = self.get_serializer(lessons, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Only teachers can view their lessons"},
                status=status.HTTP_403_FORBIDDEN
            )

class LessonCategoryViewSet(viewsets.ModelViewSet):
    queryset = LessonCategory.objects.all()
    serializer_class = LessonCategorySerializer
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter categories by course if course parameter is provided"""
        queryset = LessonCategory.objects.all()
        course_id = self.request.query_params.get('course', None)
        
        if course_id is not None:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Only teachers can create lesson categories for their own courses"""
        user = self.request.user
        course_id = self.request.data.get('course')
        
        try:
            teacher = Teacher.objects.get(user=user)
            course = Course.objects.get(id=course_id)
            
            # Check if the teacher owns this course
            if course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add categories to your own courses")
            
            serializer.save(course=course)
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create categories")
        except Course.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Course not found")
    
    def perform_update(self, serializer):
        """Only the teacher who created the course can update categories"""
        user = self.request.user
        category = self.get_object()
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if the teacher owns the course
            if category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit categories in your own courses")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can edit categories")
    
    def perform_destroy(self, instance):
        """Only the teacher who created the course can delete categories"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if the teacher owns the course
            if instance.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete categories in your own courses")
            
            instance.delete()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can delete categories")


class LessonFileViewSet(viewsets.ModelViewSet):
    queryset = LessonFile.objects.all()
    serializer_class = LessonFileSerializer

    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter files by lesson if provided in query params"""
        queryset = LessonFile.objects.all()
        lesson_id = self.request.query_params.get('lesson', None)
        if lesson_id:
            queryset = queryset.filter(lesson=lesson_id)
        return queryset

    def perform_create(self, serializer):
        """Validate that teacher owns the course before creating file"""
        lesson = serializer.validated_data.get('lesson')
        course = lesson.course
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            if course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to add files to this lesson")
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create lesson files")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Validate ownership before deleting"""
        course = instance.lesson.course
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            if course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You don't have permission to delete this file")
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can delete lesson files")
        
        instance.delete()


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated) 
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter quizzes by lesson_category if provided in query params"""
        queryset = Quiz.objects.all()
        lesson_category_id = self.request.query_params.get('lesson_category', None)
        if lesson_category_id:
            queryset = queryset.filter(lesson_category=lesson_category_id)
        return queryset.order_by('order')

    def perform_create(self, serializer):
        """Validate that teacher owns the course before creating quiz"""
        lesson_category = serializer.validated_data.get('lesson_category')
        course = lesson_category.course
        user = self.request.user
        
        # Check if user is a teacher and owns the course
        try:
            teacher = Teacher.objects.get(user=user)
            if course.teacher != teacher:
                return Response(
                    {"error": "You don't have permission to add quizzes to this course"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Only teachers can create quizzes"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save()

    def perform_update(self, serializer):
        """Validate ownership before updating"""
        quiz = self.get_object()
        course = quiz.lesson_category.course
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            if course.teacher != teacher:
                return Response(
                    {"error": "You don't have permission to edit this quiz"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Only teachers can edit quizzes"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save()

    def perform_destroy(self, instance):
        """Validate ownership before deleting"""
        course = instance.lesson_category.course
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            if course.teacher != teacher:
                return Response(
                    {"error": "You don't have permission to delete this quiz"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Only teachers can delete quizzes"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filter questions by quiz if provided in query params"""
        queryset = Question.objects.all()
        quiz_id = self.request.query_params.get('quiz', None)
        if quiz_id:
            queryset = queryset.filter(quiz=quiz_id)
        return queryset
    
    def perform_create(self, serializer):
        """Only teachers can create questions for their quizzes"""
        quiz_id = self.request.data.get('quiz')
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            quiz = Quiz.objects.get(id=quiz_id)
            
            # Check if teacher owns the course
            if quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add questions to your own quizzes")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create questions")
        except Quiz.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Quiz not found")
    
    def perform_update(self, serializer):
        """Only teachers can update questions"""
        question = self.get_object()
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if teacher owns the course
            if question.quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit questions in your own quizzes")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can edit questions")
    
    def perform_destroy(self, instance):
        """Only teachers can delete questions"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if teacher owns the course
            if instance.quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete questions from your own quizzes")
            
            instance.delete()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can delete questions")


class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    
    def get_permissions(self):
        """
        GET requests are allowed for anyone (AllowAny)
        POST/PATCH/DELETE require authentication (IsAuthenticated)
        """
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Only teachers can create answers for their questions"""
        question_id = self.request.data.get('question')
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            question = Question.objects.get(id=question_id)
            
            # Check if teacher owns the course
            if question.quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only add answers to your own questions")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can create answers")
        except Question.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Question not found")
    
    def perform_update(self, serializer):
        """Only teachers can update answers"""
        answer = self.get_object()
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if teacher owns the course
            if answer.question.quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only edit answers in your own quizzes")
            
            serializer.save()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can edit answers")
    
    def perform_destroy(self, instance):
        """Only teachers can delete answers"""
        user = self.request.user
        
        try:
            teacher = Teacher.objects.get(user=user)
            
            # Check if teacher owns the course
            if instance.question.quiz.lesson_category.course.teacher != teacher:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete answers from your own quizzes")
            
            instance.delete()
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only teachers can delete answers")
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter results to only show results for the current user if they're a student"""
        user = self.request.user
        if user.is_authenticated:
            # If student, return only their results
            if hasattr(user, 'student'):
                return Result.objects.filter(student=user.student)
            # If teacher, return all results (or filter by their quizzes if needed)
            return Result.objects.all()
        return Result.objects.none()
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments to only show payments for the current user if they're a student"""
        user = self.request.user
        if user.is_authenticated:
            if hasattr(user, 'student'):
                return Payment.objects.filter(student=user.student)
            return Payment.objects.all()
        return Payment.objects.none()
    
    def perform_create(self, serializer):
        """Create payment for the current student"""
        if hasattr(self.request.user, 'student'):
            serializer.save(student=self.request.user.student)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "User must have a Student profile to make payments. Please complete your student profile first."})
class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
class FileSubmissionViewSet(viewsets.ModelViewSet):
    queryset = FileSubmission.objects.all()
    serializer_class = FileSubmissionSerializer
 

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # creates User and profile
            token, _ = Token.objects.get_or_create(user=user)

            # Determine role and profile data
            if hasattr(user, 'student'):
                role = 'student'
                profile = user.student
                profile_data = {
                    "id": profile.id,
                    "qualification": profile.qualification,
                    "mobile_no": profile.mobile_no,
                    "interested_categories": profile.interested_categories
                }
            elif hasattr(user, 'teacher'):
                role = 'teacher'
                profile = user.teacher
                profile_data = {
                    "id": profile.id,
                    "qualification": profile.qualification,
                    "mobile_no": profile.mobile_no,
                    "experience": profile.experience,
                    "expertise": profile.expertise
                }
            else:
                role = 'unknown'
                profile_data = {}

            return Response({
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "profile": profile_data,
                "token": token.key
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            token, _ = Token.objects.get_or_create(user=user)

            # Determine role and profile data
            if hasattr(user, 'student'):
                role = 'student'
                profile = user.student
                profile_data = {
                    "id": profile.id,
                    "qualification": profile.qualification,
                    "mobile_no": profile.mobile_no,
                    "interested_categories": profile.interested_categories
                }
            elif hasattr(user, 'teacher'):
                role = 'teacher'
                profile = user.teacher
                profile_data = {
                    "id": profile.id,
                    "qualification": profile.qualification,
                    "mobile_no": profile.mobile_no,
                    "experience": profile.experience,
                    "expertise": profile.expertise
                }
            else:
                role = 'unknown'
                profile_data = {}

            return Response({
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role,
                "profile": profile_data,
                "token": token.key
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def send_otp(self, request):
        """Send OTP to user's email"""
        phone_number = request.data.get('phone_number')
        email = request.data.get('email')
        
        if not phone_number or not email:
            return Response(
                {'error': 'Phone number and email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = send_otp_email(phone_number, email)
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Verify OTP code"""
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            otp_code = serializer.validated_data.get('otp_code', '')
            result = verify_otp(phone_number, otp_code)
            return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def check_verified(self, request):
        """Check if phone number is already verified"""
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({'error': 'Phone number required'}, status=status.HTTP_400_BAD_REQUEST)
        
        is_verified = is_otp_verified(phone_number)
        return Response({'is_verified': is_verified}, status=status.HTTP_200_OK)
