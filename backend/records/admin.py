from django.contrib import admin
from .models import Prescription, TestResult

admin.site.register(Prescription)
admin.site.register(TestResult)
