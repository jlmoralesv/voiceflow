const bar = document.getElementById("bar");
const label = document.getElementById("label");
const levelEl = document.getElementById("level");

let recorder = null;
let chunks = [];
let stream = null;
let audioCtx = null;
let raf = null;

const BARS = 16;
for (let i = 0; i < BARS; i++) levelEl.appendChild(document.createElement("span"));
const bars = [...levelEl.children];

function animateLevel(analyser) {
  const data = new Uint8Array(analyser.frequencyBinCount);
  const tick = () => {
    analyser.getByteFrequencyData(data);
    for (let i = 0; i < BARS; i++) {
      const v = data[Math.floor((i / BARS) * data.length)] / 255;
      bars[i].style.height = `${3 + v * 15}px`;
    }
    raf = requestAnimationFrame(tick);
  };
  tick();
}

async function start() {
  bar.className = "";
  label.textContent = "Escuchando…";
  chunks = [];
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
  }
});
