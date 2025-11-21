from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import F
from .models import Restaurant, Item
from .serializers import RestaurantSerializer, ItemSerializer, OrderCreateSerializer, MerchantItemDetailSerializer, MerchantItemCreateSerializer
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
        if it.spice_levels is not None:
            obj, _ = UserSpicePreference.objects.get_or_create(
                profile=profile,
                tag=it.spiciness,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def merchant_my_restaurants(request):
    """
    返回当前登录商家的所有餐厅。
    """
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found."}, status=status.HTTP_400_BAD_REQUEST)

    if profile.user_type != "owner":
        return Response({"detail": "Not a merchant account."}, status=status.HTTP_403_FORBIDDEN)

    qs = Restaurant.objects.filter(owner=request.user).order_by("id")
    data = RestaurantSerializer(qs, many=True).data
    return Response({"restaurants": data})


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def merchant_item_detail(request, item_id):
    """
    商家查看 / 编辑自己名下餐厅的某个 Item。
    URL: /api/merchant/items/<item_id>/

    GET: 返回详情（含所有 tag）
    PUT: 更新 name/description/price/is_active + 各类 tag
    """
    user = request.user

    # 验证用户类型（你现在的 user_type 可能叫 "merchant" 或 "owner"，都放进来）
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)

    if profile.user_type not in ("merchant", "owner"):
        return Response({"detail": "Only merchant users can edit items."},
                        status=status.HTTP_403_FORBIDDEN)

    # 只允许操作自己名下餐厅的菜品
    try:
        item = (
            Item.objects
            .select_related("restaurant")
            .prefetch_related(
                "cuisines",
                "proteins",
                "meal_types",
                "flavors",
                "allergens",
                "nutritions",
            )
            .get(
                id=item_id,
                restaurant__owner=user,  # ⚠️ 这里假设 Restaurant 有 owner=FK(User)
            )
        )
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        ser = MerchantItemDetailSerializer(item)
        return Response(ser.data)

    # PUT 更新
    ser = MerchantItemDetailSerializer(item, data=request.data, partial=True)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    ser.save()
    return Response(ser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def merchant_create_item(request, rest_id):
    """
    商家给某家自己的餐厅新建 Item。
    URL: POST /api/merchant/restaurants/<rest_id>/items/
    body: 同 MerchantItemCreateSerializer 的字段（name / price / tags...）
    """
    user = request.user

    # 校验 user_type
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)

    if profile.user_type not in ("merchant", "owner"):
        return Response(
            {"detail": "Only merchant users can create items."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # 只允许给自己名下餐厅建单品
    try:
        restaurant = Restaurant.objects.get(id=rest_id, owner=user)
    except Restaurant.DoesNotExist:
        return Response(
            {"detail": "Restaurant not found or not owned by you."},
            status=status.HTTP_404_NOT_FOUND,
        )

    ser = MerchantItemCreateSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    item = ser.save(restaurant=restaurant)

    # 返回 detail 版，省得前端再打一次 GET
    out = MerchantItemDetailSerializer(item)
    return Response(out.data, status=status.HTTP_201_CREATED)