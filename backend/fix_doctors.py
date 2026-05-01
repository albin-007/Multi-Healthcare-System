
import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor, Clinic

clinic = Clinic.objects.first()
if clinic:
    orphans = Doctor.objects.filter(clinic=None)
    for doc in orphans:
        doc.clinic = clinic
        doc.save()
        print(f"Assigned {doc.name} to {clinic.name}")
else:
    print("No clinics found.")
