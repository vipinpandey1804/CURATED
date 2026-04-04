from django.db import models
from django.db.models import Prefetch, Count
from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

from .models import Category, Product, ProductImage, ProductVariant, AttributeType
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    AttributeTypeSerializer,
)


class ProductFilter(django_filters.FilterSet):
    category__slug__in = django_filters.BaseInFilter(field_name='category__slug', lookup_expr='in')
    base_price__gte = django_filters.NumberFilter(field_name='base_price', lookup_expr='gte')
    base_price__lte = django_filters.NumberFilter(field_name='base_price', lookup_expr='lte')
    size = django_filters.BaseInFilter(field_name='variants__attributes__value', lookup_expr='in')
    is_new = django_filters.BooleanFilter(field_name='is_new')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    category__slug = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')

    class Meta:
        model = Product
        fields = []


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Category.objects.filter(is_active=True, parent__isnull=True)
            .prefetch_related("children")
            .annotate(product_count=Count("products", filter=models.Q(products__is_active=True)))
        )


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [django_filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["base_price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.action == "retrieve":
            # Detail: full variant + attribute data needed
            return (
                Product.objects.filter(is_active=True)
                .select_related("category")
                .prefetch_related(
                    Prefetch("images", queryset=ProductImage.objects.order_by("sort_order")),
                    Prefetch(
                        "variants",
                        queryset=ProductVariant.objects.filter(is_active=True)
                        .prefetch_related("attributes__attribute_type"),
                    ),
                )
            )
        # List: minimal data — only first image and variant ids needed
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.order_by("sort_order"),
                    to_attr="prefetched_images",
                ),
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True).only(
                        "id", "sku", "name", "is_active", "product_id"
                    ),
                    to_attr="prefetched_variants",
                ),
            )
            .annotate(variant_count=Count("variants", filter=models.Q(variants__is_active=True)))
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @method_decorator(cache_page(60 * 5))   # cache list for 5 minutes
    @method_decorator(vary_on_headers("Authorization"))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class AttributeTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttributeType.objects.prefetch_related("values").all()
    serializer_class = AttributeTypeSerializer
    permission_classes = [permissions.AllowAny]
