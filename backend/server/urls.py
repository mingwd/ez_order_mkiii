from django.contrib import admin
from django.urls import path
from health.views import healthz
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from restaurants.views import resolve_restaurants, items_by_restaurant, ai_order
from accounts.views import register_customer, me, profile_detail

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", healthz),
    path("api/restaurants/resolve", resolve_restaurants),
    path("api/restaurants/<int:rest_id>/items", items_by_restaurant),
    path("api/ai_order/", ai_order),

    path("api/auth/register/", register_customer),     # 强制注册为 customer
    path("api/auth/login/",   TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", me, name="me"),
    path("api/auth/profile/", profile_detail, name="profile_detail"),



]
