from collections import Counter
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import (
    UserAllergenPreference,
    UserCuisinePreference,
    UserFlavorPreference,
    UserMealTypePreference,
    UserNutritionPreference,
    UserProteinPreference,
    UserSpicePreference,
)
from restaurants.menu_templates import classify_restaurant, menu_for_kind
from restaurants.models import (
    AllergenTag,
    CuisineTag,
    FlavorTag,
    Item,
    MealTypeTag,
    NutritionTag,
    Order,
    OrderItem,
    ProteinTag,
    Restaurant,
    SpicinessTag,
)

EXTRA_CUISINES = [
    ("thai", "Thai"),
    ("italian", "Italian"),
    ("vietnamese", "Vietnamese"),
]


class Command(BaseCommand):
    help = (
        "Delete items/orders/tag-preferences, then rebuild 3 realistic dishes "
        "per restaurant from the restaurant name. Restaurant rows are not changed."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Write to the database. Default is dry-run.",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        restaurants = list(Restaurant.objects.order_by("id"))
        plans = []
        kinds = Counter()
        for rest in restaurants:
            kind = classify_restaurant(rest.name)
            kinds[kind] += 1
            plans.append((rest, kind, menu_for_kind(kind)))

        self.stdout.write(
            f"Restaurants: {len(restaurants)} | "
            f"items={Item.objects.count()} orders={Order.objects.count()} "
            f"mode={'APPLY' if apply else 'DRY-RUN'}"
        )
        for kind, n in kinds.most_common():
            self.stdout.write(f"  {kind}: {n}")

        if not apply:
            for rest, kind, menu in plans[:20]:
                self.stdout.write(f"\n[{kind}] {rest.name}")
                for dish in menu:
                    self.stdout.write(f"  - {dish['name']}  ${dish['price']}")
            self.stdout.write(
                self.style.WARNING(
                    f"\nShowing 20/{len(plans)} restaurants. "
                    "Dry-run only. Re-run with --apply to write."
                )
            )
            return

        self._ensure_tags()
        tags = self._load_tags()

        with transaction.atomic():
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            Item.objects.all().delete()
            for model in (
                UserCuisinePreference,
                UserFlavorPreference,
                UserNutritionPreference,
                UserProteinPreference,
                UserSpicePreference,
                UserMealTypePreference,
                UserAllergenPreference,
            ):
                model.objects.all().delete()

        items = []
        dishes = []
        for rest, kind, menu in plans:
            for dish in menu:
                items.append(
                    Item(
                        restaurant=rest,
                        name=dish["name"][:120],
                        description=(dish["description"] or "")[:255],
                        price=Decimal(dish["price"]),
                        is_active=True,
                        spice_levels=tags["spice"].get(dish["spice"]),
                    )
                )
                dishes.append(dish)

        created = Item.objects.bulk_create(items, batch_size=200)
        self._bulk_set_m2m(created, dishes, tags)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {len(created)} items for {len(restaurants)} restaurants. "
                "Restaurant rows were not modified."
            )
        )

    def _ensure_tags(self):
        for key, label in EXTRA_CUISINES:
            CuisineTag.objects.get_or_create(key=key, defaults={"label": label})

    def _load_tags(self):
        def mapping(model):
            return {t.key: t for t in model.objects.all()}

        return {
            "cuisine": mapping(CuisineTag),
            "protein": mapping(ProteinTag),
            "spice": mapping(SpicinessTag),
            "meal": mapping(MealTypeTag),
            "flavor": mapping(FlavorTag),
            "allergen": mapping(AllergenTag),
            "nutrition": mapping(NutritionTag),
        }

    def _bulk_set_m2m(self, items, dishes, tags):
        cuisine_rows = []
        protein_rows = []
        meal_rows = []
        flavor_rows = []
        allergen_rows = []
        nutrition_rows = []

        CThrough = Item.cuisines.through
        PThrough = Item.proteins.through
        MThrough = Item.meal_types.through
        FThrough = Item.flavors.through
        AThrough = Item.allergens.through
        NThrough = Item.nutritions.through

        def add_rows(bucket, keys, through, acc, fk_name):
            for key in keys:
                tag = tags[bucket].get(key)
                if tag is None:
                    continue
                acc.append(through(**{"item_id": item.pk, fk_name: tag.pk}))

        for item, dish in zip(items, dishes):
            add_rows("cuisine", dish["cuisines"], CThrough, cuisine_rows, "cuisinetag_id")
            add_rows("protein", dish["proteins"], PThrough, protein_rows, "proteintag_id")
            add_rows("meal", dish["meal_types"], MThrough, meal_rows, "mealtypetag_id")
            add_rows("flavor", dish["flavors"], FThrough, flavor_rows, "flavortag_id")
            add_rows("allergen", dish["allergens"], AThrough, allergen_rows, "allergentag_id")
            add_rows("nutrition", dish["nutritions"], NThrough, nutrition_rows, "nutritiontag_id")

        CThrough.objects.bulk_create(cuisine_rows, batch_size=500)
        PThrough.objects.bulk_create(protein_rows, batch_size=500)
        MThrough.objects.bulk_create(meal_rows, batch_size=500)
        FThrough.objects.bulk_create(flavor_rows, batch_size=500)
        AThrough.objects.bulk_create(allergen_rows, batch_size=500)
        NThrough.objects.bulk_create(nutrition_rows, batch_size=500)
