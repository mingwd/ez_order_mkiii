# accounts/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomerRegisterSerializer, UserProfileSerializer, MeSerializer, MerchantRegisterSerializer
from .models import UserProfile
from django.contrib.auth.models import User

@api_view(["POST"])
@permission_classes([AllowAny])
def register_customer(request):
    s = CustomerRegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response({"ok": True, "username": user.username, "user_type": "customer"}, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([AllowAny])
def register_merchant(request):
    s = MerchantRegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(
        {"username": user.username, "user_type": "owner"},
        status=status.HTTP_201_CREATED,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user: User = request.user
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"user_type": "customer"},
    )
    data = {"username": user.username, "user_type": profile.user_type}
    s = MeSerializer(data)
    return Response(s.data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_detail(request):
    """
    GET  返回当前用户的完整 profile 信息
    PUT  更新 height/weight/age/gender/activity_level/memo
    """
    user: User = request.user
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"user_type": "customer"},
    )

    if request.method == "GET":
        s = UserProfileSerializer(profile)
        return Response(s.data)

    # PUT
    s = UserProfileSerializer(profile, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)