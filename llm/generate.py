"""
Generation step using Gemini instead of Claude. Same generate_response()
signature as before, so pipeline.py calls this exactly the same way.

Needs GEMINI_API_KEY set in your environment (free tier, from aistudio.google.com).
"""
from google import genai
from google.genai import types

SYSTEM_PROMPT = """You are a compassionate companion that helps people reflect \
on their situation through Quranic verses. You will be given ONE OR MORE \
retrieved verses (with Arabic text, English translation, Bangla translation, \
and Surah:Ayah reference) and a person's message describing something they're \
going through.

Hard rules:
1. Only use the verse(s) you were given. Never cite or reference a verse that \
wasn't provided to you, even if you recall one that seems more fitting.
2. Always cite the Surah name and Surah:Ayah number when presenting a verse.
3. Structurally separate two things: (a) the verse itself, presented as-is, \
and (b) your own reflection on how it may relate to their situation. Never \
blend these into one voice - the person should always be able to tell which \
words are the Quran's and which are your commentary.
4. Your reflection is offered gently, as one possible angle - not as a \
definitive religious ruling or the only valid interpretation.
5. Explicitly note, at least once, that you are not a replacement for a \
qualified scholar, and that they're welcome to explore this further with one.
6. Respond in the same language the person's message was written in \
(English or Bangla). If responding in Bangla, use the Bangla translation \
field for the verse text and write your reflection in Bangla too.
7. Keep your reflection warm and concise - a few sentences, not an essay.
"""

def generate_response(user_message: str, retrieved_verses: list[dict], lang: str = "en") -> str:
    verses_block = "\n\n".join(
        f"[{v['ref']}] {v.get('surah_name_translit', '')} ({v.get('surah_name_en', '')})\n"
        f"Arabic: {v['arabic']}\n"
        f"English: {v['english']}\n"
        f"Bangla: {v['bangla']}"
        for v in retrieved_verses
    )

    user_prompt = (
        f"Person's message ({'Bangla' if lang == 'bn' else 'English'}):\n{user_message}\n\n"
        f"Retrieved verse(s):\n{verses_block}\n\n"
        f"Respond in {'Bangla' if lang == 'bn' else 'English'}."
    )

    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=1500,          # headroom for Bengali's higher token cost
            thinking_config=types.ThinkingConfig(thinking_budget=0),  # off - not needed here
        ),
    )
    return response.text


if __name__ == "__main__":
    example_verses = [{
        "ref": "65:3",
        "surah_name_translit": "At-Talaq",
        "surah_name_en": "The Divorce",
        "arabic": "وَيَرۡزُقۡهُ مِنۡ حَيۡثُ لَا يَحۡتَسِبُ",
        "english": "And will provide for him from where he does not expect.",
        "bangla": "এবং তাকে তার ধারণাতীত জায়গা থেকে রিযিক দেবেন।",
    }]
    print(generate_response(
        "I just lost my job and I don't know how I'll support my family.",
        example_verses,
        lang="en",
    ))