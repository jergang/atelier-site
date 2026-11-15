---
name: atelier-house-style
description: The house style for the Atelier Milano site (a Milan leather workshop that manufactures for brands). Read before adding or changing any page, section, copy or motion in this repo.
---

# Atelier house style

The site is one physical object: a hide. Every chapter is a different leather, sewn to the next with a visible seam, under one lamp the visitor moves. Nothing on the page should break that illusion.

## The idea, and what it rules out
- The background is always the WebGL hide (`src/hide.ts`). Never add flat colour blocks, gradients, cards, glass or drop shadows on top of it.
- A new section is a new leather. Give it `data-dye` and `data-finish`; the seam, stitches and nav colour follow automatically.
- Boldness is spent on the hide and on type scale. Everything else stays quiet: no icons, no badges, no decorative rules.

## Palette (the dye house)
Bordeaux `#6b0f22`, Blu Savoia `#1b3a9c`, Zafferano `#e0a21a`, Verde bottiglia `#0e4a37`, Cipria `#e3b3a4`, Osso `#eadfcb`, Notte `#1c0b13`, Oro `#dbb46a` (foil only: the stamp, numerals, one button).
- Text is Osso on dark dyes and Notte on Zafferano, Cipria and Osso. Add new light dyes to `LIGHT` in `src/main.ts`.
- Keep `src/palette.ts` and the custom properties in `src/style.css` in step.
- Never place two dark dyes or two light dyes next to each other; the seam needs contrast.

## Type
- Bodoni Moda (variable, optical size) for anything with a voice. Italic for Italian trade words and names, roman for English statements.
- Archivo, slightly widened, for reading text and controls.
- Display sizes are huge (9vw to 21vw) with tight tracking. Body stays under 40 characters wide beside display type.
- Sentence case everywhere. No all-caps labels, no monospace, no middle-dot strings, no arrows on links.

## Voice
- The workshop speaks plainly, first person plural, present tense. It describes what is done to the leather, not how the visitor should feel.
- Italian trade word first, plain English explanation after ("Scarnitura. Skiving.").
- No superlatives, no "luxury", "premium", "timeless", "crafted with passion".
- Never state a number, lead time, minimum or client name that the workshop has not confirmed.

## Motion
- One clock: Lenis drives GSAP's ticker. Eases are `expo.out` and `power3/4`; nothing bounces.
- One orchestrated moment only: the stamp in the hero. Elsewhere motion is tied to scroll position and can be scrubbed backwards.
- Derive state from scroll and layout each frame (see `readSeam`); never accumulate it.
- Honour `prefers-reduced-motion`: no pinning, no smooth scroll, the stamp already pressed.

## Photography, when it arrives
- Photos sit on the hide as objects laid on a table: no rounded corners, no overlays, generous margins.
- Prefer macro grain, hands, tools and edges over finished-product packshots on white.
- Host through an image CDN; never commit originals to the repo.

## Before shipping a change
Screenshot at 1440 and 390 wide, at the top, at each seam, and at the foot. Check text contrast under the lamp's brightest point on the light dyes.
