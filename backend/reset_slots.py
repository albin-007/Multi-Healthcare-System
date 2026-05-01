
import os
import django
import sys
from datetime import time, timedelta, datetime

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor
from appointments.models import Availability, AppointmentSlot

# 1. Clear existing
AppointmentSlot.objects.all().delete()
Availability.objects.all().delete()

doctors = Doctor.objects.all()
if not doctors:
    print("No doctors found.")
else:
    for doc in doctors:
        # Add availability for Monday to Friday, 9 AM to 5 PM
        for day in range(5):
            Availability.objects.create(
                doctor=doc,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration=30
            )
        print(f"Propagated availability for {doc.name}")

print("Seeding complete and slots cleared (they will regenerate on request).")
