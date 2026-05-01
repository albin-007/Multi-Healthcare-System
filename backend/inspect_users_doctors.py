import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Doctor

with open('output_utf8.txt', 'w', encoding='utf-8') as f:
    f.write("--- Users ---\n")
    for u in User.objects.all():
        f.write(f"User {u.id}: {u.username}, Role: {u.role}\n")

    f.write("\n--- Doctors ---\n")
    for d in Doctor.objects.all():
        user_info = f"UserID: {d.user.id}" if d.user else "NO USER, NO ID"
        f.write(f"Doctor {d.id}: {d.name}, {user_info}\n")
