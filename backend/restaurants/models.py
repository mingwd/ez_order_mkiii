from decimal import Decimal

from django.db import models


class Restaurant(models.Model):
    name = models.CharField(max_length=120)
    google_place_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Google Places API place_id",
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
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
            models.CheckConstraint(
                check=models.Q(latitude__gte=-90) & models.Q(latitude__lte=90),
                name="rest_lat_range",
            ),
            models.CheckConstraint(
                check=models.Q(longitude__gte=-180) & models.Q(longitude__lte=180),
                name="rest_lng_range",
            ),
        ]

    def __str__(self) -> str:
        return self.name


# ===== Tags (共享给 Item 和 UserProfile) =====

class CuisineTag(models.Model):
    """
    e.g. chinese / japanese / korean / ...
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class ProteinTag(models.Model):
    """
    e.g. chicken / beef / pork / tofu / beans / ...
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class SpicinessTag(models.Model):
    """
    e.g. none / mild / medium / hot / extra_hot
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)

    def __str__(self) -> str:
        return self.label


class MealTypeTag(models.Model):
    """
    e.g. combo / drink / main / side
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class FlavorTag(models.Model):
    """
    e.g. sweet / sour / umami / savory / spicy
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class AllergenTag(models.Model):
    """
    FDA top 9 allergens:
    milk / eggs / fish / crustacean_shellfish / tree_nuts /
    peanuts / wheat / soybeans / sesame
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class NutritionTag(models.Model):
    """
    e.g. high_protein / low_carb / low_sugar / low_fat /
         high_fiber / low_calorie
    """
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)

    def __str__(self) -> str:
        return self.label


class Item(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="items",
    )
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # ==== 标签维度 ====
    cuisines = models.ManyToManyField(
        CuisineTag,
        blank=True,
        related_name="items",
    )
    proteins = models.ManyToManyField(
        ProteinTag,
        blank=True,
        related_name="items",
    )
    spiciness = models.ForeignKey(
        SpicinessTag,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="items",
    )
    meal_types = models.ManyToManyField(
        MealTypeTag,
        blank=True,
        related_name="items",
    )
    flavors = models.ManyToManyField(
        FlavorTag,
        blank=True,
        related_name="items",
    )
    allergens = models.ManyToManyField(
        AllergenTag,
        blank=True,
        related_name="items",
    )
    nutritions = models.ManyToManyField(
        NutritionTag,
        blank=True,
        related_name="items",
    )

    class Meta:
        unique_together = [("restaurant", "name")]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=Decimal("0.00")),
                name="item_price_nonneg",
            ),
        ]
        indexes = [
            models.Index(fields=["restaurant", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.restaurant.name} - {self.name}"