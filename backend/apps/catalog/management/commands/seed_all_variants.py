"""
Seeds variants and stock (qty=10) for all products.
Usage: python manage.py seed_all_variants
"""
from django.core.management.base import BaseCommand
from djmoney.money import Money
from apps.catalog.models import Product, ProductVariant, AttributeType, AttributeValue
from apps.inventory.models import StockLevel, InventoryMovement


TARGET_QTY = 10

PRODUCTS = {
    "cashmere-scarf": [
        {"sku": "CSF-CML", "name": "Camel", "color": "Camel", "size": "One Size"},
        {"sku": "CSF-GRY", "name": "Grey", "color": "Grey", "size": "One Size"},
        {"sku": "CSF-NAV", "name": "Navy", "color": "Navy", "size": "One Size"},
    ],
    "leather-card-holder": [
        {"sku": "LCH-TAN", "name": "Tan", "color": "Tan", "size": "One Size"},
        {"sku": "LCH-BLK", "name": "Black", "color": "Black", "size": "One Size"},
        {"sku": "LCH-COG", "name": "Cognac", "color": "Cognac", "size": "One Size"},
    ],
    "pleated-wool-trousers": [
        {"sku": "PWT-CHR-30", "name": "Charcoal / 30", "color": "Charcoal", "size": "30"},
        {"sku": "PWT-CHR-32", "name": "Charcoal / 32", "color": "Charcoal", "size": "32"},
        {"sku": "PWT-CHR-34", "name": "Charcoal / 34", "color": "Charcoal", "size": "34"},
        {"sku": "PWT-NAV-30", "name": "Navy / 30", "color": "Navy", "size": "30"},
        {"sku": "PWT-NAV-32", "name": "Navy / 32", "color": "Navy", "size": "32"},
        {"sku": "PWT-NAV-34", "name": "Navy / 34", "color": "Navy", "size": "34"},
    ],
    "oxford-button-down-shirt": [
        {"sku": "OBD-BLU-S", "name": "Blue / S", "color": "Blue", "size": "S"},
        {"sku": "OBD-BLU-M", "name": "Blue / M", "color": "Blue", "size": "M"},
        {"sku": "OBD-BLU-L", "name": "Blue / L", "color": "Blue", "size": "L"},
        {"sku": "OBD-WHT-S", "name": "White / S", "color": "White", "size": "S"},
        {"sku": "OBD-WHT-M", "name": "White / M", "color": "White", "size": "M"},
        {"sku": "OBD-WHT-L", "name": "White / L", "color": "White", "size": "L"},
    ],
    "linen-camp-collar-shirt": [
        {"sku": "LCS-WHT-S", "name": "White / S", "color": "White", "size": "S"},
        {"sku": "LCS-WHT-M", "name": "White / M", "color": "White", "size": "M"},
        {"sku": "LCS-WHT-L", "name": "White / L", "color": "White", "size": "L"},
        {"sku": "LCS-SKY-S", "name": "Sky Blue / S", "color": "Sky Blue", "size": "S"},
        {"sku": "LCS-SKY-M", "name": "Sky Blue / M", "color": "Sky Blue", "size": "M"},
        {"sku": "LCS-SKY-L", "name": "Sky Blue / L", "color": "Sky Blue", "size": "L"},
    ],
    "wool-cashmere-overcoat": [
        {"sku": "WCO-CML-S", "name": "Camel / S", "color": "Camel", "size": "S"},
        {"sku": "WCO-CML-M", "name": "Camel / M", "color": "Camel", "size": "M"},
        {"sku": "WCO-CML-L", "name": "Camel / L", "color": "Camel", "size": "L"},
        {"sku": "WCO-BLK-S", "name": "Black / S", "color": "Black", "size": "S"},
        {"sku": "WCO-BLK-M", "name": "Black / M", "color": "Black", "size": "M"},
        {"sku": "WCO-BLK-L", "name": "Black / L", "color": "Black", "size": "L"},
    ],
    "merino-wool-turtleneck": [
        {"sku": "MWT-NAV-S", "name": "Navy / S", "color": "Navy", "size": "S"},
        {"sku": "MWT-NAV-M", "name": "Navy / M", "color": "Navy", "size": "M"},
        {"sku": "MWT-NAV-L", "name": "Navy / L", "color": "Navy", "size": "L"},
        {"sku": "MWT-CRM-S", "name": "Cream / S", "color": "Cream", "size": "S"},
        {"sku": "MWT-CRM-M", "name": "Cream / M", "color": "Cream", "size": "M"},
        {"sku": "MWT-CRM-L", "name": "Cream / L", "color": "Cream", "size": "L"},
    ],
    "cashmere-crewneck-sweater": [
        {"sku": "CSC-OAT-S", "name": "Oatmeal / S", "color": "Oatmeal", "size": "S"},
        {"sku": "CSC-OAT-M", "name": "Oatmeal / M", "color": "Oatmeal", "size": "M"},
        {"sku": "CSC-OAT-L", "name": "Oatmeal / L", "color": "Oatmeal", "size": "L"},
        {"sku": "CSC-CHR-S", "name": "Charcoal / S", "color": "Charcoal", "size": "S"},
        {"sku": "CSC-CHR-M", "name": "Charcoal / M", "color": "Charcoal", "size": "M"},
        {"sku": "CSC-CHR-L", "name": "Charcoal / L", "color": "Charcoal", "size": "L"},
    ],
    "sculptural-leather-belt": [
        {"sku": "SLB-BLK-S", "name": "Black / S", "color": "Black", "size": "S"},
        {"sku": "SLB-BLK-M", "name": "Black / M", "color": "Black", "size": "M"},
        {"sku": "SLB-BLK-L", "name": "Black / L", "color": "Black", "size": "L"},
        {"sku": "SLB-TAN-S", "name": "Tan / S", "color": "Tan", "size": "S"},
        {"sku": "SLB-TAN-M", "name": "Tan / M", "color": "Tan", "size": "M"},
        {"sku": "SLB-TAN-L", "name": "Tan / L", "color": "Tan", "size": "L"},
    ],
    "merino-cardigan": [
        {"sku": "MCG-OAT-S", "name": "Oatmeal / S", "color": "Oatmeal", "size": "S"},
        {"sku": "MCG-OAT-M", "name": "Oatmeal / M", "color": "Oatmeal", "size": "M"},
        {"sku": "MCG-OAT-L", "name": "Oatmeal / L", "color": "Oatmeal", "size": "L"},
        {"sku": "MCG-GRY-S", "name": "Grey / S", "color": "Grey", "size": "S"},
        {"sku": "MCG-GRY-M", "name": "Grey / M", "color": "Grey", "size": "M"},
        {"sku": "MCG-GRY-L", "name": "Grey / L", "color": "Grey", "size": "L"},
    ],
    "linen-relaxed-trousers": [
        {"sku": "LRT-ECR-30", "name": "Ecru / 30", "color": "Ecru", "size": "30"},
        {"sku": "LRT-ECR-32", "name": "Ecru / 32", "color": "Ecru", "size": "32"},
        {"sku": "LRT-ECR-34", "name": "Ecru / 34", "color": "Ecru", "size": "34"},
        {"sku": "LRT-KHK-30", "name": "Khaki / 30", "color": "Khaki", "size": "30"},
        {"sku": "LRT-KHK-32", "name": "Khaki / 32", "color": "Khaki", "size": "32"},
        {"sku": "LRT-KHK-34", "name": "Khaki / 34", "color": "Khaki", "size": "34"},
    ],
    "acoustic-over-ear-headphones": [
        {"sku": "AOE-MID", "name": "Midnight Matte", "color": "Midnight Matte", "size": "One Size"},
        {"sku": "AOE-WHT", "name": "Cloud White", "color": "Cloud White", "size": "One Size"},
    ],
    "the-signature-watch": [
        {"sku": "SGW-STL", "name": "Brushed Steel / Black Leather", "color": "Brushed Steel", "size": "One Size"},
        {"sku": "SGW-GLD", "name": "Gold / Brown Leather", "color": "Gold", "size": "One Size"},
    ],
    "monolith-chelsea-boot": [
        {"sku": "MCB-BLK-40", "name": "Black / 40", "color": "Black", "size": "40"},
        {"sku": "MCB-BLK-41", "name": "Black / 41", "color": "Black", "size": "41"},
        {"sku": "MCB-BLK-42", "name": "Black / 42", "color": "Black", "size": "42"},
        {"sku": "MCB-TAN-40", "name": "Tan / 40", "color": "Tan", "size": "40"},
        {"sku": "MCB-TAN-41", "name": "Tan / 41", "color": "Tan", "size": "41"},
        {"sku": "MCB-TAN-42", "name": "Tan / 42", "color": "Tan", "size": "42"},
    ],
    "raw-silk-utility-shirt": [
        {"sku": "RSU-ECR-S", "name": "Ecru / S", "color": "Ecru", "size": "S"},
        {"sku": "RSU-ECR-M", "name": "Ecru / M", "color": "Ecru", "size": "M"},
        {"sku": "RSU-ECR-L", "name": "Ecru / L", "color": "Ecru", "size": "L"},
        {"sku": "RSU-SGE-S", "name": "Sage / S", "color": "Sage", "size": "S"},
        {"sku": "RSU-SGE-M", "name": "Sage / M", "color": "Sage", "size": "M"},
        {"sku": "RSU-SGE-L", "name": "Sage / L", "color": "Sage", "size": "L"},
    ],
    "archive-leather-jacket": [
        {"sku": "ALJ-BLK-S", "name": "Black / S", "color": "Black", "size": "S"},
        {"sku": "ALJ-BLK-M", "name": "Black / M", "color": "Black", "size": "M"},
        {"sku": "ALJ-BLK-L", "name": "Black / L", "color": "Black", "size": "L"},
        {"sku": "ALJ-COG-S", "name": "Cognac / S", "color": "Cognac", "size": "S"},
        {"sku": "ALJ-COG-M", "name": "Cognac / M", "color": "Cognac", "size": "M"},
        {"sku": "ALJ-COG-L", "name": "Cognac / L", "color": "Cognac", "size": "L"},
    ],
    "frame-clutch-bag": [
        {"sku": "FCB-BLK", "name": "Black", "color": "Black", "size": "One Size"},
        {"sku": "FCB-OFW", "name": "Off-White", "color": "Off-White", "size": "One Size"},
        {"sku": "FCB-BRZ", "name": "Bronze", "color": "Bronze", "size": "One Size"},
    ],
    "artisan-leather-tote": [
        {"sku": "ALT-TAN", "name": "Tan", "color": "Tan", "size": "One Size"},
        {"sku": "ALT-COG", "name": "Cognac", "color": "Cognac", "size": "One Size"},
        {"sku": "ALT-BLK", "name": "Black", "color": "Black", "size": "One Size"},
    ],
    "the-atelier-blazer": [
        {"sku": "TAB-NAV-S", "name": "Navy / S", "color": "Navy", "size": "S"},
        {"sku": "TAB-NAV-M", "name": "Navy / M", "color": "Navy", "size": "M"},
        {"sku": "TAB-NAV-L", "name": "Navy / L", "color": "Navy", "size": "L"},
        {"sku": "TAB-CHR-S", "name": "Charcoal / S", "color": "Charcoal", "size": "S"},
        {"sku": "TAB-CHR-M", "name": "Charcoal / M", "color": "Charcoal", "size": "M"},
        {"sku": "TAB-CHR-L", "name": "Charcoal / L", "color": "Charcoal", "size": "L"},
    ],
    "raw-edge-selvedge-denim": [
        {"sku": "RED-IND-30", "name": "Indigo / 30", "color": "Indigo", "size": "30"},
        {"sku": "RED-IND-32", "name": "Indigo / 32", "color": "Indigo", "size": "32"},
        {"sku": "RED-IND-34", "name": "Indigo / 34", "color": "Indigo", "size": "34"},
        {"sku": "RED-BLK-30", "name": "Black / 30", "color": "Black", "size": "30"},
        {"sku": "RED-BLK-32", "name": "Black / 32", "color": "Black", "size": "32"},
        {"sku": "RED-BLK-34", "name": "Black / 34", "color": "Black", "size": "34"},
    ],
    "cashmere-mock-neck": [
        {"sku": "CMN-IVR-S", "name": "Ivory / S", "color": "Ivory", "size": "S"},
        {"sku": "CMN-IVR-M", "name": "Ivory / M", "color": "Ivory", "size": "M"},
        {"sku": "CMN-IVR-L", "name": "Ivory / L", "color": "Ivory", "size": "L"},
        {"sku": "CMN-CML-S", "name": "Camel / S", "color": "Camel", "size": "S"},
        {"sku": "CMN-CML-M", "name": "Camel / M", "color": "Camel", "size": "M"},
        {"sku": "CMN-CML-L", "name": "Camel / L", "color": "Camel", "size": "L"},
    ],
    "studio-low-trainer": [
        {"sku": "SLT-WHT-40", "name": "Optic White / 40", "color": "Optic White", "size": "40"},
        {"sku": "SLT-WHT-41", "name": "Optic White / 41", "color": "Optic White", "size": "41"},
        {"sku": "SLT-WHT-42", "name": "Optic White / 42", "color": "Optic White", "size": "42"},
        {"sku": "SLT-CHK-40", "name": "Chalk / 40", "color": "Chalk", "size": "40"},
        {"sku": "SLT-CHK-41", "name": "Chalk / 41", "color": "Chalk", "size": "41"},
        {"sku": "SLT-CHK-42", "name": "Chalk / 42", "color": "Chalk", "size": "42"},
    ],
    "lessonne-wool-overcoat": [
        {"sku": "LWO-OAT-S", "name": "Oatmeal / S", "color": "Oatmeal", "size": "S"},
        {"sku": "LWO-OAT-M", "name": "Oatmeal / M", "color": "Oatmeal", "size": "M"},
        {"sku": "LWO-OAT-L", "name": "Oatmeal / L", "color": "Oatmeal", "size": "L"},
        {"sku": "LWO-CHR-S", "name": "Charcoal / S", "color": "Charcoal", "size": "S"},
        {"sku": "LWO-CHR-M", "name": "Charcoal / M", "color": "Charcoal", "size": "M"},
        {"sku": "LWO-CHR-L", "name": "Charcoal / L", "color": "Charcoal", "size": "L"},
    ],
}


