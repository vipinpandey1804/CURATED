from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer
from .models import SearchQuery
from .serializers import SearchSerializer


class SearchView(APIView):
    """
    GET /api/v1/search/?q=...&category=...&min_price=...&max_price=...&sort=...
    Phase 1: PostgreSQL icontains search. Elasticsearch upgrade in Phase 4.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        serializer = SearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        params = serializer.validated_data

        q = params["q"]
        qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")

        # Text search (basic icontains for now)
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(description__icontains=q)
            | Q(category__name__icontains=q)
            | Q(material__icontains=q)
        )

        # Category filter
        category = params.get("category")
        if category:
            qs = qs.filter(category__slug=category)

        # Price filter
        min_price = params.get("min_price")
        if min_price is not None:
            qs = qs.filter(base_price__gte=min_price)
        max_price = params.get("max_price")
        if max_price is not None:
            qs = qs.filter(base_price__lte=max_price)

        # Sort
        sort = params.get("sort", "relevance")
        if sort == "price_asc":
            qs = qs.order_by("base_price")
        elif sort == "price_desc":
            qs = qs.order_by("-base_price")
        elif sort == "newest":
            qs = qs.order_by("-created_at")

        # Log query
        SearchQuery.objects.create(
            query=q,
            results_count=qs.count(),
            user_id=request.user.id if request.user.is_authenticated else None,
        )

        # Paginate
        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)
