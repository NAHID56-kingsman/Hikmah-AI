
import json
import chromadb
from sentence_transformers import SentenceTransformer

DATA_MVP = "data/quran_mvp_subset.json"
COLLECTION_NAME = "quran_verses"
DB_PATH = "data/chroma_db"
MODEL_NAME = "BAAI/bge-m3"   # multilingual: handles Arabic/English/Bangla


def load_corpus(path=DATA_MVP):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_index(corpus_path=DATA_MVP):
    corpus = load_corpus(corpus_path)
    model = SentenceTransformer(MODEL_NAME)

    client = chromadb.PersistentClient(path=DB_PATH)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)

    documents = [
        f"{v['english']} " + " ".join(t.replace("_", " ") for t in v["themes"])
        for v in corpus
    ]
    embeddings = model.encode(documents, normalize_embeddings=True).tolist()
    ids = [v["ref"] for v in corpus]
    metadatas = [
        {"ref": v["ref"], "arabic": v["arabic"], "english": v["english"],
         "bangla": v["bangla"], "surah_name_translit": v["surah_name_translit"],
         "surah_name_en": v["surah_name_en"], "themes": ",".join(v["themes"])}
        for v in corpus
    ]
    collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    print(f"Indexed {len(corpus)} verses into Chroma at {DB_PATH}")


def retrieve(query: str, k: int = 3):
    model = SentenceTransformer(MODEL_NAME)
    client = chromadb.PersistentClient(path=DB_PATH)
    collection = client.get_collection(COLLECTION_NAME)

    query_embedding = model.encode([query], normalize_embeddings=True).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=k)

    return [
        {**meta, "score": 1 - dist}
        for meta, dist in zip(results["metadatas"][0], results["distances"][0])
    ]


if __name__ == "__main__":
    build_index()
    for m in retrieve("I lost my job and I'm scared about money"):
        print(m["ref"], round(m["score"], 3), m["english"][:80])