"""
Management command to seed the catalog with sample products for development.
Usage: python manage.py seed_catalog
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from djmoney.money import Money

from apps.catalog.models import (
    Category, Product, ProductVariant, AttributeType, AttributeValue,
)


CATEGORIES = [
    {"name": "Knitwear", "slug": "knitwear", "description": "Premium knitted garments crafted from the finest natural fibres."},
    {"name": "Outerwear", "slug": "outerwear", "description": "Meticulously tailored coats and jackets for every season."},
    {"name": "Shirts", "slug": "shirts", "description": "Classic and contemporary shirts in premium fabrics."},
    {"name": "Trousers", "slug": "trousers", "description": "Refined trousers with a focus on fit and fabric."},
    {"name": "Accessories", "slug": "accessories", "description": "Curated essentials to complete every outfit."},
]

PRODUCTS = [
    {
        "name": "Cashmere Crewneck Sweater",
        "description": "Pure Mongolian cashmere crewneck with ribbed cuffs and hem. A wardrobe essential for layering or wearing solo.",
        "category": "knitwear",
        "base_price": 295,
        "material": "100% Mongolian Cashmere",
        "origin": "Scotland",
        "is_featured": True,
        "is_new": True,
        "variants": [
            {"name": "Oatmeal / S", "sku": "CSC-OAT-S", "color": "Oatmeal", "size": "S"},
            {"name": "Oatmeal / M", "sku": "CSC-OAT-M", "color": "Oatmeal", "size": "M"},
            {"name": "Oatmeal / L", "sku": "CSC-OAT-L", "color": "Oatmeal", "size": "L"},
            {"name": "Charcoal / S", "sku": "CSC-CHR-S", "color": "Charcoal", "size": "S"},
            {"name": "Charcoal / M", "sku": "CSC-CHR-M", "color": "Charcoal", "size": "M"},
            {"name": "Charcoal / L", "sku": "CSC-CHR-L", "color": "Charcoal", "size": "L"},
        ],
    },
    {
        "name": "Merino Wool Turtleneck",
        "description": "Extra-fine merino wool turtleneck with a relaxed fit. Soft, breathable, and perfect for transitional weather.",
        "category": "knitwear",
        "base_price": 185,
        "material": "100% Extra-fine Merino Wool",
        "origin": "Italy",
        "is_featured": True,
        "variants": [
            {"name": "Navy / S", "sku": "MWT-NAV-S", "color": "Navy", "size": "S"},
            {"name": "Navy / M", "sku": "MWT-NAV-M", "color": "Navy", "size": "M"},
            {"name": "Navy / L", "sku": "MWT-NAV-L", "color": "Navy", "size": "L"},
            {"name": "Cream / M", "sku": "MWT-CRM-M", "color": "Cream", "size": "M"},
            {"name": "Cream / L", "sku": "MWT-CRM-L", "color": "Cream", "size": "L"},
        ],
    },
    {
        "name": "Wool-Cashmere Overcoat",
        "description": "Tailored single-breasted overcoat in a luxurious wool-cashmere blend. Notch lapels, two-button closure.",
        "category": "outerwear",
        "base_price": 595,
        "material": "80% Wool, 20% Cashmere",
        "origin": "England",
        "is_featured": True,
        "is_new": True,
        "variants": [
            {"name": "Camel / S", "sku": "WCO-CML-S", "color": "Camel", "size": "S"},
            {"name": "Camel / M", "sku": "WCO-CML-M", "color": "Camel", "size": "M"},
            {"name": "Camel / L", "sku": "WCO-CML-L", "color": "Camel", "size": "L"},
            {"name": "Black / M", "sku": "WCO-BLK-M", "color": "Black", "size": "M"},
            {"name": "Black / L", "sku": "WCO-BLK-L", "color": "Black", "size": "L"},
        ],
    },
    {
        "name": "Linen Camp Collar Shirt",
        "description": "Relaxed camp collar shirt in garment-washed European linen. A summer essential with effortless drape.",
        "category": "shirts",
        "base_price": 145,
        "material": "100% European Linen",
        "origin": "Portugal",
        "is_new": True,
        "variants": [
            {"name": "White / S", "sku": "LCS-WHT-S", "color": "White", "size": "S"},
            {"name": "White / M", "sku": "LCS-WHT-M", "color": "White", "size": "M"},
            {"name": "White / L", "sku": "LCS-WHT-L", "color": "White", "size": "L"},
            {"name": "Sky Blue / M", "sku": "LCS-SKY-M", "color": "Sky Blue", "size": "M"},
            {"name": "Sky Blue / L", "sku": "LCS-SKY-L", "color": "Sky Blue", "size": "L"},
        ],
    },
    {
        "name": "Oxford Button-Down Shirt",
        "description": "Classic oxford cloth button-down with a slightly slim fit. Ideal for both casual and smart-casual settings.",
        "category": "shirts",
        "base_price": 125,
        "material": "100% Cotton Oxford Cloth",
        "origin": "Portugal",
        "is_featured": True,
        "variants": [
            {"name": "Blue / S", "sku": "OBD-BLU-S", "color": "Blue", "size": "S"},
            {"name": "Blue / M", "sku": "OBD-BLU-M", "color": "Blue", "size": "M"},
            {"name": "Blue / L", "sku": "OBD-BLU-L", "color": "Blue", "size": "L"},
            {"name": "White / M", "sku": "OBD-WHT-M", "color": "White", "size": "M"},
        ],
    },
    {
        "name": "Pleated Wool Trousers",
        "description": "Single-pleat trousers in mid-weight Italian wool. High rise with a tapered leg for a clean silhouette.",
        "category": "trousers",
        "base_price": 225,
        "material": "100% Italian Wool",
        "origin": "Italy",
        "variants": [
            {"name": "Charcoal / 30", "sku": "PWT-CHR-30", "color": "Charcoal", "size": "30"},
            {"name": "Charcoal / 32", "sku": "PWT-CHR-32", "color": "Charcoal", "size": "32"},
            {"name": "Charcoal / 34", "sku": "PWT-CHR-34", "color": "Charcoal", "size": "34"},
            {"name": "Navy / 32", "sku": "PWT-NAV-32", "color": "Navy", "size": "32"},
            {"name": "Navy / 34", "sku": "PWT-NAV-34", "color": "Navy", "size": "34"},
        ],
    },
    {
        "name": "Leather Card Holder",
        "description": "Vegetable-tanned leather card holder with four slots and a centre pocket. Ages beautifully over time.",
        "category": "accessories",
        "base_price": 65,
        "material": "Vegetable-tanned Leather",
        "origin": "Italy",
        "is_new": True,
        "variants": [
            {"name": "Tan", "sku": "LCH-TAN", "color": "Tan", "size": "One Size"},
            {"name": "Black", "sku": "LCH-BLK", "color": "Black", "size": "One Size"},
        ],
    },
    {
        "name": "Cashmere Scarf",
        "description": "Lightweight cashmere scarf with rolled edges. Versatile enough for every season.",
        "category": "accessories",
        "base_price": 135,
        "material": "100% Cashmere",
        "origin": "Nepal",
        "is_featured": True,
        "variants": [
            {"name": "Camel", "sku": "CSF-CML", "color": "Camel", "size": "One Size"},
            {"name": "Grey", "sku": "CSF-GRY", "color": "Grey", "size": "One Size"},
            {"name": "Navy", "sku": "CSF-NAV", "color": "Navy", "size": "One Size"},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the catalog with sample categories, products, and variants."

    def handle(self, *args, **options):
        # 1. Create attribute types
        color_type, _ = AttributeType.objects.get_or_create(name="Color", defaults={"slug": "color"})
        size_type, _ = AttributeType.objects.get_or_create(name="Size", defaults={"slug": "size"})

        # 2. Create categories
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={"name": cat_data["name"], "description": cat_data["description"]},
            )
            cat_map[cat_data["slug"]] = cat
            status = "created" if created else "exists"
            self.stdout.write(f"  Category: {cat.name} [{status}]")

        # 3. Create products and variants
        for prod_data in PRODUCTS:
            cat = cat_map.get(prod_data["category"])
            product, created = Product.objects.get_or_create(
                slug=slugify(prod_data["name"]),
                defaults={
                    "name": prod_data["name"],
                    "description": prod_data["description"],
                    "category": cat,
                    "base_price": Money(prod_data["base_price"], "USD"),
                    "material": prod_data.get("material", ""),
                    "origin": prod_data.get("origin", ""),
                    "is_featured": prod_data.get("is_featured", False),
                    "is_new": prod_data.get("is_new", False),
                    "is_active": True,
                },
            )
            p_status = "created" if created else "exists"
            self.stdout.write(f"  Product: {product.name} [{p_status}]")

            for var_data in prod_data.get("variants", []):
                variant, v_created = ProductVariant.objects.get_or_create(
                    sku=var_data["sku"],
                    defaults={
                        "product": product,
                        "name": var_data["name"],
                        "is_active": True,
                    },
                )

                # Assign attributes
                if v_created:
                    color_val, _ = AttributeValue.objects.get_or_create(
                        attribute_type=color_type, value=var_data["color"]
                    )
                    size_val, _ = AttributeValue.objects.get_or_create(
                        attribute_type=size_type, value=var_data["size"]
                    )
                    variant.attributes.add(color_val, size_val)

                    # Create stock level and initial inventory
                    try:
                        from apps.inventory.models import StockLevel, InventoryMovement
                        stock, _ = StockLevel.objects.get_or_create(variant=variant)
                        InventoryMovement.objects.get_or_create(
                            stock_level=stock,
                            movement_type="PURCHASE",
                            defaults={"quantity_change": 50, "reference": "Initial seed"},
                        )
                    except Exception:
                        pass

                v_status = "created" if v_created else "exists"
                self.stdout.write(f"    Variant: {variant.name} ({variant.sku}) [{v_status}]")

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products successfully!"
        ))
