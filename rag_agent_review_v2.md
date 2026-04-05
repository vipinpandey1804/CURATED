# AI Agent — Deep Review & Architecture Upgrade

**Version:** 2.0 · April 2026
**Status:** 🔴 CRITICAL REVIEW — Redesign Required in Key Areas
**Project:** CURATED E-Commerce Platform

---

## Table of Contents

1. [Executive Summary — What We Have vs What We Need](#1-executive-summary)
2. [Critical Problem — RAG vs Agent](#2-critical-problem--rag-vs-agent)
3. [Critical Fix — Admin Chat Redesign with Function Calling](#3-critical-fix--admin-chat-redesign)
4. [Critical Fix — Customer Chat Upgrade to Agentic RAG](#4-critical-fix--customer-chat-upgrade)
5. [Architecture Issues & Fixes](#5-architecture-issues--fixes)
6. [Database Schema Improvements](#6-database-schema-improvements)
7. [Memory System](#7-memory-system)
8. [Observability & Feedback Loop](#8-observability--feedback-loop)
9. [Guardrails](#9-guardrails)
10. [Revised Project Structure](#10-revised-project-structure)
11. [Revised Build Order](#11-revised-build-order)
12. [What to Keep from v1](#12-what-to-keep-from-v1)
13. [Frontend Changes — Complete Guide](#13-frontend-changes--complete-guide)
    - 13.1 [What Changed and Why](#131-what-changed-and-why)
    - 13.2 [New Folder Structure](#132-new-folder-structure-frontend)
    - 13.3 [Updated aiChatService.js](#133-updated-aichatservicejs--full-rewrite)
    - 13.4 [New Hook — useChatSession.js](#134-new-hook--usechatsessionjs)
    - 13.5 [New Hook — useAutoScroll.js](#135-new-hook--useautoscrolljs)
    - 13.6 [New Component — ToolCallIndicator.jsx](#136-new-component--toolcallindicatorjsx)
    - 13.7 [New Component — ChatMessage.jsx](#137-new-component--chatmessagejsx)
    - 13.8 [New Component — SuggestedQuestions.jsx](#138-new-component--suggestedquestionsjsx)
    - 13.9 [Updated ProductAIChat.jsx](#139-updated-productaichatjsx--full-rewrite)
    - 13.10 [Updated ProductDetailPage.jsx](#1310-updated-productdetailpagejsx--changes-only)
    - 13.11 [Updated AdminAIChat.jsx](#1311-updated-adminaichatjsx--full-rewrite)
    - 13.12 [New Page — AdminAIAssistantPage.jsx](#1312-new-page--adminaiassistantpagejsx)
    - 13.13 [AdminLayout.jsx Changes](#1313-adminlayoutjsx--changes-only)
    - 13.14 [New Django Endpoints](#1314-new-django-endpoint--chat-history)
    - 13.15 [Updated Django URLs](#1315-updated-django-urls-summary)
    - 13.16 [npm Packages](#1316-npm-packages-to-install)
    - 13.17 [Frontend Changes Summary Table](#1317-frontend-changes-summary)

---

## 1. Executive Summary

### What We Designed (v1)
A **RAG pipeline** — user asks a question → retrieve relevant chunks → stuff into GPT-4o → answer.

### What You Actually Need
An **AI Agent** — user asks a question → AI reasons → picks the right tools → calls them → observes results → reasons again → gives a grounded, accurate, multi-step answer.

### The Difference — In One Line

```
RAG    →  Question → Retrieve → Answer          (passive, single-step)
Agent  →  Question → Reason → Act → Observe → Answer  (active, multi-step)
```

### Summary of Problems Found

| # | Problem | Severity | Impact |
|---|---|---|---|
| 1 | Admin keyword matching will fail in production | 🔴 Critical | Wrong/empty answers for most queries |
| 2 | Customer chat cannot take actions | 🔴 Critical | Not a useful agent — just a Q&A bot |
| 3 | pgvector `ivfflat` index — wrong choice for production | 🟠 High | Slow queries, maintenance burden |
| 4 | `chat_sessions` JSONB design is unscalable | 🟠 High | Can't paginate, query, or analyze messages |
| 5 | No admin query audit log | 🟠 High | Compliance and security gap |
| 6 | TOP_K=5 too low, no reranking | 🟡 Medium | Misses relevant context |
| 7 | No cross-session memory | 🟡 Medium | Agent forgets user preferences |
| 8 | No user feedback (👍/👎) | 🟡 Medium | No way to improve the system |
| 9 | No AI layer observability | 🟡 Medium | Blind to token costs and errors |
| 10 | No similarity threshold — returns bad results | 🟡 Medium | Hallucinations from irrelevant context |
| 11 | Streaming + tool calls not handled | 🟠 High | Will crash when tools are added |

---

## 2. Critical Problem — RAG vs Agent

### 2.1 What is the Real Difference

```
Current Design (RAG):
─────────────────────
User: "Show me revenue this month"
  → Keyword match: "revenue" found
  → Run revenue_query()
  → Stuff result into GPT-4o prompt
  → GPT-4o answers
  → Done

Problem: What if user asks:
  "Why did revenue drop last Tuesday compared to Monday?"
  "Which electronics products are low on stock AND trending?"
  "Show orders above ₹5000 that are still pending payment"
  None of these will work with keyword matching.


What We Need (Agent with Function Calling):
───────────────────────────────────────────
User: "Why did revenue drop last Tuesday?"
  → GPT-4o REASONS: "I need revenue data for Tuesday AND Monday to compare"
  → GPT-4o CALLS: query_revenue(start="2026-03-31", end="2026-03-31")
  → GPT-4o CALLS: query_revenue(start="2026-03-30", end="2026-03-30")
  → GPT-4o CALLS: query_orders(date="2026-03-31", status="CANCELLED")
  → GPT-4o OBSERVES: "Tuesday had 3 cancelled orders, Monday had 0"
  → GPT-4o ANSWERS: "Revenue dropped ₹12,400 on Tuesday due to 3 cancellations..."
```

### 2.2 How Function Calling Works (OpenAI)

```python
# You define tools as JSON schemas
tools = [
    {
        "type": "function",
        "function": {
            "name": "query_revenue",
            "description": "Get revenue data for a specific date range",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "ISO date, e.g. 2026-03-01"},
                    "end_date": {"type": "string", "description": "ISO date, e.g. 2026-03-31"},
                    "group_by": {"type": "string", "enum": ["day", "week", "month"]}
                },
                "required": ["start_date", "end_date"]
            }
        }
    }
]

# GPT-4o decides WHICH tool to call and WITH WHAT ARGUMENTS
# Based entirely on the user's natural language query
# No keyword matching needed
```

---

## 3. Critical Fix — Admin Chat Redesign

### 3.1 Replace Keyword Matching with GPT-4o Function Calling

**File:** `rag-service/agents/admin_agent.py`

```python
from openai import AsyncOpenAI
from db.connection import get_pool
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import json

client = AsyncOpenAI()
IST = ZoneInfo("Asia/Kolkata")

# ─────────────────────────────────────────
# TOOL DEFINITIONS — GPT-4o reads these
# and decides which to call
# ─────────────────────────────────────────

ADMIN_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_revenue",
            "description": "Get total revenue, order count, and average order value for a date range. Use for questions about sales, earnings, income, money made.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Start date in YYYY-MM-DD format"},
                    "end_date": {"type": "string", "description": "End date in YYYY-MM-DD format"},
                    "group_by": {
                        "type": "string",
                        "enum": ["day", "week", "month"],
                        "description": "How to group the results"
                    }
                },
                "required": ["start_date", "end_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_orders",
            "description": "Get orders filtered by status, payment status, or date range. Use for pending orders, confirmed orders, cancelled orders.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["PENDING", "CONFIRMED", "CANCELLED", "ALL"],
                        "description": "Order fulfillment status"
                    },
                    "payment_status": {
                        "type": "string",
                        "enum": ["PAID", "UNPAID", "FAILED", "REFUNDED", "ALL"]
                    },
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "min_amount": {"type": "number", "description": "Minimum order total in INR"},
                    "limit": {"type": "integer", "default": 20}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_top_products",
            "description": "Get best-selling or most-viewed products ranked by revenue or units sold.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "enum": ["revenue", "units_sold", "views"],
                        "description": "What to rank by"
                    },
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "category": {"type": "string", "description": "Filter by category name"},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["metric"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_stock",
            "description": "Get stock levels. Use for low stock alerts, out of stock items, or checking a specific product's inventory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold": {"type": "integer", "description": "Show items with available stock below this number. Use 10 for low stock."},
                    "product_name": {"type": "string", "description": "Search for a specific product by name"},
                    "category": {"type": "string"},
                    "include_out_of_stock": {"type": "boolean", "default": True}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_users",
            "description": "Get user statistics — signups, active users, top spenders.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "enum": ["signups", "active", "top_spenders", "summary"]
                    },
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "limit": {"type": "integer", "default": 10}
                },
                "required": ["metric"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_returns",
            "description": "Get return requests, refund data, or return rate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED", "ALL"]
                    },
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_category_performance",
            "description": "Get revenue, units sold, and product count per category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "limit": {"type": "integer", "default": 10}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_product",
            "description": "Check if a specific product exists in the catalog, get its details and stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Product name or partial name to search"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_payments",
            "description": "Get payment transaction data — failed payments, refunds, Stripe sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["PAID", "FAILED", "REFUNDED", "ALL"]
                    },
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }
            }
        }
    }
]


# ─────────────────────────────────────────
# TOOL EXECUTOR — runs the actual SQL
# ─────────────────────────────────────────

async def execute_tool(tool_name: str, args: dict) -> str:
    pool = await get_pool()
    today = datetime.now(IST).date()

    # Default date range: last 30 days
    default_start = (today - timedelta(days=30)).isoformat()
    default_end = today.isoformat()

    start = args.get("start_date", default_start)
    end = args.get("end_date", default_end)

    async with pool.acquire() as conn:

        if tool_name == "query_revenue":
            group_by = args.get("group_by", "day")
            trunc = {"day": "day", "week": "week", "month": "month"}[group_by]
            rows = await conn.fetch(f"""
                SELECT
                    DATE_TRUNC('{trunc}', created_at AT TIME ZONE 'Asia/Kolkata') AS period,
                    COUNT(*) AS order_count,
                    SUM(total_amount) AS revenue,
                    AVG(total_amount) AS avg_order_value
                FROM orders_order
                WHERE payment_status = 'PAID'
                  AND created_at >= $1::date
                  AND created_at < ($2::date + INTERVAL '1 day')
                GROUP BY period
                ORDER BY period DESC
                LIMIT 60
            """, start, end)
            return format_rows("Revenue Data", rows)

        elif tool_name == "query_orders":
            conditions = ["created_at >= $1::date", "created_at < ($2::date + INTERVAL '1 day')"]
            params = [start, end]

            if args.get("status") and args["status"] != "ALL":
                conditions.append(f"status = ${len(params)+1}")
                params.append(args["status"])

            if args.get("payment_status") and args["payment_status"] != "ALL":
                conditions.append(f"payment_status = ${len(params)+1}")
                params.append(args["payment_status"])

            if args.get("min_amount"):
                conditions.append(f"total_amount >= ${len(params)+1}")
                params.append(args["min_amount"])

            limit = min(args.get("limit", 20), 50)
            where = " AND ".join(conditions)

            rows = await conn.fetch(f"""
                SELECT id, status, payment_status,
                       total_amount, created_at AT TIME ZONE 'Asia/Kolkata' AS created_ist
                FROM orders_order
                WHERE {where}
                ORDER BY created_at DESC
                LIMIT {limit}
            """, *params)
            return format_rows("Orders", rows)

        elif tool_name == "query_top_products":
            metric = args.get("metric", "revenue")
            order_col = "SUM(oi.line_total_amount)" if metric == "revenue" else "SUM(oi.quantity)"
            cat_filter = f"AND c.name ILIKE '%{args['category']}%'" if args.get("category") else ""

            rows = await conn.fetch(f"""
                SELECT
                    p.name,
                    c.name AS category,
                    SUM(oi.quantity) AS units_sold,
                    SUM(oi.line_total_amount) AS revenue
                FROM orders_orderitem oi
                JOIN catalog_productvariant pv ON oi.variant_id = pv.id
                JOIN catalog_product p ON pv.product_id = p.id
                JOIN catalog_category c ON p.category_id = c.id
                JOIN orders_order o ON oi.order_id = o.id
                WHERE o.payment_status = 'PAID'
                  AND o.created_at >= $1::date
                  AND o.created_at < ($2::date + INTERVAL '1 day')
                  {cat_filter}
                GROUP BY p.id, p.name, c.name
                ORDER BY {order_col} DESC
                LIMIT {min(args.get('limit', 10), 20)}
            """, start, end)
            return format_rows("Top Products", rows)

        elif tool_name == "query_stock":
            conditions = []
            params = []

            if args.get("threshold") is not None:
                conditions.append(f"(sl.quantity_on_hand - sl.quantity_reserved) < ${len(params)+1}")
                params.append(args["threshold"])

            if args.get("product_name"):
                conditions.append(f"p.name ILIKE ${len(params)+1}")
                params.append(f"%{args['product_name']}%")

            if args.get("category"):
                conditions.append(f"c.name ILIKE ${len(params)+1}")
                params.append(f"%{args['category']}%")

            where = "WHERE " + " AND ".join(conditions) if conditions else ""

            rows = await conn.fetch(f"""
                SELECT
                    p.name AS product,
                    c.name AS category,
                    pv.sku,
                    sl.quantity_on_hand,
                    sl.quantity_reserved,
                    (sl.quantity_on_hand - sl.quantity_reserved) AS available
                FROM inventory_stocklevel sl
                JOIN catalog_productvariant pv ON sl.variant_id = pv.id
                JOIN catalog_product p ON pv.product_id = p.id
                JOIN catalog_category c ON p.category_id = c.id
                {where}
                ORDER BY available ASC
                LIMIT 30
            """, *params)
            return format_rows("Stock Data", rows)

        elif tool_name == "query_users":
            metric = args.get("metric", "summary")
            if metric == "summary":
                row = await conn.fetchrow("""
                    SELECT
                        COUNT(*) AS total,
                        COUNT(*) FILTER (WHERE date_joined >= NOW() - INTERVAL '7 days') AS last_7_days,
                        COUNT(*) FILTER (WHERE date_joined >= NOW() - INTERVAL '30 days') AS last_30_days,
                        COUNT(*) FILTER (WHERE is_active) AS active
                    FROM accounts_user WHERE is_staff = false
                """)
                return f"User Summary: {dict(row)}"

            elif metric == "top_spenders":
                rows = await conn.fetch("""
                    SELECT
                        u.email, u.full_name,
                        COUNT(o.id) AS order_count,
                        SUM(o.total_amount) AS total_spent
                    FROM accounts_user u
                    JOIN orders_order o ON o.user_id = u.id
                    WHERE o.payment_status = 'PAID'
                    GROUP BY u.id, u.email, u.full_name
                    ORDER BY total_spent DESC
                    LIMIT 10
                """)
                return format_rows("Top Spenders", rows)

        elif tool_name == "query_returns":
            status = args.get("status", "ALL")
            params = [start, end]
            status_filter = f"AND status = $3" if status != "ALL" else ""
            if status != "ALL":
                params.append(status)

            rows = await conn.fetch(f"""
                SELECT status, COUNT(*) AS count,
                       COUNT(*) FILTER (WHERE reviewed_at IS NOT NULL) AS reviewed
                FROM returns_returnrequest
                WHERE created_at >= $1::date
                  AND created_at < ($2::date + INTERVAL '1 day')
                  {status_filter}
                GROUP BY status
            """, *params)
            return format_rows("Return Requests", rows)

        elif tool_name == "query_category_performance":
            rows = await conn.fetch("""
                SELECT
                    c.name AS category,
                    COUNT(DISTINCT p.id) AS product_count,
                    SUM(oi.quantity) AS units_sold,
                    SUM(oi.line_total_amount) AS revenue
                FROM catalog_category c
                LEFT JOIN catalog_product p ON p.category_id = c.id
                LEFT JOIN catalog_productvariant pv ON pv.product_id = p.id
                LEFT JOIN orders_orderitem oi ON oi.variant_id = pv.id
                LEFT JOIN orders_order o ON oi.order_id = o.id
                    AND o.payment_status = 'PAID'
                    AND o.created_at >= $1::date
                    AND o.created_at < ($2::date + INTERVAL '1 day')
                GROUP BY c.id, c.name
                ORDER BY revenue DESC NULLS LAST
                LIMIT 15
            """, start, end)
            return format_rows("Category Performance", rows)

        elif tool_name == "search_product":
            name = args.get("name", "")
            rows = await conn.fetch("""
                SELECT
                    p.name, p.slug, p.is_active,
                    p.base_price_amount AS price,
                    c.name AS category,
                    COALESCE(SUM(sl.quantity_on_hand - sl.quantity_reserved), 0) AS total_available
                FROM catalog_product p
                JOIN catalog_category c ON p.category_id = c.id
                LEFT JOIN catalog_productvariant pv ON pv.product_id = p.id
                LEFT JOIN inventory_stocklevel sl ON sl.variant_id = pv.id
                WHERE p.name ILIKE $1 OR p.slug ILIKE $1
                GROUP BY p.id, p.name, p.slug, p.is_active, p.base_price_amount, c.name
                LIMIT 5
            """, f"%{name}%")
            return format_rows("Product Search", rows)

        elif tool_name == "query_payments":
            status = args.get("status", "ALL")
            status_filter = f"AND status = $3" if status != "ALL" else ""
            params = [start, end]
            if status != "ALL":
                params.append(status)

            rows = await conn.fetch(f"""
                SELECT
                    type, status,
                    COUNT(*) AS count,
                    SUM(amount) AS total_amount
                FROM payments_paymenttransaction
                WHERE created_at >= $1::date
                  AND created_at < ($2::date + INTERVAL '1 day')
                  {status_filter}
                GROUP BY type, status
            """, *params)
            return format_rows("Payment Transactions", rows)

    return "No data found."


def format_rows(label: str, rows) -> str:
    if not rows:
        return f"{label}: No data found for this query."
    result = f"### {label}\n"
    result += "\n".join(str(dict(r)) for r in rows[:25])
    if len(rows) > 25:
        result += f"\n... ({len(rows) - 25} more rows)"
    return result


# ─────────────────────────────────────────
# AGENT LOOP — reason → act → observe
# ─────────────────────────────────────────

ADMIN_SYSTEM_PROMPT = """You are an intelligent business analytics assistant for CURATED 
e-commerce platform. Today's date is {today}. Timezone: Asia/Kolkata (IST).

You have access to tools to query live business data. Use them to answer admin questions.

Rules:
- Always use tools to get data — never guess numbers
- Call multiple tools if needed to give a complete answer
- Format currency as ₹ (INR)
- Highlight important trends, anomalies, or action items
- Be precise with numbers
- For "this month" use the 1st of current month to today
- For "last month" use the entire previous month
- For "today" use today's date
- If asked about a specific product's existence, always use search_product tool
- Never expose raw SQL or internal column names in responses
"""

async def run_admin_agent(query: str, user_id: str, history: list = None):
    """
    Agent loop using GPT-4o function calling.
    Yields text chunks for SSE streaming.
    """
    today = datetime.now(IST).strftime("%Y-%m-%d")
    messages = [
        {"role": "system", "content": ADMIN_SYSTEM_PROMPT.format(today=today)}
    ]

    if history:
        messages.extend(history[-6:])

    messages.append({"role": "user", "content": query})

    # ── Agent loop ──
    # GPT-4o may call multiple tools before giving a final answer
    max_iterations = 5  # Prevent infinite loops
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=ADMIN_TOOLS,
            tool_choice="auto",
            temperature=0.1,
            max_tokens=1500
        )

        message = response.choices[0].message
        finish_reason = response.choices[0].finish_reason

        # GPT-4o wants to call tools
        if finish_reason == "tool_calls" and message.tool_calls:
            # Add GPT-4o's tool call request to message history
            messages.append(message)

            # Execute each tool call
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)

                # Yield a status message so user sees progress
                yield f"\n🔍 Checking {tool_name.replace('_', ' ')}...\n"

                try:
                    result = await execute_tool(tool_name, tool_args)
                except Exception as e:
                    result = f"Error running {tool_name}: {str(e)}"

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

            # Continue the loop — GPT-4o will now synthesize the results

        # GPT-4o is done — stream the final answer
        elif finish_reason == "stop":
            # Stream the final response
            stream = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.1,
                max_tokens=1500,
                stream=True
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
            break

        else:
            yield "⚠️ Unexpected response from AI. Please try again."
            break
```

---

## 4. Critical Fix — Customer Chat Upgrade to Agentic RAG

### 4.1 Customer Agent Tools

The customer agent should not just answer questions — it should **take actions**.

```python
# rag-service/agents/customer_agent.py

CUSTOMER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": "Get full details of the current product — description, variants, attributes, price, stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "string"}
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_variant_stock",
            "description": "Check if a specific variant (e.g. Size L, Color Red) is in stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "string"},
                    "attributes": {
                        "type": "object",
                        "description": "e.g. {'size': 'L', 'color': 'Red'}"
                    }
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_similar_products",
            "description": "Find products similar to the current one — same category, similar price, or matching attributes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "max_price": {"type": "number", "description": "Maximum price in INR"},
                    "attributes": {"type": "object", "description": "Filter by attributes like color, size"},
                    "limit": {"type": "integer", "default": 5}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_order_status",
            "description": "Get the status of a user's recent orders.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "limit": {"type": "integer", "default": 3}
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_size_guide",
            "description": "Get the size guide for the current product's category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string"},
                    "product_id": {"type": "string"}
                }
            }
        }
    }
]
```

### 4.2 RAG + Agent Combined Flow for Customer

```
Customer asks: "Is there anything similar under ₹1000 in Red?"

Agent Loop:
  Step 1 → search_similar_products(category="Tops", max_price=1000, attributes={"color": "Red"})
  Step 2 → check_variant_stock for each result
  Step 3 → Synthesize: "Yes! I found 3 similar tops in Red under ₹1000. The best match is..."

Customer asks: "What's my last order status?"

Agent Loop:
  Step 1 → get_user_order_status(user_id="uuid")
  Step 2 → "Your last order #ORD-1234 was placed on April 3rd and is currently being packed."
```

---

## 5. Architecture Issues & Fixes

### 5.1 pgvector Index — ivfflat → HNSW

**Problem:**
`ivfflat` (what we designed) requires periodic `VACUUM` maintenance, has worse recall at low `lists` values, and degrades over time without maintenance.

**Fix — Use HNSW (added in pgvector 0.5.0):**
```sql
-- OLD (ivfflat) — REMOVE THIS:
CREATE INDEX ON product_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- NEW (HNSW) — USE THIS:
CREATE INDEX ON product_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- HNSW advantages:
-- ✅ Better recall (finds more relevant results)
-- ✅ No maintenance required (no VACUUM)
-- ✅ Faster query times
-- ✅ Industry standard for production pgvector
```

### 5.2 Similarity Threshold — No Bad Results

**Problem:**
If user asks something completely unrelated to any product, pgvector still returns the TOP-K closest — even if they're all irrelevant. GPT-4o then hallucinates an answer from irrelevant context.

**Fix — Minimum similarity threshold:**
```python
# rag/retriever.py

async def similarity_search(query_embedding, top_k=8, product_id=None, min_similarity=0.35):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT chunk_text, metadata, chunk_type,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM product_embeddings
            WHERE ($2::uuid IS NULL OR product_id = $2)
              AND 1 - (embedding <=> $1::vector) >= $3  -- ← threshold check
            ORDER BY embedding <=> $1::vector
            LIMIT $4
        """, query_embedding, product_id, min_similarity, top_k)

    if not rows:
        return None  # Signal: no relevant context found

    return rows

# In product_chat router:
chunks = await similarity_search(query_embedding, product_id=product_id)
if chunks is None:
    yield "I don't have specific information about that. Could you rephrase or ask something else about this product?"
    return
```

### 5.3 TOP_K = 5 → 8 with Reranking

**Problem:**
TOP_K=5 often misses the most relevant chunk. Cosine similarity on embeddings is a FIRST-PASS filter, not a perfect relevance scorer.

**Fix — Get 15, rerank to 8 using GPT-4o mini:**
```python
# rag/retriever.py

async def retrieve_with_reranking(query: str, product_id: str) -> str:
    query_embedding = await embed_text(query)

    # Step 1: Get top 15 by cosine similarity
    candidates = await similarity_search(query_embedding, top_k=15, product_id=product_id)
    if not candidates:
        return None

    # Step 2: Rerank using GPT-4o mini (cheap, fast)
    rerank_prompt = f"""Query: "{query}"

Rate each chunk's relevance to the query from 0-10. Return JSON array of indices sorted by relevance.

Chunks:
{chr(10).join(f"[{i}] {row['chunk_text'][:200]}" for i, row in enumerate(candidates))}

Return only: [{{"index": 0, "score": 8}}, ...]"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",   # Cheap — $0.15/1M input tokens
        messages=[{"role": "user", "content": rerank_prompt}],
        max_tokens=200,
        temperature=0,
        response_format={"type": "json_object"}
    )

    import json
    rankings = json.loads(response.choices[0].message.content)
    top_indices = [r["index"] for r in sorted(rankings, key=lambda x: x["score"], reverse=True)[:8]]

    reranked = [candidates[i] for i in top_indices if i < len(candidates)]
    return "\n\n---\n\n".join(r["chunk_text"] for r in reranked)
```

### 5.4 Streaming + Tool Calls Conflict

**Problem:**
Current streaming code sends `stream=True` to GPT-4o. But when GPT-4o calls a tool, it cannot stream simultaneously — it pauses to request the tool call. Current code will break.

**Fix — Two-phase approach:**
```python
# Phase 1: Non-streaming call to check for tool calls
# Phase 2: Streaming call for final answer (after tools are done)

# This is already handled in the admin agent loop (Section 3 above).
# For product chat with tools, use the same pattern:

async def stream_customer_response(query, product_id, user_id, history):
    messages = build_messages(query, history)

    # Phase 1 — Non-streaming, may call tools
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        tools=CUSTOMER_TOOLS,
        tool_choice="auto",
        temperature=0.3
    )

    if response.choices[0].finish_reason == "tool_calls":
        # Execute tools (yield status updates)
        yield "🔍 Looking that up...\n"
        messages = await process_tool_calls(response, messages, product_id, user_id)

    # Phase 2 — Stream the final answer
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.3,
        stream=True,
        max_tokens=800
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
```

---

## 6. Database Schema Improvements

### 6.1 chat_sessions → Proper Message Table

**Problem with current design:**
```sql
-- CURRENT — messages as JSONB blob in one row
CREATE TABLE chat_sessions (
    messages JSONB NOT NULL DEFAULT '[]'  -- ← entire conversation in one field
);
-- Cannot: paginate, query individual messages, analyze patterns, index content
```

**Fix — Separate messages table:**
```sql
-- Sessions table (lightweight)
CREATE TABLE chat_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    session_type  VARCHAR(20) NOT NULL,   -- 'product' or 'admin'
    context_id    UUID,                   -- product_id for product chat
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    last_active   TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table (one row per message)
CREATE TABLE chat_messages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id    UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role          VARCHAR(20) NOT NULL,   -- 'user', 'assistant', 'tool'
    content       TEXT NOT NULL,
    tool_calls    JSONB,                  -- populated for assistant tool call messages
    tool_name     VARCHAR(100),           -- populated for tool result messages
    tokens_used   INTEGER,               -- track cost per message
    latency_ms    INTEGER,               -- track response time
    feedback      SMALLINT,              -- NULL, 1 (thumbs up), -1 (thumbs down)
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX ON chat_messages (session_id, created_at);
CREATE INDEX ON chat_messages (user_id) WHERE role = 'user';  -- via session join
CREATE INDEX ON chat_messages (feedback) WHERE feedback IS NOT NULL;

-- Admin audit log — separate table for compliance
CREATE TABLE admin_chat_audit (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    query         TEXT NOT NULL,
    tools_called  JSONB,                 -- which tools were invoked
    response_summary TEXT,
    tokens_used   INTEGER,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON admin_chat_audit (admin_user_id, created_at);
```

---

## 7. Memory System

### 7.1 Cross-Session User Memory

**Problem:** Every conversation starts fresh. Agent forgets `"User prefers cotton, Size M, budget ₹500-1500"`.

**Fix — User memory embeddings in pgvector:**

```sql
-- User preference memory
CREATE TABLE user_memory (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "size": "M",
    --   "preferred_materials": ["cotton", "linen"],
    --   "budget_range": {"min": 500, "max": 2000},
    --   "favorite_categories": ["Tops", "Denim"],
    --   "avoided_colors": ["yellow"],
    --   "last_updated": "2026-04-05"
    -- }
    embedding  vector(1536),             -- embedded preference text for similarity
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

```python
# rag-service/memory/user_memory.py

async def get_user_memory(user_id: str) -> str:
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT preferences FROM user_memory WHERE user_id = $1",
            user_id
        )
    if not row:
        return ""
    prefs = row["preferences"]
    parts = []
    if prefs.get("size"):
        parts.append(f"User's size: {prefs['size']}")
    if prefs.get("preferred_materials"):
        parts.append(f"Prefers: {', '.join(prefs['preferred_materials'])}")
    if prefs.get("budget_range"):
        parts.append(f"Budget: ₹{prefs['budget_range']['min']}–₹{prefs['budget_range']['max']}")
    if prefs.get("favorite_categories"):
        parts.append(f"Favorite categories: {', '.join(prefs['favorite_categories'])}")
    return "\n".join(parts) if parts else ""

async def update_user_memory(user_id: str, new_info: dict):
    """Called after each conversation to update preferences."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO user_memory (user_id, preferences, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                preferences = user_memory.preferences || $2,
                updated_at = NOW()
        """, user_id, json.dumps(new_info))
```

**Extract preferences after each conversation:**
```python
# After conversation ends, run this in background (Django-Q2 task)

async def extract_and_save_preferences(user_id: str, conversation: list):
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Extract user preferences from this conversation as JSON. Only extract clear facts stated by the user. Return: {size, budget_range, preferred_materials, avoided_colors, favorite_categories}. Return {} if nothing clear."},
            {"role": "user", "content": str(conversation)}
        ],
        response_format={"type": "json_object"},
        max_tokens=200
    )
    prefs = json.loads(response.choices[0].message.content)
    if prefs:
        await update_user_memory(user_id, prefs)
```

**Inject memory into every product chat:**
```python
# In customer agent system prompt:
memory = await get_user_memory(user_id)
system_prompt = f"""You are a helpful shopping assistant for CURATED.

{f"Known about this user:{chr(10)}{memory}" if memory else ""}

Use this context to personalize your answers.
"""
```

---

## 8. Observability & Feedback Loop

### 8.1 Token Usage & Cost Tracking

```python
# rag-service/observability/tracker.py

async def log_chat_message(
    session_id: str,
    role: str,
    content: str,
    tokens_used: int = None,
    latency_ms: int = None,
    tool_name: str = None
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO chat_messages
                (session_id, role, content, tokens_used, latency_ms, tool_name)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, session_id, role, content, tokens_used, latency_ms, tool_name)

# Wrap every GPT-4o call:
import time

start = time.monotonic()
response = await client.chat.completions.create(...)
latency_ms = int((time.monotonic() - start) * 1000)
tokens = response.usage.total_tokens

await log_chat_message(
    session_id=session_id,
    role="assistant",
    content=response.choices[0].message.content,
    tokens_used=tokens,
    latency_ms=latency_ms
)
```

### 8.2 User Feedback — Thumbs Up / Down

**New API endpoint:**
```python
# rag-service/routers/feedback.py

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Called when user clicks 👍 or 👎 on an AI response.
    message_id: UUID of the chat_messages row
    feedback: 1 (good) or -1 (bad)
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE chat_messages SET feedback = $1 WHERE id = $2",
            request.feedback, request.message_id
        )
    return {"saved": True}
```

**Frontend — add to every AI response:**
```jsx
// After each assistant message, show feedback buttons
{msg.role === "assistant" && msg.id && (
  <div className="flex gap-2 mt-1">
    <button
      onClick={() => submitFeedback(msg.id, 1)}
      className={`text-xs px-2 py-1 rounded ${feedback[msg.id] === 1 ? "bg-green-100 text-green-700" : "text-gray-400 hover:text-green-600"}`}
    >
      👍
    </button>
    <button
      onClick={() => submitFeedback(msg.id, -1)}
      className={`text-xs px-2 py-1 rounded ${feedback[msg.id] === -1 ? "bg-red-100 text-red-700" : "text-gray-400 hover:text-red-600"}`}
    >
      👎
    </button>
  </div>
)}
```

### 8.3 Admin Query Audit Log

Every admin AI interaction must be logged for compliance:
```python
# In admin agent — log BEFORE returning response

async def log_admin_query(admin_user_id: str, query: str, tools_called: list, response: str, tokens: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO admin_chat_audit
                (admin_user_id, query, tools_called, response_summary, tokens_used)
            VALUES ($1, $2, $3, $4, $5)
        """,
        admin_user_id,
        query,
        json.dumps(tools_called),
        response[:500],  # First 500 chars of response
        tokens
        )
```

---

## 9. Guardrails

### 9.1 Response Validation

```python
# rag-service/guardrails/validator.py

async def validate_response(response: str, context_type: str) -> tuple[bool, str]:
    """
    Quick validation using GPT-4o mini.
    Returns (is_valid, issue_description)
    """
    check_prompt = f"""Is this AI response appropriate for a {context_type} e-commerce assistant?

Response: "{response[:500]}"

Check for:
1. Does it reveal sensitive business data (if context_type is 'product')?
2. Does it contain harmful or offensive content?
3. Does it make up facts not grounded in data?

Return JSON: {{"valid": true/false, "issue": "description if invalid"}}"""

    result = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": check_prompt}],
        response_format={"type": "json_object"},
        max_tokens=100,
        temperature=0
    )
    data = json.loads(result.choices[0].message.content)
    return data["valid"], data.get("issue", "")
```

### 9.2 Hallucination Detection for Product Chat

```python
# If AI response contains price/stock claims, verify against actual data

async def detect_hallucination(response: str, actual_product_data: dict) -> bool:
    """Check if AI stated wrong price or stock info."""
    import re

    # Extract any price mentioned in response
    prices_in_response = re.findall(r'₹[\d,]+', response)
    actual_price = str(actual_product_data.get("base_price", ""))

    for price in prices_in_response:
        price_num = price.replace("₹", "").replace(",", "")
        if actual_price and price_num not in actual_price:
            return True  # Hallucinated a wrong price

    return False
```

---

## 10. Revised Project Structure

```
rag-service/
├── main.py
├── config.py
├── requirements.txt
├── Procfile
│
├── agents/                     ← NEW — Agent loop files
│   ├── admin_agent.py          ← GPT-4o function calling agent for admin
│   └── customer_agent.py       ← Agentic RAG for customers
│
├── routers/
│   ├── product_chat.py
│   ├── admin_chat.py
│   ├── ingestion.py
│   └── feedback.py             ← NEW — thumbs up/down endpoint
│
├── rag/
│   ├── embedder.py
│   ├── retriever.py            ← Updated: HNSW index, threshold, reranking
│   ├── generator.py            ← Updated: tool call + streaming separation
│   └── reranker.py             ← NEW — GPT-4o mini reranking
│
├── memory/
│   └── user_memory.py          ← NEW — cross-session user preferences
│
├── guardrails/
│   └── validator.py            ← NEW — response validation, hallucination check
│
├── observability/
│   └── tracker.py              ← NEW — token tracking, latency, cost
│
├── knowledge/
│   └── product_kb.py           ← Updated: more chunk types, variant combos
│
└── db/
    ├── connection.py
    └── schema.sql              ← Updated: HNSW, messages table, audit log, memory
```

---

## 11. Revised Build Order

| Step | What | Priority | Changed from v1? |
|---|---|---|---|
| 1 | pgvector setup with **HNSW** index | P0 | ✅ Changed — was ivfflat |
| 2 | Revised DB schema (messages table + audit log + memory) | P0 | ✅ Changed |
| 3 | FastAPI skeleton + service token auth | P0 | Same |
| 4 | Embedder + retriever with **threshold + reranking** | P0 | ✅ Changed |
| 5 | Product chunking (add variant combinations) | P0 | ✅ Updated |
| 6 | Product ingestion endpoint (atomic transaction) | P0 | Same |
| 7 | Bulk ingest command (batched, rate-limited) | P1 | Updated |
| 8 | **Customer agent** with tools (replaces simple RAG chat) | P0 | ✅ Major change |
| 9 | **Admin agent** with function calling (replaces keyword matching) | P0 | ✅ Major change |
| 10 | User memory system | P1 | ✅ New |
| 11 | Feedback endpoint (👍/👎) | P1 | ✅ New |
| 12 | Observability — token tracking, latency logging | P1 | ✅ New |
| 13 | Guardrails — response validation | P2 | ✅ New |
| 14 | Django proxy layer (ai_chat app) | P0 | Same |
| 15 | Django signals for auto-ingestion (with Q2 retry) | P0 | Updated |
| 16 | Frontend — ProductAIChat with tool status indicators | P0 | Updated |
| 17 | Frontend — AdminAIChat with audit awareness | P0 | Updated |
| 18 | Frontend — feedback buttons on every message | P1 | ✅ New |
| 19 | Deploy on Railway | P0 | Same |

---

## 12. What to Keep from v1

Everything from the original design document is still valid — these parts require NO changes:

| Component | Status |
|---|---|
| Microservice architecture (FastAPI + Railway) | ✅ Keep exactly |
| pgvector on same PostgreSQL | ✅ Keep (just change index type) |
| Django proxy layer pattern | ✅ Keep exactly |
| Service token auth between Django and RAG | ✅ Keep exactly |
| SSE streaming for responses | ✅ Keep exactly |
| Product chunking concept | ✅ Keep (add variant combinations) |
| Live data approach for admin | ✅ Keep concept (change implementation to function calling) |
| Django signals for auto-ingestion | ✅ Keep (add Q2 retry) |
| Railway deployment config | ✅ Keep exactly |
| Cost estimation | ✅ Still accurate (add ~$2/month for reranking) |
| All edge case fixes from edge_cases doc | ✅ Keep all |

---

---

## 13. Frontend Changes — Complete Guide

### 13.1 What Changed and Why

v1 designed a simple chat modal. But with the agent upgrade (function calling, tool status, feedback, memory, session IDs), the frontend needs significant changes too.

| Component | v1 Status | v2 Status | Reason |
|---|---|---|---|
| `aiChatService.js` | Basic SSE stream | ✅ Major rewrite | Handle tool status events, session IDs, feedback API, token refresh mid-chat |
| `ProductAIChat.jsx` | Simple modal | ✅ Major update | Tool call indicators, feedback buttons, session persistence, markdown rendering, mobile fix |
| `AdminAIChat.jsx` | Basic dark chat | ✅ Major update | Tool progress steps, data tables in responses, audit notice, blur on inactivity |
| `ProductDetailPage.jsx` | No AI | ✅ Add AI button + auto-track | Button placement, view tracking on mount |
| `AdminLayout.jsx` | No AI tab | ✅ Add AI Assistant tab | Route + sidebar nav item |
| New: `ToolCallIndicator.jsx` | ❌ Did not exist | ✅ New component | Show agent "thinking" steps in real time |
| New: `ChatMessage.jsx` | ❌ Did not exist | ✅ New component | Markdown rendering, tables, feedback buttons |
| New: `useChatSession.js` | ❌ Did not exist | ✅ New hook | Session ID management, history persistence |
| New: `useAutoScroll.js` | ❌ Did not exist | ✅ New hook | Auto-scroll as streaming happens |

---

### 13.2 New Folder Structure (Frontend)

```
src/
├── services/
│   └── aiChatService.js         ← Full rewrite
│
├── components/
│   ├── ProductAIChat.jsx         ← Major update
│   └── admin/
│       └── AdminAIChat.jsx       ← Major update
│
├── components/chat/              ← NEW folder — shared chat primitives
│   ├── ChatMessage.jsx           ← NEW — renders one message (markdown + feedback)
│   ├── ToolCallIndicator.jsx     ← NEW — shows agent tool steps
│   ├── SuggestedQuestions.jsx    ← NEW — clickable suggestion chips
│   └── ChatInput.jsx             ← NEW — input bar with send button
│
├── hooks/
│   ├── useChatSession.js         ← NEW — session ID + history management
│   └── useAutoScroll.js          ← NEW — auto-scroll on new content
│
└── pages/
    ├── ProductDetailPage.jsx     ← Add AI button + view tracking
    └── admin/
        └── AdminAIAssistantPage.jsx  ← NEW — full page for admin AI
```

---

### 13.3 Updated `aiChatService.js` — Full Rewrite

**Key changes from v1:**
- Parse `tool_status` events (agent thinking steps)
- Attach `session_id` to every request
- `submitFeedback()` method added
- `getHistory()` to load previous session
- Proactive token refresh before streaming

```javascript
// src/services/aiChatService.js

const API_URL = import.meta.env.VITE_API_URL;

// ── Token helper ──────────────────────────────────────────
async function getValidToken() {
  let token = localStorage.getItem("access_token");
  const expiry = parseInt(localStorage.getItem("token_expiry") || "0");

  // Refresh if expiring in next 60 seconds
  if (Date.now() > expiry - 60_000) {
    try {
      const res = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: localStorage.getItem("refresh_token") }),
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      token = data.access;
      localStorage.setItem("access_token", token);
      localStorage.setItem("token_expiry", String(Date.now() + 30 * 60 * 1000));
    } catch {
      localStorage.clear();
      window.location.href = "/login";
      return null;
    }
  }
  return token;
}

// ── SSE parser ────────────────────────────────────────────
// Parses the raw SSE stream into typed events:
//   { type: "delta",       content: "Hello" }        ← text chunk
//   { type: "tool_status", tool: "query_revenue", label: "Checking revenue..." }
//   { type: "done",        message_id: "uuid" }       ← stream complete
//   { type: "error",       message: "..." }
async function* parseSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        yield JSON.parse(raw);
      } catch {
        // Malformed chunk — skip
      }
    }
  }
}

// ── Product Chat ──────────────────────────────────────────
async function* streamProductChat(query, productId, sessionId, history = []) {
  const token = await getValidToken();
  if (!token) return;

  const response = await fetch(`${API_URL}/ai/product-chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      product_id: productId,
      session_id: sessionId,   // ← NEW
      history: history.slice(-6),
    }),
  });

  if (!response.ok) {
    yield { type: "error", message: "Failed to connect to AI. Please try again." };
    return;
  }

  yield* parseSSEStream(response);
}

// ── Admin Chat ────────────────────────────────────────────
async function* streamAdminChat(query, sessionId, history = []) {
  const token = await getValidToken();
  if (!token) return;

  const response = await fetch(`${API_URL}/ai/admin-chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      session_id: sessionId,   // ← NEW
      history: history.slice(-6),
    }),
  });

  if (!response.ok) {
    yield { type: "error", message: "Failed to connect to AI. Please try again." };
    return;
  }

  yield* parseSSEStream(response);
}

// ── Feedback ──────────────────────────────────────────────
async function submitFeedback(messageId, feedback) {
  const token = await getValidToken();
  if (!token) return;

  await fetch(`${API_URL}/ai/feedback/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message_id: messageId, feedback }), // feedback: 1 or -1
  });
}

// ── Session History ───────────────────────────────────────
async function getChatHistory(sessionId) {
  const token = await getValidToken();
  if (!token || !sessionId) return [];

  const res = await fetch(`${API_URL}/ai/history/${sessionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

const aiChatService = {
  streamProductChat,
  streamAdminChat,
  submitFeedback,
  getChatHistory,
};

export default aiChatService;
```

---

### 13.4 New Hook — `useChatSession.js`

Manages session ID creation and persistence across page reloads.

```javascript
// src/hooks/useChatSession.js
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export function useChatSession(contextType, contextId = null) {
  // Session key: "chat_session_product_<productId>" or "chat_session_admin"
  const storageKey = contextId
    ? `chat_session_${contextType}_${contextId}`
    : `chat_session_${contextType}`;

  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const newId = uuidv4();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  });

  // New session when product changes
  useEffect(() => {
    const existing = sessionStorage.getItem(storageKey);
    if (!existing) {
      const newId = uuidv4();
      sessionStorage.setItem(storageKey, newId);
    }
  }, [contextId]);

  const resetSession = () => {
    const newId = uuidv4();
    sessionStorage.setItem(storageKey, newId);
    return newId;
  };

  return { sessionId, resetSession };
}
```

---

### 13.5 New Hook — `useAutoScroll.js`

```javascript
// src/hooks/useAutoScroll.js
import { useRef, useEffect } from "react";

export function useAutoScroll(dependency) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [dependency]);

  return ref;
}
```

---

### 13.6 New Component — `ToolCallIndicator.jsx`

Shows the agent's reasoning steps in real time — like "🔍 Checking revenue..." while GPT-4o is calling tools.

```jsx
// src/components/chat/ToolCallIndicator.jsx

const TOOL_LABELS = {
  query_revenue:              "Checking revenue data",
  query_orders:               "Looking up orders",
  query_top_products:         "Finding top products",
  query_stock:                "Checking stock levels",
  query_users:                "Fetching user stats",
  query_returns:              "Checking return requests",
  query_category_performance: "Analyzing categories",
  search_product:             "Searching catalog",
  query_payments:             "Reviewing payments",
  get_product_details:        "Loading product info",
  check_variant_stock:        "Checking variant stock",
  search_similar_products:    "Finding similar products",
  get_user_order_status:      "Fetching your orders",
  get_size_guide:             "Loading size guide",
};

export default function ToolCallIndicator({ toolName, done = false }) {
  const label = TOOL_LABELS[toolName] || `Checking ${toolName.replace(/_/g, " ")}`;

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-fit
      ${done ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}
    >
      {done ? (
        <span>✓</span>
      ) : (
        <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
      <span>{label}...</span>
    </div>
  );
}
```

---

### 13.7 New Component — `ChatMessage.jsx`

Renders a single message with markdown support and feedback buttons.

```jsx
// src/components/chat/ChatMessage.jsx
import { useState } from "react";
import aiChatService from "../../services/aiChatService";

// Simple markdown renderer — converts **bold**, `code`, ### headings, tables
function renderMarkdown(text) {
  if (!text) return "";

  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>')
    // Headings
    .replace(/^### (.*)/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.*)/gm, '<h2 class="font-semibold text-lg mt-4 mb-2">$1</h2>')
    // Line breaks
    .replace(/\n/g, "<br/>");
}

export default function ChatMessage({ message, isAdmin = false }) {
  const [feedback, setFeedback] = useState(null); // null | 1 | -1
  const isUser = message.role === "user";
  const isTyping = message.isTyping && !message.content;

  const handleFeedback = async (value) => {
    if (feedback !== null || !message.id) return;
    setFeedback(value);
    await aiChatService.submitFeedback(message.id, value);
  };

  // Tool call status messages (not user/assistant — internal)
  if (message.type === "tool_status") {
    return (
      <ToolCallIndicator toolName={message.tool} done={message.done} />
    );
  }

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? isAdmin
              ? "bg-blue-600 text-white"
              : "bg-black text-white"
            : isAdmin
              ? "bg-gray-800 text-gray-100"
              : "bg-gray-100 text-gray-800"
          }
        `}
      >
        {isTyping ? (
          // Typing indicator — three bouncing dots
          <div className="flex gap-1 items-center h-4">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
      </div>

      {/* Feedback buttons — only on completed assistant messages */}
      {!isUser && !isTyping && message.content && message.id && (
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => handleFeedback(1)}
            title="Helpful"
            className={`text-xs px-2 py-0.5 rounded transition
              ${feedback === 1
                ? "bg-green-100 text-green-700"
                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
              }`}
          >
            👍
          </button>
          <button
            onClick={() => handleFeedback(-1)}
            title="Not helpful"
            className={`text-xs px-2 py-0.5 rounded transition
              ${feedback === -1
                ? "bg-red-100 text-red-700"
                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              }`}
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 13.8 New Component — `SuggestedQuestions.jsx`

```jsx
// src/components/chat/SuggestedQuestions.jsx

export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="space-y-2 mt-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100
                     border border-gray-200 rounded-xl px-3 py-2 transition text-gray-600"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
```

---

### 13.9 Updated `ProductAIChat.jsx` — Full Rewrite

**Changes from v1:**
- Uses `useChatSession` hook for session management
- Parses `tool_status` events and shows `ToolCallIndicator`
- Uses `ChatMessage` component (markdown + feedback)
- Proper error handling with retry button
- Mobile keyboard fix (`100dvh`)
- Input validation before sending
- "New conversation" button to reset session

```jsx
// src/components/ProductAIChat.jsx
import { useState, useCallback } from "react";
import aiChatService from "../services/aiChatService";
import { useChatSession } from "../hooks/useChatSession";
import { useAutoScroll } from "../hooks/useAutoScroll";
import ChatMessage from "./chat/ChatMessage";
import SuggestedQuestions from "./chat/SuggestedQuestions";
import ToolCallIndicator from "./chat/ToolCallIndicator";

const PRODUCT_SUGGESTIONS = [
  "What material is this made of?",
  "Is size L available?",
  "Is this in stock?",
  "Are there similar products under ₹1000?",
  "What is the return policy for this?",
];

const isValidQuery = (q) => q.trim().length >= 3 && /[a-zA-Z0-9\u0900-\u097F]/.test(q);

export default function ProductAIChat({ productId, productName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [toolSteps, setToolSteps] = useState([]); // active tool call indicators
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { sessionId, resetSession } = useChatSession("product", productId);
  const bottomRef = useAutoScroll(messages);

  const handleOpen = () => {
    setOpen(true);
    setMessages([]); // Fresh UI on open; history is on server via sessionId
  };

  const handleReset = () => {
    const newSessionId = resetSession();
    setMessages([]);
    setToolSteps([]);
    setError(null);
  };

  const sendMessage = useCallback(async (queryOverride) => {
    const query = queryOverride || input;
    if (!isValidQuery(query) || loading) return;

    const userMsg = { role: "user", content: query };
    const assistantMsg = { role: "assistant", content: "", isTyping: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    setToolSteps([]);

    try {
      // Build history from current messages (last 6)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      for await (const event of aiChatService.streamProductChat(query, productId, sessionId, history)) {

        // ── Tool call status event ──
        if (event.type === "tool_status") {
          setToolSteps((prev) => {
            const exists = prev.find((s) => s.tool === event.tool);
            if (exists) {
              // Mark as done
              return prev.map((s) =>
                s.tool === event.tool ? { ...s, done: true } : s
              );
            }
            return [...prev, { tool: event.tool, done: false }];
          });
          continue;
        }

        // ── Text delta ──
        if (event.type === "delta") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + event.content,
              isTyping: false,
            };
            return updated;
          });
          continue;
        }

        // ── Stream complete — attach message_id for feedback ──
        if (event.type === "done" && event.message_id) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              id: event.message_id,
            };
            return updated;
          });
          setToolSteps([]); // Clear tool steps once answer is shown
          continue;
        }

        // ── Error event ──
        if (event.type === "error") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: event.message,
              isTyping: false,
              isError: true,
            };
            return updated;
          });
          setError(true);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "Connection lost. Please try again.",
            isTyping: false,
            isError: true,
          };
          return updated;
        });
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, productId, sessionId]);

  return (
    <>
      {/* ── Trigger button on product page ── */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 border border-black
                   text-black rounded-lg hover:bg-black hover:text-white transition text-sm"
      >
        <span>✨</span> Ask AI about this product
      </button>

      {/* ── Chat modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center
                        bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white w-full md:w-[480px] md:rounded-2xl flex flex-col shadow-2xl"
            style={{ height: "100dvh", maxHeight: "640px" }}  // ← dvh fixes mobile keyboard
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div>
                <p className="font-semibold text-sm">✨ AI Assistant</p>
                <p className="text-xs text-gray-400 truncate max-w-[220px]">{productName}</p>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleReset}
                    title="New conversation"
                    className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    New chat
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-black text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center mt-6">
                  <p className="text-2xl mb-2">✨</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Ask me anything about this product!
                  </p>
                  <SuggestedQuestions
                    questions={PRODUCT_SUGGESTIONS}
                    onSelect={sendMessage}
                  />
                </div>
              )}

              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} isAdmin={false} />
              ))}

              {/* Active tool call steps */}
              {toolSteps.length > 0 && (
                <div className="space-y-1 pl-1">
                  {toolSteps.map((step) => (
                    <ToolCallIndicator
                      key={step.tool}
                      toolName={step.tool}
                      done={step.done}
                    />
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 border-t shrink-0 flex gap-2"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about this product..."
                className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none
                           focus:ring-2 focus:ring-black disabled:opacity-50"
                disabled={loading}
                autoFocus
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !isValidQuery(input)}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm
                           disabled:opacity-40 hover:bg-gray-800 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent
                                   rounded-full animate-spin block" />
                ) : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

### 13.10 Updated `ProductDetailPage.jsx` — Changes Only

Three things to add:

```jsx
// src/pages/ProductDetailPage.jsx

// 1. Import
import ProductAIChat from "../components/ProductAIChat";
import recommendationService from "../services/recommendationService";

// 2. Auto-track product view on mount (for recommendation system)
useEffect(() => {
  if (product?.slug && isAuthenticated) {
    recommendationService.trackView(product.slug).catch(() => {});
  }
}, [product?.slug, isAuthenticated]);

// 3. Place the AI button below the Add to Cart button
// ── In JSX ──
<div className="flex flex-col gap-3 mt-4">
  <button className="... add-to-cart-button ...">Add to Cart</button>

  {/* AI Chat button — only for authenticated users */}
  {isAuthenticated && (
    <ProductAIChat productId={product.id} productName={product.name} />
  )}
</div>
```

---

### 13.11 Updated `AdminAIChat.jsx` — Full Rewrite

**Changes from v1:**
- Tool call steps visible as agent works
- Markdown + table rendering in responses
- Feedback buttons on every response
- Auto-blur after 30s inactivity (sensitive data protection)
- Session management
- Audit notice banner
- "Clear chat" button

```jsx
// src/components/admin/AdminAIChat.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import aiChatService from "../../services/aiChatService";
import { useChatSession } from "../../hooks/useChatSession";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import ChatMessage from "../chat/ChatMessage";
import SuggestedQuestions from "../chat/SuggestedQuestions";
import ToolCallIndicator from "../chat/ToolCallIndicator";

const ADMIN_SUGGESTIONS = [
  "What is our revenue this month?",
  "Which products are low on stock?",
  "How many new users signed up this week?",
  "Show our top 5 selling products",
  "How many orders are pending payment?",
  "What's the return rate this month?",
  "Which category is performing best?",
];

const isValidQuery = (q) => q.trim().length >= 3;
const BLUR_AFTER = 30_000; // 30 seconds

export default function AdminAIChat() {
  const [messages, setMessages] = useState([]);
  const [toolSteps, setToolSteps] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(false);

  const { sessionId, resetSession } = useChatSession("admin");
  const bottomRef = useAutoScroll(messages);
  const blurTimer = useRef(null);

  // ── Auto-blur on inactivity ──
  const resetBlurTimer = useCallback(() => {
    setBlurred(false);
    clearTimeout(blurTimer.current);
    blurTimer.current = setTimeout(() => setBlurred(true), BLUR_AFTER);
  }, []);

  useEffect(() => {
    resetBlurTimer();
    return () => clearTimeout(blurTimer.current);
  }, []);

  const sendMessage = useCallback(async (queryOverride) => {
    const query = queryOverride || input;
    if (!isValidQuery(query) || loading) return;

    resetBlurTimer();

    const history = messages.slice(-6).map((m) => ({
      role: m.role, content: m.content,
    }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", isTyping: true },
    ]);
    setInput("");
    setLoading(true);
    setToolSteps([]);

    try {
      for await (const event of aiChatService.streamAdminChat(query, sessionId, history)) {

        if (event.type === "tool_status") {
          setToolSteps((prev) => {
            const exists = prev.find((s) => s.tool === event.tool);
            if (exists) return prev.map((s) => s.tool === event.tool ? { ...s, done: true } : s);
            return [...prev, { tool: event.tool, done: false }];
          });
          continue;
        }

        if (event.type === "delta") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              content: last.content + event.content,
              isTyping: false,
            };
            return updated;
          });
          continue;
        }

        if (event.type === "done" && event.message_id) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              id: event.message_id,
            };
            return updated;
          });
          setToolSteps([]);
          continue;
        }

        if (event.type === "error") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: event.message,
              isTyping: false,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "Connection lost. Please try again.",
            isTyping: false,
          };
          return updated;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionId, resetBlurTimer]);

  return (
    <div
      className="flex flex-col h-full bg-gray-950 text-white relative"
      onMouseMove={resetBlurTimer}
      onKeyDown={resetBlurTimer}
    >
      {/* ── Blur overlay ── */}
      {blurred && (
        <div
          className="absolute inset-0 z-20 backdrop-blur-md bg-gray-900/70
                     flex items-center justify-center cursor-pointer"
          onClick={resetBlurTimer}
        >
          <div className="text-center">
            <p className="text-white text-sm font-medium">Screen locked</p>
            <p className="text-gray-400 text-xs mt-1">Click to view sensitive data</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-semibold text-sm">✨ AI Business Assistant</h2>
          <p className="text-xs text-gray-500">Live data · Queries are logged</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { resetSession(); setMessages([]); setToolSteps([]); }}
            className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* ── Audit notice — shown once ── */}
      {messages.length === 0 && (
        <div className="mx-4 mt-3 px-3 py-2 bg-yellow-900/30 border border-yellow-700/40
                        rounded-lg text-xs text-yellow-400 shrink-0">
          ⚠️ All queries and responses are logged for compliance.
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="mt-4">
            <p className="text-gray-500 text-xs mb-3">Suggested questions:</p>
            <SuggestedQuestions
              questions={ADMIN_SUGGESTIONS}
              onSelect={sendMessage}
            />
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} isAdmin={true} />
        ))}

        {/* Tool steps — shown while agent is working */}
        {toolSteps.length > 0 && (
          <div className="space-y-1 pl-1">
            {toolSteps.map((step) => (
              <ToolCallIndicator
                key={step.tool}
                toolName={step.tool}
                done={step.done}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-3 border-t border-gray-800 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about revenue, orders, stock..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2
                     text-sm text-white outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 placeholder-gray-500"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !isValidQuery(input)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl
                     text-sm disabled:opacity-40 transition min-w-[60px] flex items-center justify-center"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "Ask"}
        </button>
      </div>
    </div>
  );
}
```

---

### 13.12 New Page — `AdminAIAssistantPage.jsx`

Full-page view for the Admin AI, wired as a route.

```jsx
// src/pages/admin/AdminAIAssistantPage.jsx
import AdminAIChat from "../../components/admin/AdminAIChat";

export default function AdminAIAssistantPage() {
  return (
    <div className="h-[calc(100vh-64px)]">  {/* Full height minus topbar */}
      <AdminAIChat />
    </div>
  );
}
```

---

### 13.13 `AdminLayout.jsx` — Changes Only

Add the AI Assistant route and sidebar nav item:

```jsx
// src/components/admin/AdminLayout.jsx

// 1. Import
import AdminAIAssistantPage from "../../pages/admin/AdminAIAssistantPage";

// 2. Add to sidebar nav items array:
const navItems = [
  { icon: "📊", label: "Dashboard",   to: "/admin-panel" },
  { icon: "👕", label: "Products",    to: "/admin-panel/products" },
  { icon: "📦", label: "Orders",      to: "/admin-panel/orders" },
  { icon: "↩️", label: "Returns",     to: "/admin-panel/returns" },
  { icon: "🎟️", label: "Coupons",    to: "/admin-panel/coupons" },
  { icon: "👤", label: "Users",       to: "/admin-panel/users" },
  // ↓ NEW
  { icon: "✨", label: "AI Assistant", to: "/admin-panel/ai", highlight: true },
];

// 3. Add to Routes:
<Route path="/admin-panel/ai" element={<AdminAIAssistantPage />} />

// 4. Style the AI nav item differently (highlight it):
{navItems.map((item) => (
  <NavLink
    key={item.to}
    to={item.to}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition
      ${isActive ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}
      ${item.highlight ? "border border-blue-500/30 text-blue-400" : ""}
    `}
  >
    <span>{item.icon}</span>
    <span>{item.label}</span>
    {item.highlight && (
      <span className="ml-auto text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
        NEW
      </span>
    )}
  </NavLink>
))}
```

---

### 13.14 New Django Endpoint — Chat History

The frontend's `useChatSession` hook loads previous messages on open. This requires a new Django endpoint:

```python
# apps/ai_chat/views.py — add this view

class ChatHistoryAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Returns last 20 messages for a session — owned by this user only."""
        # This queries the chat_messages table via RAG service
        # Or directly from PostgreSQL if you prefer
        import httpx
        response = httpx.get(
            f"{settings.RAG_SERVICE_URL}/history/{session_id}/",
            headers={
                "x-service-token": settings.RAG_SERVICE_SECRET,
                "x-user-id": str(request.user.id),
            },
            timeout=10
        )
        if response.status_code == 200:
            return Response(response.json())
        return Response({"messages": []})

# apps/ai_chat/urls.py — add:
path("history/<uuid:session_id>/", ChatHistoryAPI.as_view()),

# apps/ai_chat/views.py — add feedback proxy:
class FeedbackAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import httpx
        httpx.post(
            f"{settings.RAG_SERVICE_URL}/feedback/",
            json={
                "message_id": request.data.get("message_id"),
                "feedback": request.data.get("feedback"),
                "user_id": str(request.user.id),
            },
            headers={"x-service-token": settings.RAG_SERVICE_SECRET},
            timeout=5
        )
        return Response({"saved": True})

# apps/ai_chat/urls.py — add:
path("feedback/", FeedbackAPI.as_view()),
```

---

### 13.15 Updated Django URLs Summary

```python
# apps/ai_chat/urls.py — complete file

from django.urls import path
from .views import ProductChatAPI, AdminChatAPI, ChatHistoryAPI, FeedbackAPI

urlpatterns = [
    path("product-chat/",           ProductChatAPI.as_view()),
    path("admin-chat/",             AdminChatAPI.as_view()),
    path("history/<uuid:session_id>/", ChatHistoryAPI.as_view()),  # NEW
    path("feedback/",               FeedbackAPI.as_view()),         # NEW
]
```

---

### 13.16 npm Packages to Install

```bash
# In frontend/ directory

npm install uuid                    # For session ID generation in useChatSession
npm install react-router-dom        # Already installed — verify v6+
```

No other new packages needed. Markdown rendering is done manually in `ChatMessage.jsx` to avoid a heavy dependency.

---

### 13.17 Frontend Changes Summary

| File | Status | What Changed |
|---|---|---|
| `src/services/aiChatService.js` | ✅ Full rewrite | SSE parser, tool events, session ID, feedback, token refresh |
| `src/hooks/useChatSession.js` | ✅ New | Session ID per product/admin, sessionStorage, reset |
| `src/hooks/useAutoScroll.js` | ✅ New | Auto-scroll ref hook |
| `src/components/chat/ChatMessage.jsx` | ✅ New | Markdown, feedback buttons, typing indicator |
| `src/components/chat/ToolCallIndicator.jsx` | ✅ New | Agent thinking step display |
| `src/components/chat/SuggestedQuestions.jsx` | ✅ New | Clickable suggestion chips |
| `src/components/ProductAIChat.jsx` | ✅ Full rewrite | Tool steps, feedback, session, mobile fix, error handling |
| `src/components/admin/AdminAIChat.jsx` | ✅ Full rewrite | Tool steps, blur, audit notice, session, feedback |
| `src/pages/ProductDetailPage.jsx` | ✅ Small change | Add AI button + view tracking |
| `src/pages/admin/AdminAIAssistantPage.jsx` | ✅ New | Full-page wrapper |
| `src/components/admin/AdminLayout.jsx` | ✅ Small change | AI tab in sidebar + route |
| `apps/ai_chat/views.py` (Django) | ✅ Updated | Add history + feedback proxy endpoints |
| `apps/ai_chat/urls.py` (Django) | ✅ Updated | Register new endpoints |

---

*End of document — v2.0 · April 2026*
