import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import User, Doctor

try:
    u32 = User.objects.get(id=32)
    
    # Check if User 32 has a placeholder doctor profile we just created and delete it
    d_placeholder = getattr(u32, 'doctor_profile', None)
    if d_placeholder and d_placeholder.id != 7:
        print(f"Deleting placeholder Doctor {d_placeholder.id} for Dr.anna")
        d_placeholder.delete()
        
    # Get the real doctor profile (Doctor 7) containing the appointments
    d7 = Doctor.objects.get(id=7)
    
    print(f"Linking Doctor 7 (with {d7.appointments.count() if hasattr(d7, 'appointments') else 'all'} appointments) to User 32 (Dr.anna)")
    # We must first ensure User 31 relinquishes it if needed, but reassigning the FK handles it
    d7.user = u32
    d7.save()
    
    print("Doctor 7 successfully linked to Dr.anna. All records restored!")
    
except Exception as e:
    print(f"Error: {e}")
