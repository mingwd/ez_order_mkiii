# accounts/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile
from .models import (
    UserProfile,
    UserCuisinePreference,
    UserFlavorPreference,
    UserNutritionPreference,
    UserProteinPreference,
    UserSpicePreference,
    UserMealTypePreference,
    UserAllergenPreference,
)

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
    
class MerchantRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )
        UserProfile.objects.create(user=user, user_type="owner")
        return user

class MeSerializer(serializers.Serializer):
    username = serializers.CharField()
    user_type = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_type = serializers.CharField(read_only=True)

    # 只读：把所有当前有“正向偏好”（score > 0）的 tag 列出来
    prefs = serializers.SerializerMethodField(read_only=True)

    # 写入：前端用来“点灰”的 tag id 列表
    muted_cuisine_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_flavor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_nutrition_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_protein_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_spice_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_meal_type_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )
    muted_allergen_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
    )

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
            "memo",
            "bmr",
            "prefs",  # 只读
            # 写入用的 mute 字段
            "muted_cuisine_ids",
            "muted_flavor_ids",
            "muted_nutrition_ids",
            "muted_protein_ids",
            "muted_spice_ids",
            "muted_meal_type_ids",
            "muted_allergen_ids",
        ]

    def get_prefs(self, obj: UserProfile):
        """
        返回用户“目前喜欢的 tag”（score > 0），前端只显示这些。
        """
        def build(through_model):
            qs = (
                through_model.objects
                .filter(profile=obj, score__gt=0)
                .select_related("tag")
                .order_by("-score", "tag__label")
            )
            return [
                {
                    "id": r.tag.id,
                    "label": r.tag.label,
                    "score": r.score,
                }
                for r in qs
            ]

        return {
            "cuisines": build(UserCuisinePreference),
            "flavors": build(UserFlavorPreference),
            "nutritions": build(UserNutritionPreference),
            "proteins": build(UserProteinPreference),
            "spices": build(UserSpicePreference),
            "meal_types": build(UserMealTypePreference),
            "allergens": build(UserAllergenPreference),
        }

    def update(self, instance: UserProfile, validated_data):
        # 先处理基本字段
        for field in [
            "height_cm",
            "weight_kg",
            "age",
            "gender",
            "activity_level",
            "memo",
        ]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()

        # 再处理“被点灰”的 tag，把他们的 score 置 0
        def mute(field_name, model_cls):
            ids = validated_data.pop(field_name, [])
            if ids:
                model_cls.objects.filter(
                    profile=instance,
                    tag_id__in=ids,
                ).update(score=0)

        mute("muted_cuisine_ids", UserCuisinePreference)
        mute("muted_flavor_ids", UserFlavorPreference)
        mute("muted_nutrition_ids", UserNutritionPreference)
        mute("muted_protein_ids", UserProteinPreference)
        mute("muted_spice_ids", UserSpicePreference)
        mute("muted_meal_type_ids", UserMealTypePreference)
        mute("muted_allergen_ids", UserAllergenPreference)

        return instance