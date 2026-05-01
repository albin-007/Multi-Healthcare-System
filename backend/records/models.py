from django.db import models
from appointments.models import Appointment
from users.models import User, Doctor

class Prescription(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='prescription')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for {self.patient.username} by {self.doctor.name}"

class TestResult(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='test_result')
    lab = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issued_test_results')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_results')
    result_data = models.TextField() # Storing parameters and test results
    file = models.FileField(upload_to='test_results/', null=True, blank=True)
    is_normal = models.BooleanField(default=True) # Success/Normal flag
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"TestResult for {self.patient.username} by Lab {self.lab.username}"

