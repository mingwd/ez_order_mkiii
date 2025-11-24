# restaurants/management/commands/seed_restaurants_from_json.py
import json
import random
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from restaurants.models import (
    Restaurant,
    Item,
    CuisineTag,
    ProteinTag,
    SpicinessTag,
    MealTypeTag,
    FlavorTag,
    AllergenTag,
    NutritionTag,
)


class Command(BaseCommand):
    help = "Seed restaurants & items from a Google Places JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="seattle_box_restaurants.json",
            help="Path to the JSON file exported from Google Places.",
        )
        parser.add_argument(
            "--owner-id",
            type=int,
            default=6,
            help="User ID for Restaurant.owner (merchant).",
        )

    def handle(self, *args, **options):
        json_path = options["file"]
        owner_id = options["owner_id"]

        User = get_user_model()
        try:
            owner = User.objects.get(pk=owner_id)
        except User.DoesNotExist:
            raise CommandError(f"User with id={owner_id} does not exist.")

        # reading from file
        self.stdout.write(self.style.WARNING(f"Loading JSON from: {json_path}"))
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            places = data.get("places") or data.get("results") or []
        elif isinstance(data, list):
            places = data
        else:
            raise CommandError("JSON format not recognized.")

        self.stdout.write(self.style.WARNING(f"Found {len(places)} places in JSON"))

        # all avaliable tags
        cuisine_tags = list(CuisineTag.objects.all())
        protein_tags = list(ProteinTag.objects.all())
        spiciness_tags = list(SpicinessTag.objects.all())
        meal_type_tags = list(MealTypeTag.objects.all())
        flavor_tags = list(FlavorTag.objects.all())
        allergen_tags = list(AllergenTag.objects.all())
        nutrition_tags = list(NutritionTag.objects.all())

        # double check tags exist
        if not cuisine_tags or not protein_tags or not spiciness_tags:
            raise CommandError("Tags not seeded.")

        created_rest_count = 0
        created_item_count = 0

        for idx, place in enumerate(places):
            # Google Places struct：
            # {
            #   "id": "...",
            #   "displayName": {"text": "Restaurant Name"},
            #   "formattedAddress": "...",
            #   "location": {"latitude": xx, "longitude": yy}
            # }
            place_id = place.get("id") or place.get("place_id")
            if not place_id:
                self.stdout.write(self.style.WARNING(f"[SKIP] place has no id: {place}"))
                continue

            display_name = place.get("displayName") or {}
            if isinstance(display_name, dict):
                name = display_name.get("text") or display_name.get("name") or ""
            else:
                name = str(display_name)

            name = (name or "Unknown Restaurant")[:120]

            addr = place.get("formattedAddress") or place.get("vicinity") or ""
            addr = addr[:400]

            loc = place.get("location") or {}
            lat = loc.get("latitude")
            lng = loc.get("longitude")

            if lat is None or lng is None:
                self.stdout.write(self.style.WARNING(f"[SKIP] place {place_id} has no lat/lng"))
                continue

            restaurant, created = Restaurant.objects.get_or_create(
                google_place_id=place_id,
                defaults={
                    "owner": owner,
                    "name": name,
                    "address": addr,
                    "latitude": Decimal(str(lat)),
                    "longitude": Decimal(str(lng)),
                    "is_active": True,
                },
            )

            if created:
                created_rest_count += 1
                self.stdout.write(self.style.SUCCESS(f"Created restaurant: {restaurant.name}"))
            else:
                
                if restaurant.owner_id is None:
                    restaurant.owner = owner
                    restaurant.save(update_fields=["owner"])
                self.stdout.write(f"Exists restaurant: {restaurant.name}")

            # 3 random items for each restaurant
            item_base_names = [
                f"{restaurant.name} Special 1",
                f"{restaurant.name} Special 2",
                f"{restaurant.name} Special 3",
            ]

            for j, item_name in enumerate(item_base_names, start=1):
                item_name = item_name[:120]
                price = Decimal("9.99") + Decimal(j - 1) * Decimal("3.00")

                item, item_created = Item.objects.get_or_create(
                    restaurant=restaurant,
                    name=item_name,
                    defaults={
                        "description": "Auto-generated demo item for seeding menu.",
                        "price": price,
                        "is_active": True,
                    },
                )

                # random tags for the item
                if cuisine_tags:
                    item.cuisines.set([random.choice(cuisine_tags)])

                # proteins
                if protein_tags:
                    item.proteins.set([random.choice(protein_tags)])

                # spice_levels
                if spiciness_tags:
                    item.spice_levels = random.choice(spiciness_tags)

                # meal_types
                if meal_type_tags:
                    item.meal_types.set([random.choice(meal_type_tags)])

                # flavors 1–2
                if flavor_tags:
                    flavors_sample = random.sample(
                        flavor_tags,
                        k=min(len(flavor_tags), random.choice([1, 2])),
                    )
                    item.flavors.set(flavors_sample)

                # allergens 0 or 1
                if allergen_tags:
                    if random.random() < 0.7:  # 70% item has allergen
                        item.allergens.set([random.choice(allergen_tags)])
                    else:
                        item.allergens.clear()

                # nutritions
                if nutrition_tags:
                    item.nutritions.set([random.choice(nutrition_tags)])

                item.save()

                if item_created:
                    created_item_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  Created item: {item.name} (${item.price})")
                    )
                else:
                    self.stdout.write(f"  Updated item tags: {item.name}")

            if (idx + 1) % 50 == 0:
                self.stdout.write(self.style.WARNING(f"Processed {idx + 1} places..."))

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created_rest_count} restaurants, {created_item_count} items."
            )
        )
