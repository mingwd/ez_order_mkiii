from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Restaurant, Item
from .serializers import RestaurantSerializer, ItemSerializer

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
