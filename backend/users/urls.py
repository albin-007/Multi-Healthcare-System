from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserViewSet, ClinicViewSet, DoctorViewSet,
    ComplaintViewSet, FeedbackViewSet, LabViewSet,
    VerificationDocumentViewSet, PendingApprovalsView, NotificationViewSet, LabTestViewSet, TestRequestViewSet,
    AdminDashboardDataView
)

router = DefaultRouter()
router.register(r'profiles', UserViewSet, basename='user')
router.register(r'clinics', ClinicViewSet, basename='clinic')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'labs', LabViewSet, basename='lab')
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'documents', VerificationDocumentViewSet, basename='document')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'lab-tests', LabTestViewSet, basename='lab-test')
router.register(r'test-requests', TestRequestViewSet, basename='test-request')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('approvals/', PendingApprovalsView.as_view(), name='pending_approvals'),
    path('admin-dashboard/', AdminDashboardDataView.as_view(), name='admin_dashboard'),
    path('', include(router.urls)),
]
