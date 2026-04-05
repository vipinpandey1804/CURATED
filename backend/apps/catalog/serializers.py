from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, AttributeType, AttributeValue


class AttributeValueSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source="attribute_type.name", read_only=True)

    class Meta:
        model = AttributeValue
        fields = ["id", "type_name", "value"]


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.ImageField(source="image", read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "url", "alt_text", "sort_order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "name", "price_override", "price_override_currency", "attributes", "effective_price", "is_active"]

    def get_effective_price(self, obj):
        return obj.effective_price.amount


class ProductVariantMinimalSerializer(serializers.ModelSerializer):
    """Minimal variant data for product listing — just enough for add-to-cart."""
    class Meta:
        model = ProductVariant
        fields = ["id", "sku", "name", "is_active"]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    primary_image = serializers.SerializerMethodField()
    variant_count = serializers.IntegerField(read_only=True)  # from annotated queryset
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "category_name",
            "base_price", "base_price_currency",
            "compare_at_price", "compare_at_price_currency",
            "is_new", "is_featured", "primary_image", "variant_count", "variants",
        ]

    def get_primary_image(self, obj):
        # Use prefetched_images to_attr to avoid extra DB hit
        images = getattr(obj, "prefetched_images", None)
        if images is None:
            images = list(obj.images.all())
        img = images[0] if images else None
        if img and img.image:
            request = self.context.get("request")
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def get_variants(self, obj):
        # Use prefetched_variants to_attr to avoid extra DB hit
        variants = getattr(obj, "prefetched_variants", None)
        if variants is None:
            variants = list(obj.variants.filter(is_active=True))
        return [{"id": str(v.id), "sku": v.sku, "name": v.name, "isActive": v.is_active} for v in variants]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "category", "category_name",
            "base_price", "base_price_currency",
            "compare_at_price", "compare_at_price_currency",
            "material", "origin", "is_new", "is_featured", "is_active",
            "images", "variants", "created_at",
        ]


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "parent", "is_active", "sort_order", "children", "product_count"]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data


class AttributeTypeSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = AttributeType
        fields = ["id", "name", "slug", "values"]
