
import os
import django
import sys
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

# Add the project directory to the sys.path
sys.path.append(r'C:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.views import DoctorViewSet
from users.models import Doctor

User = get_user_model()
admin_user = User.objects.get(username='appolo_clinic')

factory = APIRequestFactory()
request = factory.get('/api/users/doctors/')
force_authenticate(request, user=admin_user)

view = DoctorViewSet.as_view({'get': 'list'})
response = view(request)

print(f"Status: {response.status_code}")
print(f"Doctors: {response.data}")
