"""
Management command: seed_data
Populates the database with realistic demo data for all models.
Does NOT create any user accounts — create those manually.

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush   # wipe existing data first
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from django.db import transaction
from moneyed import Money
import datetime


class Command(BaseCommand):
    help = "Seed demo data for all models (no users)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing seed data before inserting",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self._flush()

        with transaction.atomic():
            self._seed_categories()
            self._seed_attributes()
            self._seed_products()
            self._seed_variants_and_stock()
            self._seed_shipping()
            self._seed_coupons()

        self.stdout.write(self.style.SUCCESS("✅  Seed data created successfully."))

    # ──────────────────────────────────────────────────────────────────────────
    # Flush
    # ──────────────────────────────────────────────────────────────────────────

    def _flush(self):
        from apps.catalog.models import Category, Product, ProductVariant, ProductImage, AttributeType, AttributeValue
        from apps.inventory.models import StockLevel, InventoryMovement
        from apps.fulfillment.models import ShippingZone, ShippingRule
        from apps.marketing.models import CouponCode

        self.stdout.write("Flushing existing data…")
        InventoryMovement.objects.all().delete()
        StockLevel.objects.all().delete()
        ProductVariant.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        AttributeValue.objects.all().delete()
        AttributeType.objects.all().delete()
        Category.objects.all().delete()
        ShippingRule.objects.all().delete()
        ShippingZone.objects.all().delete()
        CouponCode.objects.all().delete()

    # ──────────────────────────────────────────────────────────────────────────
    # Categories
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_categories(self):
        from apps.catalog.models import Category

        root_data = [
            {"name": "Outerwear",     "sort_order": 1},
            {"name": "Ready-to-Wear", "sort_order": 2},
            {"name": "Footwear",      "sort_order": 3},
            {"name": "Accessories",   "sort_order": 4},
            {"name": "Knitwear",      "sort_order": 5},
        ]

        sub_data = {
            "Outerwear": ["Coats", "Jackets", "Blazers"],
            "Ready-to-Wear": ["Shirts & Tops", "Trousers", "Dresses & Skirts"],
            "Footwear": ["Sneakers", "Boots", "Flats & Sandals"],
            "Accessories": ["Bags", "Belts & Scarves", "Jewellery", "Watches", "Headphones"],
            "Knitwear": ["Sweaters", "Cardigans"],
        }

        self._categories = {}
        for rd in root_data:
            cat, _ = Category.objects.get_or_create(
                slug=slugify(rd["name"]),
                defaults={
                    "name": rd["name"],
                    "sort_order": rd["sort_order"],
                    "is_active": True,
                },
            )
            self._categories[rd["name"]] = cat

            for sub_name in sub_data.get(rd["name"], []):
                sub, _ = Category.objects.get_or_create(
                    slug=slugify(sub_name),
                    defaults={
                        "name": sub_name,
                        "parent": cat,
                        "is_active": True,
                        "sort_order": 0,
                    },
                )
                self._categories[sub_name] = sub

        self.stdout.write(f"  Categories: {len(self._categories)} created/found")

    # ──────────────────────────────────────────────────────────────────────────
    # Attributes
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_attributes(self):
        from apps.catalog.models import AttributeType, AttributeValue

        attrs = {
            "Color": ["Oatmeal", "Charcoal", "Slate", "Ivory", "Camel", "Navy",
                       "Ecru", "Sage", "Clay", "Black", "Cognac", "Tan",
                       "Off-White", "Bronze", "Midnight", "Chalk", "Optic White"],
            "Size": ["XS", "S", "M", "L", "XL", "XXL"],
            "Shoe Size": ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
            "One Size": ["One Size"],
        }

        self._attr_values = {}
        for type_name, values in attrs.items():
            atype, _ = AttributeType.objects.get_or_create(
                slug=slugify(type_name),
                defaults={"name": type_name},
            )
            self._attr_values[type_name] = {}
            for i, val in enumerate(values):
                av, _ = AttributeValue.objects.get_or_create(
                    attribute_type=atype,
                    value=val,
                    defaults={"sort_order": i},
                )
                self._attr_values[type_name][val] = av

        self.stdout.write("  Attributes seeded")

    # ──────────────────────────────────────────────────────────────────────────
    # Products
    # ──────────────────────────────────────────────────────────────────────────

    PRODUCT_DATA = [
        {
            "name": "L'Essonne Wool Overcoat",
            "category": "Coats",
            "price": "890.00",
            "compare_at": None,
            "material": "80% Wool, 15% Cashmere, 5% Polyamide",
            "origin": "Made in Italy",
            "description": (
                "Sculpted from premium Italian bouclé, this overcoat is an homage to "
                "Parisian tailoring. The fluid silhouette drapes effortlessly, whether "
                "worn over a knit or a tailored suit."
            ),
            "is_new": True,
            "is_featured": True,
            "colors": ["Oatmeal", "Charcoal", "Slate"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Studio Low Trainer",
            "category": "Sneakers",
            "price": "320.00",
            "compare_at": None,
            "material": "Premium Italian Calf Leather",
            "origin": "Made in Portugal",
            "description": (
                "Hand-stitched in Portugal using premium Italian calf leather. "
                "Bridges athletic performance and sartorial elegance."
            ),
            "is_new": False,
            "is_featured": True,
            "colors": ["Optic White", "Chalk", "Midnight"],
            "sizes": ["38", "39", "40", "41", "42", "43", "44"],
        },
        {
            "name": "Cashmere Mock Neck",
            "category": "Sweaters",
            "price": "185.00",
            "compare_at": None,
            "material": "100% Grade-A Cashmere",
            "origin": "Inner Mongolia",
            "description": (
                "Ethically sourced Grade-A cashmere. Unparalleled softness "
                "and a structured yet fluid mock neck silhouette."
            ),
            "is_new": True,
            "is_featured": False,
            "colors": ["Ivory", "Camel", "Navy"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Raw Edge Selvedge Denim",
            "category": "Trousers",
            "price": "220.00",
            "compare_at": None,
            "material": "100% Selvedge Denim — Kojima Looms",
            "origin": "Woven in Japan",
            "description": (
                "Woven on 1960s Toyoda shuttle looms. A slim straight silhouette "
                "with a 14.5oz weft weight for exceptional structure and longevity."
            ),
            "is_new": False,
            "is_featured": True,
            "colors": ["Indigo", "Black"],
            "sizes": ["28", "30", "32", "34", "36"],
        },
        {
            "name": "The Atelier Blazer",
            "category": "Blazers",
            "price": "560.00",
            "compare_at": "720.00",
            "material": "100% Italian Virgin Wool",
            "origin": "Made in Italy",
            "description": (
                "Sharp lines, soft feel. Italian virgin wool construction "
                "with a semi-lined interior for comfort across all seasons."
            ),
            "is_new": False,
            "is_featured": True,
            "colors": ["Navy", "Charcoal", "Ecru"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Artisan Leather Tote",
            "category": "Bags",
            "price": "980.00",
            "compare_at": None,
            "material": "Full-Grain Vegetable-Tanned Leather",
            "origin": "Crafted in Florence",
            "description": (
                "Handcrafted from full-grain vegetable-tanned leather. "
                "Develops a unique patina with use."
            ),
            "is_new": True,
            "is_featured": True,
            "colors": ["Tan", "Cognac", "Black"],
            "sizes": ["One Size"],
        },
        {
            "name": "Frame Clutch Bag",
            "category": "Bags",
            "price": "1150.00",
            "compare_at": None,
            "material": "Satin & Polished Hardware",
            "origin": "Made in France",
            "description": (
                "An architectural evening piece. Rigid frame construction "
                "references mid-century design."
            ),
            "is_new": False,
            "is_featured": False,
            "colors": ["Black", "Off-White", "Bronze"],
            "sizes": ["One Size"],
        },
        {
            "name": "Archive Leather Jacket",
            "category": "Jackets",
            "price": "1400.00",
            "compare_at": None,
            "material": "Supple Lambskin Leather",
            "origin": "Made in Spain",
            "description": (
                "A perennial wardrobe investment. Supple lambskin with "
                "a single-seam back construction."
            ),
            "is_new": False,
            "is_featured": True,
            "colors": ["Black", "Cognac"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Raw Silk Utility Shirt",
            "category": "Shirts & Tops",
            "price": "420.00",
            "compare_at": None,
            "material": "100% Raw Thai Silk",
            "origin": "Woven in Thailand",
            "description": (
                "Woven from raw Thai silk with a subtle slubbed texture. "
                "Oversized utility pockets."
            ),
            "is_new": True,
            "is_featured": False,
            "colors": ["Ecru", "Sage", "Clay"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Monolith Chelsea Boot",
            "category": "Boots",
            "price": "650.00",
            "compare_at": None,
            "material": "Polished Calf Leather",
            "origin": "Made in England",
            "description": (
                "A sculpted block heel elevates the classic Chelsea silhouette "
                "with architectural precision."
            ),
            "is_new": False,
            "is_featured": True,
            "colors": ["Black", "Tan"],
            "sizes": ["38", "39", "40", "41", "42", "43", "44"],
        },
        {
            "name": "The Signature Watch",
            "category": "Watches",
            "price": "240.00",
            "compare_at": None,
            "material": "Stainless Steel, Sapphire Crystal",
            "origin": "Swiss Made",
            "description": (
                "Swiss-made quartz movement in 316L stainless steel. "
                "Sapphire crystal glass with anti-reflective coating."
            ),
            "is_new": False,
            "is_featured": False,
            "colors": ["One Size"],
            "sizes": ["One Size"],
        },
        {
            "name": "Acoustic Over-Ear Headphones",
            "category": "Headphones",
            "price": "350.00",
            "compare_at": None,
            "material": "Aluminum, Full-Grain Leather",
            "origin": "Designed in Denmark",
            "description": (
                "Premium hi-fi audio with a handcrafted leather headband. "
                "40mm custom drivers deliver a rich, balanced soundstage."
            ),
            "is_new": True,
            "is_featured": False,
            "colors": ["Midnight", "Chalk"],
            "sizes": ["One Size"],
        },
        {
            "name": "Linen Relaxed Trousers",
            "category": "Trousers",
            "price": "195.00",
            "compare_at": "240.00",
            "material": "100% Belgian Linen",
            "origin": "Made in Portugal",
            "description": (
                "Wide-leg linen trousers with a drawstring waist. "
                "Effortless for warm-season dressing."
            ),
            "is_new": True,
            "is_featured": False,
            "colors": ["Ecru", "Slate", "Sage"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Merino Cardigan",
            "category": "Cardigans",
            "price": "165.00",
            "compare_at": None,
            "material": "100% Extra-Fine Merino",
            "origin": "Made in Scotland",
            "description": (
                "Relaxed-fit cardigan in extra-fine Merino. "
                "Clean lines, dropped shoulder, patch pockets."
            ),
            "is_new": False,
            "is_featured": False,
            "colors": ["Camel", "Ivory", "Charcoal"],
            "sizes": ["XS", "S", "M", "L", "XL"],
        },
        {
            "name": "Sculptural Leather Belt",
            "category": "Belts & Scarves",
            "price": "145.00",
            "compare_at": None,
            "material": "Vegetable-Tanned Leather",
            "origin": "Crafted in Italy",
            "description": (
                "Slim 25mm belt in vegetable-tanned leather with a solid brass buckle."
            ),
            "is_new": False,
            "is_featured": False,
            "colors": ["Black", "Cognac", "Tan"],
            "sizes": ["One Size"],
        },
    ]

    def _seed_products(self):
        from apps.catalog.models import Product

        self._products = {}
        for pd in self.PRODUCT_DATA:
            cat = self._categories.get(pd["category"])
            slug = slugify(pd["name"])

            # Handle colors not already in attribute values
            for color in pd["colors"]:
                if color not in self._attr_values.get("Color", {}) and color not in ("One Size",):
                    from apps.catalog.models import AttributeType, AttributeValue
                    atype = AttributeType.objects.get(slug="color")
                    av, _ = AttributeValue.objects.get_or_create(
                        attribute_type=atype,
                        value=color,
                        defaults={"sort_order": 99},
                    )
                    self._attr_values["Color"][color] = av

            # Handle sizes not in Shoe Size or Size
            for size in pd["sizes"]:
                if size not in self._attr_values.get("Size", {}) and \
                   size not in self._attr_values.get("Shoe Size", {}) and \
                   size not in self._attr_values.get("One Size", {}):
                    from apps.catalog.models import AttributeType, AttributeValue
                    atype = AttributeType.objects.get(slug="size")
                    av, _ = AttributeValue.objects.get_or_create(
                        attribute_type=atype,
                        value=size,
                        defaults={"sort_order": 99},
                    )
                    self._attr_values["Size"][size] = av

            compare_price = None
            if pd["compare_at"]:
                compare_price = Money(pd["compare_at"], "USD")

            product, _ = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": pd["name"],
                    "description": pd["description"],
                    "category": cat,
                    "base_price": Money(pd["price"], "USD"),
                    "compare_at_price": compare_price,
                    "material": pd["material"],
                    "origin": pd["origin"],
                    "is_active": True,
                    "is_new": pd["is_new"],
                    "is_featured": pd["is_featured"],
                },
            )
            self._products[pd["name"]] = product

        self.stdout.write(f"  Products: {len(self._products)} created/found")

    # ──────────────────────────────────────────────────────────────────────────
    # Variants + Stock
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_variants_and_stock(self):
        from apps.catalog.models import ProductVariant, AttributeValue
        from apps.inventory.models import StockLevel, InventoryMovement

        variant_count = 0
        for pd in self.PRODUCT_DATA:
            product = self._products[pd["name"]]
            colors = pd["colors"]
            sizes = pd["sizes"]

            for color in colors:
                for size in sizes:
                    is_one_size = (color == "One Size" or size == "One Size")
                    if is_one_size:
                        variant_name = "One Size"
                        sku = f"CUR-{slugify(pd['name'])[:15]}-OS".upper()
                    else:
                        variant_name = f"{color} / {size}"
                        sku_color = color[:3].upper().replace(" ", "")
                        sku = f"CUR-{slugify(pd['name'])[:10]}-{sku_color}-{size}".upper()

                    # Deduplicate SKU collisions by appending index
                    base_sku = sku
                    idx = 1
                    while ProductVariant.objects.filter(sku=sku).exclude(product=product).exists():
                        sku = f"{base_sku}-{idx}"
                        idx += 1

                    variant, created = ProductVariant.objects.get_or_create(
                        product=product,
                        sku=sku,
                        defaults={
                            "name": variant_name,
                            "is_active": True,
                        },
                    )

                    # Attach attribute values
                    if created:
                        attr_list = []
                        if not is_one_size:
                            color_av = (
                                self._attr_values.get("Color", {}).get(color)
                            )
                            if color_av:
                                attr_list.append(color_av)

                            # Size: check both Size and Shoe Size maps
                            size_av = (
                                self._attr_values.get("Size", {}).get(size) or
                                self._attr_values.get("Shoe Size", {}).get(size)
                            )
                            if size_av:
                                attr_list.append(size_av)
                        else:
                            one_av = self._attr_values.get("One Size", {}).get("One Size")
                            if one_av:
                                attr_list.append(one_av)

                        if attr_list:
                            variant.attributes.set(attr_list)

                    # Stock level + initial purchase movement
                    stock_level, sl_created = StockLevel.objects.get_or_create(variant=variant)
                    if sl_created:
                        initial_qty = 25 if not is_one_size else 10
                        InventoryMovement.objects.create(
                            stock_level=stock_level,
                            movement_type=InventoryMovement.MovementType.PURCHASE,
                            quantity_change=initial_qty,
                            reference="SEED_DATA",
                            notes="Initial stock from seed_data command",
                        )
                    variant_count += 1

                    # If one_size, don't repeat for each size
                    if is_one_size:
                        break
                if is_one_size:
                    break

        self.stdout.write(f"  Variants + Stock: {variant_count} processed")

    # ──────────────────────────────────────────────────────────────────────────
    # Shipping
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_shipping(self):
        from apps.fulfillment.models import ShippingZone, ShippingRule

        zones_data = [
            {
                "name": "Domestic (India)",
                "countries": ["IN"],
                "rules": [
                    {
                        "name": "Standard Delivery",
                        "base_rate": Money("5.00", "USD"),
                        "free_above": Money("100.00", "USD"),
                        "days_min": 5,
                        "days_max": 8,
                    },
                    {
                        "name": "Express Delivery",
                        "base_rate": Money("12.00", "USD"),
                        "free_above": None,
                        "days_min": 2,
                        "days_max": 3,
                    },
                ],
            },
            {
                "name": "International",
                "countries": ["US", "GB", "CA", "AU", "DE", "FR", "AE", "SG"],
                "rules": [
                    {
                        "name": "Standard International",
                        "base_rate": Money("15.00", "USD"),
                        "free_above": Money("300.00", "USD"),
                        "days_min": 7,
                        "days_max": 14,
                    },
                    {
                        "name": "Express International",
                        "base_rate": Money("35.00", "USD"),
                        "free_above": None,
                        "days_min": 3,
                        "days_max": 5,
                    },
                ],
            },
        ]

        for zd in zones_data:
            zone, _ = ShippingZone.objects.get_or_create(
                name=zd["name"],
                defaults={"countries": zd["countries"], "is_active": True},
            )
            for rd in zd["rules"]:
                ShippingRule.objects.get_or_create(
                    zone=zone,
                    name=rd["name"],
                    defaults={
                        "base_rate": rd["base_rate"],
                        "free_above": rd["free_above"],
                        "estimated_days_min": rd["days_min"],
                        "estimated_days_max": rd["days_max"],
                        "is_active": True,
                    },
                )

        self.stdout.write("  Shipping zones & rules seeded")

    # ──────────────────────────────────────────────────────────────────────────
    # Coupons
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_coupons(self):
        from apps.marketing.models import CouponCode

        now = timezone.now()
        coupons = [
            {
                "code": "WELCOME10",
                "description": "10% off your first order",
                "discount_type": CouponCode.DiscountType.PERCENTAGE,
                "discount_value": "10.00",
                "max_discount": Money("50.00", "USD"),
                "min_order_amount": Money("100.00", "USD"),
                "max_uses": 1000,
                "valid_from": now,
                "valid_until": now + datetime.timedelta(days=365),
            },
            {
                "code": "CURATED20",
                "description": "20% off orders above $300",
                "discount_type": CouponCode.DiscountType.PERCENTAGE,
                "discount_value": "20.00",
                "max_discount": Money("150.00", "USD"),
                "min_order_amount": Money("300.00", "USD"),
                "max_uses": 500,
                "valid_from": now,
                "valid_until": now + datetime.timedelta(days=180),
            },
            {
                "code": "FLAT50",
                "description": "$50 off orders above $400",
                "discount_type": CouponCode.DiscountType.FIXED,
                "discount_value": "50.00",
                "max_discount": None,
                "min_order_amount": Money("400.00", "USD"),
                "max_uses": None,
                "valid_from": now,
                "valid_until": now + datetime.timedelta(days=90),
            },
            {
                "code": "NEWSEASON",
                "description": "15% off all new arrivals",
                "discount_type": CouponCode.DiscountType.PERCENTAGE,
                "discount_value": "15.00",
                "max_discount": Money("100.00", "USD"),
                "min_order_amount": None,
                "max_uses": 200,
                "valid_from": now,
                "valid_until": now + datetime.timedelta(days=60),
            },
        ]

        for cd in coupons:
            CouponCode.objects.get_or_create(
                code=cd["code"],
                defaults={
                    "description": cd["description"],
                    "discount_type": cd["discount_type"],
                    "discount_value": cd["discount_value"],
                    "max_discount": cd["max_discount"],
                    "min_order_amount": cd["min_order_amount"],
                    "max_uses": cd["max_uses"],
                    "times_used": 0,
                    "valid_from": cd["valid_from"],
                    "valid_until": cd["valid_until"],
                    "is_active": True,
                },
            )

        self.stdout.write("  Coupons seeded")
