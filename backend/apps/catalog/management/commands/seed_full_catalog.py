"""
Full catalog seed command.
Creates 10 categories, 30 products each (300 total), variants, stock, and images.
Uses picsum.photos for reliable, deterministic, royalty-free images.

Usage:
    python manage.py seed_full_catalog
    python manage.py seed_full_catalog --skip-images
    python manage.py seed_full_catalog --clear
"""

import urllib.request
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils.text import slugify
from djmoney.money import Money

from apps.catalog.models import (
    Category, Product, ProductImage, ProductVariant,
    AttributeType, AttributeValue,
)
from apps.inventory.models import StockLevel, InventoryMovement

TARGET_STOCK = 15


def picsum(seed, w=800, h=1000):
    """Deterministic picsum image URL by seed string."""
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


def fetch_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()


# ---------------------------------------------------------------------------
# DATA
# ---------------------------------------------------------------------------

CATEGORIES = [
    {
        "name": "Knitwear",
        "slug": "knitwear",
        "description": "Premium knitted garments crafted from the finest natural fibres — cashmere, merino, lambswool.",
        "image_seed": "knitwear-cat",
    },
    {
        "name": "Outerwear",
        "slug": "outerwear",
        "description": "Meticulously tailored coats, jackets, and layers for every season.",
        "image_seed": "outerwear-cat",
    },
    {
        "name": "Shirts",
        "slug": "shirts",
        "description": "Classic and contemporary shirts in premium linen, cotton, and silk fabrics.",
        "image_seed": "shirts-cat",
    },
    {
        "name": "Trousers",
        "slug": "trousers",
        "description": "Refined trousers with a focus on fit, silhouette, and exceptional fabric.",
        "image_seed": "trousers-cat",
    },
    {
        "name": "Footwear",
        "slug": "footwear",
        "description": "Hand-crafted shoes and boots from the world's finest ateliers.",
        "image_seed": "footwear-cat",
    },
    {
        "name": "Accessories",
        "slug": "accessories",
        "description": "Curated leather goods, scarves, belts, and essentials to complete every outfit.",
        "image_seed": "accessories-cat",
    },
    {
        "name": "Denim",
        "slug": "denim",
        "description": "Selvedge and premium denim crafted for longevity and character.",
        "image_seed": "denim-cat",
    },
    {
        "name": "Suits & Blazers",
        "slug": "suits-blazers",
        "description": "Sartorial tailoring — single-breasted suits, blazers, and waistcoats.",
        "image_seed": "suits-cat",
    },
    {
        "name": "Bags & Leather Goods",
        "slug": "bags-leather-goods",
        "description": "Artisan leather bags, wallets, and small leather goods built to last a lifetime.",
        "image_seed": "bags-cat",
    },
    {
        "name": "Activewear",
        "slug": "activewear",
        "description": "Performance-meets-design activewear in technical and natural fabrics.",
        "image_seed": "activewear-cat",
    },
]

# Variant templates by type
APPAREL_VARIANTS = [
    {"color": "Black",   "sizes": ["XS", "S", "M", "L", "XL"]},
    {"color": "White",   "sizes": ["S", "M", "L", "XL"]},
    {"color": "Navy",    "sizes": ["S", "M", "L"]},
    {"color": "Camel",   "sizes": ["S", "M", "L"]},
]

TROUSER_VARIANTS = [
    {"color": "Charcoal", "sizes": ["28", "30", "32", "34", "36"]},
    {"color": "Navy",     "sizes": ["30", "32", "34", "36"]},
    {"color": "Khaki",    "sizes": ["30", "32", "34"]},
    {"color": "Black",    "sizes": ["30", "32", "34", "36"]},
]

SHOE_VARIANTS = [
    {"color": "Black",   "sizes": ["39", "40", "41", "42", "43", "44"]},
    {"color": "Tan",     "sizes": ["39", "40", "41", "42", "43"]},
    {"color": "Cognac",  "sizes": ["40", "41", "42", "43"]},
]

ONE_SIZE_VARIANTS = [
    {"color": "Black",   "sizes": ["One Size"]},
    {"color": "Tan",     "sizes": ["One Size"]},
    {"color": "Navy",    "sizes": ["One Size"]},
]

DENIM_VARIANTS = [
    {"color": "Indigo",      "sizes": ["28", "30", "32", "34"]},
    {"color": "Black",       "sizes": ["28", "30", "32", "34"]},
    {"color": "Stone Wash",  "sizes": ["30", "32", "34"]},
]

ACTIVE_VARIANTS = [
    {"color": "Black",       "sizes": ["XS", "S", "M", "L", "XL"]},
    {"color": "Slate Grey",  "sizes": ["S", "M", "L", "XL"]},
    {"color": "Forest",      "sizes": ["S", "M", "L"]},
]


# ---------------------------------------------------------------------------
# PRODUCTS — 30 per category
# ---------------------------------------------------------------------------

