from django.core.management.base import BaseCommand
from restaurants.models import Restaurant, Item
from decimal import Decimal

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        menu_seed = {
            "ChIJISBz4UEOkFQRZSXwQaNZ-yI": [  # McMenamins Anderson School（美式餐酒馆）
                {"name": "Anderson Burger", "desc": "1/3 lb beef patty, cheddar, lettuce, tomato, house sauce", "price": "14.50"},
                {"name": "Cajun Tots", "desc": "Crispy tater tots tossed with Cajun spices", "price": "7.50"},
                {"name": "Hazy IPA Pint", "desc": "McMenamins house-brewed hazy IPA", "price": "7.00"},
            ],
            "ChIJ5xqmaWkOkFQRPzsLd5Jie4c": [  # Zulu's Board Game Cafe（咖啡/简餐）
                {"name": "Turkey Pesto Panini", "desc": "Turkey, provolone, pesto on ciabatta", "price": "11.50"},
                {"name": "House Cold Brew", "desc": "Slow-steeped cold brew coffee", "price": "4.50"},
                {"name": "Chocolate Chip Cookie", "desc": "Fresh-baked, shareable size", "price": "3.25"},
            ],
            "ChIJG50lNGoOkFQR9ADtNYeGU2I": [  # The Cottage（咖啡早午餐）
                {"name": "Avocado Toast", "desc": "Sourdough, smashed avocado, radish, lemon", "price": "10.00"},
                {"name": "Breakfast Sandwich", "desc": "Egg, bacon, cheddar, brioche", "price": "9.50"},
                {"name": "Latte", "desc": "Classic espresso + steamed milk", "price": "4.75"},
            ],
            "ChIJIc3RSmoOkFQR_KUtHlXdZO4": [  # Sushi Zone（寿司）
                {"name": "Salmon Nigiri (2pc)", "desc": "Fresh Atlantic salmon over sushi rice", "price": "6.50"},
                {"name": "California Roll", "desc": "Crab, avocado, cucumber", "price": "7.50"},
                {"name": "Spicy Tuna Roll", "desc": "Tuna, chili mayo, scallion", "price": "8.50"},
            ],
            "ChIJg-2Sw2sOkFQRCYwLpx4e-C4": [  # Alexa's Cafe & Catering（早午餐/咖啡）
                {"name": "Classic Benedict", "desc": "Poached eggs, ham, hollandaise, English muffin", "price": "14.00"},
                {"name": "House Granola Parfait", "desc": "Yogurt, berries, honey", "price": "8.50"},
                {"name": "Cappuccino", "desc": "Rich foam, balanced espresso", "price": "4.50"},
            ],
            "ChIJHx6nxN8TkFQRxjo-qLL-c9Y": [  # Tubs Gourmet Sub Sandwiches（三明治）
                {"name": "Italian Sub", "desc": "Salami, ham, provolone, oil & vinegar", "price": "11.00"},
                {"name": "Turkey Avocado Sub", "desc": "Turkey, avocado, lettuce, tomato", "price": "11.50"},
                {"name": "Chips & Soda Combo", "desc": "Kettle chips + fountain drink", "price": "4.00"},
            ],
            "ChIJuTek5UEOkFQRI5X6VXnzlEQ": [  # McMenamins Tavern on the Square（美式）
                {"name": "Tavern Burger", "desc": "Cheddar, pickles, house sauce, fries", "price": "15.00"},
                {"name": "Cobb Salad", "desc": "Chicken, bacon, egg, blue cheese", "price": "13.50"},
                {"name": "Ruby Ale Pint", "desc": "McMenamins signature ale", "price": "7.00"},
            ],
            "ChIJXcF73GsOkFQRtM0IIMxZx9U": [  # The Bine Beer & Food（酒馆/美式）
                {"name": "Bine Burger", "desc": "Smash patty, white cheddar, house pickles", "price": "15.50"},
                {"name": "Crispy Brussels", "desc": "Fried brussels sprouts, lemon aioli", "price": "9.00"},
                {"name": "Local Draft", "desc": "Rotating tap pint", "price": "7.00"},
            ],
            "ChIJg4GkTmoOkFQRx6YkxgKruHo": [  # Ranch Drive-In（美式快餐）
                {"name": "Double Ranch Burger", "desc": "Two patties, American cheese, special sauce", "price": "10.50"},
                {"name": "Crinkle Fries", "desc": "Golden & crispy", "price": "3.75"},
                {"name": "Chocolate Shake", "desc": "Thick, classic milkshake", "price": "5.25"},
            ],
            "ChIJJ3qaRmoOkFQRmeCmWEG3n6o": [  # Amaro Bistro（意式）
                {"name": "Rigatoni Bolognese", "desc": "Slow-cooked beef ragu, parmigiano", "price": "19.00"},
                {"name": "Margherita Pizza", "desc": "Tomato, mozzarella, basil", "price": "17.00"},
                {"name": "Tiramisu", "desc": "Espresso-soaked ladyfingers, mascarpone", "price": "8.50"},
            ],
            "ChIJ2bnEedAPkFQRCZAZ9JtTQHs": [  # Krō Bär Bothell（酒吧/德式风）
                {"name": "Bratwurst Plate", "desc": "Grilled bratwurst, mustard, kraut", "price": "14.00"},
                {"name": "Pretzel & Beer Cheese", "desc": "Warm pretzel, cheddar beer dip", "price": "9.50"},
                {"name": "German Lager Pint", "desc": "Crisp, clean finish", "price": "7.50"},
            ],
            "ChIJ56Q14zYPkFQRWXqlwY4_EtE": [  # Bay Leaf Bar & Grill（多为印式）
                {"name": "Butter Chicken", "desc": "Creamy tomato sauce, basmati rice", "price": "16.50"},
                {"name": "Vegetable Samosa", "desc": "Crispy pastry, spiced potato & peas", "price": "6.00"},
                {"name": "Garlic Naan", "desc": "Tandoor-baked flatbread with garlic", "price": "4.00"},
            ],
            "ChIJXeGM4jcPkFQRIF-aPHzlqoc": [  # Side Hustle Local（咖啡/简餐）
                {"name": "Ham & Swiss Sandwich", "desc": "Dijon, greens, rustic bread", "price": "10.50"},
                {"name": "Iced Americano", "desc": "Chilled espresso + water", "price": "3.75"},
                {"name": "Blueberry Muffin", "desc": "House-baked, buttery crumb", "price": "3.50"},
            ],
            "ChIJZY9P50EOkFQR0-kYgFq0VY0": [  # McMenamins The Woodshop（美式）
                {"name": "Smash Burger", "desc": "Griddled patty, onions, pickles", "price": "14.50"},
                {"name": "Tots Basket", "desc": "Crispy golden tots", "price": "6.50"},
                {"name": "Ruby Ale Pint", "desc": "McMenamins signature ale", "price": "7.00"},
            ],
            "ChIJuXB7uMwPkFQRU-natrnmh_4": [  # The Bison（酒吧/美式）
                {"name": "Buffalo Wings", "desc": "Spicy buffalo sauce, ranch", "price": "12.00"},
                {"name": "Bison Burger", "desc": "Sharp cheddar, caramelized onions", "price": "16.00"},
                {"name": "Pilsner Pint", "desc": "Crisp & refreshing", "price": "7.00"},
            ],
            "ChIJdRQndQAPkFQRbGsLaSPQrKc": [  # Spring Bistro-晓春舍（中餐）
                {"name": "Kung Pao Chicken", "desc": "Peanuts, chilies, bell peppers", "price": "14.50"},
                {"name": "Mapo Tofu", "desc": "Sichuan peppercorn, chili bean sauce", "price": "13.50"},
                {"name": "Scallion Pancake", "desc": "Crispy layered flatbread", "price": "7.00"},
            ],
            "ChIJ8WRNMWoOkFQRTCvWq-77wwk": [  # Julio's Restaurant（墨西哥/拉美）
                {"name": "Carne Asada Tacos", "desc": "Grilled steak, onion, cilantro", "price": "12.00"},
                {"name": "Chicken Quesadilla", "desc": "Flour tortilla, cheese blend", "price": "11.00"},
                {"name": "Horchata", "desc": "Cinnamon rice drink", "price": "4.00"},
            ],
            "ChIJXXjLHkIOkFQRlG3STUlP4pg": [  # Ambakity Cocina Mexicana（墨西哥）
                {"name": "Al Pastor Tacos", "desc": "Marinated pork, pineapple", "price": "12.00"},
                {"name": "Chips & Guacamole", "desc": "House-fried chips, fresh guac", "price": "7.50"},
                {"name": "Agua Fresca", "desc": "Daily flavor, refreshing", "price": "3.75"},
            ],
            "ChIJCUK0xmsOkFQRI6y6q0JuQVw": [  # Chantanee Thai（泰餐）
                {"name": "Pad Thai", "desc": "Rice noodles, egg, peanuts, tamarind", "price": "14.50"},
                {"name": "Green Curry Chicken", "desc": "Coconut milk, basil, bamboo shoots", "price": "15.50"},
                {"name": "Tom Yum Soup", "desc": "Hot & sour lemongrass broth", "price": "6.50"},
            ],
            "ChIJh0nuxmsOkFQRRi2V5oW1_jw": [  # The Hop and Hound（酒吧/精酿）
                {"name": "Soft Pretzel", "desc": "Warm pretzel, mustard", "price": "7.00"},
                {"name": "Cheese Board", "desc": "Local cheeses, crackers", "price": "13.00"},
                {"name": "Rotating IPA Pint", "desc": "Ask about today's tap", "price": "7.50"},
            ],
        }

        # === 写库（幂等，根据 (restaurant, name) 唯一） ===
        created_items = 0
        skipped_items = 0
        missing_rest = []

        for place_id, items in menu_seed.items():
            try:
                r = Restaurant.objects.get(google_place_id=place_id, is_active=True)
            except Restaurant.DoesNotExist:
                missing_rest.append(place_id)
                continue

            for it in items:
                name = it["name"][:120]
                desc = (it.get("desc") or "")[:255]
                price = Decimal(it["price"])
                # 若同名已存在则跳过（避免 unique_together 冲突）
                exists = Item.objects.filter(restaurant=r, name=name).exists()
                if exists:
                    skipped_items += 1
                    continue
                Item.objects.create(
                    restaurant=r,
                    name=name,
                    description=desc,
                    price=price,
                    is_active=True,
                )
                created_items += 1

        print(f"menu upsert done. created={created_items}, skipped_existing={skipped_items}")
        if missing_rest:
            print("restaurants missing (not found by google_place_id):", len(missing_rest))
            # 可打印前几个看看
            print(missing_rest[:3])