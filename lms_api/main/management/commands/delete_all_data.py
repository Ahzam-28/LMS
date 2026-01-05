from django.core.management.base import BaseCommand
from main.models import (
    Teacher, Student, Course, CourseCategory, Enrollment, 
    Lesson, LessonCategory, LessonFile, Quiz, Question, Answer, Result
)

class Command(BaseCommand):
    help = 'Delete all data from specified models'

    def handle(self, *args, **options):
        models = [
            Teacher, Student, Course, CourseCategory, Enrollment,
            Lesson, LessonCategory, LessonFile, Quiz, Question, Answer, Result
        ]
        
        for model in models:
            count, _ = model.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {count} records from {model.__name__}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('All data has been successfully deleted from all tables!')
        )
