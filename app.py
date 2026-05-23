'1.Imports'

from pathlib import Path

# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity 

'2.Load Dataset'
BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / 'career_updated.json', 'r') as file:
    data =json.load(file)

#print(data[1])

'3.'

documents =[]

for item in data:
    keywords_text = " ".join(item.get('keywords', [])) if isinstance(item.get('keywords'), list) else ""
    text = f"{item.get('career', '')} {item.get('skills', '')} {item.get('description', '')} {item.get('stream', '')} {item.get('degree', '')} {keywords_text}"
    documents.append(text)


'4.'

vectorizer = TfidfVectorizer(stop_words='english')
vectors = vectorizer.fit_transform(documents)


'5.'

def get_results(query):
    query_vec = vectorizer.transform([query])
    similarity = cosine_similarity(query_vec,vectors)
    
    top_indices = similarity.argsort()[0][-3:][::-1]
    results = []
    for i in top_indices:
        if similarity[0][i] > 0.1:
            results.append(data[i])

    return results

'6.'

def generate_response(results):
    output = ""

    for item in results:
        output += f"""
Career: {item['career']}
Stream: {item['stream']}
Skills: {item['skills']}
Exams: {item['exams']}
Degree: {item['degree']}
Salary: {item['salary']}
Description: {item['description']}
"""

    return output


'7.'

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

#new
@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/health')
def health():
    return jsonify({"status": "career advisor API is running"})

@app.route('/query', methods=['POST'])
def query():
    payload = request.get_json(silent=True) or {}
    user_input = payload.get('query', '').strip()

    if not user_input:
        return jsonify({"error": "Please enter a career interest or skill."}), 400
    
    results = get_results(user_input)
    
    if not results:
        return jsonify({"response": "No matching careers found. Try different keywords."})
        
    response = generate_response(results)
    
    return jsonify({"response": response})


'8.'

if __name__ == '__main__':
    app.run(debug=True)
    

         
    
    
    
