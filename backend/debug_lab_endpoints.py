import os
import sys
import django
from django.test import Client
import json
from django.conf import settings

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

settings.ALLOWED_HOSTS = ['*']

from users.models import User

def test_endpoints():
    client = Client()
    # Test labcenter
    response = client.post('/api/users/auth/login/', 
                           data=json.dumps({'username': 'labcenter', 'password': 'password123'}),
                           content_type='application/json')
    
    if response.status_code == 200:
        access = response.json()['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {access}'}
        
        # Test appointments
        res_apt = client.get('/api/appointments/', **headers)
        print(f"Appointments Result: {res_apt.status_code}")
        
        # Test test-results
        res_test = client.get('/api/records/test-results/', **headers)
        print(f"Test Results Result: {res_test.status_code}")
        
        # Test labs/me
        res_lab_me = client.get('/api/users/labs/me/', **headers)
        print(f"Lab Me Result: {res_lab_me.status_code}")

if __name__ == "__main__":
    test_endpoints()
