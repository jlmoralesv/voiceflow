// Filtro determinista (sin red): muletillas aisladas + puntuación. Es el resultado
// si no hay API key de texto o si la llamada a la IA falla — nunca debe bloquear el pegado.
const FILLER_RE = /^(eh+|ehm+|em+|umm*|uhm*|uh+|mmm+|hmm+)$/i;

function stripFillers(text) {
  return text
    .split(/\s+/)
    .filter((tok) => !FILLER_RE.test(tok.replace(/[,.;:¡!¿?…]/g, "")))
    .join(" ");
}

function normalizePunctuation(text) {
  let t = text.trim().replace(/\s+/g, " ");
  if (!t) return t;
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  if (!/[.!?…]$/.test(t)) t += ".";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Elegido tras comparar en vivo con la API real: gpt-4o-mini y gpt-4.1-mini dieron el
// mismo resultado correcto (~1s, ~20 tokens de salida); gpt-5-nano/mini son "razonadores"
// y para este texto corto gastaron 200-2000 tokens ocultos de razonamiento con hasta
// 27s de latencia — inviables para dictado en vivo. gpt-4o-mini es el más barato de los
// que sirven, por eso es el default.
const SYSTEM_PROMPT = `Limpias transcripciones de dictado por voz, dichas en voz alta y transcritas literal.
Reglas:
- Si la persona se corrigió o reinició una frase a mitad de camino (duda, "espera", "no, mejor...", repetir desde el inicio), conserva SOLO la versión final que quiso decir y descarta por completo el intento abandonado.
- Quita muletillas y relleno sin contenido (eh, um, bueno, o sea, como que, este, pues) solo cuando no aportan nada.
- Corrige puntuación, mayúsculas y espacios.
- No agregues información nueva, no resumas ni parafrasees el contenido real que sí quiso decir.
- Responde ÚNICAMENTE con el texto limpio, sin comillas ni explicaciones, en el mismo idioma del original. Si ya está limpio, devuélvelo igual.`;

async function llmCleanup(text) {
  const apiKey = process.env.VOICEFLOW_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.VOICEFLOW_TEXT_MODEL || "gpt-4o-mini";
  const url =
    process.env.VOICEFLOW_TEXT_URL || "https://api.openai.com/v1/chat/completions";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

async function cleanupTranscript(text, aiCleanup = true) {
  if (!text) return "";
  const fallback = normalizePunctuation(stripFillers(text));
  if (!aiCleanup) return fallback;
  const smart = await llmCleanup(text);
  return smart || fallback;
}

module.exports = { cleanupTranscript };
