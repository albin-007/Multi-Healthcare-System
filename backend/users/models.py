from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        USER = "USER", "User"
        CLINIC = "CLINIC", "Clinic"
        DOCTOR = "DOCTOR", "Doctor"
        LAB = "LAB", "Lab"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    # We will use the username field provided by AbstractUser but can use email for auth if needed
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    is_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Adding related_name to avoid conflicts with default User model during abstract setup (just in case)
    # Actually since AUTH_USER_MODEL is set, no conflicts should occur.

    def __str__(self):
        return f"{self.username} - {self.role} ({self.status})"

class PaymentType(models.TextChoices):
    PAY_AT_CLINIC = 'PAY_AT_CLINIC', 'Pay at Clinic/Lab'
    ONLINE = 'ONLINE', 'Online Payment'
    BOTH = 'BOTH', 'Both'

class Clinic(models.Model):
    name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    license_no = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    admin_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='clinic_profile')
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.BOTH)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=150.00)
    advance_payment = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Optional advance payment amount required")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Lab(models.Model):
    name = models.CharField(max_length=255)
    owner_name = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    license_no = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    admin_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='lab_profile')
    payment_type = models.CharField(max_length=20, choices=PaymentType.choices, default=PaymentType.BOTH)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    advance_payment = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Optional advance payment amount required")
    home_collection_available = models.BooleanField(default=False)
    home_collection_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    average_rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def update_rating(self):
        feedbacks = self.reviews.all()
        count = feedbacks.count()
        if count > 0:
            avg = sum(f.rating for f in feedbacks) / count
            self.average_rating = round(avg, 1)
            self.rating_count = count
        else:
            self.average_rating = 0.0
            self.rating_count = 0
        self.save()

    def __str__(self):
        return self.name

class LabTest(models.Model):
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='tests')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.lab.name} ({self.price})"

def verification_doc_upload_path(instance, filename):
    return f'verification_docs/{instance.entity_type}/{instance.entity_id}/{filename}'

class VerificationDocument(models.Model):
    class EntityType(models.TextChoices):
        CLINIC = 'clinic', 'Clinic'
        LAB = 'lab', 'Lab'

    class DocumentType(models.TextChoices):
        REGISTRATION_CERT = 'registration_cert', 'Registration Certificate'
        MEDICAL_LICENSE = 'medical_license', 'Medical License'
        ADDRESS_PROOF = 'address_proof', 'Address Proof'
        IDENTITY_PROOF = 'identity_proof', 'Identity Proof'
        LAB_LICENSE = 'lab_license', 'Lab License'
        LAB_PHOTO = 'lab_photo', 'Lab Photo'
        OTHER = 'other', 'Other'

    entity_type = models.CharField(max_length=10, choices=EntityType.choices)
    entity_id = models.IntegerField()  # FK to Clinic.id or Lab.id
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    file = models.FileField(upload_to=verification_doc_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents_uploaded')

    def __str__(self):
        return f"{self.entity_type} #{self.entity_id} - {self.document_type}"

class Doctor(models.Model):
    name = models.CharField(max_length=255)
    specialty = models.CharField(max_length=255)
    qualification = models.CharField(max_length=255, blank=True, null=True)
    license_no = models.CharField(max_length=100, blank=True, null=True)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='doctors', null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile', null=True, blank=True)
    average_rating = models.FloatField(default=0.0)
    rating_count = models.IntegerField(default=0)

    def update_rating(self):
        feedbacks = self.reviews.all()
        count = feedbacks.count()
        if count > 0:
            avg = sum(f.rating for f in feedbacks) / count
            self.average_rating = round(avg, 1)
            self.rating_count = count
        else:
            self.average_rating = 0.0
            self.rating_count = 0
        self.save()

    def __str__(self):
        return self.name

class Complaint(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_filed')
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints_received')
    subject = models.CharField(max_length=255)
    description = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Complaint by {self.user.username} against {self.target_user.username}"

class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    target_doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    target_lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.target_doctor:
            self.target_doctor.update_rating()
        if self.target_lab:
            self.target_lab.update_rating()

    def __str__(self):
        target = self.target_doctor.name if self.target_doctor else (self.target_lab.name if self.target_lab else "General")
        return f"Feedback by {self.user.username} for {target} - Rating: {self.rating}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

class TestRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        BOOKED = "BOOKED", "Booked"
        COMPLETED = "COMPLETED", "Completed"

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='test_requests')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_requests')
    tests = models.JSONField() # List of test names or objects
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request from {self.doctor.name} for {self.patient.username}"
