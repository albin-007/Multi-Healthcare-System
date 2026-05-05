from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AppointmentViewSet, AvailabilityViewSet, AppointmentSlotViewSet, 
    LabAvailabilityViewSet, LabHolidayViewSet, DoctorBreakViewSet, DoctorLeaveViewSet
)

router = DefaultRouter()
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'breaks', DoctorBreakViewSet, basename='doctor-break')
router.register(r'leaves', DoctorLeaveViewSet, basename='doctor-leave')
router.register(r'lab-availability', LabAvailabilityViewSet, basename='lab-availability')
router.register(r'lab-holidays', LabHolidayViewSet, basename='lab-holidays')
router.register(r'slots', AppointmentSlotViewSet, basename='slot')
router.register(r'', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
]
