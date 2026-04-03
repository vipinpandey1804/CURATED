"""
Tests for catalog app: categories, product listing, product detail,
filtering, and search.
"""
import pytest
from django.utils.text import slugify
from moneyed import Money

from apps.catalog.models import Category, Product, ProductVariant, AttributeType, AttributeValue


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def category(db):
    return Category.objects.create(name="Tops", slug="tops", is_active=True)


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Classic White Tee",
        slug="classic-white-tee",
        category=category,
        base_price=Money(29.99, "USD"),
        is_active=True,
        is_new=True,
        is_featured=True,
    )


@pytest.fixture
def inactive_product(db, category):
    return Product.objects.create(
        name="Hidden Product",
        slug="hidden-product",
        category=category,
        base_price=Money(19.99, "USD"),
        is_active=False,
    )


# ─── Category Tests ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCategories:
    url = "/api/v1/catalog/categories/"

    def test_list_categories(self, api_client, category):
        response = api_client.get(self.url)
        assert response.status_code == 200
        slugs = [c["slug"] for c in response.json()["results"]]
        assert "tops" in slugs

    def test_inactive_category_excluded(self, api_client, db):
        Category.objects.create(name="Hidden", slug="hidden", is_active=False)
        response = api_client.get(self.url)
        slugs = [c["slug"] for c in response.json()["results"]]
        assert "hidden" not in slugs

    def test_category_detail_by_slug(self, api_client, category):
        response = api_client.get(f"{self.url}{category.slug}/")
        assert response.status_code == 200
        assert response.json()["slug"] == "tops"

    def test_category_not_found(self, api_client):
        response = api_client.get(f"{self.url}nonexistent-slug/")
        assert response.status_code == 404


# ─── Product Listing ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProductList:
    url = "/api/v1/catalog/products/"

    def test_list_products(self, api_client, product):
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert response.json()["count"] >= 1

    def test_inactive_products_excluded(self, api_client, product, inactive_product):
        response = api_client.get(self.url)
        slugs = [p["slug"] for p in response.json()["results"]]
        assert "classic-white-tee" in slugs
        assert "hidden-product" not in slugs

    def test_filter_by_category_slug(self, api_client, product, db):
        other_cat = Category.objects.create(name="Bottoms", slug="bottoms", is_active=True)
        Product.objects.create(
            name="Slim Jeans",
            slug="slim-jeans",
            category=other_cat,
            base_price=Money(59.99, "USD"),
            is_active=True,
        )
        response = api_client.get(f"{self.url}?category__slug=tops")
        slugs = [p["slug"] for p in response.json()["results"]]
        assert "classic-white-tee" in slugs
        assert "slim-jeans" not in slugs

    def test_filter_new_arrivals(self, api_client, product):
        response = api_client.get(f"{self.url}?is_new=true")
        assert response.status_code == 200
        for p in response.json()["results"]:
            assert p["isNew"] is True

    def test_filter_featured(self, api_client, product):
        response = api_client.get(f"{self.url}?is_featured=true")
        assert response.status_code == 200
        for p in response.json()["results"]:
            assert p["isFeatured"] is True

    def test_search_products(self, api_client, product):
        response = api_client.get(f"{self.url}?search=White+Tee")
        assert response.status_code == 200
        slugs = [p["slug"] for p in response.json()["results"]]
        assert "classic-white-tee" in slugs

    def test_pagination(self, api_client, product):
        response = api_client.get(f"{self.url}?page=1&page_size=1")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert "results" in data


# ─── Product Detail ──────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProductDetail:
    url = "/api/v1/catalog/products/"

    def test_product_detail_by_slug(self, api_client, product):
        response = api_client.get(f"{self.url}{product.slug}/")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == product.slug
        assert data["name"] == product.name

    def test_inactive_product_not_found(self, api_client, inactive_product):
        response = api_client.get(f"{self.url}{inactive_product.slug}/")
        assert response.status_code == 404

    def test_product_not_found(self, api_client):
        response = api_client.get(f"{self.url}does-not-exist/")
        assert response.status_code == 404
