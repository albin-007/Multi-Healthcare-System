
import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor, Clinic
from appointments.models import Availability, AppointmentSlot

print("--- Doctors ---")
for doc in Doctor.objects.all():
    print(f"ID: {doc.id}, Name: {doc.name}")

print("\n--- Availabilities ---")
for avail in Availability.objects.all():
    print(f"Doc: {avail.doctor.name}, Day: {avail.get_day_of_week_display()}, {avail.start_time} - {avail.end_time}")

print("\n--- Slots ---")
for slot in AppointmentSlot.objects.all()[:10]:
    print(f"Doc: {slot.doctor.name}, Start: {slot.start_time}, Booked: {slot.is_booked}")
