import re

# More specific rules first.
CLASSIFY_RULES = [
    (["sushi", "nigiri", "sashimi", "ramen", "izakaya", "katsu", "udon", "sake", "tokyo"], "japanese"),
    (["korean", "korea house", "kimchi", "kbbq", "k-bbq", "seoul", "soondubu", "bulgogi"], "korean"),
    (["thai", "pad thai", "tom yum", "kin dee", "chantanee"], "thai"),
    (["pho", "banh mi", "vietnamese", "viet "], "vietnamese"),
    (["biryani", "tandoor", "masala", "indian", "naan", "tikka", "mayuri", "rogan", "bay leaf"], "indian"),
    (["taco", "burrito", "mexican", "cantina", "chipotle", "taqueria", "quesadilla", "cocina", "julio", "al pastor"], "mexican"),
    (["pizza", "pasta", "italian", "trattoria", "ristorante", "amaro", "pizz"], "italian"),
    (["teriyaki"], "japanese"),
    (["panda", "pf chang", "p.f. chang", "sichuan", "szechuan", "dim sum", "kung pao", "wok", "chinese", "shanghai", "beijing", "din tai fung", "dumpling", "hotpot", "hot pot", "malatang", "haidilao", "dough zone"], "chinese"),
    (["burger", "burgermaster", "drive-in", "drive in", "shake shack", "in-n-out", "mcdonald"], "burger"),
    (["starbucks"], "cafe"),
    (["pancake", "ihop", "waffle", "biscuit"], "cafe"),
    (["yogurt", "menchie"], "cafe"),
    (["sub sandwiches", "tubs gourmet", "sandwich"], "cafe"),
    (["panera", "cafe", "coffee", "latte", "bakery", "espresso", "brunch", "cottage", "cold brew", "zulu", "alexa", "side hustle"], "cafe"),
    (["mcmenamins", "tavern", "pub", "alehouse", "brew", "taproom", "hop and", "woodshop", "bison", "krō", "kro b", "bar & grill", "bar and grill"], "pub"),
]

CJK_RE = re.compile(r"[\u4e00-\u9fff]")


def classify_restaurant(name: str) -> str:
    text = (name or "").strip().lower()
    if CJK_RE.search(name or ""):
        return "chinese"
    for keywords, kind in CLASSIFY_RULES:
        if any(k in text for k in keywords):
            return kind
    return "american"


def _item(name, description, price, cuisine, protein, spice, meal, flavors, allergens, nutritions):
    return {
        "name": name,
        "description": description,
        "price": price,
        "cuisines": [cuisine],
        "proteins": [protein] if protein else [],
        "spice": spice,
        "meal_types": [meal],
        "flavors": flavors,
        "allergens": allergens,
        "nutritions": nutritions,
    }


