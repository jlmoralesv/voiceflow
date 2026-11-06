const { clipboard } = require("electron");
const { spawn } = require("child_process");

function sendPaste() {
  return new Promise((resolve) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-Command",
      "$w = New-Object -ComObject WScript.Shell; $w.SendKeys('^v')",
    ]);
    ps.on("exit", () => resolve());
    ps.on("error", () => resolve());
  });
}

async function insertText(text) {
  const previous = clipboard.readText();
  clipboard.writeText(text);
  await sendPaste();
  setTimeout(() => clipboard.writeText(previous), 400);
}

module.exports = { insertText };
