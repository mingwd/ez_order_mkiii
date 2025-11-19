# backend/orders/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import CreateOrderSerializer, OrderSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    从购物车创建订单（可能拆成多个餐厅的 order）。
    """
    s = CreateOrderSerializer(data=request.data, context={"request": request})
    s.is_valid(raise_exception=True)
    orders = s.save()  # list[Order]

    out = OrderSerializer(orders, many=True)
    return Response({"orders": out.data}, status=status.HTTP_201_CREATED)