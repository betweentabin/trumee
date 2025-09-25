import os
import json
from typing import Optional, Dict, Any

import requests


GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


class GeminiError(Exception):
    pass


def generate_text(prompt: str, api_key: Optional[str] = None, generation_config: Optional[Dict[str, Any]] = None) -> str:
    """Call Google Gemini API and return first candidate text.

    Note: Keep server-side usage. Do not expose API key to clients.
    """
    key = api_key or os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise GeminiError("GEMINI_API_KEY is not set")

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": generation_config or {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        },
    }

    try:
        resp = requests.post(f"{GEMINI_ENDPOINT}?key={key}", json=payload, timeout=20)
    except requests.RequestException as e:
        raise GeminiError(f"Gemini request failed: {e}")

    if not resp.ok:
        text = resp.text[:200]
        raise GeminiError(f"Gemini API error: {resp.status_code} {text}")

    data = resp.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )
    if not text:
        # Try alternative shapes
        cand = data.get("candidates", [{}])[0]
        if "output" in cand:
            text = cand.get("output", "")
        else:
            parts = cand.get("content", {}).get("parts", [])
            text = "\n".join([p.get("text", "") for p in parts if p.get("text")])
    if not text:
        raise GeminiError("No content returned from Gemini")
    return text

