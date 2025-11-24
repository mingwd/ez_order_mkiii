import json
import os
from decimal import Decimal
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import F
from .models import (
    Restaurant, 
    Item,
    CuisineTag,
    ProteinTag,
    SpicinessTag,
    MealTypeTag,
    FlavorTag,
    AllergenTag,
    NutritionTag,
)
from .serializers import (
    RestaurantSerializer, 
    ItemSerializer, 
    OrderCreateSerializer, 
    MerchantItemDetailSerializer, 
    MerchantItemCreateSerializer
)

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

from openai import OpenAI

def pref_qs_to_list(qs, label_attr="tag__label"):
    return [
        {
            "label": getattr(row, label_attr.split("__")[0]).label,
            "score": row.score,
        }
        for row in qs.order_by("-score")
    ]


def build_user_context(profile: UserProfile):
    return {
        "basic": {
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "age": profile.age,
            "gender": profile.gender,
            "activity_level": profile.activity_level,
            "memo": profile.memo,
        },
        "preferences": {
            "cuisines": pref_qs_to_list(
                UserCuisinePreference.objects.filter(profile=profile)
            ),
            "flavors": pref_qs_to_list(
                UserFlavorPreference.objects.filter(profile=profile)
            ),
            "nutritions": pref_qs_to_list(
                UserNutritionPreference.objects.filter(profile=profile)
            ),
            "proteins": pref_qs_to_list(
                UserProteinPreference.objects.filter(profile=profile)
            ),
            "spice_levels": pref_qs_to_list(
                UserSpicePreference.objects.filter(profile=profile),
                label_attr="tag__label",
            ),
            "meal_types": pref_qs_to_list(
                UserMealTypePreference.objects.filter(profile=profile)
            ),
            "allergens": pref_qs_to_list(
                UserAllergenPreference.objects.filter(profile=profile)
            ),
        },
    }

def build_restaurant_bundle(restaurants_qs): # python dict to json
    items_qs = (
        Item.objects.filter(restaurant__in=restaurants_qs, is_active=True)
        .select_related("restaurant", "spice_levels")
        .prefetch_related(
            "cuisines",
            "proteins",
            "meal_types",
            "flavors",
            "allergens",
            "nutritions",
        )
    )

    
    items_by_rest = {}
    for it in items_qs:
        items_by_rest.setdefault(it.restaurant_id, []).append(it)

    bundle = []
    for rest in restaurants_qs:
        rest_items = []
        for it in items_by_rest.get(rest.id, []):
            rest_items.append(
                {
                    "id": it.id,
                    "name": it.name,
                    "price": float(it.price),
                    "tags": {
                        "cuisines": [t.label for t in it.cuisines.all()],
                        "proteins": [t.label for t in it.proteins.all()],
                        "spiciness": it.spice_levels.label if it.spice_levels else None,
                        "meal_types": [t.label for t in it.meal_types.all()],
                        "flavors": [t.label for t in it.flavors.all()],
                        "allergens": [t.label for t in it.allergens.all()],
                        "nutritions": [t.label for t in it.nutritions.all()],
                    },
                }
            )

        bundle.append(
            {
                "id": rest.id,
                "name": rest.name,
                "address": rest.address,
                "items": rest_items,
            }
        )

    return bundle


