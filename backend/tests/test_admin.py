"""
Tests for admin panel API endpoints.

Covers:
  - Auth/permission guards (401 unauthenticated, 403 non-staff)
  - Catalog admin: categories, products, attributes
  - Orders admin: list, detail, status update
  - Returns admin: list, approve, reject
  - Marketing admin: coupons CRUD
  - Users admin: list, PATCH is_staff/is_active
  - Stats endpoint
"""
import pytest
from django.utils import timezone
from datetime import timedelta
from moneyed import Money

from apps.catalog.models import Category, Product, AttributeType, AttributeValue
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.returns.models import ReturnRequest, ReturnLineItem
from apps.marketing.models import CouponCode


# ─── Shared fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def category(db):
    return Category.objects.create(name="Shirts", slug="shirts", is_active=True)


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Test Shirt",
        slug="test-shirt",
        category=category,
        base_price=Money(49.99, "USD"),
        is_active=True,
    )


@pytest.fixture
def attribute_type(db):
    return AttributeType.objects.create(name="Size", slug="size")


@pytest.fixture
def attribute_value(db, attribute_type):
    return AttributeValue.objects.create(
        attribute_type=attribute_type, value="M", sort_order=1
    )


@pytest.fixture
def _order_defaults():
    return dict(
        shipping_full_name="Jane Doe",
        shipping_address_line_1="123 Main St",
        shipping_city="New York",
        shipping_postal_code="10001",
        shipping_country="US",
        subtotal=Money(99.99, "USD"),
        total=Money(99.99, "USD"),
    )


@pytest.fixture
def order(db, user, _order_defaults):
    return Order.objects.create(user=user, **_order_defaults)


@pytest.fixture
def order_item(db, order, product):
    return OrderItem.objects.create(
        order=order,
        product_name=product.name,
        variant_name="M",
        sku="SKU-001",
        unit_price=Money(49.99, "USD"),
        quantity=2,
        line_total=Money(99.98, "USD"),
    )


@pytest.fixture
def return_request(db, order, user, order_item):
    rr = ReturnRequest.objects.create(
        order=order,
        user=user,
        status=ReturnRequest.ReturnStatus.REQUESTED,
        reason="Did not fit",
    )
    ReturnLineItem.objects.create(
        return_request=rr,
        order_item=order_item,
        quantity=1,
        reason_code=ReturnLineItem.ReasonCode.WRONG_SIZE,
    )
    return rr


@pytest.fixture
def coupon(db):
    return CouponCode.objects.create(
        code="SAVE10",
        discount_type=CouponCode.DiscountType.PERCENTAGE,
        discount_value=10,
        valid_from=timezone.now() - timedelta(days=1),
        valid_until=timezone.now() + timedelta(days=30),
        is_active=True,
    )


# ─── Permission guard helpers ─────────────────────────────────────────────────

def assert_requires_admin(api_client, auth_client, url, method="get"):
    """Unauthenticated → 401; authenticated non-staff → 403."""
    call = getattr(api_client, method)
    assert call(url).status_code in (401, 403)

    call = getattr(auth_client, method)
    assert call(url).status_code == 403


