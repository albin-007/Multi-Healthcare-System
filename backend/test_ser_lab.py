import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

u = User.objects.get(username='labcenter')
ser = UserSerializer(u)
print(f"SERIALIZED DATA: {ser.data}")
