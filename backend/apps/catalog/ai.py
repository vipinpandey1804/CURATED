import json

import requests
from django.conf import settings


class CatalogAIError(Exception):
    """Base class for AI generation failures."""


class CatalogAIConfigurationError(CatalogAIError):
    """Raised when AI settings are missing or invalid."""


class CatalogAIGenerationError(CatalogAIError):
    """Raised when the upstream AI response cannot be used."""


class CatalogAIService:
    RESPONSES_URL = "https://api.openai.com/v1/responses"

    def __init__(self):
        self.api_key = getattr(settings, "OPENAI_API_KEY", "")
        self.text_model = getattr(settings, "OPENAI_TEXT_MODEL", "gpt-5.4-mini")
        self.image_model = getattr(settings, "OPENAI_IMAGE_MODEL", "gpt-5.4-mini")
        self.timeout = getattr(settings, "OPENAI_REQUEST_TIMEOUT", 60)

    def generate_description(self, context):
        prompt = (
            "Write a polished e-commerce product description for the product below.\n"
            "Keep it to 20-30 words, premium but clear, and avoid unsupported claims.\n"
            "If important specifics are unknown, stay tasteful and generic instead of inventing facts.\n\n"
            f"{self._format_context(context)}"
        )
        schema = {
            "type": "object",
            "properties": {
                "description": {"type": "string"},
            },
            "required": ["description"],
            "additionalProperties": False,
        }
        return self._generate_structured_json(prompt, schema, "product_description")

    def generate_details(self, context):
        prompt = (
            "Suggest short values for the product details fields below.\n"
            "Return concise, storefront-ready text.\n"
            "If a real fact is unknown, use a safe generic value instead of a specific claim.\n\n"
            f"{self._format_context(context)}"
        )
        schema = {
            "type": "object",
            "properties": {
                "material": {"type": "string"},
                "origin": {"type": "string"},
            },
            "required": ["material", "origin"],
            "additionalProperties": False,
        }
        return self._generate_structured_json(prompt, schema, "product_details")

    def generate_image(self, context):
        prompt = (
            f'Draw a premium e-commerce product hero image for "{context["name"]}". '
            "Use a clean studio setup, centered composition, soft natural shadows, and no text, logos, or watermark. "
            "Make it suitable for a fashion/commerce product gallery. "
            f"Use this context when helpful: {self._format_context(context)}"
        )
        payload = {
            "model": self.image_model,
            "input": prompt,
            "tools": [{"type": "image_generation"}],
            "tool_choice": {"type": "image_generation"},
        }
        data = self._post_responses(payload)

        image_call = None
        for item in data.get("output", []):
            if item.get("type") == "image_generation_call" and item.get("result"):
                image_call = item
                break

        if not image_call:
            raise CatalogAIGenerationError("AI did not return an image.")

        return {
            "image_base64": image_call["result"],
            "mime_type": "image/png",
            "alt_text": f'{context["name"]} product image',
            "revised_prompt": image_call.get("revised_prompt", prompt),
        }

    def _generate_structured_json(self, prompt, schema, schema_name):
        payload = {
            "model": self.text_model,
            "input": [
                {
                    "role": "system",
                    "content": (
                        "You write premium e-commerce product content for admin catalog tools. "
                        "Follow the schema exactly and keep the output practical for a merchant to review."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": schema_name,
                    "schema": schema,
                    "strict": True,
                }
            },
        }
        data = self._post_responses(payload)
        output_text = self._extract_text_output(data)
        try:
            return json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise CatalogAIGenerationError("AI returned invalid structured content.") from exc

    def _post_responses(self, payload):
        if not self.api_key:
            raise CatalogAIConfigurationError("OPENAI_API_KEY is not configured on the backend.")

        response = requests.post(
            self.RESPONSES_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=self.timeout,
        )

        if response.status_code >= 400:
            detail = ""
            try:
                detail = response.json().get("error", {}).get("message", "")
            except ValueError:
                detail = response.text
            raise CatalogAIGenerationError(detail or "OpenAI request failed.")

        return response.json()

    def _extract_text_output(self, data):
        for item in data.get("output", []):
            if item.get("type") != "message":
                continue
            for content in item.get("content", []):
                if content.get("type") == "output_text" and content.get("text"):
                    return content["text"]
        raise CatalogAIGenerationError("AI did not return any text content.")

    def _format_context(self, context):
        lines = [f'Product name: {context["name"]}']
        if context.get("category_name"):
            lines.append(f'Category: {context["category_name"]}')
        if context.get("description"):
            lines.append(f'Current description: {context["description"]}')
        if context.get("material"):
            lines.append(f'Material field: {context["material"]}')
        if context.get("origin"):
            lines.append(f'Origin field: {context["origin"]}')
        return "\n".join(lines)
