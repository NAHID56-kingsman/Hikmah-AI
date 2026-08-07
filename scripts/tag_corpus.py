"""
Apply theme tags onto the merged corpus, and produce a small MVP subset
(only tagged verses). Retrieval quality on a small, hand-checked set beats
broad-but-shallow coverage of the whole Quran for an MVP.
"""
import json
from collections import defaultdict

DATA = "data"

with open(f"{DATA}/quran_corpus.json", encoding="utf-8") as f:
    corpus = json.load(f)

with open(f"{DATA}/themes.json", encoding="utf-8") as f:
    themes = json.load(f)

by_ref = {v["ref"]: v for v in corpus}

ref_to_themes = defaultdict(list)
for theme, refs in themes.items():
    for ref in refs:
        ref_to_themes[ref].append(theme)

for ref, theme_list in ref_to_themes.items():
    if ref in by_ref:
        by_ref[ref]["themes"] = theme_list

with open(f"{DATA}/quran_corpus.json", "w", encoding="utf-8") as f:
    json.dump(corpus, f, ensure_ascii=False, indent=2)

mvp_subset = [v for v in corpus if v["themes"]]
with open(f"{DATA}/quran_mvp_subset.json", "w", encoding="utf-8") as f:
    json.dump(mvp_subset, f, ensure_ascii=False, indent=2)

print(f"Tagged {len(mvp_subset)} verses across {len(themes)} themes.")