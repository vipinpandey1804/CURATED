"""
Adds missing variants and sets stock to 5 for all variants of a product.
Usage: python manage.py seed_variants --slug oxford-button-down-shirt
"""
from django.core.management.base import BaseCommand
from apps.catalog.models import Product, ProductVariant, AttributeType, AttributeValue
from apps.inventory.models import StockLevel, InventoryMovement


VARIANTS_TO_ADD = {
    "oxford-button-down-shirt": [
        {"sku": "OBD-WHT-S", "name": "White / S", "color": "White", "size": "S"},
        {"sku": "OBD-WHT-L", "name": "White / L", "color": "White", "size": "L"},
    ],
}

TARGET_QTY = 5


class Command(BaseCommand):
    help = "Add missing variants and seed stock to 5 for all variants."

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, help="Product slug (optional, runs all if omitted)")

    def handle(self, *args, **options):
        color_type, _ = AttributeType.objects.get_or_create(name="Color", defaults={"slug": "color"})
        size_type, _ = AttributeType.objects.get_or_create(name="Size", defaults={"slug": "size"})

        slug_filter = options.get("slug")
        slugs = [slug_filter] if slug_filter else list(VARIANTS_TO_ADD.keys())

        for slug in slugs:
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(f"SKIP: product '{slug}' not found")
                continue

            self.stdout.write(f"\nProduct: {product.name}")

            # Add missing variants
            for vdata in VARIANTS_TO_ADD.get(slug, []):
                color_val, _ = AttributeValue.objects.get_or_create(attribute_type=color_type, value=vdata["color"])
                size_val, _ = AttributeValue.objects.get_or_create(attribute_type=size_type, value=vdata["size"])
                v, created = ProductVariant.objects.get_or_create(
                    sku=vdata["sku"],
                    defaults={"product": product, "name": vdata["name"], "is_active": True},
                )
                if created:
                    v.attributes.add(color_val, size_val)
                    self.stdout.write(f"  Created variant: {vdata['sku']}")
                else:
                    self.stdout.write(f"  Exists variant:  {vdata['sku']}")

            # Set all variants to TARGET_QTY
            for v in product.variants.all():
                stock, _ = StockLevel.objects.get_or_create(variant=v)
                current = stock.quantity_available
                if current < TARGET_QTY:
                    diff = TARGET_QTY - current
                    InventoryMovement.objects.create(
                        stock_level=stock,
                        movement_type="PURCHASE",
                        quantity_change=diff,
                        reference="seed_variants",
                    )
                    self.stdout.write(f"  Stocked {v.sku}: +{diff} -> {TARGET_QTY}")
                else:
                    self.stdout.write(f"  Skip stock {v.sku}: already {current}")

        self.stdout.write(self.style.SUCCESS("\nDone!"))
