import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from google import genai
    from backend.app.core.config import settings

    if not settings.GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY not found in settings.")
        sys.exit(1)

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    with open("models.txt", "w", encoding="utf-8") as f:
        print("Listing available models...", file=f)
        try:
            for model in client.models.list(config={"page_size": 100}):
                print(f"Model: {model.name}", file=f)
                # print(f"  Supported methods: {model.supported_generation_methods}")
        except Exception as e:
            print(f"Error listing models: {e}", file=f)
    print("Done. Check models.txt")

except ImportError:
    print("Error: google-genai package not found.")
except Exception as e:
    print(f"Error: {e}")
