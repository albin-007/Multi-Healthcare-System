import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic, Lab, Doctor
from appointments.models import Appointment

print("--- USERS ---")
for u in User.objects.all():
    print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}, Status: {u.status}")

print("\n--- CLINICS ---")
for c in Clinic.objects.all():
    print(f"ID: {c.id}, Name: {c.name}, Admin: {c.admin_user.username}")

print("\n--- LABS ---")
for l in Lab.objects.all():
    print(f"ID: {l.id}, Name: {l.name}, Admin: {l.admin_user.username}")

print("\n--- APPOINTMENTS ---")
for a in Appointment.objects.all():
    print(f"ID: {a.id}, User: {a.user.username}, Entity: {a.entity_type} {a.entity_id}, Status: {a.status}")
