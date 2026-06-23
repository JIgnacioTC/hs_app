# HS — Brand Board

> Estilo Grok: oscuro, sofisticado, minimalista. La interfaz desaparece; el contenido respira.

## Identidad

| Atributo | Valor |
|----------|-------|
| Nombre | **HS** |
| Tono | Calmo, preciso, inteligente |
| Personalidad | Elegante · Directo · Sin ruido |
| Metáfora visual | Obsidiana + luz cálida tenue |

## Paleta

### Fondos
| Token | Hex | Uso |
|-------|-----|-----|
| `bg-base` | `#0C0C0E` | Fondo principal |
| `bg-elevated` | `#141416` | Cards, nav |
| `bg-surface` | `#1A1A1D` | Inputs, hover |
| `bg-muted` | `#222226` | Skeletons, chips |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `text-primary` | `#F4F4F5` | Títulos, cuerpo |
| `text-secondary` | `#A0A0A8` | Subtítulos |
| `text-muted` | `#63636A` | Labels, hints |
| `text-inverse` | `#0C0C0E` | Sobre accent |

### Acentos
| Token | Hex | Uso |
|-------|-----|-----|
| `accent` | `#E8E4DC` | CTA primario, highlights |
| `accent-soft` | `#B8B2A6` | Secundario, bordes activos |
| `accent-glow` | `rgba(232,228,220,0.12)` | Glows, halos |
| `success` | `#9CAF88` | Rachas, completado |
| `warning` | `#C4A574` | "No faltes dos veces" |
| `danger` | `#B87A7A` | Eliminar, alertas |

### Bordes
| Token | Valor |
|-------|-------|
| `border-subtle` | `rgba(255,255,255,0.06)` |
| `border-default` | `rgba(255,255,255,0.10)` |
| `border-strong` | `rgba(232,228,220,0.20)` |

## Tipografía

| Rol | Familia | Peso | Tracking |
|-----|---------|------|----------|
| Display | Inter | 600 | `-0.02em` |
| Body | Inter | 400 | `0` |
| Label | Inter | 500 | `0.08em` uppercase |
| Data | Geist Mono | 500 | `0` |

## Espaciado & Forma

- **Radius sm**: `12px` — chips
- **Radius md**: `16px` — inputs
- **Radius lg**: `20px` — cards
- **Radius xl**: `28px` — modals
- **Radius full**: pills, botones
- **Padding página**: `16px` horizontal
- **Touch target mínimo**: `44px`

## Componentes

### Botón primario
Fondo `accent`, texto `text-inverse`, radius full, sin sombra dura. Hover: `opacity 0.92`.

### Botón ghost
Sin fondo. Texto `text-secondary`. Hover: `bg-surface`.

### Card
Fondo `bg-elevated`, borde `border-subtle`, sin sombra o glow muy sutil en hover.

### Input
Fondo `bg-surface`, borde `border-subtle`, focus: `border-strong`.

## Motion

- Transiciones: `200ms ease-out`
- Micro-interacciones: `scale(0.98)` on press
- Sin animaciones decorativas excesivas

## Iconografía

Lucide, stroke `1.5`, tamaño base `20px`. Color hereda del texto.

## Hábitos (Atomic Habits)

Colores semánticos para tipos de hábito (ver `src/styles/branding.ts` → `habitPalette`):

- **Identidad** — ivory
- **Obvio (cue)** — soft blue-gray
- **Atractivo** — warm gold
- **Fácil (2 min)** — sage green
- **Satisfactorio** — champagne

## Uso en código

```ts
import { brand } from "@/styles/branding";
// brand.colors.accent, brand.radius.lg, etc.
```

CSS variables en `globals.css` — **siempre** preferir tokens (`bg-elevated`, `text-muted`, `accent`) sobre hex sueltos.
