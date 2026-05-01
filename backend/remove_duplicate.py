
import os
import django
import sys

# Add the project directory to the sys.path
sys.path.append(r'c:\Users\albin\medical-scheduler\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from users.models import Doctor

docs = Doctor.objects.filter(name="Dr Anna Paul")
if docs.count() > 1:
    doc_to_keep = docs.first()
    docs_to_delete = docs.exclude(id=doc_to_keep.id)
    count = docs_to_delete.count()
    docs_to_delete.delete()
    print(f"Deleted {count} duplicate(s) of Dr Anna Paul. Kept ID: {doc_to_keep.id}")
else:
    print(f"Found {docs.count()} Anna Paul(s). No duplicates removed.")
