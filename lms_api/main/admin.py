from django.contrib import admin
from . import models

admin.site.register(models.Teacher)
admin.site.register(models.CourseCategory)
admin.site.register(models.Course)
admin.site.register(models.Student)
admin.site.register(models.Enrollment)
admin.site.register(models.Lesson)
admin.site.register(models.Assignment)
admin.site.register(models.Submission)
admin.site.register(models.Quiz)
admin.site.register(models.Question)
admin.site.register(models.Answer)
admin.site.register(models.Result)
admin.site.register(models.Payment)
admin.site.register(models.Feedback)
admin.site.register(models.Resource)    
admin.site.register(models.FileSubmission)
