const { cleanupTranscript } = require("./cleanup");

async function transcribe(buffer, mime, language, storedApiKey) {
  const apiUrl =
    process.env.VOICEFLOW_API_URL ||
    "https://api.openai.com/v1/audio/transcriptions";
  const apiKey =
    storedApiKey || process.env.VOICEFLOW_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.VOICEFLOW_MODEL || "gpt-4o-mini-transcribe";

  if (!apiKey) {
    throw new Error("Falta la API key. Pégala en el panel de Ajustes.");
  }

  const ext = (mime.split("/")[1] || "webm").split(";")[0].replace("x-", "");
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), `audio.${ext}`);
  form.append("model", model);
  if (language) form.append("language", language);

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Transcripción falló (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return cleanupTranscript((data.text || "").trim());
}

module.exports = { transcribe };
