
import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(r'C:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic, Doctor
from users.serializers import DoctorSerializer

clinic = Clinic.objects.get(id=5) # Medwell clinic
admin = clinic.admin_user

print(f"Testing for Clinic: {clinic.name}, Admin: {admin.username}")

data = {
    'name': 'Dr Test',
    'specialty': 'General',
    'username': 'dr_test_unique_1',
    'password': 'password123',
    'email': 'test@example.com'
}

serializer = DoctorSerializer(data=data)
if serializer.is_valid():
    try:
        serializer.save(clinic=clinic)
        print("Doctor created successfully!")
        doc = Doctor.objects.get(name='Dr Test')
        print(f"Doctor Name: {doc.name}, Clinic: {doc.clinic.name}")
    except Exception as e:
        print(f"Error saving: {e}")
else:
    print(f"Validation errors: {serializer.errors}")
