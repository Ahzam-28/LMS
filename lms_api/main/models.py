from django.db import models
from django.contrib.auth.models import User

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    qualification = models.CharField(max_length=200)
    mobile_no = models.CharField(max_length=20) 
    experience = models.IntegerField()
    expertise = models.TextField()
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

    class Meta:
        verbose_name_plural = "1. Teachers"


class CourseCategory(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField()

    def __str__(self):
        return self.title

    class Meta:
        verbose_name_plural = "2. Course Categories"


class Course(models.Model):
    category = models.ForeignKey(CourseCategory, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.code} - {self.title}"

    class Meta:
        verbose_name_plural = "3. Courses"


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    qualification = models.CharField(max_length=200)
    mobile_no = models.CharField(max_length=20)
    address = models.TextField()
    interested_categories = models.TextField()
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

    class Meta:
        verbose_name_plural = "4. Students"


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.student.user.username} - {self.course.code}"

    class Meta:
        verbose_name_plural = "5. Enrollments"


class LessonCategory(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lesson_categories')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"

    class Meta:
        verbose_name_plural = "6a. Lesson Categories"
        ordering = ['order']


class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    category = models.ForeignKey(LessonCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='lessons')
    title = models.CharField(max_length=150)
    content = models.TextField()
    upload_date = models.DateField(auto_now_add=True)
    video_url = models.URLField(blank=True, null=True)
    order = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.course.code} - {self.title}"

    class Meta:
        verbose_name_plural = "6. Lessons"
        ordering = ['category', 'order']


class LessonFile(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='files')
    title = models.CharField(max_length=150)
    file_url = models.URLField()
    
    def __str__(self):
        return f"{self.lesson.title} - {self.title}"

    class Meta:
        verbose_name_plural = "6b. Lesson Files"


class Assignment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=150)
    description = models.TextField()
    due_date = models.DateField()
    max_marks = models.IntegerField()

    def __str__(self):
        return f"{self.lesson.title} - {self.title}"

    class Meta:
        verbose_name_plural = "7. Assignments"


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    submission_date = models.DateField(auto_now_add=True)
    content = models.TextField()
    grade = models.CharField(max_length=10, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    marks_obtained = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"{self.assignment.title} - {self.student.user.username}"

    class Meta:
        verbose_name_plural = "8. Submissions"


class Quiz(models.Model):
    lesson_category = models.ForeignKey(LessonCategory, on_delete=models.CASCADE, related_name='quizzes', null=True, blank=True)
    title = models.CharField(max_length=150)
    description = models.TextField()
    total_marks = models.IntegerField()
    duration = models.IntegerField()
    order = models.IntegerField(default=0)

    def __str__(self):
        category_str = self.lesson_category.title if self.lesson_category else "No Category"
        return f"{category_str} - {self.title}"

    class Meta:
        verbose_name_plural = "9. Quizzes"
        ordering = ['order']

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    marks = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quiz.title} - {self.text[:50]}"

    class Meta:
        verbose_name_plural = "10. Questions"

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.question.text[:50]} - {self.text[:50]}"

    class Meta:
        verbose_name_plural = "11. Answers"

class Result(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    score = models.FloatField()
    grade_awarded = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.quiz.title} - {self.student.user.username} - {self.score}"

    class Meta:
        verbose_name_plural = "12. Results"


class Payment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_status = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.student.user.username} - {self.course.code} - {self.amount}"

    class Meta:
        verbose_name_plural = "13. Payments"


class Feedback(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='feedbacks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    comments = models.TextField()
    rating = models.IntegerField()

    def __str__(self):
        return f"{self.course.code} - {self.student.user.username} - {self.rating}"

    class Meta:
        verbose_name_plural = "14. Feedbacks"


class Resource(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=150)
    file_url = models.URLField()

    def __str__(self):
        return f"{self.course.code} - {self.title}"

    class Meta:
        verbose_name_plural = "15. Resources"


class FileSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='file_submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    submission_date = models.DateField(auto_now_add=True)
    file_url = models.URLField()
    grade = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.assignment.title} - {self.student.user.username}"

    class Meta:
        verbose_name_plural = "16. File Submissions"

class OTP(models.Model):
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)

    def __str__(self):
        return f"{self.phone_number} - {'Verified' if self.is_verified else 'Pending'}"

    class Meta:
        verbose_name_plural = "17. OTPs"
