from django.db import models
from users.models import User, Doctor, Lab

class DoctorAvailability(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.IntegerField(default=30)  # in minutes

    class Meta:
        db_table = 'doctor_availability'
        verbose_name_plural = "Doctor Availabilities"

    def __str__(self):
        return f"{self.doctor.name} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"

class LabAvailability(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.IntegerField(default=15)

    class Meta:
        db_table = 'lab_availability'
        unique_together = ('lab', 'day_of_week')

    def __str__(self):
        return f"{self.lab.name} - {self.get_day_of_week_display()}"

class LabHoliday(models.Model):
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='holidays')
    date = models.DateField()
    reason = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = 'lab_holidays'
        unique_together = ('lab', 'date')

    def __str__(self):
        return f"{self.lab.name} holiday on {self.date}"

class AppointmentSlot(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)
    
    # Locking mechanism for payment process
    locked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    def is_locked(self):
        if not self.locked_at:
            return False
        from django.utils import timezone
        import datetime
        # Lock expires after 10 minutes
        return timezone.now() < self.locked_at + datetime.timedelta(minutes=10)

    def __str__(self):
        return f"{self.doctor.name} slot: {self.start_time}"

class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class EntityType(models.TextChoices):
        DOCTOR = "DOCTOR", "Doctor"
        LAB = "LAB", "Lab"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments')
    entity_type = models.CharField(max_length=10, choices=EntityType.choices)
    
    # entity_id refers to Doctor ID if entity_type is DOCTOR, or User ID (for Lab) if entity_type is LAB
    entity_id = models.IntegerField()
    
    date = models.DateTimeField()
    slot = models.OneToOneField(AppointmentSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointment')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    token = models.CharField(max_length=20, blank=True, null=True)

    # Payment fields
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    is_paid = models.BooleanField(default=False)
    payment_mode = models.CharField(max_length=50, choices=[('ONLINE', 'Online'), ('PAY_AT_CLINIC', 'Pay at Clinic')], default='ONLINE')
    payment_intent_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Cancellation tracking
    cancellation_reason = models.CharField(max_length=255, blank=True, null=True)
    cancelled_by = models.CharField(max_length=50, blank=True, null=True) # Role: CLINIC, LAB, ADMIN, PATIENT
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Lab specific fields
    is_home_collection = models.BooleanField(default=False)
    tests = models.ManyToManyField('users.LabTest', blank=True, related_name='appointments')
    test_request = models.ForeignKey('users.TestRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')

    class Meta:
        db_table = 'appointments'

    @property
    def entity_name(self):
        if self.entity_type == self.EntityType.DOCTOR:
            doctor = Doctor.objects.filter(id=self.entity_id).first()
            return doctor.name if doctor else "Unknown Doctor"
        else:
            lab = Lab.objects.filter(id=self.entity_id).first()
            return lab.name if lab else "Unknown Lab"

    def __str__(self):
        return f"Appt {self.id} - {self.user.username} - {self.date}"
