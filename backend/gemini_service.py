import os
import json
import urllib.request
import urllib.error
from config import GEMINI_API_KEY, IS_VALID_KEY

CANDIDATE_MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.6-flash"]

def call_gemini(prompt: str, system_instruction: str = None, temperature: float = 0.7) -> str:
    """
    Directly invokes Gemini Flash with the user's API key.
    Tries resilient fallback models if quota/429 occurs.
    """
    if not IS_VALID_KEY or not GEMINI_API_KEY:
        return None

    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 600,
            }
        }

        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')[:150]
            print(f"[Gemini API Warning] Model {model_name} HTTP {e.code}: {err_msg}")
            if e.code == 429:
                continue # Try next candidate model
        except Exception as ex:
            print(f"[Gemini Service Error with {model_name}] {ex}")
            continue

    return None


    return None
