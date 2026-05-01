from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PrescriptionViewSet, TestResultViewSet

router = DefaultRouter()
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'test-results', TestResultViewSet, basename='testresult')

urlpatterns = [
    path('', include(router.urls)),
]
