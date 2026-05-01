from django.contrib import admin
from .models import User, Clinic, Doctor, Complaint, Feedback

admin.site.register(User)
admin.site.register(Clinic)
admin.site.register(Doctor)
admin.site.register(Complaint)
admin.site.register(Feedback)
