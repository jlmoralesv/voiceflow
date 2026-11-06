require("./env");
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  session,
} = require("electron");
const path = require("path");
const store = require("./store");
const { transcribe } = require("./transcribe");
const { insertText } = require("./paste");

let floatingWin = null;
let hubWin = null;
let tray = null;
let recording = false;

function createFloatingBar() {
  floatingWin = new BrowserWindow({
    width: 220,
    height: 64,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    transparent: true,
    show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  floatingWin.setVisibleOnAllWorkspaces(true);
  floatingWin.loadFile(path.join(__dirname, "renderer", "floating.html"));

  const { workArea } = require("electron").screen.getPrimaryDisplay();
  floatingWin.setBounds({
    x: Math.round(workArea.x + (workArea.width - 220) / 2),
    y: workArea.y + workArea.height - 110,
    width: 220,
    height: 64,
  });
}

function createHub() {
  if (hubWin && !hubWin.isDestroyed()) {
    hubWin.show();
    hubWin.focus();
    return;
  }
  hubWin = new BrowserWindow({
    width: 780,
    height: 640,
    minWidth: 700,
    minHeight: 520,
    autoHideMenuBar: true,
    title: "VoiceFlow",
    backgroundColor: "#0c0c0e",
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  hubWin.setMenuBarVisibility(false);
  hubWin.loadFile(path.join(__dirname, "renderer", "hub.html"));
}

function startRecording() {
  if (recording || !floatingWin) return;
  recording = true;
  floatingWin.showInactive();
  floatingWin.webContents.send("recording:start");
}

function stopRecording() {
  if (!recording || !floatingWin) return;
  recording = false;
  floatingWin.webContents.send("recording:stop");
}

function toggleRecording() {
  recording ? stopRecording() : startRecording();
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const { dictationShortcut, pasteLastShortcut } = store.getSettings();
  if (dictationShortcut) globalShortcut.register(dictationShortcut, toggleRecording);
  if (pasteLastShortcut) {
    globalShortcut.register(pasteLastShortcut, () => {
      const last = store.getHistory()[0];
      if (last) insertText(last.text);
    });
  }
}

function broadcastHistory() {
  if (hubWin && !hubWin.isDestroyed()) {
    hubWin.webContents.send("history:changed", store.getHistory());
  }
}

ipcMain.handle("audio:recorded", async (_e, { buffer, mime }) => {
  floatingWin?.webContents.send("status", "transcribing");
  try {
    const { language, insertMode } = store.getSettings();
    const text = await transcribe(Buffer.from(buffer), mime, language);
    if (text) {
      store.addTranscript(text);
      broadcastHistory();
      if (insertMode !== "none") await insertText(text);
    }
    floatingWin?.webContents.send("status", "idle");
    floatingWin?.hide();
    return { ok: true, text };
  } catch (err) {
    floatingWin?.webContents.send("status", "error");
    setTimeout(() => floatingWin?.hide(), 1500);
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle("settings:get", () => store.getSettings());
ipcMain.handle("settings:set", (_e, patch) => {
  const next = store.setSettings(patch);
  registerShortcuts();
  return next;
});
ipcMain.handle("history:get", () => store.getHistory());
ipcMain.handle("history:wipe", () => {
  store.wipeHistory();
  broadcastHistory();
});
ipcMain.handle("transcript:insert", (_e, text) => insertText(text));

function createTray() {
  const icon = nativeImage.createFromNamedImage
    ? nativeImage.createEmpty()
    : nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("VoiceFlow");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Dictar / detener", click: toggleRecording },
      { label: "Abrir panel", click: createHub },
      { type: "separator" },
      { label: "Salir", click: () => app.quit() },
    ]),
  );
  tray.on("click", createHub);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) =>
    cb(perm === "media"),
  );
  createFloatingBar();
  createHub();
  createTray();
  registerShortcuts();
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", (e) => e.preventDefault());
