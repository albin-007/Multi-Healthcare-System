import razorpay
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from appointments.models import Appointment
from .models import Payment

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CreateUPIOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get('appointment_id')
        try:
            appointment = Appointment.objects.get(id=appointment_id, user=request.user)
            
            # Ensure amount is at least 1 (Razorpay requires positive amount)
            amount_val = appointment.amount if appointment.amount > 0 else 1.00
            amount_paise = int(amount_val * 100)
            
            data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"upi_rcp_{appointment.id}",
                "payment_capture": 1 # Auto capture
            }
            
            try:
                # Attempt to create real Razorpay order
                order = client.order.create(data=data)  # type: ignore
                return Response({
                    'order_id': order['id'],
                    'amount': order['amount'],
                    'currency': order['currency'],
                    'key': settings.RAZORPAY_KEY_ID
                })
            except Exception as rzp_error:
                # Fallback to Mock Order if keys are placeholders/invalid in DEBUG mode
                if settings.DEBUG:
                    import uuid
                    mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
                    print(f"RAZORPAY ERROR: {str(rzp_error)}. Falling back to MOCK order {mock_order_id}")
                    return Response({
                        'order_id': mock_order_id,
                        'amount': amount_paise,
                        'currency': 'INR',
                        'key': settings.RAZORPAY_KEY_ID,
                        'is_mock': True
                    })
                raise rzp_error
            
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyUPIPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        try:
            # Verify signature (Skip verification if in DEBUG mode with placeholder/mock keys)
            is_placeholder = settings.RAZORPAY_KEY_ID == 'rzp_test_your_id_here'
            is_mock = data.get('razorpay_order_id', '').startswith('order_mock_')
            
            if not (settings.DEBUG and (is_placeholder or is_mock)):
                client.utility.verify_payment_signature({  # type: ignore
                    'razorpay_order_id': data.get('razorpay_order_id'),
                    'razorpay_payment_id': data.get('razorpay_payment_id'),
                    'razorpay_signature': data.get('razorpay_signature')
                })
            
            appointment = Appointment.objects.get(id=data.get('appointment_id'))
            appointment.is_paid = True
            
            # For Labs, we keep it PENDING so they can manually "Accept & Schedule" 
            # as per the unified workflow requested. Only auto-confirm for Doctors.
            if appointment.entity_type == 'DOCTOR':
                appointment.status = Appointment.Status.CONFIRMED
            else:
                appointment.status = Appointment.Status.PENDING
            
            # If a slot is associated, mark it as booked
            if appointment.slot:
                appointment.slot.is_booked = True
                appointment.slot.save()
                
            appointment.save()

            # Create Notifications
            from users.models import Notification, Doctor, Lab
            
            # 1. Notify Patient
            if appointment.entity_type == 'DOCTOR':
                Notification.objects.create(
                    user=appointment.user,
                    title="Payment Successful & Appointment Confirmed",
                    message=f"Your appointment with {appointment.entity_name} on {appointment.date.date()} at {appointment.date.time()} has been confirmed. Token: {appointment.token}"
                )
            else:
                Notification.objects.create(
                    user=appointment.user,
                    title="Payment Successful - Awaiting Lab Confirmation",
                    message=f"Your payment for {appointment.entity_name} was successful. The lab will review and schedule your test shortly."
                )
            
            if appointment.entity_type == 'LAB':
                Notification.objects.create(
                    user=appointment.user,
                    title="Lab Test Booked",
                    message="Lab test booked successfully"
                )

            # 2. Notify Provider (Doctor or Lab)
            provider_user = None
            if appointment.entity_type == 'DOCTOR':
                doc = Doctor.objects.filter(id=appointment.entity_id).first()
                if doc: provider_user = doc.user
            else:
                lab = Lab.objects.filter(id=appointment.entity_id).first()
                if lab: provider_user = lab.admin_user
            
            if provider_user:
                Notification.objects.create(
                    user=provider_user,
                    title="New Booking Confirmed",
                    message=f"New confirmed booking from {appointment.user.username} for {appointment.date.date()} at {appointment.date.time()}."
                )

            Payment.objects.create(
                payment_id=data.get('razorpay_payment_id'),
                order_id=data.get('razorpay_order_id'),
                user=request.user,
                appointment=appointment,
                amount=appointment.amount,
                payment_status=Payment.Status.SUCCESS,
                payment_method="UPI",
                transaction_id=data.get('razorpay_signature')
            )

            return Response({'message': 'UPI Payment Verified Successfully'})

        except Exception as e:
            return Response({'error': f'Payment Verification Failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
