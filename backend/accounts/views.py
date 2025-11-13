# accounts/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomerRegisterSerializer
from .models import UserProfile

@api_view(["POST"])
@permission_classes([AllowAny])
def register_customer(request):
    s = CustomerRegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response({"ok": True, "username": user.username, "user_type": "customer"}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    ut = getattr(request.user.profile, "user_type", None)
    return Response({"id": request.user.id, "username": request.user.username, "user_type": ut})
