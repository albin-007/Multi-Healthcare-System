import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

labs = User.objects.filter(role='LAB')
for u in labs:
    u.set_password('password1212')
    u.save()
    print(f"Password reset for: {u.username}")
