"""
Downloads images from Unsplash and attaches them to products and categories.
Usage: python manage.py seed_images
"""
import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile

from apps.catalog.models import Product, ProductImage, Category


def U(photo_id):
    return f"https://images.unsplash.com/{photo_id}?auto=format&fit=crop&w=800&q=80"


PRODUCT_IMAGES = {
    "cashmere-scarf": [
        U("photo-1434389677669-e08b4cac3105"),
        U("photo-1576566588028-4147f3842f27"),
        U("photo-1620799140408-edc6dcb6d633"),
    ],
    "leather-card-holder": [
        U("photo-1548036328-c9fa89d128fa"),
        U("photo-1590874103328-eac38a683ce7"),
        U("photo-1584917865442-de89df76afd3"),
    ],
    "pleated-wool-trousers": [
        U("photo-1542272604-787c3835535d"),
        U("photo-1475180098004-ca77a66827be"),
        U("photo-1555689502-c4b22d76c56f"),
    ],
    "oxford-button-down-shirt": [
        U("photo-1583743814966-8936f5b7be1a"),
        U("photo-1521572163474-6864f9cf17ab"),
        U("photo-1503341504253-dff4815485f1"),
    ],
    "linen-camp-collar-shirt": [
        U("photo-1503341504253-dff4815485f1"),
        U("photo-1583743814966-8936f5b7be1a"),
        U("photo-1521572163474-6864f9cf17ab"),
    ],
    "wool-cashmere-overcoat": [
        U("photo-1539533018447-63fcce2678e3"),
        U("photo-1544022613-e87ca75a784a"),
        U("photo-1591047139829-d91aecb6caea"),
    ],
    "merino-wool-turtleneck": [
        U("photo-1434389677669-e08b4cac3105"),
        U("photo-1576566588028-4147f3842f27"),
        U("photo-1620799140408-edc6dcb6d633"),
    ],
    "cashmere-crewneck-sweater": [
        U("photo-1576566588028-4147f3842f27"),
        U("photo-1434389677669-e08b4cac3105"),
        U("photo-1620799140408-edc6dcb6d633"),
    ],
    "sculptural-leather-belt": [
        U("photo-1548036328-c9fa89d128fa"),
        U("photo-1584917865442-de89df76afd3"),
    ],
    "merino-cardigan": [
        U("photo-1434389677669-e08b4cac3105"),
        U("photo-1576566588028-4147f3842f27"),
    ],
    "linen-relaxed-trousers": [
        U("photo-1542272604-787c3835535d"),
        U("photo-1475180098004-ca77a66827be"),
    ],
    "acoustic-over-ear-headphones": [
        U("photo-1505740420928-5e560c06d30e"),
        U("photo-1484704849700-f032a568e944"),
        U("photo-1560393464-5c69a73c5770"),
    ],
    "the-signature-watch": [
        U("photo-1523170335258-f5ed11844a49"),
        U("photo-1506439773649-6e0eb8cfb237"),
        U("photo-1547996160-81dfa63595aa"),
    ],
    "monolith-chelsea-boot": [
        U("photo-1460353581641-37baddab0fa2"),
        U("photo-1519415943484-9fa1873496d4"),
        U("photo-1587563974553-b9c52eb0e9b5"),
    ],
    "raw-silk-utility-shirt": [
        U("photo-1583743814966-8936f5b7be1a"),
        U("photo-1521572163474-6864f9cf17ab"),
    ],
    "archive-leather-jacket": [
        U("photo-1551028719-00167b16eac5"),
        U("photo-1520975916090-f9e15c0b7e06"),
        U("photo-1618354691373-d851c5c3a990"),
    ],
    "frame-clutch-bag": [
        U("photo-1566150905458-1bf1fc113f0d"),
        U("photo-1614179818511-93b1f87ac0e7"),
        U("photo-1575032617751-6ddec2089882"),
    ],
    "artisan-leather-tote": [
        U("photo-1548036328-c9fa89d128fa"),
        U("photo-1590874103328-eac38a683ce7"),
        U("photo-1584917865442-de89df76afd3"),
    ],
    "the-atelier-blazer": [
        U("photo-1507679799987-c73779587ccf"),
        U("photo-1594938298603-c8148c4b4571"),
        U("photo-1489987707025-afc232f7ea0f"),
    ],
    "raw-edge-selvedge-denim": [
        U("photo-1542272604-787c3835535d"),
        U("photo-1475180098004-ca77a66827be"),
        U("photo-1555689502-c4b22d76c56f"),
    ],
    "cashmere-mock-neck": [
        U("photo-1434389677669-e08b4cac3105"),
        U("photo-1576566588028-4147f3842f27"),
        U("photo-1620799140408-edc6dcb6d633"),
    ],
    "studio-low-trainer": [
        U("photo-1542291026-7eec264c27ff"),
        U("photo-1606107557195-0e29a4b5b4aa"),
        U("photo-1595950653106-6c9ebd614d3a"),
    ],
    "lessonne-wool-overcoat": [
        U("photo-1539533018447-63fcce2678e3"),
        U("photo-1544022613-e87ca75a784a"),
        U("photo-1591047139829-d91aecb6caea"),
    ],
}

CATEGORY_IMAGES = {
    "outerwear":    U("photo-1539533018447-63fcce2678e3"),
    "knitwear":     U("photo-1434389677669-e08b4cac3105"),
    "shirts":       U("photo-1583743814966-8936f5b7be1a"),
    "ready-to-wear": U("photo-1490481651871-ab68de25d43d"),
    "footwear":     U("photo-1542291026-7eec264c27ff"),
    "accessories":  U("photo-1548036328-c9fa89d128fa"),
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read()


class Command(BaseCommand):
    help = "Download and attach images to products and categories."

    def handle(self, *args, **options):
        # ── Products ──────────────────────────────────────────────────────────
        for slug, urls in PRODUCT_IMAGES.items():
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                self.stdout.write(f"  SKIP product: {slug} (not found)")
                continue

            if product.images.exists():
                self.stdout.write(f"  SKIP product: {slug} (images already exist)")
                continue

            for order, url in enumerate(urls):
                try:
                    content = fetch(url)
                    img = ProductImage(product=product, sort_order=order, alt_text=product.name)
                    img.image.save(f"{slug}-{order}.jpg", ContentFile(content), save=True)
                    self.stdout.write(f"  OK {slug} image {order}")
                except Exception as e:
                    self.stdout.write(f"  FAIL {slug} image {order}: {e}")

        # ── Categories ────────────────────────────────────────────────────────
        for slug, url in CATEGORY_IMAGES.items():
            try:
                cat = Category.objects.get(slug=slug)
            except Category.DoesNotExist:
                self.stdout.write(f"  SKIP category: {slug} (not found)")
                continue

            if cat.image:
                self.stdout.write(f"  SKIP category: {slug} (image already exists)")
                continue

            try:
                content = fetch(url)
                cat.image.save(f"cat-{slug}.jpg", ContentFile(content), save=True)
                self.stdout.write(f"  OK category: {slug}")
            except Exception as e:
                self.stdout.write(f"  FAIL category: {slug}: {e}")

        self.stdout.write(self.style.SUCCESS("\nDone! Images seeded successfully!"))