PRODUCTS = {
    "knitwear": [
        {"name": "Cashmere Crewneck Sweater",     "price": 295, "material": "100% Mongolian Cashmere",       "origin": "Scotland",    "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Merino Wool Turtleneck",         "price": 185, "material": "100% Extra-fine Merino",        "origin": "Italy",       "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Cardigan",              "price": 345, "material": "100% Scottish Cashmere",        "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Lambswool V-Neck Jumper",        "price": 145, "material": "100% Lambswool",               "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cotton Knit Polo",               "price": 110, "material": "100% Sea Island Cotton",       "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Roll Neck",             "price": 315, "material": "100% Grade-A Cashmere",        "origin": "Scotland",    "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Merino Zip-Up Hoodie",           "price": 195, "material": "100% Extra-fine Merino",       "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Alpaca Blend Oversized Knit",    "price": 265, "material": "60% Alpaca, 40% Wool",         "origin": "Peru",        "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Mock Neck",             "price": 280, "material": "100% Mongolian Cashmere",      "origin": "Scotland",    "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Merino Fine Knit Vest",          "price": 135, "material": "100% Merino Wool",             "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Cowl Neck",             "price": 325, "material": "100% Cashmere",                "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Wool-Silk Striped Sweater",      "price": 215, "material": "70% Wool, 30% Silk",           "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cable Knit Fisherman Sweater",   "price": 225, "material": "100% Aran Wool",               "origin": "Ireland",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Merino Crew Neck Sweater",       "price": 165, "material": "100% Merino",                  "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Ribbed Beanie",         "price": 95,  "material": "100% Cashmere",               "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Cashmere Woven Scarf",           "price": 145, "material": "100% Cashmere",                "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Brushed Mohair Sweater",         "price": 245, "material": "70% Mohair, 30% Silk",         "origin": "Italy",       "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Lambswool Crewneck",             "price": 155, "material": "100% Lambswool",               "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Pima Cotton Henley",             "price": 95,  "material": "100% Pima Cotton",             "origin": "Peru",        "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Merino Boucle Sweater",          "price": 195, "material": "100% Merino Boucle",           "origin": "Japan",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Open-Weave Linen Knit",          "price": 175, "material": "100% Linen",                   "origin": "Belgium",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Turtleneck Dress",      "price": 385, "material": "100% Cashmere",                "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Merino Split Hem Sweater",       "price": 175, "material": "100% Merino",                  "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cotton Waffle Knit Pullover",    "price": 115, "material": "100% Organic Cotton",          "origin": "Turkey",      "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Lounge Pullover",       "price": 295, "material": "100% Cashmere",                "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Silk-Cashmere Blend Knit",       "price": 355, "material": "70% Cashmere, 30% Silk",       "origin": "Italy",       "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Shetland Wool Fair Isle Knit",   "price": 195, "material": "100% Shetland Wool",           "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Recycled Cashmere Sweater",      "price": 185, "material": "100% Recycled Cashmere",       "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Cashmere Sleeveless Jumper",     "price": 255, "material": "100% Cashmere",                "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Ribbed Knit Longline Cardigan",  "price": 235, "material": "40% Wool, 30% Acrylic, 30% Alpaca", "origin": "Italy","is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
    ],
    "outerwear": [
        {"name": "Wool-Cashmere Overcoat",        "price": 595, "material": "80% Wool, 20% Cashmere",        "origin": "England",     "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Archive Leather Jacket",         "price": 895, "material": "Full-grain Calf Leather",       "origin": "Italy",       "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Lessonne Wool Overcoat",         "price": 545, "material": "100% Wool",                     "origin": "France",      "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Officer-Collar Field Jacket",    "price": 395, "material": "100% Cotton Ripstop",           "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Quilted Down Puffer",            "price": 445, "material": "90/10 Down Fill",               "origin": "Canada",      "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Bonded Fleece Jacket",           "price": 285, "material": "100% Recycled Polyester Fleece","origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Shearling-Lined Trucker Jacket", "price": 745, "material": "Suede + Shearling Lining",      "origin": "Spain",       "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Unlined Linen Duster",           "price": 325, "material": "100% European Linen",           "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Padded Crinkle Jacket",          "price": 365, "material": "100% Nylon (recycled)",         "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Double-Breasted Peacoat",        "price": 495, "material": "80% Wool, 20% Polyamide",       "origin": "England",     "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Waxed Cotton Mac",               "price": 415, "material": "100% Waxed Cotton",             "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Technical Windbreaker",          "price": 295, "material": "3L Nylon Shell",                "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Corduroy Overshirt Jacket",      "price": 245, "material": "100% Cotton Corduroy",          "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Merino Wrap Coat",               "price": 565, "material": "100% Merino Wool",              "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Casentino Wool Coat",            "price": 875, "material": "100% Casentino Wool",           "origin": "Italy",       "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Suede Blouson Jacket",           "price": 685, "material": "100% Lamb Suede",               "origin": "Spain",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Herringbone Wool Blazer-Coat",   "price": 515, "material": "100% Wool Herringbone",         "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Military Parka",                 "price": 465, "material": "60% Cotton, 40% Nylon",         "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Down-Fill Gilet",                "price": 295, "material": "90/10 Down",                    "origin": "Canada",      "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Camel Hair Chesterfield",        "price": 895, "material": "100% Camel Hair",               "origin": "England",     "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Boiled Wool Jacket",             "price": 345, "material": "100% Boiled Wool",              "origin": "Austria",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Cotton Canvas Ranch Coat",       "price": 375, "material": "100% Heavy Canvas Cotton",      "origin": "USA",         "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Recycled Nylon Anorak",          "price": 295, "material": "100% Recycled Nylon",           "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Oversized Cocoon Coat",          "price": 685, "material": "70% Wool, 30% Alpaca",          "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Wool-Blend Belted Trench",       "price": 595, "material": "65% Wool, 35% Cotton",          "origin": "England",     "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Classic Cotton Trench Coat",     "price": 545, "material": "100% Gabardine Cotton",         "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Checked Wool Car Coat",          "price": 495, "material": "100% Checked Wool",             "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Supima Cotton Topcoat",          "price": 445, "material": "100% Supima Cotton",            "origin": "USA",         "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Shearling Aviator Jacket",       "price": 995, "material": "Sheepskin Shearling",           "origin": "Australia",   "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Polar Fleece Zip Jacket",        "price": 195, "material": "100% Recycled Fleece",          "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
    ],
    "shirts": [
        {"name": "Linen Camp Collar Shirt",        "price": 145, "material": "100% European Linen",           "origin": "Portugal",    "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Oxford Button-Down Shirt",       "price": 125, "material": "100% Oxford Cotton",            "origin": "Portugal",    "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Raw Silk Utility Shirt",         "price": 195, "material": "100% Raw Silk",                 "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Flannel Check Shirt",            "price": 135, "material": "100% Brushed Cotton Flannel",   "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Sea Island Cotton Dress Shirt",  "price": 185, "material": "100% Sea Island Cotton",        "origin": "England",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Poplin Cuban Collar Shirt",      "price": 115, "material": "100% Cotton Poplin",            "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Chambray Work Shirt",            "price": 125, "material": "100% Chambray Cotton",          "origin": "Japan",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Tencel Oversized Shirt",         "price": 105, "material": "100% Tencel™ Lyocell",          "origin": "Austria",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Double-Cloth Wool Shirt",        "price": 215, "material": "100% Double Cloth Wool",        "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Voile See-Through Shirt",        "price": 135, "material": "100% Cotton Voile",             "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Denim Shirt",                    "price": 115, "material": "100% Japanese Denim",           "origin": "Japan",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Corduroy Overshirt",             "price": 145, "material": "100% Cotton Corduroy",          "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Formal Slim Poplin Shirt",       "price": 95,  "material": "100% Egyptian Cotton",          "origin": "Egypt",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Broderie Anglaise Shirt",        "price": 155, "material": "100% Cotton Broderie",          "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Jacquard Weave Shirt",           "price": 165, "material": "100% Cotton Jacquard",          "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Merino Knit Shirt",              "price": 145, "material": "100% Merino Wool",              "origin": "Australia",   "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Twill Band Collar Shirt",        "price": 125, "material": "100% Cotton Twill",             "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Crinkle Linen Shirt",            "price": 115, "material": "100% Stonewashed Linen",        "origin": "Belgium",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Printed Studio Shirt",           "price": 125, "material": "100% Viscose",                  "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Heavy Cotton Workshirt",         "price": 135, "material": "100% Heavy Cotton",             "origin": "USA",         "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Pima Cotton Essential Shirt",    "price": 85,  "material": "100% Pima Cotton",              "origin": "Peru",        "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Bamboo Fibre Breathe Shirt",     "price": 95,  "material": "100% Bamboo Fibre",             "origin": "China",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Madras Plaid Shirt",             "price": 125, "material": "100% Madras Cotton",            "origin": "India",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Lyocell Relaxed Shirt",          "price": 105, "material": "100% Lyocell",                  "origin": "Austria",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Silk Pyjama Shirt",              "price": 245, "material": "100% Mulberry Silk",            "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Organic Cotton Boxy Shirt",      "price": 85,  "material": "100% Organic Cotton",           "origin": "Turkey",      "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Heritage Tartan Shirt",          "price": 155, "material": "100% Tartan Wool",              "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Seersucker Summer Shirt",        "price": 105, "material": "100% Cotton Seersucker",        "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Boho Embroidered Shirt",         "price": 135, "material": "100% Organic Cotton",           "origin": "India",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Minimalist Tuxedo Shirt",        "price": 165, "material": "100% Swiss Cotton",             "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
    ],
    "trousers": [
        {"name": "Pleated Wool Trousers",          "price": 245, "material": "100% Virgin Wool",              "origin": "England",     "is_featured": True,  "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Linen Relaxed Trousers",         "price": 175, "material": "100% European Linen",           "origin": "Belgium",     "is_featured": True,  "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Raw-Edge Selvedge Denim",        "price": 265, "material": "100% Japanese Selvedge Denim",  "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Chino Classic Trouser",          "price": 155, "material": "98% Cotton, 2% Elastane",       "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Herringbone Suit Trouser",       "price": 215, "material": "100% Wool",                     "origin": "England",     "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Merino Jogger",                  "price": 185, "material": "100% Merino Wool",              "origin": "Australia",   "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Organic Slim Taper",             "price": 125, "material": "100% Organic Cotton",           "origin": "Turkey",      "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Cargo Utility Trouser",          "price": 165, "material": "65% Poly, 35% Cotton",          "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Flannel Wide-Leg Trouser",       "price": 195, "material": "100% Brushed Cotton Flannel",   "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Velvet Tuxedo Trouser",          "price": 235, "material": "100% Cotton Velvet",            "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Camel Wool Trousers",            "price": 225, "material": "100% Camel Wool",               "origin": "England",     "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Tencel Easy Trouser",            "price": 115, "material": "100% Tencel",                   "origin": "Austria",     "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Checked Flannel Trouser",        "price": 195, "material": "100% Wool-Flannel",             "origin": "Ireland",     "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "High-Rise Cropped Trouser",      "price": 165, "material": "98% Cotton, 2% Elastane",       "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Wool Pinstripe Trousers",        "price": 245, "material": "100% Wool",                     "origin": "Italy",       "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Silk-Blend Pyjama Trouser",      "price": 195, "material": "70% Silk, 30% Cotton",          "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Jogger Drawstring Lounger",      "price": 115, "material": "100% Organic Cotton",           "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Wide Leg Linen Palazzo",         "price": 145, "material": "100% Linen",                    "origin": "Belgium",     "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "5-Pocket Slim Corduroy",         "price": 155, "material": "100% Cotton Corduroy",          "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Pleated Mohair Blend Trouser",   "price": 275, "material": "60% Mohair, 40% Wool",          "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Tropical Wool Trouser",          "price": 205, "material": "100% Tropical Weight Wool",     "origin": "Italy",       "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Cotton Poplin Cigarette Pant",   "price": 135, "material": "100% Cotton Poplin",            "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Double-Pleated Gabardine",       "price": 255, "material": "100% Wool Gabardine",           "origin": "England",     "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Pima Cotton Chino",              "price": 135, "material": "100% Pima Cotton",              "origin": "Peru",        "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Neon Stretch Track Pant",        "price": 105, "material": "88% Poly, 12% Elastane",        "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Hopsack Weave Trouser",          "price": 185, "material": "100% Hopsack Wool",             "origin": "Italy",       "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Sherpa-Lined Tech Pant",         "price": 175, "material": "100% Nylon + Sherpa Lining",    "origin": "Japan",       "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Worsted Flannel Trouser",        "price": 225, "material": "100% Worsted Flannel",          "origin": "England",     "is_featured": False, "is_new": True,  "variants": TROUSER_VARIANTS},
        {"name": "Vintage Wash Chino",             "price": 125, "material": "100% Washed Cotton",            "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
        {"name": "Seersucker Drawstring Pant",     "price": 115, "material": "100% Cotton Seersucker",        "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": TROUSER_VARIANTS},
    ],
    "footwear": [
        {"name": "Monolith Chelsea Boot",          "price": 545, "material": "Full-grain Calfskin + Rubber Sole", "origin": "Italy",  "is_featured": True,  "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Studio Low Trainer",             "price": 325, "material": "Calf Leather + Suede",          "origin": "Spain",       "is_featured": True,  "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Derby Brogue",                   "price": 445, "material": "Full-grain Leather",            "origin": "England",     "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Loafer in Suede",                "price": 395, "material": "100% Suede",                    "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Wholecut Oxford",                "price": 495, "material": "Single-piece Calfskin",         "origin": "England",     "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Sand Crepe Sole Derby",          "price": 365, "material": "Waxed Suede + Crepe Sole",      "origin": "Spain",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Moccasin Driver",                "price": 295, "material": "Nappa Leather",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "High-Top Canvas Plimsoll",       "price": 185, "material": "100% Canvas + Rubber",          "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Lug-Sole Combat Boot",           "price": 575, "material": "Full-grain Leather + Lug Sole", "origin": "Germany",     "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Espadrille Wedge",               "price": 215, "material": "Canvas + Jute Wedge",           "origin": "Spain",       "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Platform Derby",                 "price": 395, "material": "Patent Leather + Platform",     "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Desert Boot",                    "price": 285, "material": "Suede + Crepe Sole",            "origin": "England",     "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Tassel Loafer",                  "price": 415, "material": "Calf Leather",                  "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Slip-On Mule",                   "price": 295, "material": "Satin + Leather Insole",        "origin": "Spain",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Ankle Boot with Buckle",         "price": 485, "material": "Full-grain Calf Leather",       "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Leather Sandal",                 "price": 245, "material": "Vegetable-tanned Leather",      "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Velvet Smoking Slipper",         "price": 345, "material": "Silk Velvet + Leather Sole",    "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Woven Penny Loafer",             "price": 365, "material": "Woven Leather",                 "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Distressed Leather Boot",        "price": 525, "material": "Distressed Full-grain Leather", "origin": "England",     "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Satin Ballet Flat",              "price": 255, "material": "100% Satin + Leather Sole",     "origin": "France",      "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Nappa Leather Kitten Heel",      "price": 345, "material": "Nappa Leather",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Sock-Fit Trail Runner",          "price": 275, "material": "Mesh + TPU Cage",               "origin": "Germany",     "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Rubber Rain Boot",               "price": 185, "material": "Natural Rubber",                "origin": "France",      "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Clog in Claret Wood",            "price": 225, "material": "Wood + Leather Strap",          "origin": "Sweden",      "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Cap-Toe Oxford",                 "price": 465, "material": "Polished Calfskin",             "origin": "England",     "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Boat Shoe",                      "price": 225, "material": "Moccasin Construction",         "origin": "USA",         "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Side-Zip Ankle Boot",            "price": 445, "material": "Suede + YKK Zip",               "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Triple-Sole Chunky Trainer",     "price": 355, "material": "Leather + EVA Stack Sole",      "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": SHOE_VARIANTS},
        {"name": "Leather Toe-Ring Sandal",        "price": 195, "material": "Vegetable-tanned Leather",      "origin": "Greece",      "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
        {"name": "Metallic Kitten Mule",           "price": 315, "material": "Metallized Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": SHOE_VARIANTS},
    ],
    "accessories": [
        {"name": "Cashmere Scarf",                 "price": 145, "material": "100% Cashmere",                 "origin": "Scotland",    "is_featured": True,  "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Leather Card Holder",            "price": 85,  "material": "Full-grain Calf Leather",       "origin": "Italy",       "is_featured": True,  "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Sculptural Leather Belt",        "price": 165, "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "The Signature Watch",            "price": 895, "material": "316L Steel + Sapphire Crystal", "origin": "Switzerland", "is_featured": True,  "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Silk Pocket Square",             "price": 65,  "material": "100% Mulberry Silk",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Wool Flat Cap",                  "price": 95,  "material": "100% Harris Tweed",             "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Brass Key Fob",                  "price": 45,  "material": "Solid Brass + Leather",         "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Cashmere Gloves",                "price": 125, "material": "100% Cashmere",                 "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Suede Driving Gloves",           "price": 145, "material": "Lamb Suede",                    "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Silk Tie",                       "price": 95,  "material": "100% Silk",                     "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Sterling Silver Cufflinks",      "price": 185, "material": "Sterling Silver",               "origin": "England",     "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Acoustic Over-Ear Headphones",   "price": 445, "material": "Aluminium + Lambskin Ear Pads", "origin": "Denmark",     "is_featured": True,  "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Wool Waistcoat",                 "price": 185, "material": "100% Wool",                     "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Leather Luggage Tag",            "price": 55,  "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Cashmere Earmuffs",              "price": 75,  "material": "100% Cashmere",                 "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Woven Leather Bracelet",         "price": 65,  "material": "Woven Leather",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Box-Pleated Wool Kilt",          "price": 345, "material": "100% Scottish Tartan Wool",     "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Tortoiseshell Sunglasses",       "price": 225, "material": "Acetate Frame + UV400 Lens",    "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Signet Ring",                    "price": 295, "material": "22ct Gold-Plated Silver",       "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Leather Passport Wallet",        "price": 95,  "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Silk Headband",                  "price": 55,  "material": "100% Silk",                     "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Grosgrain Bow Tie",              "price": 75,  "material": "100% Grosgrain Silk",           "origin": "France",      "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Personalised Leather Belt",      "price": 175, "material": "Vegetable-tanned Leather",      "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Tweed Bucket Hat",               "price": 105, "material": "100% Harris Tweed",             "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Merino Beanie",                  "price": 65,  "material": "100% Merino Wool",              "origin": "Australia",   "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Gold-Fill Chain Bracelet",       "price": 145, "material": "14ct Gold-Fill",                "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Linen Pocket Square",            "price": 45,  "material": "100% Irish Linen",              "origin": "Ireland",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Lambskin Coin Purse",            "price": 115, "material": "Lambskin Leather",              "origin": "France",      "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Personalised Cufflinks",         "price": 145, "material": "Sterling Silver",               "origin": "England",     "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Braided Leather Belt",           "price": 125, "material": "Braided Full-grain Leather",    "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
    ],
    "denim": [
        {"name": "Slim Selvedge Jean",             "price": 265, "material": "100% Japanese Selvedge Denim",  "origin": "Japan",       "is_featured": True,  "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Straight-Leg Raw Denim",         "price": 245, "material": "14oz Raw Denim",                "origin": "Japan",       "is_featured": True,  "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Wide-Leg Denim Trouser",         "price": 215, "material": "100% Organic Cotton Denim",     "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Cropped Flare Jean",             "price": 195, "material": "98% Cotton, 2% Elastane",       "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "High-Waist Mom Jean",            "price": 185, "material": "100% Cotton Denim",             "origin": "Turkey",      "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Tapered Carpenter Jean",         "price": 225, "material": "Heavyweight Denim 12oz",        "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Double-Knee Work Jean",          "price": 235, "material": "100% Organic Cotton Denim",     "origin": "USA",         "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Indigo Overdyed Slim",           "price": 195, "material": "100% Cotton Overdyed",          "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Relaxed Taper 5-Pocket",         "price": 175, "material": "100% Cotton Denim",             "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Bootcut Heritage Jean",          "price": 185, "material": "100% Cone Mills Denim",         "origin": "USA",         "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Straight-Leg Organic Jean",      "price": 165, "material": "100% Organic Cotton",           "origin": "Turkey",      "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Slim Black Denim",               "price": 175, "material": "100% Cotton Black Denim",       "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Barrel Leg Jean",                "price": 195, "material": "100% Cotton",                   "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Rigid Straight Jean",            "price": 215, "material": "13.5oz Rigid Denim",            "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Stonewash 501-Style",            "price": 155, "material": "100% Cotton Stonewash",         "origin": "USA",         "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Patchwork Vintage Jean",         "price": 245, "material": "100% Upcycled Denim",           "origin": "France",      "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Light Wash Slouch Jean",         "price": 165, "material": "100% Cotton Light Wash",        "origin": "Turkey",      "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Dark Rinse Slim Jean",           "price": 185, "material": "Dark Rinse Japanese Cotton",    "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Acid-Wash Wide Jean",            "price": 175, "material": "100% Cotton Acid-washed",       "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Ecru Natural Denim",             "price": 195, "material": "100% Undyed Cotton",            "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Overdyed Teal Jean",             "price": 185, "material": "100% Cotton Overdyed",          "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Denim Midi Skirt",               "price": 165, "material": "100% Cotton Denim",             "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Denim Shirt Dress",              "price": 185, "material": "100% Organic Cotton Denim",     "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Denim Jacket Classic Trucker",   "price": 245, "material": "100% Selvedge Denim",           "origin": "Japan",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Denim Dungarees",                "price": 215, "material": "100% Organic Denim",            "origin": "Turkey",      "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Washed Denim Shorts",            "price": 135, "material": "100% Cotton Denim",             "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Denim Maxi Skirt",               "price": 155, "material": "100% Cotton Denim",             "origin": "Turkey",      "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Slim-Taper Tech Denim",          "price": 195, "material": "97% Cotton, 3% Elastane",       "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": DENIM_VARIANTS},
        {"name": "Lapis Blue Straight Jean",       "price": 185, "material": "100% Cotton Lapis Denim",       "origin": "Japan",       "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
        {"name": "Classic Rinse Denim",            "price": 165, "material": "100% Cotton Classic Rinse",     "origin": "USA",         "is_featured": False, "is_new": False, "variants": DENIM_VARIANTS},
    ],
    "suits-blazers": [
        {"name": "The Atelier Blazer",             "price": 695, "material": "100% Wool",                     "origin": "Italy",       "is_featured": True,  "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Single-Breasted 2-Piece Suit",   "price": 1295,"material": "Super 120s Wool",               "origin": "England",     "is_featured": True,  "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Double-Breasted 6-Button Suit",  "price": 1495,"material": "Pure Wool Fresco",              "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Three-Piece Pinstripe Suit",     "price": 1695,"material": "100% Pinstripe Wool",           "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Unstructured Linen Blazer",      "price": 495, "material": "100% Linen",                    "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Velvet Tuxedo Blazer",           "price": 795, "material": "Silk Velvet",                   "origin": "France",      "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Tweed Sport Coat",               "price": 595, "material": "100% Harris Tweed",             "origin": "Scotland",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Heritage Check Blazer",          "price": 545, "material": "100% Wool Check",               "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "White Summer Suit",              "price": 1095,"material": "100% Hopsack Cotton",           "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Herringbone Blazer",             "price": 625, "material": "100% Herringbone Wool",         "origin": "England",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Camel Unconstructed Blazer",     "price": 495, "material": "100% Camel Hair",               "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Seersucker Summer Suit",         "price": 895, "material": "100% Cotton Seersucker",        "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Chalk Stripe Suit",              "price": 1295,"material": "Chalk Stripe Wool",             "origin": "England",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Merino Travel Suit",             "price": 1095,"material": "Wrinkle-resist Merino",         "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Navy Wool Blazer",               "price": 525, "material": "100% Wool",                     "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Windowpane Check Blazer",        "price": 575, "material": "100% Windowpane Wool",          "origin": "England",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Nehru Collar Suit",              "price": 1195,"material": "100% Tropical Wool",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Evening Tuxedo",                 "price": 1495,"material": "Barathea Wool",                 "origin": "England",     "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Morning Coat",                   "price": 1895,"material": "Doeskin Wool",                  "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Flannel Grey Suit",              "price": 1195,"material": "100% Flannel Wool",             "origin": "England",     "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Bold Prince of Wales Suit",      "price": 1395,"material": "100% Prince of Wales Check",   "origin": "Scotland",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Mohair Blazer",                  "price": 645, "material": "70% Mohair, 30% Wool",          "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Hopsack Blazer",                 "price": 515, "material": "100% Hopsack Wool",             "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Corduroy Sport Coat",            "price": 445, "material": "100% Cotton Corduroy",          "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Silk-Lined Dinner Jacket",       "price": 895, "material": "Barathea + Silk Lining",        "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Casual Linen Suit",              "price": 795, "material": "100% Linen",                    "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Tropical Wool 2-Piece",          "price": 1095,"material": "100% Tropical Wool",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Burgundy Velvet Blazer",         "price": 695, "material": "100% Silk Velvet",              "origin": "France",      "is_featured": False, "is_new": True,  "variants": APPAREL_VARIANTS},
        {"name": "Lightweight Cotton Blazer",      "price": 445, "material": "100% Cotton",                   "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
        {"name": "Italian Cut Travel Blazer",      "price": 595, "material": "Stretch Wool Blend",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": APPAREL_VARIANTS},
    ],
    "bags-leather-goods": [
        {"name": "Artisan Leather Tote",           "price": 545, "material": "Full-grain Veg-tanned Leather", "origin": "Italy",       "is_featured": True,  "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Frame Clutch Bag",               "price": 365, "material": "Satin + Gold Frame",            "origin": "France",      "is_featured": True,  "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Leather Briefcase",              "price": 795, "material": "Full-grain Calf Leather",       "origin": "England",     "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Saddle Bag",                     "price": 485, "material": "Vegetable-tanned Leather",      "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Woven Leather Shopper",          "price": 425, "material": "Woven Leather",                 "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Backpack in Waxed Canvas",       "price": 345, "material": "Waxed Canvas + Leather Trim",   "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Mini Crossbody Bag",             "price": 285, "material": "Lambskin Leather",              "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Doctor Bag",                     "price": 625, "material": "Buffalo Leather",               "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Suede Weekend Holdall",          "price": 745, "material": "Suede + Cotton Lining",         "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Envelope Clutch",                "price": 245, "material": "Nappa Leather",                 "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Bi-fold Leather Wallet",         "price": 145, "material": "Full-grain Leather",            "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Zip Leather Purse",              "price": 195, "material": "Nappa Leather",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Leather Notebook Cover",         "price": 125, "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Belt Bag / Fanny Pack",          "price": 295, "material": "Calfskin Leather",              "origin": "France",      "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Ring-Handle Bag",                "price": 395, "material": "Smooth Calf Leather",           "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Weekender Duffel Bag",           "price": 695, "material": "Waxed Canvas + Tan Leather",    "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Slim Leather Portfolio",         "price": 265, "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Chain-Strap Flap Bag",           "price": 445, "material": "Calfskin + Gold Chain",         "origin": "France",      "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Bucket Bag",                     "price": 365, "material": "Lambskin Leather",              "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Suede Pouch",                    "price": 195, "material": "100% Suede",                    "origin": "Spain",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Leather Toiletry Bag",           "price": 215, "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Croc-Embossed Tote",             "price": 495, "material": "Croc-embossed Calfskin",        "origin": "France",      "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Large Shopper Tote",             "price": 345, "material": "Pebbled Leather",               "origin": "Italy",       "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Fold-Over Clutch",               "price": 225, "material": "Nappa Leather",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Quilted Shoulder Bag",           "price": 425, "material": "Quilted Lambskin",              "origin": "France",      "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Cork Tote",                      "price": 225, "material": "Natural Cork + Cotton Lining",  "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Travel Leather Organiser",       "price": 185, "material": "Full-grain Leather",            "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Half-Moon Evening Bag",          "price": 315, "material": "Satin + Faille",                "origin": "France",      "is_featured": False, "is_new": True,  "variants": ONE_SIZE_VARIANTS},
        {"name": "Ruched Leather Clutch",          "price": 285, "material": "Soft Lambskin",                 "origin": "Italy",       "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
        {"name": "Signature Zip Tote",             "price": 475, "material": "Full-grain Leather",            "origin": "England",     "is_featured": False, "is_new": False, "variants": ONE_SIZE_VARIANTS},
    ],
    "activewear": [
        {"name": "Merino Performance Tee",         "price": 95,  "material": "100% Merino Wool",              "origin": "Australia",   "is_featured": True,  "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Technical Running Short",        "price": 75,  "material": "87% Poly, 13% Elastane",        "origin": "Japan",       "is_featured": True,  "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Seamless Long-Sleeve Base Layer","price": 115, "material": "93% Poly, 7% Elastane",         "origin": "Germany",     "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Merino Trail Hoodie",            "price": 195, "material": "85% Merino, 15% Nylon",         "origin": "New Zealand", "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "4-Way Stretch Jogger",           "price": 125, "material": "88% Poly, 12% Elastane",        "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Compression Tights",             "price": 105, "material": "80% Nylon, 20% Spandex",        "origin": "Germany",     "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Running Singlet",                "price": 65,  "material": "100% Recycled Polyester",       "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Insulated Midlayer Fleece",      "price": 145, "material": "100% Polartec® 200",            "origin": "USA",         "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Gym Tank Top",                   "price": 55,  "material": "100% Suplex Nylon",             "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Padded Move Legging",            "price": 115, "material": "78% Nylon, 22% Elastane",       "origin": "Germany",     "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Windstopper Softshell",          "price": 225, "material": "Gore® Windstopper",             "origin": "Germany",     "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Trail Running Jacket",           "price": 185, "material": "3L Laminated Nylon",            "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Cross-Train Shorts",             "price": 85,  "material": "92% Poly, 8% Elastane",         "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Seamless Sports Bra",            "price": 75,  "material": "90% Nylon, 10% Spandex",        "origin": "Germany",     "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Quick-Dry Polo",                 "price": 85,  "material": "100% Recycled Poly Piqué",      "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Swim Short",                     "price": 95,  "material": "100% Recycled Nylon",           "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Mountain Hiking Pant",           "price": 165, "material": "Schoeller® Stretch Weave",      "origin": "Austria",     "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Tencel Yoga Pant",               "price": 115, "material": "95% Tencel, 5% Elastane",       "origin": "Austria",     "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Flash Dry Crew",                 "price": 75,  "material": "100% Flash Dry Poly",           "origin": "Japan",       "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Baselayer Midweight Bottom",     "price": 95,  "material": "100% Merino",                   "origin": "New Zealand", "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Studio Jacket",                  "price": 155, "material": "100% Stretch Fleece",           "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Performance Half-Zip",           "price": 135, "material": "88% Poly, 12% Elastane",        "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Everyday Zip Hoodie",            "price": 125, "material": "60% Cotton, 40% Poly",          "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Merino 5-Pocket Hiking Pant",    "price": 175, "material": "60% Merino, 40% Nylon",         "origin": "New Zealand", "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Gym Roll-Down Waist Skirt",      "price": 85,  "material": "88% Nylon, 12% Spandex",        "origin": "Germany",     "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Paddle Short",                   "price": 105, "material": "100% Recycled Nylon",           "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Ultralight Running Vest",        "price": 95,  "material": "100% Ultralight Poly",          "origin": "Japan",       "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
        {"name": "Eco Stretch Jean",               "price": 145, "material": "78% Organic Cotton, 22% Stretch","origin": "Turkey",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Neoprene Swim Bikini Top",       "price": 85,  "material": "100% Neoprene",                 "origin": "Portugal",    "is_featured": False, "is_new": False, "variants": ACTIVE_VARIANTS},
        {"name": "Endure Long Run Tee",            "price": 65,  "material": "100% Recycled Poly Mesh",       "origin": "Portugal",    "is_featured": False, "is_new": True,  "variants": ACTIVE_VARIANTS},
    ],
}


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def make_sku(product_slug, color, size):
    """Generate a short unique SKU from product slug, color, and size."""
    cat = product_slug[:4].upper().replace("-", "")
    col = color[:3].upper().replace(" ", "")
    siz = size[:3].upper().replace(" ", "")
    return f"{cat}-{col}-{siz}"


def ensure_unique_slug(base_slug):
    """Append a numeric suffix if slug already exists."""
    slug = base_slug
    counter = 1
    while Product.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# ---------------------------------------------------------------------------
# COMMAND
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Seed 10 categories × 30 products with variants, stock, and images."

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-images", action="store_true",
            help="Skip downloading images (faster, useful for CI)."
        )
        parser.add_argument(
            "--clear", action="store_true",
            help="Clear all catalog data before seeding (DESTRUCTIVE)."
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("Clearing existing catalog data..."))
            ProductImage.objects.all().delete()
            ProductVariant.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write("  Done — catalog cleared.")

        skip_images = options["skip_images"]

        # Ensure attribute types
        color_type, _ = AttributeType.objects.get_or_create(
            name="Color", defaults={"slug": "color"}
        )
        size_type, _ = AttributeType.objects.get_or_create(
            name="Size", defaults={"slug": "size"}
        )

        total_products = 0
        total_variants = 0

        for cat_data in CATEGORIES:
            self.stdout.write(f"\n{'='*60}")
            self.stdout.write(f"Category: {cat_data['name']}")

            # Create / update category
            cat, cat_created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "description": cat_data["description"],
                    "is_active": True,
                    "sort_order": CATEGORIES.index(cat_data),
                },
            )

            # Category image
            if not skip_images and not cat.image:
                try:
                    img_url = picsum(cat_data["image_seed"], w=1200, h=800)
                    content = fetch_image(img_url)
                    cat.image.save(
                        f"cat-{cat_data['slug']}.jpg",
                        ContentFile(content),
                        save=True,
                    )
                    self.stdout.write(f"  Image downloaded for category: {cat_data['slug']}")
                except Exception as exc:
                    self.stdout.write(f"  WARN: category image failed: {exc}")

            cat_products = PRODUCTS.get(cat_data["slug"], [])
            self.stdout.write(f"  Seeding {len(cat_products)} products...")

            for prod_data in cat_products:
                base_slug = slugify(prod_data["name"])
                product, p_created = Product.objects.get_or_create(
                    slug=base_slug,
                    defaults={
                        "name": prod_data["name"],
                        "description": f"{prod_data['name']} — crafted from {prod_data['material']}, made in {prod_data['origin']}.",
                        "category": cat,
                        "base_price": Money(prod_data["price"], "USD"),
                        "material": prod_data["material"],
                        "origin": prod_data["origin"],
                        "is_active": True,
                        "is_featured": prod_data.get("is_featured", False),
                        "is_new": prod_data.get("is_new", False),
                    },
                )

                if p_created:
                    total_products += 1

                # Variants
                variant_template = prod_data.get("variants", APPAREL_VARIANTS)
                variant_count = 0

                for vt in variant_template:
                    color_val, _ = AttributeValue.objects.get_or_create(
                        attribute_type=color_type,
                        value=vt["color"],
                    )
                    for size_str in vt["sizes"]:
                        size_val, _ = AttributeValue.objects.get_or_create(
                            attribute_type=size_type,
                            value=size_str,
                        )
                        sku = make_sku(base_slug, vt["color"], size_str)
                        # Ensure SKU uniqueness
                        sku_suffix = 0
                        base_sku = sku
                        while ProductVariant.objects.filter(sku=sku).exclude(product=product).exists():
                            sku_suffix += 1
                            sku = f"{base_sku}-{sku_suffix}"

                        variant, v_created = ProductVariant.objects.get_or_create(
                            sku=sku,
                            defaults={
                                "product": product,
                                "name": f"{vt['color']} / {size_str}",
                                "is_active": True,
                            },
                        )
                        if v_created:
                            variant.attributes.add(color_val, size_val)
                            total_variants += 1
                            variant_count += 1

                        # Stock
                        stock, _ = StockLevel.objects.get_or_create(variant=variant)
                        current_qty = stock.quantity_available
                        if current_qty < TARGET_STOCK:
                            diff = TARGET_STOCK - current_qty
                            InventoryMovement.objects.create(
                                stock_level=stock,
                                movement_type="PURCHASE",
                                quantity_change=diff,
                                reference="seed_full_catalog",
                            )

                # Product images (5 per product using different picsum seeds)
                if not skip_images and not product.images.exists():
                    for i in range(5):
                        seed = f"{base_slug}-{i}"
                        img_url = picsum(seed, w=800, h=1000)
                        try:
                            content = fetch_image(img_url)
                            pi = ProductImage(
                                product=product,
                                sort_order=i,
                                alt_text=f"{product.name} — view {i + 1}",
                            )
                            pi.image.save(f"{base_slug}-{i}.jpg", ContentFile(content), save=True)
                        except Exception as exc:
                            self.stdout.write(f"    WARN: image {i} failed for {base_slug}: {exc}")

                action = "created" if p_created else "exists "
                self.stdout.write(
                    f"  [{action}] {product.name} — "
                    f"{variant_count} new variants"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n{'='*60}\n"
                f"Seeding complete!\n"
                f"  New products created : {total_products}\n"
                f"  New variants created : {total_variants}\n"
                f"  Stock target/variant : {TARGET_STOCK}\n"
                f"  Images               : {'skipped' if skip_images else 'downloaded (5/product)'}\n"
            )
        )
