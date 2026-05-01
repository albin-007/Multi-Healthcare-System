import os
import django
import sys
import json
from rest_framework.test import APIClient

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

def test_lab_api():
    client = APIClient()
    # Login as global1011
    user = User.objects.get(username='global1011')
    client.force_authenticate(user=user)
    
    # Test getting appointments
    res = client.get('/api/appointments/')
    print(f"Status: {res.status_code}")
    print(f"Data count: {len(res.data)}")
    for apt in res.data:
        print(f"Apt {apt['id']}: Status={apt['status']}, EntityID={apt['entity_id']}")

if __name__ == "__main__":
    test_lab_api()
