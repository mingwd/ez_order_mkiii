# restaurants/management/commands/seed_tags.py
from django.core.management.base import BaseCommand
from restaurants.models import (
    CuisineTag,
    ProteinTag,
    SpicinessTag,
    MealTypeTag,
    FlavorTag,
    AllergenTag,
    NutritionTag,
)


class Command(BaseCommand):
    help = "Seed initial tags for cuisines, proteins, spiciness, meal types, flavors, allergens, nutritions."

    def handle(self, *args, **options):
        # 1) Cuisine
        cuisine_data = [
            ("chinese", "Chinese"),
            ("japanese", "Japanese"),
            ("korean", "Korean"),
            ("american", "American"),
            ("mexican", "Mexican"),
            ("indian", "Indian"),
        ]
        for key, label in cuisine_data:
            obj, created = CuisineTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created cuisine: {label}"))
            else:
                self.stdout.write(f"Exists cuisine: {label}")

        # 2) Protein
        protein_data = [
            ("chicken", "Chicken"),
            ("beef", "Beef"),
            ("pork", "Pork"),
            ("fish", "Fish"),
            ("shrimp", "Shrimp"),
            ("tofu", "Tofu"),
            ("egg", "Egg"),
        ]
        for key, label in protein_data:
            obj, created = ProteinTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created protein: {label}"))
            else:
                self.stdout.write(f"Exists protein: {label}")

        # 3) Spiciness
        spiciness_data = [
            ("none", "Not spicy"),
            ("mild", "Mild"),
            ("medium", "Medium"),
            ("hot", "Hot"),
            ("extra_hot", "Extra hot"),
        ]
        for key, label in spiciness_data:
            obj, created = SpicinessTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created spiciness: {label}"))
            else:
                self.stdout.write(f"Exists spiciness: {label}")

        # 4) MealType
        meal_type_data = [
            ("main", "Main dish"),
            ("side", "Side"),
            ("drink", "Drink"),
            ("dessert", "Dessert"),
            ("combo", "Combo"),
        ]
        for key, label in meal_type_data:
            obj, created = MealTypeTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created meal type: {label}"))
            else:
                self.stdout.write(f"Exists meal type: {label}")

        # 5) Flavor
        flavor_data = [
            ("sweet", "Sweet"),
            ("sour", "Sour"),
            ("salty", "Salty"),
            ("spicy", "Spicy"),
            ("umami", "Umami"),
        ]
        for key, label in flavor_data:
            obj, created = FlavorTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created flavor: {label}"))
            else:
                self.stdout.write(f"Exists flavor: {label}")

        # 6) Allergen（FDA top 9）
        allergen_data = [
            ("milk", "Milk"),
            ("eggs", "Eggs"),
            ("fish", "Fish"),
            ("crustacean_shellfish", "Crustacean shellfish"),
            ("tree_nuts", "Tree nuts"),
            ("peanuts", "Peanuts"),
            ("wheat", "Wheat"),
            ("soybeans", "Soybeans"),
            ("sesame", "Sesame"),
        ]
        for key, label in allergen_data:
            obj, created = AllergenTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created allergen: {label}"))
            else:
                self.stdout.write(f"Exists allergen: {label}")

        # 7) Nutrition
        nutrition_data = [
            ("high_protein", "High protein"),
            ("low_carb", "Low carb"),
            ("low_fat", "Low fat"),
            ("high_fiber", "High fiber"),
            ("low_calorie", "Low calorie"),
        ]
        for key, label in nutrition_data:
            obj, created = NutritionTag.objects.get_or_create(
                key=key,
                defaults={"label": label},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created nutrition: {label}"))
            else:
                self.stdout.write(f"Exists nutrition: {label}")

        self.stdout.write(self.style.SUCCESS("Tag seeding done."))