const bar = document.getElementById("bar");
const label = document.getElementById("label");
const levelEl = document.getElementById("level");

let recorder = null;
let chunks = [];
let stream = null;
let audioCtx = null;
let raf = null;
let hadSound = false;
let silenceSince = null;

const BARS = 16;
for (let i = 0; i < BARS; i++) levelEl.appendChild(document.createElement("span"));
const bars = [...levelEl.children];

// shortcut: umbral fijo de nivel (0-255), no calibra ganancia por mic; si un mic muy
// sensible corta de más o uno muy bajo nunca dispara el auto-stop, subir/bajar este valor.
const SILENCE_LEVEL = 10;
const SILENCE_HOLD_MS = 1600;

function animateLevel(analyser) {
  const data = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < BARS; i++) {
      const v = data[Math.floor((i / BARS) * data.length)];
      bars[i].style.height = `${3 + (v / 255) * 15}px`;
      sum += v;
    }
    const avg = sum / BARS;
    if (avg > SILENCE_LEVEL) {
      hadSound = true;
      silenceSince = null;
    } else if (hadSound) {
      if (silenceSince === null) silenceSince = performance.now();
      else if (performance.now() - silenceSince > SILENCE_HOLD_MS) {
        stop();
        return;
      }
    }
    raf = requestAnimationFrame(tick);
  };
  tick();
}

async function start() {
  bar.className = "";
  label.textContent = "Escuchando…";
  chunks = [];
  hadSound = false;
  silenceSince = null;
  const { micDeviceId } = await window.voiceflow.getSettings();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: micDeviceId ? { deviceId: { exact: micDeviceId } } : true,
    });
  } catch {
    // El mic elegido ya no existe (desconectado/cruzado): cae al predeterminado
    // del sistema en vez de quedarse sin grabar nada.
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  animateLevel(analyser);

  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  recorder = new MediaRecorder(stream, { mimeType: mime });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = async () => {
    if (!hadSound) {
      await window.voiceflow.discardRecording();
      return;
    }
    const blob = new Blob(chunks, { type: mime });
    const buffer = await blob.arrayBuffer();
    await window.voiceflow.sendAudio(buffer, mime);
  };
  recorder.start();
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  recorder?.state === "recording" && recorder.stop();
  stream?.getTracks().forEach((t) => t.stop());
  audioCtx?.close();
}

window.voiceflow.onRecordingStart(start);
window.voiceflow.onRecordingStop(stop);
window.voiceflow.onStatus((s) => {
  if (s === "transcribing") {
    bar.className = "transcribing";
    label.textContent = "Transcribiendo…";
  } else if (s === "error") {
    bar.className = "error";
    label.textContent = "Error";
  } else if (s === "empty") {
    bar.className = "error";
    label.textContent = "Sin audio";
  }
});
