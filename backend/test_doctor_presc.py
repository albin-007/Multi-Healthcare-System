import os
import django
import sys
import json
from django.test import Client

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

def test_doctor_api():
    client = Client()
    # Login as doctor_nani
    user = User.objects.get(username='doctor_nani')
    # We can't easily get the token here without knowing the password, but we can use force_authenticate or just mock it.
    # Actually, we can just use the internal test client and mock the user.
    from rest_framework.test import APIClient
    api_client = APIClient()
    api_client.force_authenticate(user=user)
    
    # Test getting prescriptions
    res = api_client.get('/api/records/prescriptions/')
    print(f"Prescriptions Status: {res.status_code}")
    print(f"Prescriptions Data: {json.dumps(res.data, indent=2)}")
    
    # Test writing a prescription
    # First find an appointment for this doctor
    from appointments.models import Appointment
    # In my previous debug output, Appointment ID 10 is for doctor_nani (entity_id 5)
    apt = Appointment.objects.get(id=10)
    
    # Try to write a prescription for an appointment that already has one (ID 10 has one)
    res_post_err = api_client.post('/api/records/prescriptions/', {
        'appointment_id': apt.id,
        'patient_id': apt.user.id,
        'notes': 'Test notes'
    })
    print(f"\nDuplicate Prescription Status: {res_post_err.status_code}")
    print(f"Duplicate Prescription Data: {json.dumps(res_post_err.data, indent=2)}")

if __name__ == "__main__":
    test_doctor_api()
