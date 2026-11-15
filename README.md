# Atelier site

First draft of the site for the Milan leather workshop. "Atelier Milano" is a working name.

One page, no commerce. The background is a real-time leather surface: each chapter is a different hide, sewn to the next, lit by a lamp that follows the pointer. The wordmark is heat-stamped in foil on load.

## Run it

```
npm install
npm run dev      # local preview
npm run build    # static site in dist/
```

Deploy: import the repo in Vercel (framework preset "Vite"). Every push gets its own preview link.

## Where things are

| File | What it holds |
|---|---|
| `index.html` | All copy and structure |
| `src/style.css` | Palette tokens, type, layout |
| `src/palette.ts` | Dye colours and leather finishes for the shader |
| `src/hide.ts` | The WebGL leather: grain, light, seams, stamp |
| `src/main.ts` | Scroll and motion (GSAP, ScrollTrigger, SplitText, Lenis) |
| `.claude/skills/` | Design skills Claude reads when working in this repo |

## Still placeholder

- The name, and every line of copy: written to be plausible, not confirmed by the workshop.
- The four pattern drawings stand in for product photography.
- The form is not connected to an inbox.

## Skills in this repo

| Skill | Source | Licence |
|---|---|---|
| `atelier-house-style` | written for this project | ours |
| `frontend-design` | anthropics/skills | Apache 2.0 |
| `impeccable` | pbakaus/impeccable | Apache 2.0 |
| `taste-skill` | Leonxlnx/taste-skill | MIT |
| `cinematic-gsap-lenis-motion-system`, `cinematic-scroll-storytelling`, `horizontal-scroll-scenes` | mengto/skills | MIT |

Fonts: Bodoni Moda and Archivo (SIL Open Font License), bundled through Fontsource.
