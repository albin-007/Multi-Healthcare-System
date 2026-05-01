import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Lab

labs = User.objects.filter(role='LAB')
print(f"DEBUG: Found {labs.count()} lab users")
for u in labs:
    print(f"USER: {u.username} | STATUS: {u.status} | VERIFIED: {u.is_verified}")
    lab = getattr(u, 'lab_profile', None)
    if lab:
        print(f"  LAB PROFILE: {lab.name} | ID: {lab.id}")
    else:
        print(f"  LAB PROFILE: MISSING")
