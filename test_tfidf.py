import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / 'career_updated.json', 'r') as file:
    data = json.load(file)

documents = []
for item in data:
    keywords_text = " ".join(item.get('keywords', [])) if isinstance(item.get('keywords'), list) else ""
    text = f"{item.get('career', '')} {item.get('skills', '')} {item.get('description', '')} {item.get('stream', '')} {item.get('degree', '')} {keywords_text}"
    documents.append(text)

vectorizer = TfidfVectorizer(stop_words='english')
vectors = vectorizer.fit_transform(documents)

def test_query(query):
    query_vec = vectorizer.transform([query])
    similarity = cosine_similarity(query_vec, vectors)
    print(f"Query: '{query}'")
    
    # Check max similarity
    print(f"Max similarity: {similarity.max()}")
    
    top_indices = similarity.argsort()[0][::-1]
    for idx in top_indices:
        if similarity[0][idx] > 0:
            print(f"Score: {similarity[0][idx]:.4f} - {data[idx]['career']}")
    print("-" * 40)

test_query("math careers")
test_query("medical jobs")
test_query("engineering")
test_query("data jobs")
test_query("something completely random that shouldn't match")
