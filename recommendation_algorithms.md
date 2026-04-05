# Recommendation Algorithms — CURATED

**Version:** 1.0 · April 2026  
**Status:** 📚 Reference Document  
**Project:** CURATED E-Commerce Platform  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Algorithm 1 — Content-Based Filtering](#2-algorithm-1--content-based-filtering)
3. [Algorithm 2 — Collaborative Filtering](#3-algorithm-2--collaborative-filtering)
4. [Algorithm 3 — Matrix Factorization](#4-algorithm-3--matrix-factorization)
5. [Algorithm 4 — Hybrid Approach](#5-algorithm-4--hybrid-approach)
6. [Algorithm 5 — Session-Based (Deep Learning)](#6-algorithm-5--session-based-deep-learning)
7. [Comparison Table](#7-comparison-table)
8. [CURATED Roadmap](#8-curated-roadmap)

---

## 1. Overview

Recommendation systems suggest relevant products to users based on different signals — browsing history, purchase patterns, similar users, or real-time session behavior. Different algorithms work better at different stages of platform growth.

### 1.1 How Big Platforms Use These

| Platform | Primary Algorithm |
|---|---|
| Amazon | Item-based Collaborative Filtering + Hybrid |
| Netflix | Matrix Factorization (SVD) + Hybrid |
| Instagram / Reels | Session-based Deep Learning (Transformer) |
| YouTube | Hybrid (Collaborative + Deep Learning) |
| Flipkart | Hybrid (Content + Collaborative + Popularity) |
| Spotify | Matrix Factorization (ALS) + Content-based |

---

## 2. Algorithm 1 — Content-Based Filtering

### 2.1 Concept

**"Product ke features dekho"**

Recommend products that are similar to what the user has already viewed, based on the product's own attributes — category, price range, material, colour, brand, etc. No data from other users is needed.

### 2.2 How It Works

```
User views: Samsung Fridge
    → Extract features: {category: Electronics, brand: Samsung, type: Refrigerator}
    → Find products with overlapping features
    → Rank by feature overlap score
    → Recommend: LG Fridge, Whirlpool Fridge, Samsung Microwave
```

### 2.3 Scoring Formula (CURATED Implementation)

```
score = (category_match × 5) + (attribute_overlap × 3) + (recency_boost × 2)
```

| Signal | Weight | Logic |
|---|---|---|
| Category match | ×5 | Same category as browsed product |
| Attribute overlap | ×3 | Shared attributes (colour, size, material) |
| Recency boost | ×2 | Recently viewed items contribute more |

### 2.4 Pros and Cons

| Pros | Cons |
|---|---|
| No user data needed — works from day 1 | Cannot discover cross-category interests |
| Fast and explainable | Limited to what user has already seen |
| Works well for small user base | No "surprise" recommendations |
| Easy to implement and maintain | Relies on rich product attribute data |

### 2.5 Best For

- New platforms with small user base
- Launch phase
- Cold start problem (new users with no history)

### 2.6 Status in CURATED

✅ **Implemented** — see `recommendation_system.md` for full implementation details.

---

## 3. Algorithm 2 — Collaborative Filtering

### 3.1 Concept

**"Dusre users ne kya kiya dekho"**

Instead of looking at product features, look at what other users with similar behavior did. Two approaches exist.

---

### 3.2 User-Based Collaborative Filtering

**"Tere jaisi browsing history wale users ne ye bhi dekha"**

```
User A viewed: Fridge, Microwave, AC
User B viewed: Fridge, Microwave, Washing Machine   ← similar to A
User C viewed: Fridge, AC, Dishwasher               ← similar to A

Recommendation for User A:
    → User B also viewed Washing Machine  → recommend it
    → User C also viewed Dishwasher       → recommend it
```

**Similarity Metric — Cosine Similarity:**
```
similarity(UserA, UserB) = (A · B) / (|A| × |B|)

Where A and B are vectors of product interactions (1 = viewed, 0 = not viewed)
```

---

### 3.3 Item-Based Collaborative Filtering

**"Jo log ye product dekhte hain, wo ye bhi dekhte hain"**

This is what Amazon uses for "Customers who viewed this also viewed."

```
Many users viewed both: Fridge AND Microwave
Many users viewed both: Fridge AND AC

Therefore: Fridge is similar to Microwave and AC
→ When any user views Fridge → recommend Microwave and AC
```

Item-based is more stable than user-based because product relationships change less frequently than user behavior.

### 3.4 Django Implementation Sketch

```python
# models.py — store interaction matrix
class UserProductInteraction(BaseModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    interaction_type = models.CharField(
        choices=[("VIEW", "View"), ("WISHLIST", "Wishlist"), ("PURCHASE", "Purchase")]
    )
    weight = models.FloatField()  # VIEW=1, WISHLIST=3, PURCHASE=10
    created_at = models.DateTimeField(auto_now_add=True)

# engine.py — item-based similarity
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def build_item_similarity_matrix():
    # Build user-product matrix from interactions
    # Compute cosine similarity between all product pairs
    # Cache result in Redis for 1 hour
    pass
```

### 3.5 Pros and Cons

| Pros | Cons |
|---|---|
| Discovers cross-category interests | Requires significant user interaction data |
| "Surprise" recommendations possible | Cold start problem for new users |
| Powers "also viewed" features | Computationally expensive at scale |
| No need for product attribute data | Privacy considerations |

### 3.6 Best For

- Platforms with 1000+ active users
- Rich interaction history (views, wishlists, purchases)
- "Also viewed / also bought" sections

---

## 4. Algorithm 3 — Matrix Factorization (SVD / ALS)

### 4.1 Concept

**"Hidden patterns dhundo"**

Represent every user and every product as a vector of hidden features (called latent factors). The model learns these vectors by factorizing the user-product interaction matrix. Recommendations are made by finding products whose latent vector is closest to the user's latent vector.

Used by: **Netflix, Spotify, LinkedIn**

### 4.2 How It Works

```
User-Product Interaction Matrix R:

              Fridge  AC  Microwave  Washing Machine  Headphones
User A           5     4      3            ?               1
User B           4     ?      4            5               2
User C           1     2      ?            1               5
User D           ?     3      3            4               4

Matrix Factorization decomposes R into:
    R ≈ U × V^T

Where:
    U = User latent factor matrix  (users × k hidden features)
    V = Item latent factor matrix  (products × k hidden features)
    k = number of latent dimensions (e.g. 50)

Fill in the ? values → those are your recommendations
```

### 4.3 Two Common Approaches

| Method | Full Name | Best For |
|---|---|---|
| **SVD** | Singular Value Decomposition | Offline batch computation, smaller datasets |
| **ALS** | Alternating Least Squares | Large sparse matrices, implicit feedback (views not ratings) |

### 4.4 Python Implementation (using Surprise library)

```python
from surprise import SVD, Dataset, Reader
from surprise.model_selection import cross_validate
import pandas as pd

# Build interaction dataframe
interactions = UserProductInteraction.objects.values_list(
    "user_id", "product_id", "weight"
)
df = pd.DataFrame(interactions, columns=["user", "item", "rating"])

reader = Reader(rating_scale=(1, 10))
data = Dataset.load_from_df(df, reader)

# Train SVD model
model = SVD(n_factors=50, n_epochs=20)
trainset = data.build_full_trainset()
model.fit(trainset)

# Predict score for user + product
predicted_score = model.predict(user_id, product_id).est
```

### 4.5 Pros and Cons

| Pros | Cons |
|---|---|
| Discovers non-obvious relationships | Requires large interaction dataset |
| Handles sparse data well | Model needs periodic retraining |
| Scales to millions of users | Harder to explain recommendations |
| Industry-proven (Netflix Prize winner) | Needs ML infrastructure |

### 4.6 Best For

- Platforms with 10k+ users and rich history
- When collaborative filtering alone is not enough
- Subscription or catalog-heavy products (music, video, courses)

---

## 5. Algorithm 4 — Hybrid Approach

### 5.1 Concept

**"Sab combine karo"**

Combine multiple algorithms with weighted scores. This is what **Flipkart, Amazon, and most mature e-commerce platforms** use in production.

### 5.2 Hybrid Score Formula

```
Final Score = (Content Score    × W1)
            + (Collaborative    × W2)
            + (Popularity Score × W3)
            + (Recency Boost    × W4)
```

**Recommended weights for CURATED Phase 3:**

| Signal | Weight | Rationale |
|---|---|---|
| Content-based score | 0.40 | Strong signal, always available |
| Collaborative score | 0.35 | Improves with user base growth |
| Popularity score | 0.15 | Trending / bestseller boost |
| Recency boost | 0.10 | Recent views matter more |

### 5.3 Popularity Score

```python
def popularity_score(product, window_days=7):
    recent_views = BrowseHistory.objects.filter(
        product=product,
        viewed_at__gte=timezone.now() - timedelta(days=window_days)
    ).count()

    recent_orders = OrderItem.objects.filter(
        variant__product=product,
        order__created_at__gte=timezone.now() - timedelta(days=window_days)
    ).count()

    return (recent_views * 1) + (recent_orders * 5)
```

### 5.4 Switching Strategy

Start with content-only, progressively add more signals:

```python
class HybridRecommendationEngine:

    def get_score(self, user, candidate_product):
        score = 0

        # Always available
        score += self.content_score(user, candidate_product) * 0.40

        # Add when collaborative data is available (1k+ users)
        if self.has_collaborative_data():
            score += self.collaborative_score(user, candidate_product) * 0.35
            score += self.popularity_score(candidate_product) * 0.15
            score += self.recency_boost(user, candidate_product) * 0.10
        else:
            # Fallback weights without collaborative
            score += self.popularity_score(candidate_product) * 0.35
            score += self.recency_boost(user, candidate_product) * 0.25

        return score
```

### 5.5 Pros and Cons

| Pros | Cons |
|---|---|
| Best accuracy overall | More complex to build and maintain |
| Handles cold start (content fallback) | Weight tuning requires experimentation |
| Improves automatically as data grows | Multiple models to keep updated |
| Industry standard for mature platforms | Higher infrastructure cost |

---

## 6. Algorithm 5 — Session-Based (Deep Learning)

### 6.1 Concept

**"Is session mai kya dekha — sequence samjho"**

Instead of treating all history equally, model the sequence of actions within the current session as a time series. Deep learning models (RNN, LSTM, Transformer) learn what the user is "in the mood for" right now.

Used by: **Instagram Reels, YouTube, TikTok, Pinterest**

### 6.2 How It Works

```
Current session sequence:
    10:01 → viewed Fridge
    10:03 → viewed AC  
    10:06 → viewed Washing Machine
    10:08 → ??? (predict next)

Model learns: this sequence pattern = user is furnishing a new home
→ Recommend: Microwave, Dishwasher, Water Purifier (not headphones)
```

### 6.3 Model Options

| Model | Description | Complexity |
|---|---|---|
| **GRU4Rec** | RNN-based session model — pioneered session-based recommendation | Medium |
| **SASRec** | Self-Attention Sequential Recommendation — Transformer-based | High |
| **BERT4Rec** | BERT applied to item sequences — bidirectional context | High |
| **Two-Tower Model** | Separate user + item encoders — used by YouTube | Very High |

### 6.4 High-Level Architecture

```
Session sequence → Embedding Layer → Transformer Encoder → Score Layer → Top-K Products

Training data:
    Input:  [product_1, product_2, product_3, ..., product_n-1]
    Target: product_n (next item to predict)
```

### 6.5 Infrastructure Requirements

| Requirement | Details |
|---|---|
| Training data | 100k+ sessions minimum |
| Training environment | GPU (AWS p3 / SageMaker) |
| Model serving | TorchServe / TensorFlow Serving / SageMaker endpoint |
| Retraining frequency | Daily or weekly |
| Latency | <50ms with model caching |

### 6.6 Pros and Cons

| Pros | Cons |
|---|---|
| Best at understanding real-time intent | Requires massive data and ML expertise |
| Powers highly engaging feeds (Reels style) | Expensive infrastructure (GPU training) |
| Adapts within a session in real time | Black box — hard to explain |
| State-of-the-art accuracy | Overkill for early-stage platforms |

### 6.7 Best For

- High-traffic platforms (100k+ monthly active users)
- Feed-style interfaces (infinite scroll)
- When you have a dedicated ML team

---

## 7. Comparison Table

| Algorithm | Data Needed | Complexity | Cold Start | Accuracy | Best Phase |
|---|---|---|---|---|---|
| Content-Based | Product attributes | Low | ✅ Handles well | Medium | Launch |
| User-Based CF | User interactions | Medium | ❌ Fails | Medium-High | 1k+ users |
| Item-Based CF | User interactions | Medium | ❌ Fails | High | 1k+ users |
| Matrix Factorization | Rich interactions | High | ❌ Fails | Very High | 10k+ users |
| Hybrid | All of the above | High | ✅ With content fallback | Very High | 10k+ users |
| Session-Based DL | Massive session logs | Very High | ✅ Within session | State of the art | 100k+ users |

---

## 8. CURATED Roadmap

### Phase 1 — Launch (Current)
**Algorithm:** Content-Based Filtering  
**Trigger:** Day 1  
**What it powers:** Similar Products + Homepage Feed  
**Status:** ✅ Implemented

### Phase 2 — Growth (1k+ users)
**Algorithm:** Content-Based + Item-Based Collaborative Filtering  
**Trigger:** 1,000+ users with browse history  
**New signals:** "Users who viewed this also viewed"  
**New model:** `UserProductInteraction` table + cosine similarity  
**What to add:**
```python
score = (content_score × 0.5) + (collaborative_score × 0.5)
```

### Phase 3 — Scale (10k+ users)
**Algorithm:** Full Hybrid  
**Trigger:** 10,000+ users, rich order + wishlist data  
**New signals:** Purchase weight (×10), Wishlist weight (×3), Popularity score  
**Infrastructure:** Redis cache for pre-computed scores  
**What to add:**
```python
score = (content × 0.40) + (collaborative × 0.35) + (popularity × 0.15) + (recency × 0.10)
```

### Phase 4 — Mature Platform (100k+ users)
**Algorithm:** Hybrid + Session-Based Deep Learning  
**Trigger:** 100,000+ MAU, dedicated ML engineer  
**New infrastructure:** SageMaker or self-hosted model serving  
**What it replaces:** Real-time feed becomes ML-driven, batch recommendations become fallback  

### Migration Strategy

Each phase is additive — you never throw away the previous work:

```
Phase 1: content_score only
Phase 2: content_score + collaborative_score (when data available)
Phase 3: full hybrid weights
Phase 4: ML model score replaces content + collaborative; popularity remains
```

---

*End of document — v1.0 · April 2026*