class Command(BaseCommand):
    help = "Seed variants and stock for all products."

    def handle(self, *args, **options):
        color_type, _ = AttributeType.objects.get_or_create(name="Color", defaults={"slug": "color"})
        size_type, _ = AttributeType.objects.get_or_create(name="Size", defaults={"slug": "size"})

        for slug, variants in PRODUCTS.items():
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(f"SKIP: {slug} not found")
                continue

            self.stdout.write(f"\n{product.name}")

            for vdata in variants:
                color_val, _ = AttributeValue.objects.get_or_create(attribute_type=color_type, value=vdata["color"])
                if vdata["size"] == "One Size":
                    size_val, _ = AttributeValue.objects.get_or_create(attribute_type=size_type, value="One Size")
                else:
                    size_val, _ = AttributeValue.objects.get_or_create(attribute_type=size_type, value=vdata["size"])

                v, created = ProductVariant.objects.get_or_create(
                    sku=vdata["sku"],
                    defaults={"product": product, "name": vdata["name"], "is_active": True},
                )
                if created:
                    v.attributes.add(color_val, size_val)
                    self.stdout.write(f"  + {vdata['sku']}")
                else:
                    self.stdout.write(f"  = {vdata['sku']} (exists)")

            # Set all variants to TARGET_QTY
            for v in product.variants.all():
                stock, _ = StockLevel.objects.get_or_create(variant=v)
                current = stock.quantity_available
                if current < TARGET_QTY:
                    InventoryMovement.objects.create(
                        stock_level=stock,
                        movement_type="PURCHASE",
                        quantity_change=TARGET_QTY - current,
                        reference="seed_all_variants",
                    )
                    self.stdout.write(f"  stock {v.sku} -> {TARGET_QTY}")

        self.stdout.write(self.style.SUCCESS("\nDone!"))
