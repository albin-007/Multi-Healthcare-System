
import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic, Doctor

print("--- Clinics and Verification Status ---")
for clinic in Clinic.objects.all():
    admin = clinic.admin_user
    print(f"Clinic: {clinic.name}, Admin: {admin.username}, Verified: {admin.is_verified}")

print("\n--- Doctors and Clinics ---")
for doc in Doctor.objects.all():
    print(f"Doctor: {doc.name}, Clinic: {doc.clinic.name if doc.clinic else 'None'}")
