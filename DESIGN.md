# DESIGN.md

Sistema visual de VoiceFlow: **modern dark glass neutro** con estética de escritorio refinada.
Esta guía define los principios y tokens para mantener la consistencia en la interfaz.

## Principios

1. **Vidrio refinado monocromo.** Acabado de cristal translúcido oscuro (`backdrop-filter: blur`) con sutiles gradientes radiales sobre luz blanca difusa ambiental. Sin saturaciones artificiales de color.
2. **Jerarquía visual limpia.** Separación clara mediante grupos de campos (`.field`), bordes nítidos (`1px solid rgba(255,255,255,0.1)`), elevación con sombras suaves y estados de foco bien definidos.
3. **Desplegables opacos de alta visibilidad.** Los menús flotantes (`.glass-select-menu`) usan un fondo oscuro casi 100% opaco (`rgba(21, 21, 25, 0.98)` / `#151519`) para evitar que el texto de los campos o etiquetas inferiores se transparente o amontone. Cuentan con detección automática de posición (apertura hacia arriba si están cerca del borde inferior).
4. **Bordes modernos y contenidos.** Radios redondeados sutiles y elegantes (8px para controles, 14px para paneles), evitando formas exageradamente globulares o tipo cápsula en formularios.
5. **Tipografía moderna de sistema.** Tipografía sans-serif limpia (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`) para toda la interfaz, reservando tipografía monoespaciada exclusivamente para teclas y atajos de teclado (`#dictationShortcut`, `#pasteLastShortcut`).

## Tokens

### Tipografía

```css
/* Interfaz general */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", Helvetica, Arial, sans-serif;

/* Atajos y combinaciones de teclas */
font-family: ui-monospace, "Cascadia Code", "Cascadia Mono", Consolas, monospace;
```

- **Títulos de sección (`h2`)**: 12px, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.8px`.
- **Etiquetas (`label`)**: 11.5px, `font-weight: 600`, color `--text-secondary` (`#a1a1aa`).
- **Textos de entrada y opciones**: 13px / 12.5px.
- **Pistas y ayudas (`.hint`, `.field-subtext`)**: 11.5px / 11px.

### Colores (escala neutra)

| Rol | Token / Valor |
|-----|---------------|
| Fondo de ventana | `#0c0c0e` |
| Fondo de paneles | `rgba(20, 20, 25, 0.72)` + blur 36px |
| Fondo de inputs/triggers | `rgba(255, 255, 255, 0.04)` |
| Fondo de inputs (hover) | `rgba(255, 255, 255, 0.05)` |
| Fondo de inputs (foco/abierto) | `rgba(255, 255, 255, 0.07)` |
| Menú desplegable (select) | `rgba(21, 21, 25, 0.98)` / `#151519` (opaco de alta visibilidad) |
| Borde base | `rgba(255, 255, 255, 0.08)` a `rgba(255, 255, 255, 0.1)` |
| Borde hover | `rgba(255, 255, 255, 0.18)` |
| Borde foco / activo | `rgba(255, 255, 255, 0.42)` + halo `rgba(255, 255, 255, 0.08)` |
| Texto primario | `#f4f4f6` |
| Texto secundario | `#a1a1aa` |
| Texto atenuado (muted) | `#71717a` |

### Radios de esquina (`border-radius`)

| Elemento | Radio |
|----------|-------|
| Paneles principales (aside / main) | `14px` |
| Barra flotante de grabación | `12px` |
| Controles (inputs, selects, botones, tarjetas de historial) | `8px` |
| Opciones internas de menú (`li`) y botones pequeños | `6px` |

### Menús desplegables (`.glass-select`)

- Montados dinámicamente sobre `<select>` estándar.
- Flecha indicadora SVG sincronizada que rota 180° al desplegar.
- Menú con elevación alta (`z-index: 1000`) y sombra profunda (`box-shadow: 0 16px 36px -4px rgba(0,0,0,0.8)`).
- Opción seleccionada con icono de checkmark SVG.
- Cierre global de cualquier otro desplegable al abrir uno nuevo.
