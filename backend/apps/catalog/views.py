from rest_framework import viewsets, permissions, filters
from django_filters import rest_framework as django_filters
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Category, Product, AttributeType
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
            .prefetch_related("children", "products")
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
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images", "variants__attributes__attribute_type")
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


class AttributeTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttributeType.objects.prefetch_related("values").all()
    serializer_class = AttributeTypeSerializer
    permission_classes = [permissions.AllowAny]
