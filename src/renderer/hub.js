const fields = [
  "apiKey",
  "dictationShortcut",
  "pasteLastShortcut",
  "dictationMode",
  "language",
  "micDeviceId",
  "aiCleanup",
  "insertMode",
];
const list = document.getElementById("list");
const hint = document.getElementById("hint");

function renderHistory(items) {
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="hint">Aún no hay transcripciones.</p>
      </div>
    `;
    return;
  }
  for (const it of items) {
    const div = document.createElement("div");
    div.className = "entry";
    div.title = "Clic para insertar en la app activa";
    div.innerHTML = `<div></div><time>${new Date(it.createdAt).toLocaleString()}</time>`;
    div.firstChild.textContent = it.text;
    div.onclick = () => window.voiceflow.insertTranscript(it.text);
    list.appendChild(div);
  }
}

function closeAllSelects(exceptWrap = null) {
  document.querySelectorAll(".glass-select").forEach((w) => {
    if (w !== exceptWrap) {
      w.classList.remove("open");
      w.classList.remove("drop-up");
      const m = w.querySelector(".glass-select-menu");
      if (m) m.hidden = true;
    }
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".glass-select")) {
    closeAllSelects();
  }
});

function mountGlassSelect(select) {
  const wrap = document.createElement("div");
  wrap.className = "glass-select";
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "glass-select-trigger";
  trigger.innerHTML = `
    <span class="glass-select-val"></span>
    <svg class="glass-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  wrap.appendChild(trigger);

  const valSpan = trigger.querySelector(".glass-select-val");

  const menu = document.createElement("ul");
  menu.className = "glass-select-menu";
  menu.hidden = true;
  wrap.appendChild(menu);

  const options = [...select.options];
  const close = () => {
    menu.hidden = true;
    wrap.classList.remove("open");
    wrap.classList.remove("drop-up");
  };

  const sync = () => {
    const opt = options.find((o) => o.value === select.value) ?? options[0];
    valSpan.textContent = opt ? opt.textContent : "";
    for (const li of menu.children) {
      li.classList.toggle("selected", li.dataset.value === select.value);
    }
  };

  for (const opt of options) {
    const li = document.createElement("li");
    li.dataset.value = opt.value;
    li.innerHTML = `
      <span class="opt-text">${opt.textContent}</span>
      <svg class="opt-check" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M13.25 4.75L6 12L2.75 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    li.onclick = (e) => {
      e.stopPropagation();
      select.value = opt.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      sync();
      close();
    };
    menu.appendChild(li);
  }

  trigger.onclick = (e) => {
    e.stopPropagation();
    const willOpen = menu.hidden;
    closeAllSelects(wrap);

    if (willOpen) {
      const rect = wrap.getBoundingClientRect();
      const menuEstimatedHeight = options.length * 36 + 14;
      if (rect.bottom + menuEstimatedHeight > window.innerHeight - 20 && rect.top > menuEstimatedHeight) {
        wrap.classList.add("drop-up");
      } else {
        wrap.classList.remove("drop-up");
      }

      menu.hidden = false;
      wrap.classList.add("open");
    } else {
      close();
    }
  };

  sync();
}

async function populateMicOptions() {
  const sel = document.getElementById("micDeviceId");
  try {
    // Pide permiso una vez para que enumerateDevices devuelva labels (sin esto,
    // Chromium los da vacíos hasta que algún renderer haya usado el mic).
    const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
    tmp.getTracks().forEach((t) => t.stop());
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter((d) => d.kind === "audioinput");
    sel.innerHTML = '<option value="">Predeterminado del sistema</option>';
    mics.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = d.deviceId;
      opt.textContent = d.label || `Micrófono ${i + 1}`;
      sel.appendChild(opt);
    });
  } catch {
    sel.innerHTML = '<option value="">Predeterminado del sistema</option>';
  }
}

async function init() {
  await populateMicOptions();
  const s = await window.voiceflow.getSettings();
  for (const f of fields) {
    const el = document.getElementById(f);
    if (el.type === "checkbox") el.checked = s[f] ?? true;
    else el.value = s[f] ?? "";
  }
  for (const select of document.querySelectorAll("select")) mountGlassSelect(select);
  renderHistory(await window.voiceflow.getHistory());

  for (const f of fields) {
    document.getElementById(f).addEventListener("change", async (e) => {
      if (e.target.type === "checkbox") {
        await window.voiceflow.setSettings({ [f]: e.target.checked });
        return;
      }
      const value = f === "apiKey" ? e.target.value.trim() : e.target.value;
      await window.voiceflow.setSettings({ [f]: value });
    });
  }
  document.getElementById("wipe").onclick = () => window.voiceflow.wipeHistory();
  hint.textContent = window.voiceflow
    ? "Pulsa el atajo de dictado en cualquier app para transcribir."
    : "";
}

// Mock para previsualización fuera de Electron si window.voiceflow no existe
if (!window.voiceflow) {
  window.voiceflow = {
    getSettings: async () => ({
      apiKey: "",
      dictationShortcut: "Control+Shift+Space",
      pasteLastShortcut: "Control+Shift+V",
      dictationMode: "toggle",
      language: "es",
      aiCleanup: true,
      insertMode: "paste",
    }),
    setSettings: async () => ({}),
    getHistory: async () => [
      { text: "Hola, este es un texto de prueba transcrito con éxito.", createdAt: Date.now() - 60000 },
      { text: "VoiceFlow permite dictado ultra rápido en cualquier aplicación.", createdAt: Date.now() - 180000 },
    ],
    wipeHistory: async () => {},
    insertTranscript: async () => {},
    onHistoryChanged: () => {},
  };
}

window.voiceflow.onHistoryChanged(renderHistory);
init();
