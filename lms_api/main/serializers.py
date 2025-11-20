from rest_framework import serializers
from .models import Teacher , Student , Course ,  CourseCategory , Enrollment , Lesson , LessonCategory , LessonFile , Assignment , Submission , Quiz , Question , Answer , Result , Payment , Feedback , Resource , FileSubmission
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

class TeacherSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField(read_only=True)
    courses_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'user_details', 'qualification', 'mobile_no', 'experience', 'expertise', 'courses_count']
    
    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'name': obj.user.get_full_name() or obj.user.username
        }
    
    def get_courses_count(self, obj):
        return obj.courses.count()

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseCategory
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    category_details = CourseCategorySerializer(source='category', read_only=True)
    teacher_details = serializers.SerializerMethodField(read_only=True)
    enrollment_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'category', 'category_details', 'teacher', 'teacher_details', 'code', 'title', 'description', 'price', 'is_available', 'created_at', 'enrollment_count']
        read_only_fields = ['id', 'teacher', 'teacher_details', 'created_at', 'enrollment_count']
    
    def get_teacher_details(self, obj):
        try:
            teacher = obj.teacher
            return {
                'id': teacher.id,
                'name': teacher.user.get_full_name() or teacher.user.username,
                'qualification': teacher.qualification,
                'experience': teacher.experience
            }
        except:
            return None
    
    def get_enrollment_count(self, obj):
        """Count the number of enrollments for this course"""
        return obj.enrollment_set.count()

class EnrollmentSerializer(serializers.ModelSerializer):
    course_details = CourseSerializer(source='course', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'course', 'course_details', 'enrollment_date', 'status']

class LessonCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonCategory
        fields = '__all__'

class LessonSerializer(serializers.ModelSerializer):
    category_details = LessonCategorySerializer(source='category', read_only=True)
    files = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Lesson
        fields = ['id', 'course', 'category', 'category_details', 'title', 'content', 'upload_date', 'video_url', 'order', 'files']
        read_only_fields = ['id', 'course', 'upload_date']
    
    def get_files(self, obj):
        files = obj.files.all()
        return LessonFileSerializer(files, many=True).data


class LessonFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonFile
        fields = ['id', 'lesson', 'title', 'file_url']
        read_only_fields = ['id']


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'
class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'
class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'lesson_category', 'title', 'description', 'total_marks', 'duration', 'order']
        read_only_fields = ['id']

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'question', 'text', 'is_correct']
        read_only_fields = ['id']

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'marks', 'answers']
        read_only_fields = ['id']
class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'course', 'amount', 'payment_status', 'payment_date']
        read_only_fields = ['id', 'payment_date']
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = '__all__'
class FileSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileSubmission
        fields = '__all__'

    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('student', 'Student'), ('teacher', 'Teacher')])
    qualification = serializers.CharField(required=True)
    mobile_no = serializers.CharField(required=True)
    experience = serializers.IntegerField(required=False)
    interested_categories = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'qualification', 'mobile_no', 'experience', 'interested_categories']

    def create(self, validated_data):
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        # Validate for role first 
        # BEfore creating user/student

        # Create user with hashed password
        user = User.objects.create_user(username=username, email=email, password=password)

        # Create the appropriate profile
        if role == 'student':
            Student.objects.create(
                user=user,
                qualification=validated_data.get('qualification', ''),
                mobile_no=validated_data.get('mobile_no', ''),
                interested_categories=validated_data.get('interested_categories', '')
            )
        elif role == 'teacher':
            Teacher.objects.create(
                user=user,
                qualification=validated_data.get('qualification', ''),
                mobile_no=validated_data.get('mobile_no', ''),
                experience=validated_data.get('experience', '')
            )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")


class OTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6, required=False)

    class Meta:
        fields = ['phone_number', 'otp_code']
