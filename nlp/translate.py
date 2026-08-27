"""
Translate Bangla queries to English before retrieval, and detect which
language the user is writing in. Uses Gemini (free tier) instead of Anthropic.
"""
from langdetect import detect, LangDetectException
from google import genai


def detect_language(text: str) -> str:
    """Returns 'bn' or 'en'. Falls back to 'en' on short/ambiguous text."""
    try:
        lang = detect(text)
    except LangDetectException:
        return "en"
    return "bn" if lang == "bn" else "en"


def translate_with_llm(text: str, target: str = "English") -> str:
    client = genai.Client()  # picks up GEMINI_API_KEY from environment
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=f"Translate this to {target}. Return ONLY the translation, "
                 f"nothing else:\n\n{text}",
    )
    return response.text.strip()


def prepare_query(text: str) -> dict:
    """Detects language, translates to English if needed. Returns both the
    original text (for responding back in the same language) and the
    English version (for retrieval)."""
    lang = detect_language(text)
    english_text = translate_with_llm(text) if lang == "bn" else text
    return {"original_text": text, "lang": lang, "english_text": english_text}


if __name__ == "__main__":
    samples = [
        "I lost my job and I'm scared about money",
        "আমি চাকরি হারিয়েছি, খুব দুশ্চিন্তায় আছি",
    ]
    for s in samples:
        result = prepare_query(s)
        print(f"{result['lang']} -> {result['english_text']}")