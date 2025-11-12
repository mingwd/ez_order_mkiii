from decimal import Decimal
from django.core.management.base import BaseCommand
from restaurants.models import Restaurant

class Command(BaseCommand):
    def handle(self, *args, **kwargs):

        payload = { 
        "places": [
            {
            "id": "ChIJ3Z2osGsPkFQRVhikAj0ypIc",
            "formattedAddress": "20611 Bothell Everett Hwy Apt G, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.8105477,
                "longitude": -122.2069791
            },
            "displayName": {
                "text": "Royal Biryani House",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJXbAJERgPkFQRb9FyqE_0Guw",
            "formattedAddress": "20617 Bothell Everett Hwy suite b/c, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.8110661,
                "longitude": -122.20583289999999
            },
            "displayName": {
                "text": "Mayuri International Foods | Bothell",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJ77ZoLfYFkFQRQ52e5-P8CfA",
            "formattedAddress": "18626 Bothell Everett Hwy, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.82863150000001,
                "longitude": -122.20965049999998
            },
            "displayName": {
                "text": "Burgermaster",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJSSiF6NIPkFQRfh5XwEuyst8",
            "formattedAddress": "21135 Bothell Everett Hwy, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.8058682,
                "longitude": -122.2065973
            },
            "displayName": {
                "text": "Chipotle Mexican Grill",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJkb_PabwPkFQRrJ0jAMnsmbs",
            "formattedAddress": "20611 Bothell Everett Hwy Ste A, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.810729099999996,
                "longitude": -122.20684039999999
            },
            "displayName": {
                "text": "Kin Dee Thai Bothell",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJOXA05RIPkFQREdXmcmyDzA0",
            "formattedAddress": "21221 Bothell Everett Hwy, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.8051506,
                "longitude": -122.2075778
            },
            "displayName": {
                "text": "Panera Bread",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJPdIxg0IPkFQRcnVRNdF-Oqg",
            "formattedAddress": "1904 201st Pl SE, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.815995,
                "longitude": -122.20705699999999
            },
            "displayName": {
                "text": "Original Pancake House",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJweTGf2wPkFQR4TOKBYI0dyE",
            "formattedAddress": "20806 Bothell Everett Hwy UNIT 100, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.8092116,
                "longitude": -122.2087749
            },
            "displayName": {
                "text": "Samburna Indian Restaurant",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJ6_ed02sPkFQR2lqwi3Of1Ls",
            "formattedAddress": "20511 Bothell Everett Hwy, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.811857599999996,
                "longitude": -122.20696269999999
            },
            "displayName": {
                "text": "Dairy Queen Grill & Chill",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJvZDtIRMPkFQReNuIdVph5kw",
            "formattedAddress": "21215 Bothell Everett Hwy, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.805554799999996,
                "longitude": -122.20608820000001
            },
            "displayName": {
                "text": "Red Robin Gourmet Burgers and Brews",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJZQCqWxkPkFQRH4D8wNGGH6M",
            "formattedAddress": "20611 Bothell Everett Hwy E, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.810729099999996,
                "longitude": -122.20684039999999
            },
            "displayName": {
                "text": "Shawarma Time",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJ56fUSWoPkFQReeZkWsVPtb4",
            "formattedAddress": "20615 Bothell Everett Hwy B, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.8116053,
                "longitude": -122.20581940000001
            },
            "displayName": {
                "text": "Korea House Restaurant",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJBYDat0sPkFQRF7PbDyDMbY0",
            "formattedAddress": "21225 Bothell Everett Hwy #101, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.8052499,
                "longitude": -122.20689429999999
            },
            "displayName": {
                "text": "19 GOLD Malatang Bothell",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJs_Y15RIPkFQRnPu1RcIyx4A",
            "formattedAddress": "21225 Bothell Everett Hwy Ste 102, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.80514910000001,
                "longitude": -122.20710969999999
            },
            "displayName": {
                "text": "Menchie's Frozen Yogurt",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJdawae2sPkFQRJUlEPE6rGtw",
            "formattedAddress": "20805 Bothell Everett Hwy, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.8088372,
                "longitude": -122.2071386
            },
            "displayName": {
                "text": "Thrasher's Corner Sports Pub",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJd0zHFGsPkFQRp2TPcmo0Upc",
            "formattedAddress": "2020 Maltby Rd # 6, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.808980399999996,
                "longitude": -122.2058016
            },
            "displayName": {
                "text": "Bollywood 360 Pizza & Kwality Ice Cream",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJD5tpONMPkFQRpzFEkPqTrpI",
            "formattedAddress": "1912 201st Pl SE STE 207, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.815418199999996,
                "longitude": -122.2070388
            },
            "displayName": {
                "text": "Patrona",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJX_AeU2oPkFQRW-1egwJ0CT4",
            "formattedAddress": "20631 Bothell Everett Hwy J Ste J, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.8105614,
                "longitude": -122.2056361
            },
            "displayName": {
                "text": "Domino's Pizza",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJnS9TV1wPkFQRqH-rnlmhg2s",
            "formattedAddress": "19536-19598 Bothell Everett Hwy, Bothell, WA 98012, USA",
            "location": {
                "latitude": 47.8207777,
                "longitude": -122.20779279999999
            },
            "displayName": {
                "text": "La Sabrosa Taqueria",
                "languageCode": "en"
            }
            },
            {
            "id": "ChIJPfe_FGsPkFQRHzHMjyT0m_A",
            "formattedAddress": "2020 Maltby Rd #2, Bothell, WA 98021, USA",
            "location": {
                "latitude": 47.809179699999994,
                "longitude": -122.205803
            },
            "displayName": {
                "text": "Sushi Hana",
                "languageCode": "en"
            }
            }
        ]
        }

        created = updated = 0
        for p in payload.get("places", []):
            pid = p.get("id")
            if not pid:
                continue
            name = (p.get("displayName") or {}).get("text") or "Unnamed"
            addr = p.get("formattedAddress") or ""
            loc  = p.get("location") or {}
            lat  = loc.get("latitude")
            lng  = loc.get("longitude")

            obj, is_created = Restaurant.objects.update_or_create(
                google_place_id=pid,
                defaults={
                    "name": name[:120],
                    "address": addr[:400],
                    "latitude": Decimal(str(lat)) if lat is not None else None,
                    "longitude": Decimal(str(lng)) if lng is not None else None,
                    "is_active": True,
                },
            )
            created += 1 if is_created else 0
            updated += 0 if is_created else 1

        print(f"done. created={created}, updated={updated}, total={len(payload.get('places', []))}")
