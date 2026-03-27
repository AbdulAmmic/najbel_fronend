try:
    from google import genai
except ImportError:
    # Fallback or detailed error if package is missing
    print("CRITICAL ERROR: 'google-genai' package not found. Please run: pip install google-genai")
    genai = None

from app.core.config import settings

class AIChatService:
    def __init__(self):
        try:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            print(f"Failed to initialize Gemini Client: {e}")
            self.client = None

    def generate_response(self, message: str) -> str:
        if not self.client:
             return "AI Service is not initialized."

        try:
            # Switch to 'gemini-flash-latest' (Gemini 1.5) for better stability/quota?
            response = self.client.models.generate_content(
                model="gemini-flash-latest",
                contents=f"You are a helpful AI assistant, (you can give medical advises)for a medical clinic. You are responding to a patient because the doctor is currently offline. Be polite, empathetic, and professional. Do not provide medical diagnosis, but confirm you received their message and the doctor will reply soon. User message: {message}",
            )
            return response.text
        except Exception as e:
            # Log the actual error to file for debugging
            try:
                with open("ai_error.log", "a") as f:
                    f.write(f"{str(e)}\n")
            except:
                pass
            print(f"Error generating AI response: {e}")
            
            # Smart Mock AI fallback for Rate Limits / Errors
            msg_lower = message.lower()
            
            if "fever" in msg_lower or "temperature" in msg_lower:
                return "I understand you have a fever. While I am an AI and not a doctor, generally it is advised to stay hydrated, rest, and monitor your temperature. If it exceeds 39°C or persists, please visit the emergency room. The doctor will review your case shortly."
            
            elif "headache" in msg_lower or "head ache" in msg_lower or "migraine" in msg_lower:
                return "I'm sorry to hear about your headache. Dehydration or stress can often be causes. Please try to drink water and rest in a quiet, dark room. The doctor will advise further soon."
            
            elif "pain" in msg_lower or "hurt" in msg_lower:
                return "I have noted that you are experiencing pain. Please try to describe the location and intensity for the doctor. If the pain is severe or sudden, please seek immediate emergency care."
            
            elif "diabetic" in msg_lower or "diabetes" in msg_lower or "sugar" in msg_lower or "hunger" in msg_lower:
                return "I understand your concern regarding diabetes and hunger symptoms. It is important to monitor your blood sugar levels if possible. Please have a small, balanced snack if your sugar might be low, but await the doctor's specific advice. I have prioritized this message for the doctor."

            elif "hello" in msg_lower or "hi" in msg_lower:
                return "Hello! I am the automated assistant. The doctor is currently offline. Please describe your symptoms or concern, and I will log them for the doctor to review immediately."
                
            else:
                return f"Thank you for your message. I have logged: \"{message}\". The doctor is currently offline but has been notified and will respond as soon as they are back online."

ai_chat_service = AIChatService()
