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

from .models import Teacher, Student , Course , CourseCategory , Enrollment , Lesson , Assignment , Submission , Quiz , Question , Answer , Result , Payment , Feedback , Resource , FileSubmission
from .serializers import TeacherSerializer, StudentSerializer , CourseSerializer , CourseCategorySerializer , EnrollmentSerializer , LessonSerializer , AssignmentSerializer , SubmissionSerializer , QuizSerializer , QuestionSerializer , AnswerSerializer , ResultSerializer , PaymentSerializer , FeedbackSerializer , ResourceSerializer , FileSubmissionSerializer , RegisterSerializer, LoginSerializer

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]
    
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
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
class AnswerViewSet(viewsets.ModelViewSet):
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
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
