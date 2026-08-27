
import re
from dataclasses import dataclass
from enum import Enum


class RiskLevel(Enum):
    NONE = "none"
    ELEVATED = "elevated"
    CRISIS = "crisis"


CRISIS_PATTERNS_EN = [
    r"\b(kill myself|end my life|suicide|suicidal)\b",
    r"\b(want to die|don'?t want to (live|be alive))\b",
    r"\b(hurt myself|harm myself|self[- ]harm)\b",
]

CRISIS_PATTERNS_BN = [
    r"আত্মহত্যা",
    r"মরে যেতে চাই",
    r"নিজেকে আঘাত",
]

ELEVATED_PATTERNS_EN = [
    r"\b(hopeless|worthless|can'?t (take|handle) (it|this) anymore)\b",
    r"\b(so (alone|lonely)|nobody cares)\b",
]

ELEVATED_PATTERNS_BN = [
    r"হতাশ",
    r"আর পারছি না",
]


@dataclass
class DistressCheck:
    level: RiskLevel
    matched_pattern: str | None = None


def check_distress(text: str) -> DistressCheck:
    lowered = text.lower()
    for pattern in CRISIS_PATTERNS_EN:
        if re.search(pattern, lowered):
            return DistressCheck(RiskLevel.CRISIS, pattern)
    for pattern in CRISIS_PATTERNS_BN:
        if re.search(pattern, text):
            return DistressCheck(RiskLevel.CRISIS, pattern)
    for pattern in ELEVATED_PATTERNS_EN:
        if re.search(pattern, lowered):
            return DistressCheck(RiskLevel.ELEVATED, pattern)
    for pattern in ELEVATED_PATTERNS_BN:
        if re.search(pattern, text):
            return DistressCheck(RiskLevel.ELEVATED, pattern)
    return DistressCheck(RiskLevel.NONE)


SUPPORT_RESOURCES_EN = """I'm concerned about what you're going through. If you're
in immediate danger, please contact your local emergency number.
- Bangladesh: Kaan Pete Roi — 09666-777777
- International: befrienders.org lists crisis lines by country
You don't have to go through this alone."""

SUPPORT_RESOURCES_BN = """আপনি যে কঠিন সময়ের মধ্য দিয়ে যাচ্ছেন তা নিয়ে আমি চিন্তিত।
তাৎক্ষণিক বিপদে থাকলে স্থানীয় জরুরি নম্বরে যোগাযোগ করুন।
- বাংলাদেশ: কান পেতে রই — ০৯৬৬৬-৭৭৭৭৭৭"""


def support_response(lang: str) -> str:
    return SUPPORT_RESOURCES_BN if lang == "bn" else SUPPORT_RESOURCES_EN



