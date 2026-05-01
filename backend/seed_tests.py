
import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medical_scheduler.settings')
django.setup()

from users.models import Lab, LabTest

tests = [
    ("Complete Blood Count (CBC)", "Hematology", 350, 450),
    ("Lipid Profile (Cholesterol)", "Biochemistry", 500, 700),
    ("Liver Function Test (LFT)", "Biochemistry", 600, 850),
    ("Kidney Function Test (KFT)", "Biochemistry", 550, 750),
    ("Thyroid Profile (T3, T4, TSH)", "Endocrinology", 450, 650),
    ("Blood Glucose (Fasting/PP)", "Biochemistry", 100, 200),
    ("Vitamin D (25-Hydroxy)", "Biochemistry", 1200, 1800),
    ("Vitamin B12 (Cobalamin)", "Biochemistry", 800, 1200),
    ("Urine Routine & Microscopy", "General", 150, 250),
    ("HbA1c (Glycated Hemoglobin)", "Biochemistry", 400, 550),
    ("Chest X-Ray", "Radiology", 500, 800),
    ("ECG (Electrocardiogram)", "Cardiology", 300, 500),
    ("Ultrasound Whole Abdomen", "Radiology", 1200, 2000),
    ("MRI Brain (Plain)", "Radiology", 5000, 8000),
    ("CT Scan Chest (HRCT)", "Radiology", 3000, 5500),
    ("Blood Grouping & Rh Factor", "Hematology", 150, 250),
    ("Dengue NS1 Antigen", "Serology", 600, 900),
    ("Malaria Parasite (Smear)", "Microbiology", 200, 350),
    ("Widal Test (Typhoid)", "Serology", 300, 450),
    ("C-Reactive Protein (CRP)", "Immunology", 400, 600),
    ("PSA (Prostate Specific Antigen)", "Endocrinology", 800, 1200),
    ("Calcium Total", "Biochemistry", 200, 350),
    ("Iron Profile", "Biochemistry", 600, 900),
    ("Electrolytes (Na, K, Cl)", "Biochemistry", 400, 600)
]

labs = Lab.objects.all()

for lab in labs:
    print(f"Populating tests for {lab.name}...")
    for name, category, min_p, max_p in tests:
        price = random.randint(min_p, max_p)
        # Avoid duplicates
        if not LabTest.objects.filter(lab=lab, name=name).exists():
            LabTest.objects.create(
                lab=lab,
                name=name,
                category=category,
                price=price,
                description=f"Standard {name} diagnostic procedure."
            )
            print(f"  Added {name} @ ₹{price}")

print("Done.")
