
import os
import django
import sys
from datetime import time

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor
from appointments.models import Availability

doctors = Doctor.objects.all()
if not doctors:
    print("No doctors found to add availability to.")
else:
    for doc in doctors:
        # Add availability for Monday to Friday, 9 AM to 5 PM
        for day in range(5):
            Availability.objects.get_or_create(
                doctor=doc,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration=30
            )
        print(f"Added availability for {doc.name}")

print("Seeding complete.")
