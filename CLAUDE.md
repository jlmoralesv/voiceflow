# CLAUDE.md

Guía para Claude Code (y cualquier agente) al trabajar en este repositorio.

## Qué es

App de escritorio Electron de dictado por voz: atajo global → graba micrófono →
transcribe con una API compatible con OpenAI → inserta el texto en la app activa.
Reimplementación educativa de Typeless. Ver `README.md` para el panorama de usuario y
`DESIGN.md` para el sistema visual.

## Comandos

```bash
npm install     # instala Electron (única dependencia)
npm start        # arranca la app en modo desarrollo
```

No hay tests ni linter configurados. Node **≥ 22** (se usan `fetch`/`FormData`/`Blob`
globales). Solo **Windows** (la inserción de texto usa `SendKeys` de PowerShell).

## Arquitectura

```
src/
  main.js        Proceso principal: crea ventanas, registra atajos, maneja IPC y orquesta
  preload.js     contextBridge → expone window.voiceflow al renderer
  env.js         Carga .env a process.env (sin dependencias). Requerido al inicio de main.js
  store.js       Ajustes + historial en un JSON (userData). API en memoria con persist()
  transcribe.js  POST multipart al endpoint de transcripción. Lee env en runtime
  cleanup.js     Filtra muletillas aisladas y normaliza puntuación del texto transcrito
  paste.js       Portapapeles + SendKeys ^v para insertar en la app enfocada
  renderer/
    floating.*   Barra flotante: graba (MediaRecorder) y envía el audio por IPC
    hub.*        Panel: historial + ajustes
```

Flujo: atajo (`main`) → `recording:start` a la barra → graba → `audio:recorded` a `main`
→ `transcribe` → `store.addTranscript` + `history:changed` al hub → `paste.insertText`.

Canales IPC: `recording:start|stop`, `status`, `history:changed` (main→renderer);
`audio:recorded`, `settings:get|set`, `history:get|wipe`, `transcript:insert`
(renderer→main, vía `invoke`).

## Reglas al editar

- **No rompas el contrato HTML↔JS.** El JS de cada renderer busca elementos por `id` y
  manipula clases concretas. Si editas `floating.html`/`hub.html`, conserva: en floating
  `#bar #dot #label #level` y las clases de estado `.transcribing`/`.error`; en hub los
  `id` de los campos (`dictationShortcut`, `pasteLastShortcut`, `dictationMode`,
  `language`, `micDeviceId`, `insertMode`), `#list`, `#hint`, `#wipe` y las clases
  `.entry`/`.entry time`.
- **`transcribe.js` lee `process.env` en cada llamada** (no al importar). Cualquier entrada
  que lo use debe haber cargado `./env` antes; `main.js` ya lo hace en su primera línea.
- **La barra flotante es `focusable: false`** a propósito: así la app donde escribes
  conserva el foco y el `Ctrl+V` cae ahí. No la hagas enfocable sin entender esto.
- **`paste.js` usa `SendKeys('^v')`.** El pegado no interpreta el contenido (va por
  portapapeles), pero si envías texto por `SendKeys`, recuerda que `+ ^ % ~ ( )` son
  metacaracteres.
- **Permiso de micrófono:** se concede en `setPermissionRequestHandler` solo para `media`.

## Estilo de código

- CommonJS, 2 espacios, comillas dobles, punto y coma.
- **Comentarios:** solo cuando sin ellos alguien rompería algo (una trampa real, el porqué
  de una decisión no evidente, un `TODO`). Nada de comentarios que narren lo que el código
  ya dice. Prefiere nombres precisos a comentarios.
- Sin dependencias nuevas salvo necesidad real; la gracia del proyecto es que solo depende
  de Electron.

## Seguridad

- `.env` contiene la clave de API y está en `.gitignore`. Nunca lo subas ni lo imprimas
  completo. La plantilla pública es `.env.example`.
