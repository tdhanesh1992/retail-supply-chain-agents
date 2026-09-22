import os
from pathlib import Path
from dotenv import load_dotenv

# Search paths for .env and .env.local in order of preference
CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent
DASHBOARD_DIR = WORKSPACE_ROOT / "supply-chain-dashboard"

search_locations = [
    CURRENT_DIR / ".env.local",
    CURRENT_DIR / ".env",
    DASHBOARD_DIR / ".env.local",
    DASHBOARD_DIR / ".env",
    WORKSPACE_ROOT / ".env.local",
    WORKSPACE_ROOT / ".env",
]

loaded_files = []
for env_path in search_locations:
    if env_path.exists():
        # load_dotenv with override=False so earlier files take precedence
        load_dotenv(dotenv_path=str(env_path), override=False)
        loaded_files.append(str(env_path))

# Check for GEMINI_API_KEY or GOOGLE_API_KEY
raw_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
raw_key = raw_key.strip()

# Check if the key is real or just a placeholder
IS_VALID_KEY = bool(raw_key and not raw_key.startswith("your_") and len(raw_key) > 15)
GEMINI_API_KEY = raw_key if IS_VALID_KEY else ""

print(f"[Config] Loaded env files: {loaded_files}")
print(f"[Config] Gemini API key configured: {'Yes (Live Gemini API enabled)' if IS_VALID_KEY else 'No (Simulated Multi-Agent mode active)'}")

# Configure genai if key is valid
genai_client = None
if IS_VALID_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        genai_client = genai
        print("[Config] Google Generative AI client initialized successfully.")
    except Exception as e:
        print(f"[Config] Failed to initialize Google Generative AI: {e}")
        IS_VALID_KEY = False

def get_gemini_model(model_name: str = "gemini-1.5-flash"):
    """
    Returns a GenerativeModel instance if API key is configured, else None.
    """
    if IS_VALID_KEY and genai_client:
        try:
            return genai_client.GenerativeModel(model_name)
        except Exception as e:
            print(f"[Config] Error creating model {model_name}: {e}")
            try:
                # Fallback model attempt
                return genai_client.GenerativeModel("gemini-1.5-pro")
            except Exception:
                return None
    return None
