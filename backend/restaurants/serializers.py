from rest_framework import serializers
from .models import Restaurant, Item

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["id", "name", "address", "google_place_id", "latitude", "longitude"]

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "description", "price", "is_active", "created_at"]
