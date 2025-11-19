from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import F
from .models import Restaurant, Item
from .serializers import RestaurantSerializer, ItemSerializer, OrderCreateSerializer
from accounts.models import (
    UserProfile,
    UserCuisinePreference,
    UserFlavorPreference,
    UserNutritionPreference,
    UserProteinPreference,
    UserSpicePreference,
    UserMealTypePreference,
    UserAllergenPreference,
)

import os
from openai import OpenAI

@api_view(["POST"])
def resolve_restaurants(request):
    """
    输入: { "place_ids": ["ChIJ...", "ChIJ..."] }
    输出: { "restaurants": [ {...}, ... ] }
    只返回 is_active=True 的餐厅；按传入顺序返回。
    """
    ids = request.data.get("place_ids", [])
    if not isinstance(ids, list):
        return Response({"error": "place_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

    if len(ids) == 0:
        return Response({"restaurants": []})

    # 为安全给个上限（避免超长请求）
    ids = ids[:100]

    qs = Restaurant.objects.filter(is_active=True, google_place_id__in=ids)
    # 按传入顺序排序
    by_id = {r.google_place_id: r for r in qs}
    ordered = [by_id[i] for i in ids if i in by_id]

    data = RestaurantSerializer(ordered, many=True).data
    return Response({"restaurants": data})

@api_view(["GET"])
def items_by_restaurant(request, rest_id):
    """
    返回某餐厅的菜单（只取 is_active=True）
    """
    try:
        # 你也可以顺便校验 is_active
        Restaurant.objects.get(id=rest_id, is_active=True)
    except Restaurant.DoesNotExist:
        return Response({"error": "restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

    items = Item.objects.filter(restaurant_id=rest_id, is_active=True).order_by("id")
    data = ItemSerializer(items, many=True).data
    return Response({"items": data})

@api_view(["POST"])
def ai_order(request):
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say one funny sentence about food."}
            ]
        )

        reply = completion.choices[0].message.content
        return Response({"message": reply})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    body:
    {
        "restaurant_id": 1,
        "items": [
            {"item_id": 10, "quantity": 2},
            {"item_id": 11, "quantity": 1}
        ]
    }
    """
    s = OrderCreateSerializer(data=request.data, context={"request": request})
    s.is_valid(raise_exception=True)
    order = s.save()

    # ===== 偏好更新逻辑 =====
    user = request.user
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        # 如果还没有 profile，直接略过偏好更新
        return Response({"order_id": order.id, "updated_prefs": False})

    # 拿到订单里的所有 item
    order_items = order.items.select_related("item")
    items = [oi.item for oi in order_items]

    for it in items:
        qty = next((oi.quantity for oi in order_items if oi.item_id == it.id), 1)
        delta = qty  # 点一次就 +1，可以后调整成别的权重

        # Cuisine
        for tag in it.cuisines.all():
            obj, _ = UserCuisinePreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserCuisinePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # Flavor
        for tag in it.flavors.all():
            obj, _ = UserFlavorPreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserFlavorPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # Nutrition
        for tag in it.nutritions.all():
            obj, _ = UserNutritionPreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserNutritionPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # Protein
        for tag in it.proteins.all():
            obj, _ = UserProteinPreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserProteinPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # Spice level
        for tag in it.spice_levels.all():
            obj, _ = UserSpicePreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserSpicePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # Meal type
        for tag in it.meal_types.all():
            obj, _ = UserMealTypePreference.objects.get_or_create(
                profile=profile,
                tag=tag,
                defaults={"score": 0},
            )
            UserMealTypePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

    return Response(
        {
            "order_id": order.id,
            "total_price": str(order.total_price),
            "updated_prefs": True,
        }
    )