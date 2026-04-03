from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    unit_price = serializers.DecimalField(source="unit_price.amount", max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(source="line_total.amount", max_digits=10, decimal_places=2, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id", "variant", "product_name", "variant_name", "sku",
            "quantity", "unit_price", "line_total", "primary_image",
        ]

    def get_primary_image(self, obj):
        img = obj.variant.product.images.first()
        if img and img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class CartItemCreateSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(source="subtotal.amount", max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "status", "items", "subtotal", "item_count", "coupon", "created_at"]
        read_only_fields = ["id", "status", "created_at"]


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
