

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Restaurant, Item

@api_view(["POST"])
def resolve_restaurants(request):
    place_ids = request.data.get("place_ids", [])
    qs = Restaurant.objects.filter(google_place_id__in=place_ids, is_active=True)
    data = [
        {
            "id": r.id,
            "name": r.name,
            "google_place_id": r.google_place_id,
            "lat": float(r.latitude),
            "lng": float(r.longitude),
            "address": r.address,
        }
        for r in qs
    ]
    return Response({"restaurants": data})

@api_view(["GET"])
def items_by_restaurant(request, rest_id: int):
    items = Item.objects.filter(restaurant_id=rest_id, is_active=True).order_by("name")
    data = [
        {"id": it.id, "name": it.name, "price": float(it.price), "description": it.description}
        for it in items
    ]
    return Response({"items": data})
