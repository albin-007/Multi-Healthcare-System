import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from appointments.models import Appointment
from users.models import User, Lab, Doctor

def migrate_appointments():
    print("Migrating LAB appointments...")
    lab_appointments = Appointment.objects.filter(entity_type='LAB')
    for apt in lab_appointments:
        # Check if entity_id is a User ID instead of a Lab ID
        if User.objects.filter(id=apt.entity_id, role='LAB').exists():
            user = User.objects.get(id=apt.entity_id)
            lab = getattr(user, 'lab_profile', None)
            if lab:
                print(f"Updating Lab Appointment {apt.id}: User ID {apt.entity_id} -> Lab ID {lab.id}")
                apt.entity_id = lab.id
                apt.save()
            else:
                print(f"Warning: Lab Appointment {apt.id} has User ID {apt.entity_id} but no Lab Profile found!")
        else:
            print(f"Lab Appointment {apt.id} already seems correct or target is not a LAB User (ID: {apt.entity_id}).")

    print("\nMigrating DOCTOR appointments...")
    doc_appointments = Appointment.objects.filter(entity_type='DOCTOR')
    for apt in doc_appointments:
        # Check if entity_id is a User ID instead of a Doctor ID
        if User.objects.filter(id=apt.entity_id, role='DOCTOR').exists():
            user = User.objects.get(id=apt.entity_id)
            doc = getattr(user, 'doctor_profile', None)
            if doc:
                print(f"Updating Doctor Appointment {apt.id}: User ID {apt.entity_id} -> Doctor ID {doc.id}")
                apt.entity_id = doc.id
                apt.save()
            else:
                print(f"Warning: Doctor Appointment {apt.id} has User ID {apt.entity_id} but no Doctor Profile found!")
        else:
            print(f"Doctor Appointment {apt.id} already seems correct or target is not a DOCTOR User (ID: {apt.entity_id}).")

if __name__ == "__main__":
    migrate_appointments()
