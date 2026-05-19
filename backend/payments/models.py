from django.db import models
from users.models import User
from appointments.models import Appointment

class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    payment_id = models.CharField(max_length=100, primary_key=True)
    order_id = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, default="UPI")
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    payment_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Refund tracking
    refund_id = models.CharField(max_length=100, blank=True, null=True)
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    objects = models.Manager()
    id: int
    DoesNotExist: type[Exception]

    def __str__(self):
        return f"UPI Payment {self.payment_id} - {self.payment_status}"
