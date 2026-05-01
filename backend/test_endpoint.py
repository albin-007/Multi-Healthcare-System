
import os
import django
import sys
from datetime import date as dt_date

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor
from appointments.views import AppointmentSlotViewSet
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
doctor = Doctor.objects.first()
if not doctor:
    print("No doctors found.")
    sys.exit()

# Try to find a Monday (0) or Tuesday (1) etc.
# Today is March 17, 2026 (Tuesday)
target_date = "2026-03-18" # Wednesday

request = factory.get(f'/api/appointments/slots/available_slots/?doctor_id={doctor.id}&date={target_date}')
view = AppointmentSlotViewSet.as_view({'get': 'available_slots'})
response = view(request)

print(f"Status: {response.status_code}")
print(f"Count: {len(response.data)}")
if len(response.data) > 0:
    print(f"First slot: {response.data[0]['start_time']}")
