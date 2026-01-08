from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from main.models import Teacher, CourseCategory, Course
from django.utils.crypto import get_random_string


class Command(BaseCommand):
    help = 'Create an Intro to Python course assigned to instructor Ahsan (creates instructor if missing)'

    def handle(self, *args, **options):
        username = 'ahsan'
        # Find or create user
        user = None
        try:
            user = User.objects.filter(username__iexact=username).first()
            if not user:
                # Try by name
                user = User.objects.filter(first_name__icontains='ahsan').first()
        except Exception:
            user = None

        if not user:
            user = User(username=username, first_name='Ahsan', email='ahsan@example.com')
            user.set_unusable_password()
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created User: {user.username}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Found existing User: {user.username}'))

        # Find or create Teacher
        teacher = Teacher.objects.filter(user=user).first()
        if not teacher:
            teacher = Teacher.objects.create(
                user=user,
                qualification='MSc Computer Science',
                mobile_no='0000000000',
                experience=5,
                expertise='Python, Django, REST APIs',
            )
            self.stdout.write(self.style.SUCCESS(f'Created Teacher record for {user.username}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Found existing Teacher: {teacher}'))

        # Find or create CourseCategory
        category_title = 'Programming'
        category, created = CourseCategory.objects.get_or_create(
            title__iexact=category_title,
            defaults={'title': category_title, 'description': 'Programming and software development courses'}
        )
        # get_or_create with case-insensitive requires a workaround
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created CourseCategory: {category.title}'))
        else:
            # If get_or_create didn't return created due to lookup using title__iexact, ensure we have the object
            if not category:
                category = CourseCategory.objects.create(title=category_title, description='Programming and software development courses')
                self.stdout.write(self.style.SUCCESS(f'Created CourseCategory: {category.title}'))
            else:
                self.stdout.write(self.style.NOTICE(f'Using existing CourseCategory: {category.title}'))

        # Generate a simple unique code
        base_code = 'PYINTRO'
        code = base_code
        while Course.objects.filter(code=code).exists():
            suffix = get_random_string(4, allowed_chars='0123456789')
            code = f"{base_code}{suffix}"

        # Create the course
        course = Course.objects.create(
            category=category,
            teacher=teacher,
            code=code,
            title='Intro to Python',
            description='A beginner-friendly introduction to Python programming. Covers syntax, data types, control flow, functions, and basic OOP.',
            price=499.00,
            is_available=True,
        )

        self.stdout.write(self.style.SUCCESS(f'Created Course: {course.code} - {course.title} (id={course.id})'))