from django.db import models
from decimal import Decimal

class Restaurant(models.Model):
    name = models.CharField(max_length=120)
    google_place_id = models.CharField(max_length=255, unique=True, db_index=True)
    latitude  = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=400, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["latitude", "longitude"]),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(latitude__gte=-90) & models.Q(latitude__lte=90),
                                   name="rest_lat_range"),
            models.CheckConstraint(check=models.Q(longitude__gte=-180) & models.Q(longitude__lte=180),
                                   name="rest_lng_range"),
        ]

class Item(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=Decimal("0.00")), name="item_price_nonneg"),
        ]
        indexes = [models.Index(fields=["restaurant", "is_active"])]
