# accounts/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile

class CustomerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)

    def create(self, validated):
        username = validated["username"]
        password = validated["password"]
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username already exists.")
        user = User.objects.create_user(username=username, password=password)
        # 强制 customer
        if not hasattr(user, "profile"):
            UserProfile.objects.create(user=user, user_type="customer")
        else:
            user.profile.user_type = "customer"
            user.profile.save()
        return user

class MeSerializer(serializers.Serializer):
    username = serializers.CharField()
    user_type = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "user_type",
            "height_cm",
            "weight_kg",
            "age",
            "gender",
            "activity_level",
            "bmr", 
            "memo",
        ]
        read_only_fields = ["user_type", "bmr", "username"]