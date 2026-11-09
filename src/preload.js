const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voiceflow", {
  onRecordingStart: (cb) => ipcRenderer.on("recording:start", cb),
  onRecordingStop: (cb) => ipcRenderer.on("recording:stop", cb),
  onStatus: (cb) => ipcRenderer.on("status", (_e, s) => cb(s)),
  onHistoryChanged: (cb) =>
    ipcRenderer.on("history:changed", (_e, h) => cb(h)),
  sendAudio: (buffer, mime) =>
    ipcRenderer.invoke("audio:recorded", { buffer, mime }),
  discardRecording: () => ipcRenderer.invoke("recording:discard"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
  getHistory: () => ipcRenderer.invoke("history:get"),
  wipeHistory: () => ipcRenderer.invoke("history:wipe"),
  insertTranscript: (text) => ipcRenderer.invoke("transcript:insert", text),
});