@api_view(["POST"])
def resolve_restaurants(request):
    ids = request.data.get("place_ids", [])
    if not isinstance(ids, list):
        return Response({"error": "place_ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)

    if len(ids) == 0:
        return Response({"restaurants": []})

    ids = ids[:100]

    qs = Restaurant.objects.filter(is_active=True, google_place_id__in=ids)
    # 按传入顺序排序
    by_id = {r.google_place_id: r for r in qs}
    ordered = [by_id[i] for i in ids if i in by_id]

    data = RestaurantSerializer(ordered, many=True).data
    return Response({"restaurants": data})

@api_view(["GET"])
def items_by_restaurant(request, rest_id):
    
    try:
        Restaurant.objects.get(id=rest_id, is_active=True)
    except Restaurant.DoesNotExist:
        return Response({"error": "restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

    items = Item.objects.filter(restaurant_id=rest_id, is_active=True).order_by("id")
    data = ItemSerializer(items, many=True).data
    return Response({"items": data})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_order(request):
    restaurant_ids = request.data.get("restaurant_ids", [])
    if not isinstance(restaurant_ids, list) or not restaurant_ids:
        return Response(
            {"detail": "restaurant_ids must be a non-empty list."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response(
            {"detail": "User profile not found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    restaurants = Restaurant.objects.filter(
        id__in=restaurant_ids, is_active=True
    ).order_by("id")

    if not restaurants.exists():
        return Response(
            {"detail": "No valid restaurants found."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_ctx = build_user_context(profile)
    rest_bundle = build_restaurant_bundle(restaurants)

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    system_prompt ="""
        You are a food-ordering assistant. You will receive a JSON containing:
        user: the user`s basic information and historical preferences (a higher score for a tag means the user likes it more)
        restaurants: the list of available restaurants and their menus; each dish has a name, price, and several tags
        Your tasks:
        Only choose from the provided restaurants and items. Do NOT invent new IDs or dish names.
        Pick one restaurant, and select 1-3 dishes from that restaurant based on user info (watch user memo, combine all info and try to give what user wants).
        Avoid allergens that are obviously unsuitable for the user. If information is insufficient, you may ignore allergens.
        Keep the total price reasonable (for example, don`t order 10 items for one person).
        You must return the result in the following JSON schema exactly as shown, without adding extra fields:
        {
        "restaurant_id": <int, must be one of the restaurants in the input>,
        "items": [
            { "item_id": <int, must belong to the chosen restaurant>, "quantity": <int, 1-3> }
        ],
        "comment": "<Briefly explain of why you chose this order>"
        }

        }
    """.strip()

    user_payload = {
        "user": user_ctx,
        "restaurants": rest_bundle,
    }

    completion = client.chat.completions.create(
        model="gpt-5.1",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(user_payload, ensure_ascii=False, default=float),
            },
        ],
    )

    raw = completion.choices[0].message.content
    try:
        ai_result = json.loads(raw)
    except json.JSONDecodeError:
        return Response(
            {"detail": "AI returned invalid JSON.", "raw": raw},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    rest_id = ai_result.get("restaurant_id")
    items = ai_result.get("items") or []
    comment = ai_result.get("comment", "")

    if rest_id not in restaurant_ids:
        return Response(
            {"detail": "AI chose an invalid restaurant_id.", "ai_result": ai_result},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid_items_qs = Item.objects.filter(
        restaurant_id=rest_id, id__in=[x.get("item_id") for x in items]
    ).select_related("restaurant")

    valid_ids = set(valid_items_qs.values_list("id", flat=True))
    cleaned_items = []
    for it in items:
        iid = it.get("item_id")
        qty = it.get("quantity", 1) or 1
        if iid in valid_ids and qty > 0:
            cleaned_items.append({"item_id": iid, "quantity": int(qty)})

    if not cleaned_items:
        return Response(
            {"detail": "AI did not pick any valid items.", "ai_result": ai_result},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # order create
    payload = {
        "restaurant_id": rest_id,
        "items": cleaned_items,
    }

    with transaction.atomic():
        order = create_order_with_prefs(request, payload)

    order_items = (
        order.items.select_related("item", "item__restaurant")
        .all()
        .order_by("id")
    )

    out_items = []
    total = Decimal("0.00")
    for oi in order_items:
        line_total = oi.price_at_order * oi.quantity
        total += line_total
        out_items.append(
            {
                "item_id": oi.item_id,
                "name": oi.item.name,
                "quantity": oi.quantity,
                "price": str(oi.price_at_order),
                "line_total": str(line_total),
            }
        )

    resp_data = {
        "order_id": order.id,
        "restaurant_id": rest_id,
        "restaurant_name": order.restaurant.name,
        "items": out_items,
        "total_price": str(total),
        "ai_comment": comment,
    }
    return Response(resp_data, status=status.HTTP_201_CREATED)





def update_user_preferences_from_order(order, user):
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return

    order_items = order.items.select_related("item")
    items = [oi.item for oi in order_items]

    for it in items:
        qty = next((oi.quantity for oi in order_items if oi.item_id == it.id), 1)
        delta = qty

        for tag in it.cuisines.all():
            obj, _ = UserCuisinePreference.objects.get_or_create(
                profile=profile, tag=tag, defaults={"score": 0}
            )
            UserCuisinePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        for tag in it.flavors.all():
            obj, _ = UserFlavorPreference.objects.get_or_create(
                profile=profile, tag=tag, defaults={"score": 0}
            )
            UserFlavorPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        for tag in it.nutritions.all():
            obj, _ = UserNutritionPreference.objects.get_or_create(
                profile=profile, tag=tag, defaults={"score": 0}
            )
            UserNutritionPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        for tag in it.proteins.all():
            obj, _ = UserProteinPreference.objects.get_or_create(
                profile=profile, tag=tag, defaults={"score": 0}
            )
            UserProteinPreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        # spice_levels
        if it.spice_levels is not None:
            obj, _ = UserSpicePreference.objects.get_or_create(
                profile=profile, tag=it.spice_levels, defaults={"score": 0}
            )
            UserSpicePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

        for tag in it.meal_types.all():
            obj, _ = UserMealTypePreference.objects.get_or_create(
                profile=profile, tag=tag, defaults={"score": 0}
            )
            UserMealTypePreference.objects.filter(pk=obj.pk).update(
                score=F("score") + delta
            )

def create_order_with_prefs(request, payload):
    """
    unified order creation logic for both AI and manual orders.
    """
    s = OrderCreateSerializer(data=payload, context={"request": request})
    s.is_valid(raise_exception=True)
    order = s.save()

    update_user_preferences_from_order(order, request.user)
    return order


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
    payload = request.data
    order = create_order_with_prefs(request, payload)

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
    user = request.user

    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)

    if profile.user_type not in ("merchant", "owner"):
        return Response({"detail": "Only merchant users can edit items."},
                        status=status.HTTP_403_FORBIDDEN)

   
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
                restaurant__owner=user, 
            )
        )
    except Item.DoesNotExist:
        return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        ser = MerchantItemDetailSerializer(item)
        return Response(ser.data)

    # PUT
    ser = MerchantItemDetailSerializer(item, data=request.data, partial=True)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    ser.save()
    return Response(ser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def merchant_create_item(request, rest_id):
    user = request.user

    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)

    if profile.user_type not in ("merchant", "owner"):
        return Response(
            {"detail": "Only merchant users can create items."},
            status=status.HTTP_403_FORBIDDEN,
        )

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

    
    out = MerchantItemDetailSerializer(item)
    return Response(out.data, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def merchant_tags_overview(request):
    
    user = request.user
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_403_FORBIDDEN)

    if profile.user_type not in ("merchant", "owner"):
        return Response(
            {"detail": "Only merchant users can access tags."},
            status=status.HTTP_403_FORBIDDEN,
        )

    def qs_to_list(qs):
        return [
            {"id": t.id, "key": t.key, "label": t.label}
            for t in qs.order_by("label")
        ]

    data = {
        "cuisines": qs_to_list(CuisineTag.objects.all()),
        "proteins": qs_to_list(ProteinTag.objects.all()),
        "spiciness": qs_to_list(SpicinessTag.objects.all()),
        "meal_types": qs_to_list(MealTypeTag.objects.all()),
        "flavors": qs_to_list(FlavorTag.objects.all()),
        "allergens": qs_to_list(AllergenTag.objects.all()),
        "nutritions": qs_to_list(NutritionTag.objects.all()),
    }
    return Response(data)
