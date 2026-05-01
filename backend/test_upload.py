import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from users.models import User
from appointments.models import Appointment

client = APIClient(SERVER_NAME='localhost')

lab_user = User.objects.filter(role='LAB').first()
client.force_authenticate(user=lab_user)

apt = Appointment.objects.filter(entity_type='LAB').last()
file_obj = SimpleUploadedFile("test_report.png", b"file_content", content_type="image/png")

data = {
    'appointment_id': apt.id,
    'patient_id': apt.user.id,
    'result_data': "high BP",
    'is_normal': "true",
    'file': file_obj
}

# Second upload to trigger duplicate constraint
response = client.post('/api/records/test-results/', data, format='multipart')
print(f"Status: {response.status_code}")
try:
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Could not parse JSON: {e}")
    print(f"Content: {response.content.decode('utf-8')[:500]}")
