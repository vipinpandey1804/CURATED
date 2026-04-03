"""
Tests for cart app: get cart, add item, update quantity, remove item,
clear cart, apply/remove coupon.
"""
import pytest
from moneyed import Money

from apps.catalog.models import Category, Product, ProductVariant, AttributeType
from apps.carts.models import Cart, CartItem
from apps.marketing.models import CouponCode


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def category(db):
    return Category.objects.create(name="Tops", slug="tops-cart", is_active=True)


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Test Tee",
        slug="test-tee-cart",
        category=category,
        base_price=Money(25.00, "USD"),
        is_active=True,
    )


@pytest.fixture
def variant(db, product):
    return ProductVariant.objects.create(
        product=product,
        sku="TEST-TEE-M",
        name="Medium",
        is_active=True,
    )


@pytest.fixture
def active_coupon(db):
    from django.utils import timezone
    import datetime
    return CouponCode.objects.create(
        code="SAVE10",
        discount_type=CouponCode.DiscountType.PERCENTAGE,
        discount_value=10,
        min_order_amount=Money(0, "USD"),
        max_uses=100,
        valid_from=timezone.now(),
        valid_until=timezone.now() + datetime.timedelta(days=30),
        is_active=True,
    )


# ─── Cart CRUD ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCart:
    cart_url = "/api/v1/cart/"
    items_url = "/api/v1/cart/items/"
    clear_url = "/api/v1/cart/clear/"
    coupon_url = "/api/v1/cart/coupon/"

    def test_get_empty_cart(self, auth_client):
        response = auth_client.get(self.cart_url)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_add_item(self, auth_client, variant):
        response = auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 2},
            format="json",
        )
        assert response.status_code == 200
        items = response.json()["items"]
        assert len(items) == 1
        assert items[0]["quantity"] == 2

    def test_add_same_item_increments_quantity(self, auth_client, variant):
        auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        response = auth_client.get(self.cart_url)
        assert response.json()["items"][0]["quantity"] == 2

    def test_add_invalid_variant(self, auth_client):
        response = auth_client.post(
            self.items_url,
            {"variantId": "00000000-0000-0000-0000-000000000000", "quantity": 1},
            format="json",
        )
        assert response.status_code == 404
        assert response.json()["error"] == "VARIANT_NOT_FOUND"

    def test_update_item_quantity(self, auth_client, variant):
        add_resp = auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        item_id = add_resp.json()["items"][0]["id"]
        update_resp = auth_client.patch(
            f"{self.items_url}{item_id}/",
            {"quantity": 5},
            format="json",
        )
        assert update_resp.status_code == 200
        assert update_resp.json()["items"][0]["quantity"] == 5

    def test_remove_item(self, auth_client, variant):
        add_resp = auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        item_id = add_resp.json()["items"][0]["id"]
        del_resp = auth_client.delete(f"{self.items_url}{item_id}/")
        assert del_resp.status_code == 200
        assert del_resp.json()["items"] == []

    def test_remove_nonexistent_item(self, auth_client):
        response = auth_client.delete(
            f"{self.items_url}00000000-0000-0000-0000-000000000000/"
        )
        assert response.status_code == 404

    def test_clear_cart(self, auth_client, variant):
        auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 3},
            format="json",
        )
        response = auth_client.post(self.clear_url)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_apply_coupon(self, auth_client, variant, active_coupon):
        auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        response = auth_client.post(
            self.coupon_url,
            {"code": "SAVE10"},
            format="json",
        )
        assert response.status_code == 200

    def test_apply_invalid_coupon(self, auth_client):
        response = auth_client.post(
            self.coupon_url,
            {"code": "FAKECODE"},
            format="json",
        )
        assert response.status_code == 400

    def test_remove_coupon(self, auth_client, variant, active_coupon):
        auth_client.post(
            self.items_url,
            {"variantId": str(variant.id), "quantity": 1},
            format="json",
        )
        auth_client.post(self.coupon_url, {"code": "SAVE10"}, format="json")
        response = auth_client.delete(self.coupon_url)
        assert response.status_code == 200
        assert response.json().get("coupon") is None
