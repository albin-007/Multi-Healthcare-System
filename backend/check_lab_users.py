import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User

labs = User.objects.filter(role='LAB')
for u in labs:
    print(f"USER: {u.username}")
    print(f"  ID: {u.id}")
    print(f"  IS_ACTIVE: {u.is_active}")
    print(f"  ROLE: {u.role}")
    print(f"  STATUS: {u.status}")
    print(f"  VERIFIED: {u.is_verified}")
    print(f"  HAS_LAB_PROFILE: {hasattr(u, 'lab_profile')}")
