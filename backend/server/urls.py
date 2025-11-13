from django.contrib import admin
from django.urls import path
from health.views import healthz
from restaurants.views import resolve_restaurants, items_by_restaurant, ai_order

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz),
    path("api/restaurants/resolve", resolve_restaurants),
    path("api/restaurants/<int:rest_id>/items", items_by_restaurant),
    path("api/ai_order/", ai_order),
]
