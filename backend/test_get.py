import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient
from users.models import User

client = APIClient(SERVER_NAME='localhost')

# Get a Lab User
lab_user = User.objects.filter(role='LAB').first()
if getattr(lab_user, 'lab_profile', None):
    print(f"Testing GETs for Lab user: {lab_user.username}")
    client.force_authenticate(user=lab_user)

    endpoints = [
        '/api/appointments/',
        '/api/records/test-results/',
        '/api/users/notifications/'
    ]

    for ep in endpoints:
        resp = client.get(ep)
        print(f"GET {ep} -> Status: {resp.status_code}")
        if resp.status_code == 500:
            print(resp.content.decode('utf-8')[:500])

else:
    print("No LAB user found.")
