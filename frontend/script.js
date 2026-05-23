let isVoiceQuery = false;

function sendQuery() {
    const apiBase = window.location.protocol === "file:" ? "http://127.0.0.1:5000" : "";
    const query = document.getElementById("query").value;
    if (!query.trim()) return;

    const btn = document.getElementById("searchBtn");
    const loading = document.getElementById("loading");
    const resultsDiv = document.getElementById("results");

    btn.disabled = true;
    btn.innerText = "Searching...";
    loading.style.display = "block";
    resultsDiv.innerHTML = "";

    fetch(`${apiBase}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query })
    })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "The server could not process this request.");
            }
            return data;
        })
        .then(data => {
            loading.style.display = "none";
            btn.disabled = false;
            btn.innerText = "Discover";
            renderResults(data.response);
            if (isVoiceQuery) {
                speakResults(data.response);
                isVoiceQuery = false;
            }
        })
        .catch(error => {
            loading.style.display = "none";
            btn.disabled = false;
            btn.innerText = "Discover";
            resultsDiv.innerHTML = `
                <div class="result-card error-card">
                    <strong>Connection Error:</strong> ${error.message || "Could not connect to the server. Start Flask with python app.py and open http://127.0.0.1:5000."}
                </div>
            `;
            console.error("Fetch error:", error);
        });
}

// Parse the raw text response from Python and render beautiful cards
function renderResults(responseText) {
    const resultsDiv = document.getElementById("results");

    // Split by "Career:" which is how the Python backend structures each result
    const blocks = responseText.split(/Career:/g).filter(b => b.trim().length > 0);

    if (blocks.length === 0) {
        resultsDiv.innerHTML = `<div class="result-card"><pre>${responseText}</pre></div>`;
        return;
    }

    blocks.forEach((block, index) => {
        const lines = block.split('\n').filter(l => l.trim().length > 0);

        let html = `<div class="result-card" style="animation-delay: ${index * 0.15}s">`;

        let title = "";
        if (lines.length > 0) {
            title = lines.shift().trim();
            html += `<div class="career-title">${title}</div>`;
        }

        lines.forEach(line => {
            const colonIdx = line.indexOf(':');
            if (colonIdx > -1) {
                const label = line.substring(0, colonIdx).trim();
                const val = line.substring(colonIdx + 1).trim();
                html += `<div class="field"><span class="field-label">${label}</span><span class="field-value">${val}</span></div>`;
            } else {
                html += `<div class="field"><span class="field-value">${line}</span></div>`;
            }
        });

        if (title) {
            html += `<div style="margin-top: 1.5rem;"><button class="more-info-btn" onclick="window.open('https://www.google.com/search?q=${encodeURIComponent(title + " career details requirements salary")}', '_blank')">For more information click it</button></div>`;
        }

        html += `</div>`;
        resultsDiv.innerHTML += html;
    });
}

// Voice Assistant Logic
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("query").value = transcript;
        isVoiceQuery = true;
        sendQuery();
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error", event.error);
        stopVoiceRecognition();
    };

    recognition.onend = function () {
        stopVoiceRecognition();
    };
} else {
    console.warn("Speech Recognition API is not supported in this browser.");
}

function startVoiceRecognition() {
    if (!recognition) {
        alert("Voice recognition is not supported in your browser.");
        return;
    }
    const micBtn = document.getElementById("micBtn");
    if (micBtn.classList.contains("recording")) {
        recognition.stop();
        stopVoiceRecognition();
    } else {
        recognition.start();
        micBtn.classList.add("recording");
    }
}

function stopVoiceRecognition() {
    const micBtn = document.getElementById("micBtn");
    if (micBtn) {
        micBtn.classList.remove("recording");
    }
}

function speakResults(responseText) {
    if (!('speechSynthesis' in window)) return;

    const blocks = responseText.split(/Career:/g).filter(b => b.trim().length > 0);
    let message = "";

    if (blocks.length === 0) {
        message = "I'm sorry, I couldn't find any matching careers.";
    } else {
        const firstBlockLines = blocks[0].split('\n').filter(l => l.trim().length > 0);
        if (firstBlockLines.length > 0) {
            const topTitle = firstBlockLines[0].trim();
            message = `I found ${blocks.length} career options. The top recommendation is ${topTitle}.`;
        } else {
            message = `I found ${blocks.length} career options for you.`;
        }
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
}
