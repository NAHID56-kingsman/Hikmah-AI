import sys
from safety.distress import check_distress, RiskLevel, support_response
from rag.retrieve import load_corpus, build_index, retrieve as tfidf_retrieve


def detect_language_simple(text: str) -> str:
    return "bn" if any("\u0980" <= ch <= "\u09FF" for ch in text) else "en"


def answer(user_message: str, dry_run: bool = False) -> str:
    distress = check_distress(user_message)
    lang = detect_language_simple(user_message)

    if distress.level == RiskLevel.CRISIS:
        return support_response(lang)

    from nlp.translate import prepare_query
    prepared = prepare_query(user_message)
    query_for_retrieval = prepared["english_text"]


    corpus = load_corpus()
    vectorizer, matrix = build_index(corpus)
    results = tfidf_retrieve(query_for_retrieval, corpus, vectorizer, matrix, k=2)
    verses = [v for v, score in results]

    if not verses:
        return "I couldn't find a matching verse for this yet."

    if dry_run:
        return f"Would retrieve: {[v['ref'] for v in verses]}"

    from llm.generate import generate_response
    return generate_response(user_message, verses, lang=lang)


if __name__ == "__main__":
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]
    message = " ".join(args) or "I lost my job and I'm scared about money"
    print(answer(message, dry_run=dry_run))