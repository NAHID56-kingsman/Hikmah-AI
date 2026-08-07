
import json

DATA = "data"

def load(name):
    with open(f"{DATA}/{name}", encoding="utf-8") as f:
        return json.load(f)


ar = load("quran_ar_raw.json")
en = load("quran_en_raw.json")
bn = load("quran_bn_raw.json")

merged = []
for surah_ar, surah_en, surah_bn in zip(ar, en, bn):
    assert surah_ar["id"] == surah_en["id"] == surah_bn["id"], "Surah id mismatch"
    surah_no = surah_ar["id"]

    for v_ar, v_en, v_bn in zip(surah_ar["verses"], surah_en["verses"], surah_bn["verses"]):
        assert v_ar["id"] == v_en["id"] == v_bn["id"], "Ayah id mismatch"
        merged.append({
            "surah_no": surah_no,
            "ayah_no": v_ar["id"],
            "ref": f"{surah_no}:{v_ar['id']}",
            "surah_name_ar": surah_ar["name"],
            "surah_name_translit": surah_ar["transliteration"],
            "surah_name_en": surah_en["translation"],
            "surah_name_bn": surah_bn["translation"],
            "arabic": v_ar["text"],
            "english": v_en["translation"],
            "bangla": v_bn["translation"],
            "themes": [],          # filled in next step
            "tafsir_en": None,
            "tafsir_bn": None,
        })

with open(f"{DATA}/quran_corpus.json", "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print(f"Merged {len(merged)} ayahs across {len(ar)} surahs.")