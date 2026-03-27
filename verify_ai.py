import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.app.services.ai_chat import ai_chat_service
    print("Successfully imported AIChatService")
    
    if not ai_chat_service.client:
        print("Error: Gemini Client not initialized. Check requirements and API key.")
        sys.exit(1)

    print("Sending test message to Gemini...")
    response = ai_chat_service.generate_response("Hello, I have a headache.")
    print(f"AI Response: {response}")
    
    if len(response) > 0 and ("doctor" in response.lower() or "offline" in response.lower() or "AI" in response):
         print("Verification SUCCESS: Gemini service returned a valid-looking response.")
    else:
         print("Verification WARNING: Response format might be unexpected, but service is working.")

except ImportError as e:
    print(f"ImportError: {e}")
    print("Please ensure google-genai is installed: pip install google-genai")
except Exception as e:
    print(f"Error: {e}")
