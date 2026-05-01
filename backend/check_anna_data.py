import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Doctor
from appointments.models import Appointment, DoctorAvailability

with open('check_anna_data.txt', 'w', encoding='utf-8') as f:
    f.write("--- Doctor 7 (User 31, Anna Paul) ---\n")
    d7 = Doctor.objects.filter(id=7).first()
    if d7:
        apts = Appointment.objects.filter(entity_type='DOCTOR', entity_id=d7.id)
        f.write(f"Appointments: {apts.count()}\n")
        avails = DoctorAvailability.objects.filter(doctor=d7)
        f.write(f"Availabilities: {avails.count()}\n")

    f.write("\n--- User 32 (Dr.anna) Doctor Profile ---\n")
    u32 = User.objects.filter(id=32).first()
    if u32:
        try:
            d32 = u32.doctor_profile
            f.write(f"Doctor ID: {d32.id}\n")
            apts = Appointment.objects.filter(entity_type='DOCTOR', entity_id=d32.id)
            f.write(f"Appointments: {apts.count()}\n")
            avails = DoctorAvailability.objects.filter(doctor=d32)
            f.write(f"Availabilities: {avails.count()}\n")
        except:
            f.write("No doctor profile found\n")
