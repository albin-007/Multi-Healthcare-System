from rest_framework import generics, viewsets, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.conf import settings
import os

from django.db.models import Sum
from appointments.models import Appointment
from payments.models import Payment
from records.models import Prescription, TestResult
from records.serializers import PrescriptionSerializer, TestResultSerializer
from appointments.serializers import AppointmentSerializer

from .models import User, Clinic, Doctor, Complaint, Feedback, Lab, VerificationDocument, Notification, LabTest, TestRequest
from .serializers import (
    RegisterSerializer, UserSerializer, ClinicSerializer,
    DoctorSerializer, ComplaintSerializer, FeedbackSerializer,
    LabSerializer, VerificationDocumentSerializer, NotificationSerializer, LabTestSerializer, TestRequestSerializer
)
from .permissions import IsAdmin, IsClinic

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'], parser_classes=[MultiPartParser, FormParser])
    def update_me(self, request):
        try:
            user = request.user
            data = request.data
            
            # Handle Password Update
            new_password = data.get('new_password')
            if new_password:
                confirm_password = data.get('confirm_password')
                if not confirm_password:
                    return Response({"detail": "Please confirm your new password"}, status=status.HTTP_400_BAD_REQUEST)
                if new_password != confirm_password:
                    return Response({"detail": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Use Django's built-in password validation if desired
                try:
                    from django.contrib.auth.password_validation import validate_password
                    validate_password(new_password, user)
                except Exception as e:
                    return Response({"detail": list(e.messages) if hasattr(e, 'messages') else str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
                user.set_password(new_password)
                user.save()

            # Handle Facility Profile Updates for Clinic/Lab roles
            if user.role == User.Role.CLINIC and hasattr(user, 'clinic_profile'):
                profile = user.clinic_profile
                profile.name = data.get('name', profile.name)
                profile.address = data.get('address', profile.address)
                profile.pincode = data.get('pincode', profile.pincode)
                profile.save()
            elif user.role == User.Role.LAB and hasattr(user, 'lab_profile'):
                profile = user.lab_profile
                profile.name = data.get('name', profile.name)
                profile.address = data.get('address', profile.address)
                profile.pincode = data.get('pincode', profile.pincode)
                profile.save()

            serializer = self.get_serializer(user, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.APPROVED
        user.is_verified = True
        user.save()
        return Response({'status': 'User approved and verified'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        user = self.get_object()
        user.status = User.Status.REJECTED
        user.is_verified = False
        user.save()
        return Response({'status': 'User application rejected'})

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        patient = self.get_object()
        
        # Security check: Only allow if requesting user is authorized
        user = request.user
        can_access = False
        
        if user.role == 'ADMIN' or user.id == patient.id:
            can_access = True
        elif user.role in ['DOCTOR', 'LAB', 'CLINIC']:
            # Check for existing appointments
            if user.role == 'DOCTOR':
                doctor = getattr(user, 'doctor_profile', None)
                if doctor:
                    can_access = Appointment.objects.filter(user=patient, entity_type='DOCTOR', entity_id=doctor.id).exists()
            elif user.role == 'LAB':
                lab = getattr(user, 'lab_profile', None)
                if lab:
                    can_access = Appointment.objects.filter(user=patient, entity_type='LAB', entity_id=lab.id).exists()
            elif user.role == 'CLINIC':
                doctor_ids = Doctor.objects.filter(clinic__admin_user=user).values_list('id', flat=True)
                can_access = Appointment.objects.filter(user=patient, entity_type='DOCTOR', entity_id__in=doctor_ids).exists()
        
        if not can_access:
            return Response({"detail": "Permission denied. You must have an appointment with this patient to view their history."}, status=status.HTTP_403_FORBIDDEN)

        appointments = Appointment.objects.filter(user=patient).order_by('-date')
        prescriptions = Prescription.objects.filter(patient=patient).order_by('-created_at')
        test_results = TestResult.objects.filter(patient=patient).order_by('-created_at')
        
        return Response({
            'patient_details': UserSerializer(patient, context={'request': request}).data,
            'appointments': AppointmentSerializer(appointments, many=True, context={'request': request}).data,
            'prescriptions': PrescriptionSerializer(prescriptions, many=True, context={'request': request}).data,
            'test_results': TestResultSerializer(test_results, many=True, context={'request': request}).data,
        })


class ClinicViewSet(viewsets.ModelViewSet):
    queryset = Clinic.objects.all()
    serializer_class = ClinicSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees everything
        if not user.is_anonymous and user.role == 'ADMIN':
            return Clinic.objects.all().order_by('-created_at')
            
        # Clinic user sees their own profile
        if not user.is_anonymous and user.role == 'CLINIC':
            return Clinic.objects.filter(admin_user=user)
            
        # Patients and anonymous users see only approved clinics
        return Clinic.objects.filter(admin_user__status=User.Status.APPROVED).order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(admin_user=self.request.user)
        # Handle verification document if uploaded during initialization
        doc = self.request.FILES.get('document')
        if doc:
            VerificationDocument.objects.create(
                entity_type=VerificationDocument.EntityType.CLINIC,
                entity_id=instance.id,
                document_type=VerificationDocument.DocumentType.REGISTRATION_CERT,
                file=doc,
                uploaded_by=self.request.user
            )


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all doctors
        if not user.is_anonymous and user.role == 'ADMIN':
            return Doctor.objects.all()
        
        # Clinic users see their own doctors
        if not user.is_anonymous and user.role == 'CLINIC':
            return Doctor.objects.filter(clinic__admin_user=user)
        
        # Patients and anonymous users see only doctors from approved clinics
        return Doctor.objects.filter(clinic__admin_user__status=User.Status.APPROVED)

    def perform_create(self, serializer):
        if self.request.user.role == 'CLINIC':
            try:
                clinic = Clinic.objects.get(admin_user=self.request.user)
                serializer.save(clinic=clinic)
            except Clinic.DoesNotExist:
                raise serializers.ValidationError("Clinic profile not found for this user.")
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        doctor = getattr(request.user, 'doctor_profile', None)
        if doctor:
            serializer = self.get_serializer(doctor)
            return Response(serializer.data)
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def resolve(self, request, pk=None):
        complaint = self.get_object()
        complaint.is_resolved = True
        complaint.save()
        return Response({'status': 'Complaint marked as resolved'})


class LabViewSet(viewsets.ModelViewSet):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees everything
        if not user.is_anonymous and user.role == 'ADMIN':
            return Lab.objects.all().order_by('-created_at')
            
        # Lab user sees their own profile
        if not user.is_anonymous and user.role == 'LAB':
            return Lab.objects.filter(admin_user=user)
            
        # Patients and anonymous users see only approved labs
        return Lab.objects.filter(admin_user__status=User.Status.APPROVED).order_by('-created_at')

    def perform_create(self, serializer):
        instance = serializer.save(admin_user=self.request.user)
        # Handle verification document if uploaded during initialization
        doc = self.request.FILES.get('document')
        if doc:
            VerificationDocument.objects.create(
                entity_type=VerificationDocument.EntityType.LAB,
                entity_id=instance.id,
                document_type=VerificationDocument.DocumentType.REGISTRATION_CERT,
                file=doc,
                uploaded_by=self.request.user
            )


    @action(detail=False, methods=['get'])
    def me(self, request):
        lab = getattr(request.user, 'lab_profile', None)
        if lab:
            serializer = self.get_serializer(lab)
            return Response(serializer.data)
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post', 'patch'])
    def update_profile(self, request):
        data = request.data
        lab, created = Lab.objects.update_or_create(
            admin_user=request.user,
            defaults={
                'name': data.get('name', 'Pending Initialization'),
                'address': data.get('address', 'Pending Initialization'),
                'license_no': data.get('license_no', 'Pending Initialization'),
            }
        )
        serializer = self.get_serializer(lab, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class LabTestViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        lab_id = self.request.query_params.get('lab_id')
        user = self.request.user

        if lab_id:
            # If a specific lab is requested, ensure it's either the owner's lab, 
            # or the lab is approved.
            qs = LabTest.objects.filter(lab_id=lab_id)
            if not user.is_anonymous and (user.role == 'ADMIN' or (user.role == 'LAB' and user.lab_profile.id == int(lab_id))):
                return qs
            return qs.filter(lab__admin_user__status=User.Status.APPROVED)
        
        if not user.is_anonymous:
            if user.role == 'ADMIN':
                return LabTest.objects.all()
            if user.role == 'LAB':
                return LabTest.objects.filter(lab__admin_user=user)
        
        # Patients and anonymous users see only tests from approved labs
        return LabTest.objects.filter(lab__admin_user__status=User.Status.APPROVED)

    def perform_create(self, serializer):
        if self.request.user.role == 'LAB':
            try:
                lab = Lab.objects.get(admin_user=self.request.user)
                serializer.save(lab=lab)
            except Lab.DoesNotExist:
                raise serializers.ValidationError("Lab profile not found.")
        else:
            serializer.save()

class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=self.request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})


# ── VERIFICATION DOCUMENT MANAGEMENT ─────────────────────────────────────────

class VerificationDocumentViewSet(viewsets.ModelViewSet):
    """Upload and list verification documents for clinics or labs."""
    serializer_class = VerificationDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        qs = VerificationDocument.objects.all().order_by('-uploaded_at')

        # Admin can see all
        if user.role == 'ADMIN':
            return qs

        # Clinic users see their own clinic's docs
        if user.role == 'CLINIC':
            try:
                clinic = Clinic.objects.get(admin_user=user)
                return qs.filter(entity_type='clinic', entity_id=clinic.id)
            except Clinic.DoesNotExist:
                return VerificationDocument.objects.none()

        # Lab users see their own lab's docs
        if user.role == 'LAB':
            try:
                lab = Lab.objects.get(admin_user=user)
                return qs.filter(entity_type='lab', entity_id=lab.id)
            except Lab.DoesNotExist:
                return VerificationDocument.objects.none()

        return VerificationDocument.objects.none()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def by_entity(self, request):
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')
        qs = VerificationDocument.objects.filter(entity_type=entity_type, entity_id=entity_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class PendingApprovalsView(generics.ListAPIView):
    """Returns separate lists of pending clinics and labs for admin approval."""
    permission_classes = [IsAdmin]

    def list(self, request, *args, **kwargs):
        pending_clinics = Clinic.objects.filter(
            admin_user__status='PENDING'
        ).order_by('-created_at')

        pending_labs = Lab.objects.filter(
            admin_user__status='PENDING'
        ).order_by('-created_at')

        approved_clinics = Clinic.objects.filter(
            admin_user__status='APPROVED'
        ).order_by('-created_at')

        approved_labs = Lab.objects.filter(
            admin_user__status='APPROVED'
        ).order_by('-created_at')

        rejected_clinics = Clinic.objects.filter(
            admin_user__status='REJECTED'
        ).order_by('-created_at')

        rejected_labs = Lab.objects.filter(
            admin_user__status='REJECTED'
        ).order_by('-created_at')

        ctx = {'request': request}
        return Response({
            'pending_clinics': ClinicSerializer(pending_clinics, many=True, context=ctx).data,
            'pending_labs': LabSerializer(pending_labs, many=True, context=ctx).data,
            'approved_clinics': ClinicSerializer(approved_clinics, many=True, context=ctx).data,
            'approved_labs': LabSerializer(approved_labs, many=True, context=ctx).data,
            'rejected_clinics': ClinicSerializer(rejected_clinics, many=True, context=ctx).data,
            'rejected_labs': LabSerializer(rejected_labs, many=True, context=ctx).data,
        })


class TestRequestViewSet(viewsets.ModelViewSet):
    queryset = TestRequest.objects.all()
    serializer_class = TestRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            doctor = getattr(user, 'doctor_profile', None)
            return TestRequest.objects.filter(doctor=doctor)
        elif user.role == 'USER':
            return TestRequest.objects.filter(patient=user)
        return TestRequest.objects.none()

    def perform_create(self, serializer):
        doctor = getattr(self.request.user, 'doctor_profile', None)
        serializer.save(doctor=doctor)

class AdminDashboardDataView(generics.GenericAPIView):
    """Provides consolidated stats, payments, and appointments for the Admin Dashboard."""
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        total_users = User.objects.filter(role=User.Role.USER).count()
        total_doctors = Doctor.objects.count()
        total_clinics = Clinic.objects.count()
        total_labs = Lab.objects.count()
        total_appointments = Appointment.objects.count()
        total_lab_tests = LabTest.objects.count()

        total_revenue = Payment.objects.filter(payment_status='SUCCESS').aggregate(Sum('amount'))['amount__sum'] or 0
        commission_rate = getattr(settings, 'PLATFORM_COMMISSION_RATE', 0.10)
        commission_earned = float(total_revenue) * commission_rate

        recent_payments = Payment.objects.order_by('-created_at')[:20]
        payments_data = []
        for p in recent_payments:
            payments_data.append({
                'payment_id': p.payment_id,
                'amount': p.amount,
                'status': p.payment_status,
                'user_name': p.user.username if p.user else 'Unknown',
                'date': p.created_at,
                'method': p.payment_method
            })

        recent_appointments = Appointment.objects.order_by('-date')[:50]
        appointments_data = []
        for a in recent_appointments:
            appointments_data.append({
                'id': a.id,
                'user_name': a.user.username,
                'entity_name': a.entity_name,
                'date': a.date,
                'status': a.status,
                'amount': a.amount,
                'is_paid': a.is_paid
            })

        return Response({
            'stats': {
                'total_users': total_users,
                'total_doctors': total_doctors,
                'total_clinics': total_clinics,
                'total_labs': total_labs,
                'total_appointments': total_appointments,
                'total_lab_tests': total_lab_tests,
                'total_revenue': total_revenue,
                'commission_earned': commission_earned,
            },
            'recent_payments': payments_data,
            'recent_appointments': appointments_data
        })