# ═════════════════════════════════════════════════════════════════════════════
# 1. CATALOG ADMIN
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminCategoryAPI:
    list_url = "/api/v1/admin/catalog/categories/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_categories(self, admin_client, category):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        slugs = [c["slug"] for c in resp.json()["results"]]
        assert "shirts" in slugs

    def test_create_category(self, admin_client):
        payload = {"name": "Pants", "is_active": True}
        resp = admin_client.post(self.list_url, payload, format="json")
        assert resp.status_code == 201
        assert resp.json()["slug"] == "pants"

    def test_create_category_auto_slug(self, admin_client):
        """Slug is generated from name when omitted."""
        resp = admin_client.post(
            self.list_url, {"name": "New Arrivals"}, format="json"
        )
        assert resp.status_code == 201
        assert resp.json()["slug"] == "new-arrivals"

    def test_update_category(self, admin_client, category):
        url = f"{self.list_url}{category.id}/"
        resp = admin_client.patch(url, {"name": "Updated Shirts"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Shirts"

    def test_delete_category(self, admin_client, category):
        url = f"{self.list_url}{category.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204

    def test_delete_category_non_admin(self, auth_client, category):
        url = f"{self.list_url}{category.id}/"
        assert auth_client.delete(url).status_code == 403


@pytest.mark.django_db
class TestAdminProductAPI:
    list_url = "/api/v1/admin/catalog/products/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_products(self, admin_client, product):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1

    def test_create_product(self, admin_client, category):
        payload = {
            "name": "New Tee",
            "category": category.id,
            "base_price": "29.99",
            "base_price_currency": "USD",
            "is_active": True,
        }
        resp = admin_client.post(self.list_url, payload, format="json")
        assert resp.status_code == 201
        assert resp.json()["slug"] == "new-tee"

    def test_update_product(self, admin_client, product):
        url = f"{self.list_url}{product.id}/"
        resp = admin_client.patch(url, {"name": "Renamed Tee"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Tee"

    def test_delete_product(self, admin_client, product):
        url = f"{self.list_url}{product.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204

    def test_product_detail_unauthenticated(self, api_client, product):
        url = f"{self.list_url}{product.id}/"
        assert api_client.get(url).status_code in (401, 403)


@pytest.mark.django_db
class TestAdminAttributeAPI:
    attr_url = "/api/v1/admin/catalog/attributes/"
    val_url = "/api/v1/admin/catalog/attribute-values/"

    def test_create_attribute_type(self, admin_client):
        resp = admin_client.post(self.attr_url, {"name": "Color"}, format="json")
        assert resp.status_code == 201
        data = resp.json()
        assert data["slug"] == "color"
        assert "values" in data

    def test_create_attribute_value(self, admin_client, attribute_type):
        resp = admin_client.post(
            self.val_url,
            {"attribute_type": attribute_type.id, "value": "XL", "sort_order": 2},
            format="json",
        )
        assert resp.status_code == 201
        assert resp.json()["value"] == "XL"

    def test_list_attribute_types_non_admin(self, auth_client):
        assert auth_client.get(self.attr_url).status_code == 403

    def test_delete_attribute_value(self, admin_client, attribute_value):
        url = f"{self.val_url}{attribute_value.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204


# ═════════════════════════════════════════════════════════════════════════════
# 2. ORDERS ADMIN
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminOrdersAPI:
    list_url = "/api/v1/admin/orders/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_orders(self, admin_client, order):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1

    def test_list_returns_lightweight_fields(self, admin_client, order):
        resp = admin_client.get(self.list_url)
        result = resp.json()["results"][0]
        # List serializer must NOT include items/status_history
        assert "items" not in result
        assert "statusHistory" not in result
        assert "orderNumber" in result

    def test_order_detail(self, admin_client, order, order_item):
        resp = admin_client.get(f"{self.list_url}{order.id}/")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["productName"] == "Test Shirt"

    def test_order_detail_not_found(self, admin_client):
        import uuid
        resp = admin_client.get(f"{self.list_url}{uuid.uuid4()}/")
        assert resp.status_code == 404

    def test_filter_orders_by_status(self, admin_client, order):
        resp = admin_client.get(f"{self.list_url}?status=PENDING")
        assert resp.status_code == 200
        for row in resp.json()["results"]:
            assert row["status"] == "PENDING"

    def test_search_orders_by_email(self, admin_client, order, user):
        resp = admin_client.get(f"{self.list_url}?search={user.email}")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1


@pytest.mark.django_db
class TestAdminOrderStatusUpdate:
    def _url(self, order):
        return f"/api/v1/admin/orders/{order.id}/status/"

    def test_update_order_status(self, admin_client, admin_user, order):
        resp = admin_client.patch(
            self._url(order),
            {"status": "CONFIRMED", "note": "Payment verified"},
            format="json",
        )
        assert resp.status_code == 200
        order.refresh_from_db()
        assert order.status == "CONFIRMED"

    def test_status_update_creates_history_record(self, admin_client, admin_user, order):
        admin_client.patch(
            self._url(order),
            {"status": "PROCESSING"},
            format="json",
        )
        history = OrderStatusHistory.objects.filter(order=order)
        assert history.exists()
        record = history.first()
        assert record.new_status == "PROCESSING"
        assert record.changed_by == admin_user

    def test_update_payment_status(self, admin_client, order):
        resp = admin_client.patch(
            self._url(order),
            {"payment_status": "PAID"},
            format="json",
        )
        assert resp.status_code == 200
        order.refresh_from_db()
        assert order.payment_status == "PAID"

    def test_update_fulfillment_status(self, admin_client, order):
        resp = admin_client.patch(
            self._url(order),
            {"fulfillment_status": "FULFILLED"},
            format="json",
        )
        assert resp.status_code == 200
        order.refresh_from_db()
        assert order.fulfillment_status == "FULFILLED"

    def test_invalid_status_value(self, admin_client, order):
        resp = admin_client.patch(
            self._url(order),
            {"status": "INVALID_STATUS"},
            format="json",
        )
        assert resp.status_code == 400

    def test_non_admin_cannot_update_status(self, auth_client, order):
        assert auth_client.patch(
            self._url(order), {"status": "SHIPPED"}, format="json"
        ).status_code == 403


# ═════════════════════════════════════════════════════════════════════════════
# 3. RETURNS ADMIN
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminReturnsAPI:
    list_url = "/api/v1/admin/returns/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_returns(self, admin_client, return_request):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1

    def test_return_detail(self, admin_client, return_request):
        resp = admin_client.get(f"{self.list_url}{return_request.id}/")
        assert resp.status_code == 200
        data = resp.json()
        assert "lineItems" in data
        assert len(data["lineItems"]) == 1

    def test_filter_by_status(self, admin_client, return_request):
        resp = admin_client.get(f"{self.list_url}?status=REQUESTED")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1


@pytest.mark.django_db
class TestAdminReturnApprove:
    def _approve_url(self, rr):
        return f"/api/v1/admin/returns/{rr.id}/approve/"

    def _reject_url(self, rr):
        return f"/api/v1/admin/returns/{rr.id}/reject/"

    def test_approve_return(self, admin_client, return_request):
        resp = admin_client.patch(
            self._approve_url(return_request),
            {"admin_notes": "Looks good"},
            format="json",
        )
        assert resp.status_code == 200
        return_request.refresh_from_db()
        assert return_request.status == "APPROVED"
        assert return_request.admin_notes == "Looks good"
        assert return_request.reviewed_by is not None

    def test_approve_sets_reviewed_at(self, admin_client, return_request):
        admin_client.patch(self._approve_url(return_request), {}, format="json")
        return_request.refresh_from_db()
        assert return_request.reviewed_at is not None

    def test_cannot_approve_already_approved(self, admin_client, return_request):
        return_request.status = ReturnRequest.ReturnStatus.APPROVED
        return_request.save()
        resp = admin_client.patch(self._approve_url(return_request), {}, format="json")
        assert resp.status_code == 400

    def test_reject_return(self, admin_client, return_request):
        resp = admin_client.patch(
            self._reject_url(return_request),
            {"admin_notes": "Outside return window"},
            format="json",
        )
        assert resp.status_code == 200
        return_request.refresh_from_db()
        assert return_request.status == "REJECTED"
        assert return_request.reviewed_by is not None

    def test_cannot_reject_already_rejected(self, admin_client, return_request):
        return_request.status = ReturnRequest.ReturnStatus.REJECTED
        return_request.save()
        resp = admin_client.patch(self._reject_url(return_request), {}, format="json")
        assert resp.status_code == 400

    def test_non_admin_cannot_approve(self, auth_client, return_request):
        assert auth_client.patch(
            self._approve_url(return_request), {}, format="json"
        ).status_code == 403


# ═════════════════════════════════════════════════════════════════════════════
# 4. MARKETING / COUPONS ADMIN
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminCouponsAPI:
    list_url = "/api/v1/admin/marketing/coupons/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_coupons(self, admin_client, coupon):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        codes = [c["code"] for c in resp.json()["results"]]
        assert "SAVE10" in codes

    def test_create_coupon(self, admin_client):
        payload = {
            "code": "NEWCODE",
            "discount_type": "PERCENTAGE",
            "discount_value": "15.00",
            "valid_from": "2026-01-01T00:00:00Z",
            "valid_until": "2026-12-31T23:59:59Z",
            "is_active": True,
        }
        resp = admin_client.post(self.list_url, payload, format="json")
        assert resp.status_code == 201
        assert resp.json()["code"] == "NEWCODE"
        assert resp.json()["timesUsed"] == 0

    def test_times_used_is_readonly(self, admin_client, coupon):
        url = f"{self.list_url}{coupon.id}/"
        resp = admin_client.patch(url, {"times_used": 999}, format="json")
        assert resp.status_code == 200
        assert resp.json()["timesUsed"] == 0  # unchanged

    def test_update_coupon(self, admin_client, coupon):
        url = f"{self.list_url}{coupon.id}/"
        resp = admin_client.patch(url, {"discount_value": "20.00"}, format="json")
        assert resp.status_code == 200
        assert float(resp.json()["discountValue"]) == 20.0

    def test_delete_coupon(self, admin_client, coupon):
        url = f"{self.list_url}{coupon.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 204
        assert not CouponCode.objects.filter(id=coupon.id).exists()

    def test_filter_by_discount_type(self, admin_client, coupon):
        resp = admin_client.get(f"{self.list_url}?discount_type=PERCENTAGE")
        assert resp.status_code == 200
        for row in resp.json()["results"]:
            assert row["discountType"] == "PERCENTAGE"

    def test_search_by_code(self, admin_client, coupon):
        resp = admin_client.get(f"{self.list_url}?search=SAVE")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1


# ═════════════════════════════════════════════════════════════════════════════
# 5. USERS ADMIN
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminUsersAPI:
    list_url = "/api/v1/admin/users/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.list_url)

    def test_list_users(self, admin_client, user):
        resp = admin_client.get(self.list_url)
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1

    def test_list_exposes_is_staff_field(self, admin_client, user):
        resp = admin_client.get(self.list_url)
        result = resp.json()["results"][0]
        assert "isStaff" in result
        assert "isActive" in result

    def test_patch_is_staff(self, admin_client, user):
        url = f"{self.list_url}{user.id}/"
        resp = admin_client.patch(url, {"is_staff": True}, format="json")
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.is_staff is True

    def test_patch_is_active_false(self, admin_client, user):
        url = f"{self.list_url}{user.id}/"
        resp = admin_client.patch(url, {"is_active": False}, format="json")
        assert resp.status_code == 200
        user.refresh_from_db()
        assert user.is_active is False

    def test_cannot_delete_user(self, admin_client, user):
        """DELETE on users endpoint should be disallowed."""
        url = f"{self.list_url}{user.id}/"
        resp = admin_client.delete(url)
        assert resp.status_code == 405

    def test_email_not_writable(self, admin_client, user):
        """Email is read-only — PATCH should not change it."""
        url = f"{self.list_url}{user.id}/"
        original_email = user.email
        admin_client.patch(url, {"email": "hacked@example.com"}, format="json")
        user.refresh_from_db()
        assert user.email == original_email

    def test_search_by_email(self, admin_client, user):
        resp = admin_client.get(f"{self.list_url}?search={user.email}")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1


# ═════════════════════════════════════════════════════════════════════════════
# 6. STATS ENDPOINT
# ═════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAdminStatsAPI:
    url = "/api/v1/admin/stats/"

    def test_permission_guard(self, api_client, auth_client):
        assert_requires_admin(api_client, auth_client, self.url)

    def test_stats_response_shape(self, admin_client, product, order, return_request, user):
        resp = admin_client.get(self.url)
        assert resp.status_code == 200
        data = resp.json()
        assert "totalProducts" in data
        assert "totalUsers" in data
        assert "totalOrders" in data
        assert "pendingReturns" in data
        assert "newUsersToday" in data
        assert "ordersByStatus" in data
        assert "returnsByStatus" in data
        assert "salesTrend" in data
        assert "userGrowth" in data
        assert "revenue" in data
        assert "today" in data["revenue"]
        assert "last7Days" in data["revenue"]
        assert "last30Days" in data["revenue"]
        assert len(data["salesTrend"]) == 7
        assert len(data["userGrowth"]) == 7

    def test_stats_counts_active_products(self, admin_client, product):
        resp = admin_client.get(self.url)
        assert resp.json()["totalProducts"] >= 1

    def test_stats_counts_pending_returns(self, admin_client, return_request):
        resp = admin_client.get(self.url)
        assert resp.json()["pendingReturns"] >= 1

    def test_stats_counts_total_orders(self, admin_client, order):
        resp = admin_client.get(self.url)
        assert resp.json()["totalOrders"] >= 1

    def test_sales_trend_includes_paid_order_revenue_for_day(self, admin_client, user, _order_defaults):
        paid_order = Order.objects.create(
            user=user,
            payment_status=Order.PaymentStatus.PAID,
            created_at=timezone.now(),
            **_order_defaults,
        )
        resp = admin_client.get(self.url)
        assert resp.status_code == 200
        today = timezone.localdate().isoformat()
        today_point = next(point for point in resp.json()["salesTrend"] if point["date"] == today)
        assert today_point["orders"] >= 1
        assert today_point["revenue"] >= float(paid_order.total.amount)
