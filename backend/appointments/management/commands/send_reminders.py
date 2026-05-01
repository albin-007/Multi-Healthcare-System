import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from appointments.models import Appointment
from users.models import Notification

class Command(BaseCommand):
    help = 'Sends appointment reminders (1 day and 1 hour before)'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # 1. Reminders for tomorrow (24 hours - 25 hours from now)
        tomorrow_start = now + datetime.timedelta(days=1)
        tomorrow_end = tomorrow_start + datetime.timedelta(hours=1)
        
        tomorrow_appointments = Appointment.objects.filter(
            date__gte=tomorrow_start,
            date__lte=tomorrow_end,
            status=Appointment.Status.CONFIRMED
        )
        
        for apt in tomorrow_appointments:
            # Check if we already sent a reminder to avoid duplicates if run multiple times
            # For simplicity in this demo, we just create it. 
            # In production, you'd track 'reminder_sent' flags.
            Notification.objects.create(
                user=apt.user,
                title="Appointment Reminder",
                message=f"Reminder: You have an appointment tomorrow at {apt.date.strftime('%I:%M %p')} with {apt.entity_name}."
            )
            self.stdout.write(f"Sent 1-day reminder to {apt.user.username} for {apt.id}")

        # 2. Reminders for 1 hour from now (60 mins - 70 mins from now)
        hour_start = now + datetime.timedelta(hours=1)
        hour_end = hour_start + datetime.timedelta(minutes=10)
        
        hour_appointments = Appointment.objects.filter(
            date__gte=hour_start,
            date__lte=hour_end,
            status=Appointment.Status.CONFIRMED
        )
        
        for apt in hour_appointments:
            Notification.objects.create(
                user=apt.user,
                title="Appointment Reminder",
                message=f"Reminder: You have an appointment in 1 hour at {apt.date.strftime('%I:%M %p')} with {apt.entity_name}."
            )
            self.stdout.write(f"Sent 1-hour reminder to {apt.user.username} for {apt.id}")
