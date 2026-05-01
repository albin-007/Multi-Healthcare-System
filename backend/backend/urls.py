"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "message": "Welcome to the Medical Scheduler API",
        "status": "Running",
        "endpoints": {
            "admin": "/admin/",
            "users": "/api/users/",
            "appointments": "/api/appointments/",
            "records": "/api/records/",
            "payments": "/api/payments/"
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('api/', api_root, name='api_root_alt'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/records/', include('records.urls')),
    path('api/payments/', include('payments.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
