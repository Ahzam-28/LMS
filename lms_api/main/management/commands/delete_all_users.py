from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Delete all users from the database'

    def handle(self, *args, **options):
        count, _ = User.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} users from the database!')
        )
