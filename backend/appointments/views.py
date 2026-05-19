from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta, date as dt_date

from users.models import Doctor, Clinic, User, Lab
from .models import Appointment, DoctorAvailability, AppointmentSlot, LabAvailability, LabHoliday, DoctorBreak, DoctorLeave
from .serializers import (
    AppointmentSerializer, AvailabilitySerializer, AppointmentSlotSerializer, 
    LabAvailabilitySerializer, LabHolidaySerializer, DoctorBreakSerializer, DoctorLeaveSerializer
)


class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = DoctorAvailability.objects.all()
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return DoctorAvailability.objects.all()
        elif self.request.user.role == 'DOCTOR':
            return DoctorAvailability.objects.filter(doctor__user=self.request.user)
        elif self.request.user.role == 'CLINIC':
            return DoctorAvailability.objects.filter(doctor__clinic__admin_user=self.request.user)
        return DoctorAvailability.objects.none()

class DoctorBreakViewSet(viewsets.ModelViewSet):
    queryset = DoctorBreak.objects.all()
    serializer_class = DoctorBreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return DoctorBreak.objects.all()
        elif user.role == 'DOCTOR':
            return DoctorBreak.objects.filter(doctor__user=user)
        elif user.role == 'CLINIC':
            return DoctorBreak.objects.filter(doctor__clinic__admin_user=user)
        return DoctorBreak.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'DOCTOR':
            doctor = getattr(self.request.user, 'doctor_profile', None)
            if doctor:
                serializer.save(doctor=doctor)
                return
        serializer.save()

class DoctorLeaveViewSet(viewsets.ModelViewSet):
    queryset = DoctorLeave.objects.all()
    serializer_class = DoctorLeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return DoctorLeave.objects.all()
        elif user.role == 'DOCTOR':
            return DoctorLeave.objects.filter(doctor__user=user)
        elif user.role == 'CLINIC':
            return DoctorLeave.objects.filter(doctor__clinic__admin_user=user)
        return DoctorLeave.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'DOCTOR':
            doctor = getattr(self.request.user, 'doctor_profile', None)
            if doctor:
                serializer.save(doctor=doctor)
                return
        serializer.save()

class LabAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = LabAvailability.objects.all()
    serializer_class = LabAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        lab_id = self.request.query_params.get('lab_id')
        
        if lab_id:
            return LabAvailability.objects.filter(lab_id=lab_id)
            
        if user.role == 'ADMIN':
            return LabAvailability.objects.all()
        elif user.role == 'LAB':
            return LabAvailability.objects.filter(lab__admin_user=user)
        return LabAvailability.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'LAB':
            lab = getattr(self.request.user, 'lab_profile', None)
            if lab:
                # Replace if already exists for this day
                day = serializer.validated_data.get('day_of_week')
                LabAvailability.objects.filter(lab=lab, day_of_week=day).delete()
                serializer.save(lab=lab)
                return
        serializer.save()

class LabHolidayViewSet(viewsets.ModelViewSet):
    queryset = LabHoliday.objects.all()
    serializer_class = LabHolidaySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        lab_id = self.request.query_params.get('lab_id')
        
        if lab_id:
            return LabHoliday.objects.filter(lab_id=lab_id)
            
        if user.role == 'ADMIN':
            return LabHoliday.objects.all()
        elif user.role == 'LAB':
            return LabHoliday.objects.filter(lab__admin_user=user)
        return LabHoliday.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'LAB':
            lab = getattr(self.request.user, 'lab_profile', None)
            if lab:
                serializer.save(lab=lab)
                return
        serializer.save()

class AppointmentSlotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppointmentSlot.objects.all()
    serializer_class = AppointmentSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _generate_slots(self, doctor, target_date):
        day_of_week = target_date.weekday()
        
        # 1. Check for Emergency Leave
        if DoctorLeave.objects.filter(doctor=doctor, date=target_date).exists():
            return []

        # 2. Get Availabilities and Breaks
        availabilities = DoctorAvailability.objects.filter(doctor=doctor, day_of_week=day_of_week)
        breaks = DoctorBreak.objects.filter(doctor=doctor, day_of_week=day_of_week)
        
        for avail in availabilities:
            current_time = datetime.combine(target_date, avail.start_time)
            end_time = datetime.combine(target_date, avail.end_time)
            
            while current_time + timedelta(minutes=avail.slot_duration) <= end_time:
                slot_end = current_time + timedelta(minutes=avail.slot_duration)
                
                # Check if this slot overlaps with any break
                is_on_break = False
                for b in breaks:
                    break_start = datetime.combine(target_date, b.start_time)
                    break_end = datetime.combine(target_date, b.end_time)
                    # If slot start or end falls within a break
                    if (current_time >= break_start and current_time < break_end) or \
                       (slot_end > break_start and slot_end <= break_end):
                        is_on_break = True
                        break
                
                if not is_on_break:
                    # Use get_or_create to avoid duplicates
                    AppointmentSlot.objects.get_or_create(
                        doctor=doctor,
                        start_time=timezone.make_aware(current_time),
                        end_time=timezone.make_aware(slot_end)
                    )
                
                current_time = slot_end

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        
        if not doctor_id or not date_str:
            return Response({"error": "doctor_id and date are required"}, status=400)
            
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            doctor = Doctor.objects.get(id=doctor_id)
            self._generate_slots(doctor, target_date)
            
            slots = AppointmentSlot.objects.filter(doctor=doctor, start_time__date=target_date)
            available_slots = []
            now = timezone.now()
            for s in slots:
                if s.start_time < now: continue
                if not s.is_booked:
                    if not s.is_locked() or s.locked_by == request.user:
                        available_slots.append(s)
            
            serializer = self.get_serializer(available_slots, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def all_slots(self, request):
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')
        
        if not doctor_id or not date_str:
            return Response({"error": "doctor_id and date are required"}, status=400)
            
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            doctor = Doctor.objects.get(id=doctor_id)
            self._generate_slots(doctor, target_date)
            
            slots = AppointmentSlot.objects.filter(doctor=doctor, start_time__date=target_date).order_by('start_time')
            serializer = self.get_serializer(slots, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        slot = self.get_object()
        if slot.is_booked:
            return Response({"error": "Slot already booked"}, status=400)
            
        if slot.is_locked() and slot.locked_by != request.user:
            return Response({"error": "Slot is temporarily locked by another user"}, status=400)
            
        slot.locked_by = request.user
        slot.locked_at = timezone.now()
        slot.save()
        return Response({"message": "Slot locked successfully"})


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'ADMIN':
            return Appointment.objects.all().order_by('-date')

        elif user.role == 'DOCTOR':
            doctor = getattr(user, 'doctor_profile', None)
            if doctor:
                return Appointment.objects.filter(entity_type='DOCTOR', entity_id=doctor.id).order_by('-date')
            return Appointment.objects.none()

        elif user.role == 'LAB':
            lab = getattr(user, 'lab_profile', None)
            if lab:
                return Appointment.objects.filter(entity_type='LAB', entity_id=lab.id).order_by('-date')
            return Appointment.objects.none()

        elif user.role == 'CLINIC':
            try:
                clinic = Clinic.objects.get(admin_user=user)
                doctor_ids = Doctor.objects.filter(clinic=clinic).values_list('id', flat=True)
                return Appointment.objects.filter(entity_type='DOCTOR', entity_id__in=doctor_ids).order_by('-date')
            except Exception as e:
                return Appointment.objects.none()

        else:
            return Appointment.objects.filter(user=user).order_by('-date')

    def create(self, request, *args, **kwargs):
        # Prevent 400 Errors on Retry: Reuse existing pending/unpaid appointment if it exists for this slot and user
        slot_id = request.data.get('slot')
        if slot_id:
            existing = Appointment.objects.filter(
                slot_id=slot_id, 
                user=request.user, 
                is_paid=False,
                status=Appointment.Status.PENDING
            ).first()
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)
        
        return super().create(request, *args, **kwargs)

    def _generate_token(self, entity_id, entity_type, date):
        # Find how many appointments are confirmed/scheduled for this entity on this day
        # and what position THIS appointment's time would take in a chronological list.
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # We calculate the token based on the "slot rank" for the day.
        # Since slots are defined by start time, we can determine the rank by 
        # looking at the availability and finding how many slots exist before it.
        
        start_hour = 9 # Default
        slot_duration = 15 # Default
        
        try:
            if entity_type == 'DOCTOR':
                avail = DoctorAvailability.objects.filter(doctor_id=entity_id, day_of_week=(date.weekday())).first()
                if avail:
                    start_hour = avail.start_time.hour
                    slot_duration = avail.slot_duration
            elif entity_type == 'LAB':
                avail = LabAvailability.objects.filter(lab_id=entity_id, day_of_week=(date.weekday())).first()
                if avail:
                    start_hour = avail.start_time.hour
                    slot_duration = avail.slot_duration
        except:
            pass

        # Calculate rank based on minutes from operational start
        op_start = date.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        diff_mins = (date - op_start).total_seconds() / 60
        rank = int(diff_mins / slot_duration) + 1
        
        # Ensure rank is at least 1 (in case user books a slot before official start)
        token_num = max(1, rank)
        return f"T-{token_num:02d}"

    def perform_create(self, serializer):
        try:
            data = serializer.validated_data
            slot = data.get('slot')
            
            if slot:
                if slot.is_booked:
                    raise ValidationError("This slot is already booked.")
                
                if Appointment.objects.filter(slot=slot).exists():
                    raise ValidationError("An appointment already exists for this slot.")

                if slot.is_locked() and slot.locked_by != self.request.user:
                    raise ValidationError("This slot is currently locked by another user.")
                
                # The slot remains "Unbooked" until payment is confirmed.
                # It is protected by the 'lock' during the transition.

            token = self._generate_token(
                entity_id=data.get('entity_id'),
                entity_type=data.get('entity_type'),
                date=data.get('date'),
            )
            
            target_user = self.request.user
            if target_user.role in ['DOCTOR', 'CLINIC', 'ADMIN'] and 'user_id' in self.request.data:
                try:
                    target_user = User.objects.get(id=self.request.data['user_id'])
                except User.DoesNotExist:
                    pass

            entity_type = data.get('entity_type')
            entity_id = data.get('entity_id')
            payment_mode = data.get('payment_mode', 'ONLINE')
            is_home_collection = self.request.data.get('is_home_collection', False)
            test_ids = self.request.data.get('test_ids') or self.request.data.get('tests', [])
            
            amount = 0
            if entity_type == 'DOCTOR':
                from users.models import Doctor
                doctor = Doctor.objects.filter(id=entity_id).first()
                if doctor and doctor.clinic:
                    if doctor.clinic.advance_payment and payment_mode == 'ONLINE':
                        amount = doctor.clinic.advance_payment + 2
                    else:
                        amount = doctor.clinic.consultation_fee + (2 if payment_mode == 'ONLINE' else 0)
            elif entity_type == 'LAB':
                from users.models import Lab
                lab = Lab.objects.filter(id=entity_id).first()
                if lab:
                    base_fee = 0 # Labs don't charge consultation fee by default
                    tests_fee = 0
                    if test_ids:
                        from users.models import LabTest
                        tests = LabTest.objects.filter(id__in=test_ids, lab=lab)
                        tests_fee = sum(t.price for t in tests)
                    
                    home_fee = 0
                    if is_home_collection and lab.home_collection_available:
                        home_fee = lab.home_collection_charge
                    
                    total_amount = base_fee + tests_fee + home_fee
                    
                    if lab.advance_payment and payment_mode == 'ONLINE':
                        amount = lab.advance_payment + 2
                    else:
                        amount = total_amount + (2 if payment_mode == 'ONLINE' else 0)

            # For Labs, all appointments should start as PENDING so they appear in "Incoming Test Requests"
            # Patients must be "Accepted" by the lab to move to "Test Schedule"
            initial_status = Appointment.Status.PENDING
            
            appointment = serializer.save(
                user=target_user, 
                token=token, 
                amount=amount, 
                payment_mode=payment_mode,
                is_home_collection=is_home_collection,
                status=initial_status
            )

            # If Pay at Clinic, mark slot as booked immediately
            if payment_mode == 'PAY_AT_CLINIC' and slot:
                slot.is_booked = True
                slot.save()
            
            if test_ids and entity_type == 'LAB':
                appointment.tests.set(test_ids)

            # Update TestRequest status if linked
            if appointment.test_request:
                appointment.test_request.status = 'BOOKED'
                appointment.test_request.save()

            # Create "Pending Payment" Notification if needed
            from users.models import Notification
            if appointment.status == Appointment.Status.PENDING and not appointment.is_paid:
                Notification.objects.create(
                    user=target_user,
                    title="Payment Required",
                    message=f"Complete your payment to confirm your appointment with {appointment.entity_name} on {appointment.date.date()}."
                )
            
            # Notify Lab Test Booked (Patient)
            if appointment.entity_type == 'LAB':
                Notification.objects.create(
                    user=target_user,
                    title="Lab Test Booked",
                    message=f"Your diagnostic test has been booked with {appointment.entity_name}."
                )

            # Notify Facility (Doctor or Lab)
            try:
                from users.models import Doctor, Lab
                facility_user = None
                if appointment.entity_type == 'DOCTOR':
                    doctor = Doctor.objects.filter(id=appointment.entity_id).first()
                    if doctor and doctor.user:
                        facility_user = doctor.user
                elif appointment.entity_type == 'LAB':
                    lab = Lab.objects.filter(id=appointment.entity_id).first()
                    if lab and lab.admin_user:
                        facility_user = lab.admin_user
                
                if facility_user:
                    Notification.objects.create(
                        user=facility_user,
                        title="New Appointment Request",
                        message=f"A new appointment has been booked by {target_user.username} for {appointment.date.strftime('%Y-%m-%d %H:%M')}."
                    )
            except Exception as e:
                print(f"Failed to notify facility: {e}")

        except Exception as e:
            import traceback
            print(f"BOOKING ERROR: {str(e)}")
            traceback.print_exc()
            raise ValidationError(f"Booking internal error: {str(e)}")

    def perform_update(self, serializer):
        instance = serializer.instance
        old_status = instance.status
        new_status = serializer.validated_data.get('status', instance.status)

        # Handle Cancellation
        if new_status == Appointment.Status.CANCELLED and old_status != Appointment.Status.CANCELLED:
            from django.utils import timezone
            instance.cancelled_by = self.request.user.role
            instance.cancelled_at = timezone.now()
            instance.cancellation_reason = self.request.data.get('cancellation_reason', 'Not specified')
            instance.save()

            # Release slot
            if instance.slot:
                instance.slot.is_booked = False
                instance.slot.locked_by = None
                instance.slot.locked_at = None
                instance.slot.save()
            
            # Handle Refund if paid
            if instance.is_paid:
                from payments.models import Payment
                from django.conf import settings
                import razorpay
                
                payment = Payment.objects.filter(appointment=instance).exclude(payment_status=Payment.Status.FAILED).last()
                
                if payment and payment.payment_status == Payment.Status.REFUNDED:
                    # Already refunded, skip
                    pass
                elif payment and payment.payment_id and instance.payment_mode == 'ONLINE':
                    try:
                        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                        # Razorpay refund
                        refund_res = client.payment.refund(payment.payment_id, {'amount': int(payment.amount * 100)})  # type: ignore
                        
                        payment.payment_status = Payment.Status.REFUNDED
                        payment.refund_id = refund_res.get('id')
                        payment.refund_processed_at = timezone.now()
                        payment.save()
                        
                        from users.models import Notification
                        Notification.objects.create(
                            user=instance.user,
                            title="Appointment Cancelled & Refunded",
                            message=f"Your appointment with {instance.entity_name} has been cancelled by the {instance.cancelled_by.lower()}. Reason: {instance.cancellation_reason}. A refund of ₹{instance.amount} has been initiated."
                        )
                    except Exception as e:
                        print(f"Refund failed: {e}")
                        from users.models import Notification
                        Notification.objects.create(
                            user=instance.user,
                            title="Appointment Cancelled",
                            message=f"Your appointment with {instance.entity_name} has been cancelled. We encountered an issue initiating your refund. Our team will contact you shortly."
                        )
                else:
                    # Not an online payment or no payment record found
                    from users.models import Notification
                    Notification.objects.create(
                        user=instance.user,
                        title="Appointment Cancelled",
                        message=f"Your appointment with {instance.entity_name} has been cancelled by the {instance.cancelled_by.lower()}. Reason: {instance.cancellation_reason}."
                    )
            else:
                from users.models import Notification
                Notification.objects.create(
                    user=instance.user,
                    title="Appointment Cancelled",
                    message=f"Your appointment with {instance.entity_name} has been cancelled by the {instance.cancelled_by.lower()}. Reason: {instance.cancellation_reason}."
                )


        if new_status == Appointment.Status.CONFIRMED and not instance.token:
            token = self._generate_token(
                entity_id=instance.entity_id,
                entity_type=instance.entity_type,
                date=instance.date,
            )
            serializer.save(token=token)
            
            # Notify Facility of confirmation
            try:
                from users.models import Notification, Doctor, Lab
                facility_user = None
                if instance.entity_type == 'DOCTOR':
                    doctor = Doctor.objects.filter(id=instance.entity_id).first()
                    facility_user = doctor.user if doctor else None
                elif instance.entity_type == 'LAB':
                    lab = Lab.objects.filter(id=instance.entity_id).first()
                    facility_user = lab.admin_user if lab else None
                
                if facility_user:
                    Notification.objects.create(
                        user=facility_user,
                        title="Appointment Confirmed",
                        message=f"The appointment for {instance.user.username} on {instance.date.date()} has been confirmed."
                    )
                
                # Also notify patient
                Notification.objects.create(
                    user=instance.user,
                    title="Appointment Confirmed",
                    message=f"Your appointment with {instance.entity_name} on {instance.date.date()} is now confirmed. Your token is {token}."
                )
            except Exception as e:
                print(f"Failed to notify of confirmation: {e}")
        elif new_status == Appointment.Status.CANCELLED and old_status != Appointment.Status.CANCELLED:
            # Release slot and refund handled above, but notify facility here
            try:
                from users.models import Notification, Doctor, Lab
                facility_user = None
                if instance.entity_type == 'DOCTOR':
                    doctor = Doctor.objects.filter(id=instance.entity_id).first()
                    facility_user = doctor.user if doctor else None
                elif instance.entity_type == 'LAB':
                    lab = Lab.objects.filter(id=instance.entity_id).first()
                    facility_user = lab.admin_user if lab else None
                
                if facility_user:
                    Notification.objects.create(
                        user=facility_user,
                        title="Appointment Cancelled",
                        message=f"The appointment for {instance.user.username} on {instance.date.date()} has been cancelled."
                    )
            except Exception as e:
                print(f"Failed to notify facility of cancellation: {e}")
            serializer.save()
        elif new_status == Appointment.Status.COMPLETED and old_status != Appointment.Status.COMPLETED:
            # Handle TestRequest completion
            if instance.test_request:
                instance.test_request.status = 'COMPLETED'
                instance.test_request.save()
            serializer.save()
        else:
            serializer.save()
