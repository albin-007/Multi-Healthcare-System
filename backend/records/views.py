from rest_framework import viewsets, permissions
from .models import Prescription, TestResult
from .serializers import PrescriptionSerializer, TestResultSerializer
from users.models import Notification

class PatientReadonlyPermission(permissions.BasePermission):
    """
    Data protection: Standard 'USER' (patients) can only view their records. 
    They cannot create, modify, or delete explicit medical prescriptions or lab results.
    """
    def has_permission(self, request, view):
        if request.user.role == 'USER':
            return request.method in permissions.SAFE_METHODS
        return True

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, PatientReadonlyPermission]

    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')
        
        if user.role == 'ADMIN':
            queryset = Prescription.objects.all()
        elif user.role == 'DOCTOR':
            # Doctors can see all prescriptions if they filter by patient_id
            if patient_id:
                queryset = Prescription.objects.filter(patient_id=patient_id)
            else:
                queryset = Prescription.objects.filter(doctor__user=user)
        else:
            queryset = Prescription.objects.filter(patient=user)
            
        return queryset

    def perform_create(self, serializer):
        try:
            doctor = self.request.user.doctor_profile
            prescription = serializer.save(doctor=doctor)
            
            # Notify Patient
            Notification.objects.create(
                user=prescription.patient,
                title="New Prescription Issued",
                message=f"Dr. {doctor.name} has issued a new prescription for you. You can view it in your dashboard."
            )
        except Exception:
            serializer.save()

from rest_framework.parsers import MultiPartParser, FormParser

class TestResultViewSet(viewsets.ModelViewSet):
    serializer_class = TestResultSerializer
    permission_classes = [permissions.IsAuthenticated, PatientReadonlyPermission]
    parser_classes = [MultiPartParser, FormParser]


    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient_id')
        
        if user.role == 'ADMIN':
            queryset = TestResult.objects.all()
        elif user.role == 'LAB':
            queryset = TestResult.objects.filter(lab=user)
        elif user.role == 'DOCTOR':
            # Doctors only see lab results for tests they specifically requested
            doctor = getattr(user, 'doctor_profile', None)
            if patient_id:
                queryset = TestResult.objects.filter(patient_id=patient_id)
                if doctor:
                    queryset = queryset.filter(appointment__test_request__doctor=doctor)
            else:
                if doctor:
                    queryset = TestResult.objects.filter(appointment__test_request__doctor=doctor)
                else:
                    queryset = TestResult.objects.none()
        else:
            queryset = TestResult.objects.filter(patient=user)
            
        return queryset

    def perform_create(self, serializer):
        test_result = serializer.save(lab=self.request.user)
        
        # Notify Patient
        try:
            Notification.objects.create(
                user=test_result.patient,
                title="Lab Result Available",
                message="Your lab report is available"
            )
        except Exception as e:
            print(f"Failed to notify patient: {e}")

        # Auto-notify doctor if we can find one for this patient
        try:
            patient = test_result.patient
            # Find the most recent prescription for this patient in the last month
            prescription = Prescription.objects.filter(patient=patient).order_by('-created_at').first()
            
            if prescription:
                doctor_user = prescription.doctor.user
                Notification.objects.create(
                    user=doctor_user,
                    title="Lab Report Uploaded",
                    message=f"A new lab report has been uploaded for your patient {patient.get_full_name() or patient.username} for the test processed on {test_result.created_at.date()}."
                )
        except Exception as e:
            print(f"Failed to notify doctor: {e}")
