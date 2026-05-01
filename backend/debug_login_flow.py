import os
import sys
import django
from django.test import Client
import json
from django.conf import settings

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Override settings for the test
settings.ALLOWED_HOSTS = ['*']

from users.models import User

def test_lab_login():
    client = Client()
    # Test labcenter
    response = client.post('/api/users/auth/login/', 
                           data=json.dumps({'username': 'labcenter', 'password': 'password123'}),
                           content_type='application/json')
    
    print(f"Login Response Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict):
            access = data.get('access')
            if not access:
                print(f"Error: 'access' token not found in response: {data}")
                return
            print("Login Successful")
            
            # Test profiles/me
            response = client.get('/api/users/profiles/me/', 
                                  HTTP_AUTHORIZATION=f'Bearer {access}')
            print(f"Profiles/me Result: {response.status_code}")
            if response.status_code == 200:
                print(f"Profile Data: {response.json()}")
            else:
                content = response.content.decode('utf-8', errors='ignore')
                print(f"Profile Error (first 500 chars): {content[:500]}")
        else:
            print(f"Expected JSON dict but got {type(data).__name__}: {data}")
    else:
        content = response.content.decode('utf-8', errors='ignore')
        print(f"Login failed (first 500 chars): {content[:500]}")

if __name__ == "__main__":
    test_lab_login()
