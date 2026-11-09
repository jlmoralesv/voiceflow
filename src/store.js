const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const FILE = path.join(app.getPath("userData"), "voiceflow.json");

const DEFAULTS = {
  settings: {
    apiKey: "",
    dictationShortcut: "Control+Shift+Space",
    pasteLastShortcut: "Control+Shift+V",
    dictationMode: "toggle",
    language: "",
    insertMode: "paste",
    micDeviceId: "",
    aiCleanup: true,
  },
  history: [],
};

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return {
      settings: { ...DEFAULTS.settings, ...(data.settings || {}) },
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();

function persist() {
  // Escritura atómica: si el proceso muere a mitad de guardar, el .tmp queda
  // incompleto pero el archivo real nunca se corrompe (rename es atómico en NTFS).
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, FILE);
}

module.exports = {
  getSettings: () => state.settings,
  setSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    persist();
    return state.settings;
  },
  getHistory: () => state.history,
  addTranscript(text) {
    const entry = { id: Date.now(), text, createdAt: new Date().toISOString() };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 500);
    persist();
    return entry;
  },
  wipeHistory() {
    state.history = [];
    persist();
  },
};
