
import json
import sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA = "data/quran_mvp_subset.json"


def load_corpus():
    with open(DATA, encoding="utf-8") as f:
        return json.load(f)


def build_index(corpus):
    import json
    with open("data/theme_keywords.json", encoding="utf-8") as f:
        theme_keywords = json.load(f)

    docs = []
    for v in corpus:
        theme_names = " ".join(t.replace('_', ' ') for t in v['themes'])
        extra_keywords = " ".join(
            kw for theme in v['themes'] for kw in theme_keywords.get(theme, [])
        )
        docs.append(f"{v['english']} {theme_names} {extra_keywords}")

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(docs)
    return vectorizer, matrix


def retrieve(query, corpus, vectorizer, matrix, k=3):
    query_vec = vectorizer.transform([query])
    scores = cosine_similarity(query_vec, matrix).flatten()
    top_idx = scores.argsort()[::-1][:k]
    return [(corpus[i], scores[i]) for i in top_idx if scores[i] > 0]


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) or "I feel anxious about the future"
    corpus = load_corpus()
    vectorizer, matrix = build_index(corpus)
    results = retrieve(query, corpus, vectorizer, matrix, k=3)

    print(f'Query: "{query}"')
    if not results:
        print("No matches — TF-IDF needs literal shared words with the verse "
              "text or theme labels. Try rephrasing, or see Step 8 (real "
              "embeddings) for genuine semantic matching.")
    for verse, score in results:
        print(f"\n[{verse['ref']}] score {score:.3f}")
        print(f"  Arabic : {verse['arabic']}")
        print(f"  English: {verse['english']}")
        print(f"  Bangla : {verse['bangla']}")