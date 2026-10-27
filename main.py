from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="LinguaAI Translator")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Lazy-init client
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set in .env")
        _client = Groq(api_key=api_key)
    return _client


LANGUAGES = [
    "English", "Spanish", "French", "German", "Portuguese", "Italian",
    "Dutch", "Russian", "Japanese", "Korean", "Chinese (Simplified)",
    "Chinese (Traditional)", "Arabic", "Hindi", "Bengali", "Turkish",
    "Polish", "Swedish", "Greek", "Hebrew", "Thai", "Vietnamese",
    "Indonesian", "Urdu",
]


class TranslateRequest(BaseModel):
    text: str
    src_lang: str   # "auto" or a language name
    tgt_lang: str


class TranslateResponse(BaseModel):
    translated: str
    detected_lang: str | None = None
    src_lang: str
    tgt_lang: str
    char_count: int


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "languages": LANGUAGES}
    )


@app.post("/translate", response_model=TranslateResponse)
async def translate(body: TranslateRequest):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(text) > 3000:
        raise HTTPException(status_code=400, detail="Text too long (max 3000 chars).")

    source_desc = (
        "the source language (detect it automatically)"
        if body.src_lang == "auto"
        else body.src_lang
    )

    prompt = f"""You are a professional translator. Translate the following text from {source_desc} to {body.tgt_lang}.

Rules:
- Return ONLY the translated text, nothing else
- Preserve formatting, punctuation, and tone
- If source language was auto-detected, prepend exactly one line: [Detected: LANGUAGE_NAME] then a newline, then the translation
- Do not add explanations, notes, or quotation marks

Text to translate:
{text}"""

    try:
        client = get_client()
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2048,
        )
        result = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

    detected_lang = None
    if result.startswith("[Detected:"):
        import re
        match = re.match(r"^\[Detected: (.+?)\]", result)
        if match:
            detected_lang = match.group(1)
            result = re.sub(r"^\[Detected: .+?\]\n?", "", result).strip()

    return TranslateResponse(
        translated=result,
        detected_lang=detected_lang,
        src_lang=body.src_lang,
        tgt_lang=body.tgt_lang,
        char_count=len(result),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "model": "llama-3.3-70b-versatile"}
