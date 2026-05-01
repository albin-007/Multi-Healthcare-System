import os
import sys
import django

# Add the current directory to sys.path to help resolve imports like 'users'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

errors = []
for u in User.objects.all():
    try:
        data = UserSerializer(u).data
    except Exception as e:
        errors.append((u.username, str(e)))

print('Errors:', errors)
