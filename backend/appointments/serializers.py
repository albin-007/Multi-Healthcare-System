from rest_framework import serializers
from django.db import models
from .models import Appointment, DoctorAvailability, AppointmentSlot, LabAvailability, LabHoliday, DoctorBreak, DoctorLeave
from users.serializers import UserSerializer
from users.models import Doctor, Lab

class AvailabilitySerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = DoctorAvailability
        fields = ['id', 'doctor', 'day_of_week', 'day_display', 'start_time', 'end_time', 'slot_duration']

    def validate(self, data):
        doctor = data.get('doctor')
        day = data.get('day_of_week')
        start = data.get('start_time')
        end = data.get('end_time')

        if start >= end:
            raise serializers.ValidationError("Start time must be before end time.")

        # Check for overlaps
        overlaps = DoctorAvailability.objects.filter(
            doctor=doctor,
            day_of_week=day
        ).filter(
            models.Q(start_time__lt=end, end_time__gt=start)
        )
        
        if self.instance:
            overlaps = overlaps.exclude(pk=self.instance.pk)
            
        if overlaps.exists():
            raise serializers.ValidationError("This time range overlaps with an existing schedule for this day.")

        return data

class DoctorBreakSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = DoctorBreak
        fields = ['id', 'doctor', 'day_of_week', 'day_display', 'start_time', 'end_time']

    def validate(self, data):
        if data.get('start_time') >= data.get('end_time'):
            raise serializers.ValidationError("Start time must be before end time.")
        return data

class DoctorLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorLeave
        fields = ['id', 'doctor', 'date', 'reason']

class LabAvailabilitySerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = LabAvailability
        fields = ['id', 'lab', 'day_of_week', 'day_display', 'start_time', 'end_time', 'slot_duration']
        read_only_fields = ['lab']

    def validate(self, data):
        start = data.get('start_time')
        end = data.get('end_time')
        if start >= end:
            raise serializers.ValidationError("Start time must be before end time.")
        return data

class LabHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = LabHoliday
        fields = ['id', 'lab', 'date', 'reason']
        read_only_fields = ['lab']

class AppointmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    entity_name = serializers.SerializerMethodField()
    test_details = serializers.SerializerMethodField()
    test_request_details = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    refund_details = serializers.SerializerMethodField()
    time_slot = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['user', 'token', 'entity_name', 'time_slot']

    def get_time_slot(self, obj):
        if not obj.date:
            return None
        from django.utils import timezone
        local_date = timezone.localtime(obj.date)
        return local_date.strftime('%I:%M %p')

    def get_entity_name(self, obj):
        if obj.entity_type == Appointment.EntityType.DOCTOR:
            doc = Doctor.objects.filter(id=obj.entity_id).first()
            return doc.name if doc else "Unknown Doctor"
        elif obj.entity_type == Appointment.EntityType.LAB:
            lab = Lab.objects.filter(id=obj.entity_id).first()
            return lab.name if lab else "Unknown Lab"
        return "Unknown"

    def get_test_details(self, obj):
        return [{"id": t.id, "name": t.name, "price": str(t.price)} for t in obj.tests.all()]

    def get_test_request_details(self, obj):
        if not obj.test_request:
            return None
        return {
            "id": obj.test_request.id,
            "doctor_name": obj.test_request.doctor.name,
            "tests": obj.test_request.tests
        }

    def get_payment_status(self, obj):
        from payments.models import Payment
        payment = Payment.objects.filter(appointment=obj).last()
        return payment.payment_status if payment else "NONE"

    def get_refund_details(self, obj):
        from payments.models import Payment
        payment = Payment.objects.filter(appointment=obj).last()
        if not payment or payment.payment_status != Payment.Status.REFUNDED:
            return None
        return {
            "refund_id": payment.refund_id,
            "amount": str(payment.amount),
            "status": "Completed" if payment.refund_id else "Processing",
            "timeline": "3-5 business days",
            "processed_at": payment.refund_processed_at
        }

class AppointmentSlotSerializer(serializers.ModelSerializer):
    is_locked = serializers.BooleanField(read_only=True)
    booking_details = serializers.SerializerMethodField()
    is_booked = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentSlot
        fields = ['id', 'doctor', 'start_time', 'end_time', 'is_booked', 'is_locked', 'locked_by', 'locked_at', 'booking_details']

    def get_is_booked(self, obj):
        # A slot is booked if the field is True OR if there is an active appointment linked to it
        if obj.is_booked:
            return True
        try:
            return obj.appointment.status != 'CANCELLED'
        except:
            return False

    def get_booking_details(self, obj):
        # Find the appointment linked to this slot
        try:
            appt = obj.appointment
            if appt.status != 'CANCELLED':
                return AppointmentSerializer(appt).data
        except:
            pass
        return None
