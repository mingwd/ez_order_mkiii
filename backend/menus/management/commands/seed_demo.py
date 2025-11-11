from django.core.management.base import BaseCommand
from restaurants.models import Restaurant, Item

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # tuple returned
        r, _ = Restaurant.objects.get_or_create(
            google_place_id="ChIJ-demo-001",
            defaults=dict(name="Demo Thai", latitude=47.620500, longitude=-122.349300, address="Seattle, WA"),
        )
        Item.objects.get_or_create(restaurant=r, name="Spicy Chicken Bowl", defaults=dict(price=12.99))
        Item.objects.get_or_create(restaurant=r, name="Green Curry", defaults=dict(price=13.49))
        self.stdout.write(self.style.SUCCESS("Seeded demo restaurant & items"))
