import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from users.models import User
from appointments.models import Appointment

client = APIClient(SERVER_NAME='localhost')

# Get a Lab User
lab_user = User.objects.filter(role='LAB').first()
if getattr(lab_user, 'lab_profile', None):
    print(f"Testing as Lab user: {lab_user.username}")
    client.force_authenticate(user=lab_user)

    apt = Appointment.objects.filter(entity_type='LAB').last()

    if apt:
        print(f"Using Appointment ID: {apt.id}")
        
        response = client.patch(f'/api/appointments/{apt.id}/', {'status': 'COMPLETED'}, format='json')
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except:
            print(f"Response content: {response.content.decode('utf-8')[:500]}...")
    else:
        print("No LAB appointment found.")
