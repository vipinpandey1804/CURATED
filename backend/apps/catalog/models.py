from django.db import models
from djmoney.models.fields import MoneyField

from apps.core.models import TimestampedModel


class Category(TimestampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    image = models.ImageField(upload_to="categories/", blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "catalog_category"
        verbose_name_plural = "categories"
        ordering = ["sort_order", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "sort_order"]),
        ]

    def __str__(self):
        return self.name


class AttributeType(TimestampedModel):
    """E.g., 'Color', 'Size', 'Material'."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        db_table = "catalog_attribute_type"
        ordering = ["name"]

    def __str__(self):
        return self.name


class AttributeValue(TimestampedModel):
    """E.g., 'Oatmeal', 'XS', 'Cashmere'."""

    attribute_type = models.ForeignKey(
        AttributeType, on_delete=models.CASCADE, related_name="values"
    )
    value = models.CharField(max_length=200)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "catalog_attribute_value"
        ordering = ["sort_order", "value"]
        unique_together = [("attribute_type", "value")]

    def __str__(self):
        return f"{self.attribute_type.name}: {self.value}"


class Product(TimestampedModel):
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300, unique=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    base_price = MoneyField(max_digits=10, decimal_places=2, default_currency="USD")
    compare_at_price = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD", null=True, blank=True
    )
    material = models.CharField(max_length=300, blank=True)
    origin = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_new = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)

    class Meta:
        db_table = "catalog_product"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["is_active", "is_new"]),
            models.Index(fields=["is_active", "is_featured"]),
            models.Index(fields=["is_active", "-created_at"]),
            models.Index(fields=["is_active", "base_price"]),
        ]

    def __str__(self):
        return self.name


class ProductImage(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "catalog_product_image"
        ordering = ["sort_order"]

    def __str__(self):
        return f"Image for {self.product.name} #{self.sort_order}"


class ProductVariant(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=300, blank=True, help_text="e.g. 'Oatmeal / M'")
    price_override = MoneyField(
        max_digits=10, decimal_places=2, default_currency="USD", null=True, blank=True
    )
    attributes = models.ManyToManyField(AttributeValue, related_name="variants", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "catalog_product_variant"
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["product", "is_active"]),
        ]

    def __str__(self):
        return f"{self.product.name} — {self.name or self.sku}"

    @property
    def effective_price(self):
        return self.price_override if self.price_override else self.product.base_price
