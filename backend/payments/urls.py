from django.urls import path
from .views import CreateUPIOrderView, VerifyUPIPaymentView

urlpatterns = [
    path('create-upi-order/', CreateUPIOrderView.as_view(), name='create-upi-order'),
    path('verify-upi-payment/', VerifyUPIPaymentView.as_view(), name='verify-upi-payment'),
]
