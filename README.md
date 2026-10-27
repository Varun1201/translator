# 🌐 LinguaAI Translator

AI-powered translation app using **Groq (Llama 3.3 70B)** + **FastAPI** + **HTML/JS**.
Supports 24+ languages with auto-detection, translation history, and a dark UI.

---

## ⚡ Quick Start

### 1. Navigate to project

```
cd "C:\Users\Varun Gupta\OneDrive\Desktop\Practicals\lingua-ai-translator"
```

### 2. Create virtual environment

```
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

### 4. Set up API key

```
copy .env.example .env
notepad .env
```

Replace gsk_your_key_here with your real Groq key from https://console.groq.com/keys

### 5. Run the server

```
uvicorn main:app --reload --port 8000
```

Open → http://localhost:8000

---

## 🔁 Restart Commands (every time)

```
cd "C:\Users\Varun Gupta\OneDrive\Desktop\Practicals\lingua-ai-translator"
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

---

## 📁 Project Structure

```
lingua-ai-translator/
├── main.py                  ← FastAPI backend (translate endpoint)
├── requirements.txt
├── .env                     ← Your Groq API key (DO NOT commit)
├── .env.example             ← Template
├── .gitignore
├── README.md
├── templates/
│   └── index.html           ← Full UI (Jinja2 template)
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## 🌍 Supported Languages

24 languages + Auto-detect (Llama identifies the source language automatically).

---

## 🔌 API Endpoints

POST /translate
  Body:    { "text": "Hello", "src_lang": "auto", "tgt_lang": "Hindi" }
  Returns: { "translated": "नमस्ते", "detected_lang": "English", ... }

GET  /health  →  { "status": "ok", "model": "llama-3.3-70b-versatile" }

---

## 🚀 Portfolio Notes

Tech Stack: Python, FastAPI, Groq SDK, Llama 3.3 70B, HTML/CSS/JS, Jinja2

Key concepts: Groq API integration, prompt engineering for structured output,
auto language detection via LLM parsing, FastAPI + Pydantic validation,
lazy client initialization, vanilla JS with no dependencies.
