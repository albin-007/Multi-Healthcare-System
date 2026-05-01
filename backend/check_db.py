import os
import sys
import django

# Add the current directory to sys.path to help resolve imports like 'users'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic, Doctor

def run():
    print("--- Users & Roles ---")
    for user in User.objects.all():
        print(f"User: {user.username}, Role: {user.role}, Status: {user.status}")
    
    print("\n--- Clinics ---")
    for clinic in Clinic.objects.all():
        print(f"Clinic ID {clinic.id}: Name={clinic.name}, Admin={clinic.admin_user.username}")

    print("\n--- Doctors ---")
    for doc in Doctor.objects.all():
        print(f"Doctor ID {doc.id}: Name={doc.name}, ClinicID={doc.clinic.id if doc.clinic else 'None'}")

if __name__ == "__main__":
    run()
