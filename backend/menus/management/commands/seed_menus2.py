from django.core.management.base import BaseCommand
from restaurants.models import Restaurant, Item
from decimal import Decimal

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        menu_seed = {
            # Royal Biryani House
            "ChIJ3Z2osGsPkFQRVhikAj0ypIc": [
                {"name": "Chicken Biryani", "price": "14.99", "desc": "Basmati rice with tender chicken, spices & herbs."},
                {"name": "Lamb Rogan Josh", "price": "16.99", "desc": "Kashmiri-style lamb curry, aromatic and rich."},
                {"name": "Garlic Naan", "price": "3.99", "desc": "Tandoor-baked flatbread with fresh garlic and butter."},
            ],
            # Mayuri International Foods | Bothell
            "ChIJXbAJERgPkFQRb9FyqE_0Guw": [
                {"name": "Masala Dosa", "price": "10.99", "desc": "Crispy rice crepe with spiced potato filling."},
                {"name": "Paneer Butter Masala", "price": "13.49", "desc": "Paneer in creamy tomato-butter sauce."},
                {"name": "Chicken Tikka", "price": "14.49", "desc": "Yogurt-marinated chicken, grilled to perfection."},
            ],
            # Burgermaster
            "ChIJ77ZoLfYFkFQRQ52e5-P8CfA": [
                {"name": "Master Burger", "price": "9.99", "desc": "Quarter-pound beef, lettuce, tomato, house sauce."},
                {"name": "Bacon Cheddar Burger", "price": "11.49", "desc": "Crispy bacon, sharp cheddar, pickles."},
                {"name": "Hand-Cut Fries", "price": "3.49", "desc": "Fresh potatoes, fried golden and salted."},
            ],
            # Chipotle
            "ChIJSSiF6NIPkFQRfh5XwEuyst8": [
                {"name": "Chicken Burrito", "price": "10.95", "desc": "Chicken, cilantro-lime rice, beans, salsa, cheese."},
                {"name": "Steak Bowl", "price": "12.45", "desc": "Grilled steak with rice, fajita veggies, corn salsa."},
                {"name": "Chips & Guacamole", "price": "5.25", "desc": "Corn chips with hand-mashed guac."},
            ],
            # Kin Dee Thai Bothell
            "ChIJkb_PabwPkFQRrJ0jAMnsmbs": [
                {"name": "Pad Thai", "price": "13.95", "desc": "Rice noodles, tamarind sauce, egg, peanuts."},
                {"name": "Green Curry (Chicken)", "price": "14.95", "desc": "Coconut green curry, bamboo, basil."},
                {"name": "Tom Yum Soup", "price": "8.95", "desc": "Hot & sour lemongrass soup with mushrooms."},
            ],
            # Panera Bread
            "ChIJOXA05RIPkFQREdXmcmyDzA0": [
                {"name": "Broccoli Cheddar Soup", "price": "6.99", "desc": "Creamy soup with broccoli and cheddar."},
                {"name": "Bacon Turkey Bravo Sandwich", "price": "10.49", "desc": "Turkey, bacon, signature sauce on tomato basil."},
                {"name": "Fuji Apple Chicken Salad", "price": "11.49", "desc": "Greens, chicken, apple chips, gorgonzola."},
            ],
            # Original Pancake House
            "ChIJPdIxg0IPkFQRcnVRNdF-Oqg": [
                {"name": "Dutch Baby", "price": "12.95", "desc": "Oven-baked pancake with lemon, butter, sugar."},
                {"name": "Apple Pancake", "price": "13.95", "desc": "Baked with sautéed apples and cinnamon sugar."},
                {"name": "Buttermilk Pancakes", "price": "9.95", "desc": "Classic stack, whipped butter, syrup."},
            ],
            # Samburna Indian Restaurant
            "ChIJweTGf2wPkFQR4TOKBYI0dyE": [
                {"name": "Mysore Masala Dosa", "price": "11.49", "desc": "Spicy chutney spread & potato filling."},
                {"name": "Chicken Chettinad", "price": "15.49", "desc": "Peppery South Indian chicken curry."},
                {"name": "Gulab Jamun", "price": "4.99", "desc": "Warm milk-solid dumplings in syrup."},
            ],
            # Dairy Queen
            "ChIJ6_ed02sPkFQR2lqwi3Of1Ls": [
                {"name": "DQ® Blizzard (Oreo)", "price": "5.49", "desc": "Soft-serve blended with Oreo cookie pieces."},
                {"name": "Chicken Strip Basket", "price": "9.99", "desc": "Crispy strips with fries and toast."},
                {"name": "GrillBurger with Cheese", "price": "7.99", "desc": "Beef patty, cheese, lettuce, tomato."},
            ],
            # Red Robin
            "ChIJvZDtIRMPkFQReNuIdVph5kw": [
                {"name": "Royal Red Robin Burger", "price": "14.49", "desc": "Burger topped with egg and bacon."},
                {"name": "Banzai Burger", "price": "13.99", "desc": "Teriyaki glaze, grilled pineapple, cheddar."},
                {"name": "Bottomless Steak Fries", "price": "4.99", "desc": "Seasoned fries, all-you-can-eat."},
            ],
            # Shawarma Time
            "ChIJZQCqWxkPkFQRH4D8wNGGH6M": [
                {"name": "Chicken Shawarma Plate", "price": "14.49", "desc": "Spiced chicken, rice, salad, garlic sauce."},
                {"name": "Beef & Lamb Gyro Wrap", "price": "10.99", "desc": "Pita wrap with tzatziki and veggies."},
                {"name": "Falafel (6 pcs)", "price": "6.99", "desc": "Crispy chickpea fritters, tahini."},
            ],
            # Korea House Restaurant
            "ChIJ56fUSWoPkFQReeZkWsVPtb4": [
                {"name": "Bibimbap", "price": "13.99", "desc": "Rice, veggies, beef, fried egg, gochujang."},
                {"name": "LA Galbi", "price": "19.99", "desc": "Marinated short ribs, grilled."},
                {"name": "Kimchi Jjigae", "price": "12.49", "desc": "Kimchi stew with pork and tofu."},
            ],
            # 19 GOLD Malatang
            "ChIJBYDat0sPkFQRF7PbDyDMbY0": [
                {"name": "Build-Your-Own Malatang (Small)", "price": "12.99", "desc": "Pick broth & skewers by weight."},
                {"name": "Build-Your-Own Malatang (Large)", "price": "16.99", "desc": "Bigger bowl, custom toppings."},
                {"name": "Spicy Beef Skewers (5)", "price": "8.99", "desc": "Chili oil, cumin, sesame."},
            ],
            # Menchie's Frozen Yogurt
            "ChIJs_Y15RIPkFQRnPu1RcIyx4A": [
                {"name": "Original Tart Froyo", "price": "0.79", "desc": "Per ounce; tangy classic yogurt."},
                {"name": "Chocolate Froyo", "price": "0.79", "desc": "Per ounce; rich cocoa flavor."},
                {"name": "Toppings Sampler", "price": "1.99", "desc": "Assorted fruits, nuts & candies."},
            ],
            # Thrasher's Corner Sports Pub
            "ChIJdawae2sPkFQRJUlEPE6rGtw": [
                {"name": "Buffalo Wings (10)", "price": "13.49", "desc": "Choice of sauce, ranch or blue cheese."},
                {"name": "Pub Burger", "price": "12.49", "desc": "Cheddar, lettuce, tomato, house sauce."},
                {"name": "Fish & Chips", "price": "14.99", "desc": "Beer-battered cod, fries, tartar sauce."},
            ],
            # Bollywood 360 Pizza & Kwality Ice Cream
            "ChIJd0zHFGsPkFQRp2TPcmo0Upc": [
                {"name": "Tandoori Chicken Pizza (12\")", "price": "17.99", "desc": "Tandoori chicken, onions, peppers."},
                {"name": "Paneer Tikka Pizza (12\")", "price": "16.99", "desc": "Paneer, tikka sauce, cilantro."},
                {"name": "Kwality Mango Ice Cream (scoop)", "price": "3.99", "desc": "Indian-style mango ice cream."},
            ],
            # Patrona
            "ChIJD5tpONMPkFQRpzFEkPqTrpI": [
                {"name": "Carne Asada Tacos (3)", "price": "14.99", "desc": "Grilled steak, onions, cilantro."},
                {"name": "Chicken Enchiladas", "price": "13.99", "desc": "Red sauce, cheese, crema."},
                {"name": "Chips & Salsa", "price": "4.49", "desc": "Fresh tortilla chips with house salsa."},
            ],
            # Domino's Pizza
            "ChIJX_AeU2oPkFQRW-1egwJ0CT4": [
                {"name": "Pepperoni Hand-Tossed (12\")", "price": "12.99", "desc": "Classic pepperoni and mozzarella."},
                {"name": "ExtravaganZZa (12\")", "price": "15.49", "desc": "Loaded with meats & veggies."},
                {"name": "Stuffed Cheesy Bread", "price": "6.99", "desc": "Cheesy breadsticks with garlic."},
            ],
            # La Sabrosa Taqueria
            "ChIJnS9TV1wPkFQRqH-rnlmhg2s": [
                {"name": "Al Pastor Burrito", "price": "11.49", "desc": "Marinated pork, pineapple, beans, rice."},
                {"name": "Carnitas Tacos (3)", "price": "12.49", "desc": "Slow-cooked pork, onions, cilantro."},
                {"name": "Churros", "price": "4.99", "desc": "Cinnamon-sugar fried dough, chocolate dip."},
            ],
            # Sushi Hana
            "ChIJPfe_FGsPkFQRHzHMjyT0m_A": [
                {"name": "Spicy Tuna Roll", "price": "7.99", "desc": "Tuna, chili mayo, nori & rice."},
                {"name": "Salmon Nigiri (2)", "price": "6.49", "desc": "Fresh salmon over vinegared rice."},
                {"name": "Chicken Teriyaki Bento", "price": "14.99", "desc": "Grilled chicken, rice, salad, gyoza."},
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