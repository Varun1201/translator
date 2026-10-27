/* ── State ── */
let history = [];
let lastOutput = "";

/* ── DOM refs ── */
const inputEl      = document.getElementById("input-text");
const outputEl     = document.getElementById("output-area");
const srcLangEl    = document.getElementById("src-lang");
const tgtLangEl    = document.getElementById("tgt-lang");
const charCountEl  = document.getElementById("char-count");
const detectedEl   = document.getElementById("detected-badge");
const errorBox     = document.getElementById("error-box");
const translateBtn = document.getElementById("translate-btn");
const historySection = document.getElementById("history-section");
const historyItems   = document.getElementById("history-items");

/* ── Char counter ── */
inputEl.addEventListener("input", () => {
  charCountEl.textContent = `${inputEl.value.length} / 3000`;
});

/* ── Ctrl+Enter shortcut ── */
inputEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") translate();
});

/* ── Clear ── */
document.getElementById("clear-btn").addEventListener("click", () => {
  inputEl.value = "";
  charCountEl.textContent = "0 / 3000";
  setOutput("placeholder", "Translation will appear here…");
  detectedEl.textContent = "";
  hideError();
});

/* ── Paste ── */
document.getElementById("paste-btn").addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    inputEl.value = text.slice(0, 3000);
    charCountEl.textContent = `${inputEl.value.length} / 3000`;
  } catch {
    showError("Clipboard access denied — please paste manually (Ctrl+V).");
  }
});

/* ── Copy output ── */
document.getElementById("copy-btn").addEventListener("click", async () => {
  if (!lastOutput) return;
  try {
    await navigator.clipboard.writeText(lastOutput);
    const btn = document.getElementById("copy-btn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => (btn.textContent = "📋 Copy"), 1500);
  } catch {
    showError("Could not copy — please copy manually.");
  }
});

/* ── Swap languages ── */
document.getElementById("swap-btn").addEventListener("click", swapLanguages);

function swapLanguages() {
  if (srcLangEl.value === "auto") return;
  const tmp = srcLangEl.value;
  srcLangEl.value = tgtLangEl.value;
  tgtLangEl.value = tmp;
}

/* ── Translate back ── */
document.getElementById("back-btn").addEventListener("click", () => {
  if (!lastOutput) return;
  inputEl.value = lastOutput;
  charCountEl.textContent = `${lastOutput.length} / 3000`;
  swapLanguages();
  translate();
});

/* ── Translate button ── */
translateBtn.addEventListener("click", translate);

/* ── Core translate function ── */
async function translate() {
  const text = inputEl.value.trim();
  if (!text) { showError("Please enter some text to translate."); return; }

  hideError();
  setLoading(true);

  try {
    const res = await fetch("/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        src_lang: srcLangEl.value,
        tgt_lang: tgtLangEl.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.detail || "Translation failed.");
      setOutput("placeholder", "Translation will appear here…");
      return;
    }

    lastOutput = data.translated;
    setOutput("text", data.translated);

    detectedEl.textContent = data.detected_lang
      ? `🔍 Detected: ${data.detected_lang}`
      : "";

    addHistory({
      src:     text,
      tgt:     data.translated,
      srcLang: data.src_lang === "auto" ? (data.detected_lang || "Auto") : data.src_lang,
      tgtLang: data.tgt_lang,
    });

  } catch (err) {
    showError("Network error — is the server running?");
    setOutput("placeholder", "Translation will appear here…");
  } finally {
    setLoading(false);
  }
}

/* ── Helpers ── */
function setLoading(val) {
  translateBtn.disabled = val;
  translateBtn.textContent = val ? "⏳ Translating…" : "✨ Translate";
  if (val) {
    outputEl.innerHTML = `
      <div class="loading-wrap">
        Translating
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>`;
  }
}

function setOutput(type, content) {
  if (type === "placeholder") {
    outputEl.innerHTML = `<span class="placeholder">${content}</span>`;
  } else {
    outputEl.textContent = content;
  }
}

function showError(msg) {
  errorBox.textContent = "⚠ " + msg;
  errorBox.style.display = "block";
}
function hideError() {
  errorBox.style.display = "none";
}

/* ── History ── */
function addHistory(item) {
  history.unshift(item);
  if (history.length > 5) history.pop();
  renderHistory();
}

function renderHistory() {
  historySection.style.display = "block";
  historyItems.innerHTML = history.map((item, i) => `
    <div class="history-item" data-i="${i}">
      <p class="history-langs">${item.srcLang} → ${item.tgtLang}</p>
      <p class="history-src">${item.src.substring(0, 90)}${item.src.length > 90 ? "…" : ""}</p>
      <p class="history-tgt">${item.tgt.substring(0, 90)}${item.tgt.length > 90 ? "…" : ""}</p>
    </div>
  `).join("");

  historyItems.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", () => {
      const item = history[+el.dataset.i];
      inputEl.value = item.src;
      charCountEl.textContent = `${item.src.length} / 3000`;
      lastOutput = item.tgt;
      setOutput("text", item.tgt);
      detectedEl.textContent = "";
    });
  });
}
