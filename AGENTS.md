# AGENTS.md

Instrucciones para agentes de IA que trabajen en este repositorio.
Sigue el estándar [agents.md](https://agents.md). Las convenciones específicas de Claude
Code están en `CLAUDE.md`; el sistema visual en `DESIGN.md`.

## Proyecto

Electron + dictado por voz. Atajo global → micrófono → transcripción (API compatible con
OpenAI) → inserción del texto en la app activa. Reimplementación educativa de Typeless.

## Puesta en marcha

```bash
npm install
cp .env.example .env     # añade tu VOICEFLOW_API_KEY
npm start
```

Requisitos: Node ≥ 22, Windows 10/11.

## Comandos

| Acción | Comando |
|--------|---------|
| Instalar | `npm install` |
| Ejecutar | `npm start` |
| Empaquetar (opcional) | `npx electron-builder --win` tras instalar electron-builder |

No hay suite de tests ni linter. Si añades lógica no trivial (una rama, un parser, manejo
de dinero/seguridad), acompáñala de una comprobación mínima.

## Estructura

- `src/main.js` — proceso principal: ventanas, `globalShortcut`, IPC, orquestación.
- `src/preload.js` — `contextBridge` → `window.voiceflow`.
- `src/env.js` — carga `.env`.
- `src/store.js` — ajustes e historial en JSON.
- `src/transcribe.js` — llamada de transcripción.
- `src/paste.js` — inserción de texto (portapapeles + `SendKeys`).
- `src/renderer/floating.*` — barra flotante de grabación.
- `src/renderer/hub.*` — panel de ajustes e historial.

## Convenciones de código

- JavaScript CommonJS, 2 espacios, comillas dobles, punto y coma.
- Comenta solo lo que el código no puede explicar por sí mismo; prefiere nombres claros.
- No añadas dependencias salvo necesidad real (el proyecto solo depende de Electron).

## Reglas que un agente no debe romper

1. Al editar un `.html` del renderer, conserva los `id` y clases que su `.js` usa
   (`#bar`, `#dot`, `#label`, `#level`, `.transcribing`, `.error`; en el hub los `id` de
   los campos de ajustes, `#list`, `#hint`, `#wipe`, `.entry`). Rómpelos y la UI deja de
   funcionar sin error visible.
2. `transcribe.js` lee `process.env` en tiempo de ejecución: carga `./env` antes de usarlo.
3. La barra flotante es `focusable: false` para no robar el foco; no lo cambies.
4. Micrófono: permitido solo el permiso `media` en `setPermissionRequestHandler`.

## Pull requests

- Rama por cambio: `feature/...` o `fix/...`.
- Prueba manualmente con `npm start` antes de abrir el PR y describe qué verificaste.
- No incluyas `.env`, `node_modules/` ni claves en el diff.

## Seguridad

La clave de API vive en `.env` (ignorado por git). Nunca la imprimas entera ni la subas.
