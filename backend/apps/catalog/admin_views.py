from django.utils.text import slugify
from rest_framework import serializers, viewsets, status, parsers
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Category, Product, ProductImage, ProductVariant, AttributeType, AttributeValue
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    AttributeValueSerializer,
)
from .ai import CatalogAIService, CatalogAIConfigurationError, CatalogAIGenerationError


# ─── Write serializers ────────────────────────────────────────────────────────

class AdminCategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "parent", "image", "is_active", "sort_order"]

    def validate_slug(self, value):
        return value or None

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        return super().update(instance, validated_data)


class AdminProductWriteSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "category",
            "base_price", "base_price_currency",
            "compare_at_price", "compare_at_price_currency",
            "material", "origin", "is_active", "is_new", "is_featured",
        ]

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("name", instance.name))
        return super().update(instance, validated_data)


class AdminProductImageWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "sort_order"]


class AdminProductVariantWriteSerializer(serializers.ModelSerializer):
    attribute_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=AttributeValue.objects.all(), source="attributes", required=False
    )

    class Meta:
        model = ProductVariant
        fields = [
            "id", "sku", "name",
            "price_override", "price_override_currency",
            "attribute_ids", "is_active",
        ]


class AdminProductAIRequestSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=300)
    category_name = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    material = serializers.CharField(required=False, allow_blank=True)
    origin = serializers.CharField(required=False, allow_blank=True)


class AdminAttributeTypeSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = AttributeType
        fields = ["id", "name", "slug", "values"]

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)


class AdminAttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ["id", "attribute_type", "value", "sort_order"]


# ─── ViewSets ─────────────────────────────────────────────────────────────────

class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all().order_by("sort_order", "name")
    filter_backends = [SearchFilter]
    search_fields = ["name", "slug"]
    lookup_field = "pk"


class AdminProductViewSet(viewsets.ModelViewSet):
    ai_service_class = CatalogAIService
    permission_classes = [IsAdminUser]
    queryset = Product.objects.select_related("category").prefetch_related("images", "variants").order_by("-created_at")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_active", "is_new", "is_featured", "category"]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["created_at", "base_price", "name"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return ProductDetailSerializer
        return AdminProductWriteSerializer

    def _build_ai_context(self, request):
        serializer = AdminProductAIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def _run_ai_action(self, callback):
        try:
            return Response(callback())
        except CatalogAIConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except CatalogAIGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=False, methods=["post"], url_path="generate-description")
    def generate_description(self, request):
        context = self._build_ai_context(request)
        service = self.ai_service_class()
        return self._run_ai_action(lambda: service.generate_description(context))

    @action(detail=False, methods=["post"], url_path="generate-details")
    def generate_details(self, request):
        context = self._build_ai_context(request)
        service = self.ai_service_class()
        return self._run_ai_action(lambda: service.generate_details(context))

    @action(detail=False, methods=["post"], url_path="generate-image")
    def generate_image(self, request):
        context = self._build_ai_context(request)
        service = self.ai_service_class()
        return self._run_ai_action(lambda: service.generate_image(context))


class AdminProductImageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductImageWriteSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs["product_id"])

    def perform_create(self, serializer):
        product = Product.objects.get(pk=self.kwargs["product_id"])
        serializer.save(product=product)


class AdminProductVariantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminProductVariantWriteSerializer

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs["product_id"]).prefetch_related("attributes")

    def perform_create(self, serializer):
        product = Product.objects.get(pk=self.kwargs["product_id"])
        serializer.save(product=product)


class AdminAttributeTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminAttributeTypeSerializer
    queryset = AttributeType.objects.prefetch_related("values").order_by("name")


class AdminAttributeValueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    serializer_class = AdminAttributeValueSerializer
    queryset = AttributeValue.objects.select_related("attribute_type").order_by("attribute_type__name", "sort_order", "value")
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["attribute_type"]
