# backend/restaurants/serializers.py

from decimal import Decimal
from rest_framework import serializers
from .models import (
    Restaurant, 
    Item, 
    Order, 
    OrderItem, 
    CuisineTag, 
    ProteinTag, 
    SpicinessTag, 
    MealTypeTag, 
    FlavorTag, 
    AllergenTag, 
    NutritionTag
    )


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ["id", "name", "address", "google_place_id", "latitude", "longitude"]


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ["id", "name", "description", "price", "is_active", "created_at"]


# ====== 下单：输入结构 ======

class OrderItemInputSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class OrderCreateSerializer(serializers.Serializer):
    """
    前端 POST /api/restaurants/orders/

    body 形状：
    {
        "restaurant_id": 1,
        "items": [
            { "item_id": 10, "quantity": 2 },
            { "item_id": 11, "quantity": 1 }
        ]
    }

    约束：
    - 所有 item 必须属于同一个 restaurant（即 restaurant_id）
    - item / restaurant 必须是 active
    """
    restaurant_id = serializers.IntegerField()
    items = OrderItemInputSerializer(many=True)

    def validate(self, attrs):
        items_data = attrs.get("items") or []
        if not items_data:
            raise serializers.ValidationError("Order must contain at least one item.")

        # 检查餐厅存在且 active
        try:
            restaurant = Restaurant.objects.get(
                id=attrs["restaurant_id"],
                is_active=True,
            )
        except Restaurant.DoesNotExist:
            raise serializers.ValidationError({"restaurant_id": "Restaurant not found or inactive."})

        item_ids = [row["item_id"] for row in items_data]

        # 查出所有相关 item，并带上 restaurant
        found_items = list(
            Item.objects.filter(
                id__in=item_ids,
                is_active=True,
                restaurant__is_active=True,
            ).select_related("restaurant")
        )

        if len(found_items) != len(item_ids):
            raise serializers.ValidationError("Some items do not exist or are inactive.")

        # 确保所有 item 都属于同一个餐厅
        for it in found_items:
            if it.restaurant_id != restaurant.id:
                raise serializers.ValidationError("All items must belong to the same restaurant.")

        # 缓存起来，create 里用
        attrs["_items"] = {it.id: it for it in found_items}
        attrs["_restaurant"] = restaurant
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        restaurant = validated_data["_restaurant"]
        items_data = validated_data["items"]
        item_map = validated_data["_items"]

        # 先创建订单（默认 pending，或者你想仍然用 completed 也行）
        order = Order.objects.create(
            user=user,
            restaurant=restaurant,
            status="pending",                # 如果你模型 default 还是 "completed"，这里会覆盖
            total_price=Decimal("0.00"),
        )

        total = Decimal("0.00")
        for row in items_data:
            it = item_map[row["item_id"]]
            qty = row.get("quantity", 1)
            line_total = it.price * qty

            OrderItem.objects.create(
                order=order,
                item=it,
                quantity=qty,
                price_at_order=it.price,
            )
            total += line_total

        order.total_price = total
        order.save(update_fields=["total_price"])
        return order


# ====== 下单：输出结构 ======

class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "item", "item_name", "quantity", "price_at_order"]


class OrderSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(
        source="restaurant.name",
        read_only=True,
    )
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "restaurant",
            "restaurant_name",
            "status",
            "total_price",
            "created_at",
            "items",
        ]

class MerchantItemDetailSerializer(serializers.ModelSerializer):
    cuisines = serializers.PrimaryKeyRelatedField(
        queryset=CuisineTag.objects.all(),
        many=True,
        required=False,
    )
    proteins = serializers.PrimaryKeyRelatedField(
        queryset=ProteinTag.objects.all(),
        many=True,
        required=False,
    )
    spiciness = serializers.PrimaryKeyRelatedField(
        queryset=SpicinessTag.objects.all(),
        required=False,
        allow_null=True,
        source="spice_levels",
    )
    meal_types = serializers.PrimaryKeyRelatedField(
        queryset=MealTypeTag.objects.all(),
        many=True,
        required=False,
    )
    flavors = serializers.PrimaryKeyRelatedField(
        queryset=FlavorTag.objects.all(),
        many=True,
        required=False,
    )
    allergens = serializers.PrimaryKeyRelatedField(
        queryset=AllergenTag.objects.all(),
        many=True,
        required=False,
    )
    nutritions = serializers.PrimaryKeyRelatedField(
        queryset=NutritionTag.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Item
        fields = [
            "id",
            "restaurant",
            "name",
            "description",
            "price",
            "is_active",
            "created_at",
            "cuisines",
            "proteins",
            "spiciness",
            "meal_types",
            "flavors",
            "allergens",
            "nutritions",
        ]
        read_only_fields = ["id", "restaurant", "created_at"]




class MerchantItemCreateSerializer(serializers.ModelSerializer):
    cuisines = serializers.PrimaryKeyRelatedField(
        queryset=CuisineTag.objects.all(),
        many=True,
        required=False,
    )
    proteins = serializers.PrimaryKeyRelatedField(
        queryset=ProteinTag.objects.all(),
        many=True,
        required=False,
    )
    spiciness = serializers.PrimaryKeyRelatedField(
        queryset=SpicinessTag.objects.all(),
        allow_null=True,
        required=False,
        source="spice_levels",
    )
    meal_types = serializers.PrimaryKeyRelatedField(
        queryset=MealTypeTag.objects.all(),
        many=True,
        required=False,
    )
    flavors = serializers.PrimaryKeyRelatedField(
        queryset=FlavorTag.objects.all(),
        many=True,
        required=False,
    )
    allergens = serializers.PrimaryKeyRelatedField(
        queryset=AllergenTag.objects.all(),
        many=True,
        required=False,
    )
    nutritions = serializers.PrimaryKeyRelatedField(
        queryset=NutritionTag.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Item
        fields = [
            "name",
            "description",
            "price",
            "is_active",
            "cuisines",
            "proteins",
            "spiciness",
            "meal_types",
            "flavors",
            "allergens",
            "nutritions",
        ]
