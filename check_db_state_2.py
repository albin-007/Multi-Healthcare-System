import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic, Lab, Doctor
from appointments.models import Appointment

print("\n--- CLINICS & DOCTORS ---")
for c in Clinic.objects.all():
    print(f"\nClinic: {c.name} (ID: {c.id})")
    docs = Doctor.objects.filter(clinic=c)
    if not docs.exists():
        print("  No doctors.")
    for d in docs:
        print(f"  Doctor: {d.name} (ID: {d.id}), User: {d.user.username}")

print("\n--- DOCTORS WITHOUT CLINICS ---")
for d in Doctor.objects.filter(clinic__isnull=True):
    print(f"  Doctor: {d.name} (ID: {d.id}), User: {d.user.username}")

print("\n--- APPOINTMENTS FOR DOCTORS ---")
for a in Appointment.objects.filter(entity_type='DOCTOR'):
    try:
        doc = Doctor.objects.get(id=a.entity_id)
        print(f"  ID: {a.id}, User: {a.user.username}, Doctor: {doc.name}, Status: {a.status}")
    except Doctor.DoesNotExist:
        print(f"  ID: {a.id}, User: {a.user.username}, Doctor ID: {a.entity_id} (NOT FOUND), Status: {a.status}")
