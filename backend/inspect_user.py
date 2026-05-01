import os
import sys
import django

# Add the current directory to sys.path to help resolve imports like 'users'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Clinic

try:
    u = User.objects.get(username='appolo_clinic')
    print(f'USER_ID: {u.id}')
    print(f'ROLE: {u.role}')
    print(f'STATUS: {u.status}')
    print(f'VERIFIED: {u.is_verified}')
    
    clinic = Clinic.objects.filter(admin_user=u).first()
    if clinic:
        print(f'CLINIC_PROFILE_EXISTS: True')
        print(f'CLINIC_NAME: {clinic.name}')
        print(f'CLINIC_ID: {clinic.id}')
    else:
        print(f'CLINIC_PROFILE_EXISTS: False')
        
except User.DoesNotExist:
    print('USER_NOT_FOUND')
except Exception as e:
    print(f'ERROR: {str(e)}')
