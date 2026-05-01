import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Doctor
from records.models import Prescription
from appointments.models import Appointment

print("--- Doctors ---")
for d in Doctor.objects.all():
    print(f"Doctor ID: {d.id}, Name: {d.name}, User: {d.user.username if d.user else 'None'}")

print("\n--- Prescriptions ---")
for p in Prescription.objects.all():
    print(f"Prescription ID: {p.id}, Appointment: {p.appointment.id}, Doctor: {p.doctor.name}, Patient: {p.patient.username}")

print("\n--- Appointments ---")
for a in Appointment.objects.all():
    presc_exists = hasattr(a, 'prescription')
    print(f"Appointment ID: {a.id}, User: {a.user.username if a.user else 'None'}, Entity: {a.entity_id} ({a.entity_type}), Status: {a.status}, Prescription: {presc_exists}")
