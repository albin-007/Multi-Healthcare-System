import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Doctor, Clinic

# Find any clinic to attach to, or none
default_clinic = Clinic.objects.first()

users_with_doctor_role = User.objects.filter(role=User.Role.DOCTOR)
for u in users_with_doctor_role:
    try:
        doc = getattr(u, 'doctor_profile', None)
        if not doc:
            raise AttributeError
    except AttributeError:
        # Create missing doctor profile
        doc = Doctor.objects.create(
            user=u,
            name=f"{u.first_name} {u.last_name}".strip() or u.username,
            specialty="General Practice",
            clinic=default_clinic
        )
        print(f"Created missing Doctor profile for user: {u.username}")

print("Done fixing detached doctor accounts.")
