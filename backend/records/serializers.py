from rest_framework import serializers
from .models import Prescription, TestResult
from appointments.serializers import AppointmentSerializer
from users.serializers import UserSerializer, DoctorSerializer

class PrescriptionSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)
    appointment_id = serializers.PrimaryKeyRelatedField(
        queryset=Prescription.appointment.field.related_model.objects.all(), source='appointment', write_only=True
    )
    doctor = DoctorSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=UserSerializer.Meta.model.objects.all(), source='patient', write_only=True
    )

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['doctor']

    def validate(self, attrs):
        appointment_obj = attrs.get('appointment')
        if not self.instance and appointment_obj:
            if Prescription.objects.filter(appointment=appointment_obj).exists():
                raise serializers.ValidationError({"appointment_id": ["A prescription for this appointment already exists."]})
        return attrs

class TestResultSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)
    appointment_id = serializers.PrimaryKeyRelatedField(
        queryset=TestResult.appointment.field.related_model.objects.all(), source='appointment', write_only=True
    )
    lab = UserSerializer(read_only=True)
    patient = UserSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=UserSerializer.Meta.model.objects.all(), source='patient', write_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TestResult
        fields = '__all__'
        read_only_fields = ['lab']

    def validate(self, attrs):
        appointment_obj = attrs.get('appointment')
        if not self.instance and appointment_obj:
            if TestResult.objects.filter(appointment=appointment_obj).exists():
                raise serializers.ValidationError({"appointment_id": ["Test result with this appointment already exists."]})
        return attrs

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

