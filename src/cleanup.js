// shortcut: solo filtra muletillas aisladas (eh, umm, mmm...), no discursivas
// ("bueno", "tipo", "este") porque esas también son palabras de contenido legítimo
// y distinguirlas requiere entender el contexto, no un regex. Para eso haría falta
// un segundo paso con un modelo de texto (más costo y latencia por transcripción).
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

function cleanupTranscript(text) {
  if (!text) return "";
  return normalizePunctuation(stripFillers(text));
}

module.exports = { cleanupTranscript };
