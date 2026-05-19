from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view): # type: ignore
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsPatient(permissions.BasePermission):
    def has_permission(self, request, view): # type: ignore
        return bool(request.user and request.user.is_authenticated and request.user.role == 'USER')

class IsClinic(permissions.BasePermission):
    def has_permission(self, request, view): # type: ignore
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CLINIC')

class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view): # type: ignore
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')

class IsLab(permissions.BasePermission):
    def has_permission(self, request, view): # type: ignore
        return bool(request.user and request.user.is_authenticated and request.user.role == 'LAB')