TEMPLATES = {
    "japanese": [
        _item("Salmon Nigiri (2pc)", "Fresh salmon over seasoned sushi rice.", "8.50", "japanese", "fish", "none", "main", ["umami"], ["fish"], ["high_protein"]),
        _item("Spicy Tuna Roll", "Tuna, chili mayo, scallion, sushi rice.", "9.50", "japanese", "fish", "medium", "main", ["spicy", "umami"], ["fish", "eggs"], ["high_protein"]),
        _item("Green Tea", "Hot sencha, lightly roasted.", "3.50", "japanese", None, "none", "drink", ["umami"], [], ["low_calorie"]),
    ],
    "korean": [
        _item("Bulgogi Bowl", "Marinated beef, rice, sesame, pickled veg.", "16.50", "korean", "beef", "mild", "main", ["sweet", "umami"], ["soybeans", "sesame", "wheat"], ["high_protein"]),
        _item("Kimchi Side", "House-fermented napa cabbage.", "4.50", "korean", None, "medium", "side", ["sour", "spicy"], [], ["low_calorie"]),
        _item("Barley Tea", "Toasted barley, served hot or iced.", "3.00", "korean", None, "none", "drink", ["salty"], [], ["low_calorie"]),
    ],
    "thai": [
        _item("Pad Thai", "Rice noodles, egg, tamarind, crushed peanuts.", "14.95", "thai", "chicken", "mild", "main", ["sweet", "sour", "salty"], ["peanuts", "eggs", "fish", "soybeans"], ["high_protein"]),
        _item("Green Curry Chicken", "Coconut green curry, basil, bamboo shoots.", "15.95", "thai", "chicken", "hot", "main", ["spicy", "umami"], ["milk"], ["high_protein"]),
        _item("Thai Iced Tea", "Strong black tea, sweetened condensed milk.", "4.50", "thai", None, "none", "drink", ["sweet"], ["milk"], ["low_fat"]),
    ],
    "vietnamese": [
        _item("Chicken Pho", "Star anise broth, rice noodles, herbs.", "14.50", "vietnamese", "chicken", "mild", "main", ["umami", "salty"], [], ["high_protein", "low_fat"]),
        _item("Spring Rolls", "Shrimp, herbs, rice paper, peanut dip.", "8.50", "vietnamese", "shrimp", "none", "side", ["fresh", "salty"], ["peanuts", "crustacean_shellfish"], ["low_calorie"]),
        _item("Iced Coffee", "Dark roast over condensed milk.", "4.25", "vietnamese", None, "none", "drink", ["sweet"], ["milk"], []),
    ],
    "chinese": [
        _item("Kung Pao Chicken", "Peanuts, dried chili, bell pepper.", "15.50", "chinese", "chicken", "hot", "main", ["spicy", "salty", "umami"], ["peanuts", "soybeans", "wheat"], ["high_protein"]),
        _item("Mapo Tofu", "Silken tofu, chili bean sauce, Sichuan pepper.", "13.50", "chinese", "tofu", "extra_hot", "main", ["spicy", "umami"], ["soybeans"], ["high_protein", "low_calorie"]),
        _item("Jasmine Tea", "Hot fragrant tea.", "2.50", "chinese", None, "none", "drink", ["umami"], [], ["low_calorie"]),
    ],
    "indian": [
        _item("Chicken Tikka Masala", "Tomato-cream curry, basmati rice.", "16.95", "indian", "chicken", "medium", "main", ["spicy", "sweet", "umami"], ["milk"], ["high_protein"]),
        _item("Garlic Naan", "Tandoor flatbread, garlic butter.", "3.99", "indian", None, "none", "side", ["salty"], ["wheat", "milk"], []),
        _item("Mango Lassi", "Yogurt smoothie with mango.", "4.50", "indian", None, "none", "drink", ["sweet"], ["milk"], []),
    ],
    "mexican": [
        _item("Carne Asada Tacos", "Grilled steak, onion, cilantro, salsa.", "12.95", "mexican", "beef", "mild", "main", ["salty", "umami"], ["wheat"], ["high_protein"]),
        _item("Chips & Guacamole", "Fried corn chips, lime guacamole.", "6.50", "mexican", None, "none", "side", ["salty"], [], ["high_fiber"]),
        _item("Horchata", "Cinnamon rice drink.", "3.75", "mexican", None, "none", "drink", ["sweet"], ["milk"], []),
    ],
    "italian": [
        _item("Margherita Pizza", "Tomato, mozzarella, basil.", "17.00", "italian", None, "none", "main", ["salty", "umami"], ["wheat", "milk"], []),
        _item("Caesar Salad", "Romaine, parmesan, croutons.", "11.00", "italian", "egg", "none", "side", ["salty"], ["eggs", "milk", "wheat", "fish"], ["low_calorie"]),
        _item("Tiramisu", "Espresso-soaked ladyfingers, mascarpone.", "8.50", "italian", None, "none", "dessert", ["sweet"], ["eggs", "milk", "wheat"], []),
    ],
    "burger": [
        _item("Cheeseburger", "Beef patty, American cheese, pickle, bun.", "11.50", "american", "beef", "none", "main", ["salty", "umami"], ["wheat", "milk"], ["high_protein"]),
        _item("Crinkle Fries", "Salted, fried golden.", "3.75", "american", None, "none", "side", ["salty"], [], []),
        _item("Chocolate Shake", "Thick fountain shake.", "5.25", "american", None, "none", "drink", ["sweet"], ["milk"], []),
    ],
    "cafe": [
        _item("Avocado Toast", "Sourdough, smashed avocado, lemon, chili flake.", "11.00", "american", "egg", "none", "main", ["salty"], ["wheat", "eggs"], ["high_fiber"]),
        _item("Latte", "Espresso and steamed milk.", "4.75", "american", None, "none", "drink", ["sweet"], ["milk"], []),
        _item("Blueberry Muffin", "Buttery crumb, baked daily.", "3.50", "american", None, "none", "dessert", ["sweet"], ["wheat", "eggs", "milk"], []),
    ],
    "pub": [
        _item("Tavern Burger", "Cheddar, house sauce, pickles, bun.", "15.00", "american", "beef", "none", "main", ["salty", "umami"], ["wheat", "milk"], ["high_protein"]),
        _item("Soft Pretzel", "Warm pretzel, mustard.", "7.00", "american", None, "none", "side", ["salty"], ["wheat"], []),
        _item("House Draft Pint", "Rotating local tap.", "7.00", "american", None, "none", "drink", ["bitter"], [], ["low_calorie"]),
    ],
    "american": [
        _item("Grilled Chicken Plate", "Herb chicken, seasonal vegetables.", "16.00", "american", "chicken", "none", "main", ["umami", "salty"], [], ["high_protein", "low_fat"]),
        _item("House Salad", "Greens, cucumber, vinaigrette.", "8.50", "american", None, "none", "side", ["sour"], [], ["low_calorie", "high_fiber"]),
        _item("Iced Tea", "Fresh-brewed, unsweetened.", "3.00", "american", None, "none", "drink", [], [], ["low_calorie"]),
    ],
}

# Flavor "fresh"/"bitter" are not in seed_tags — strip unknown flavors when applying.
ALLOWED_FLAVORS = {"sweet", "sour", "salty", "spicy", "umami"}


def menu_for_kind(kind: str):
    items = TEMPLATES.get(kind) or TEMPLATES["american"]
    cleaned = []
    for it in items:
        row = dict(it)
        row["flavors"] = [f for f in row["flavors"] if f in ALLOWED_FLAVORS]
        cleaned.append(row)
    return cleaned
