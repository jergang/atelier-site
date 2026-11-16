---
name: atelier-house-style
description: The house style for the Atelier Firenze site (a Florentine leather workshop that manufactures for fashion houses). Read before adding or changing any page, section, copy, image or motion in this repo.
---

# Atelier house style

The site is a private viewing in a Florentine palazzo at night: dark rooms, spotlit glass cases, brass, pietra serena stone and marbled paper. Luxury comes from light, scale and slow motion, never from bright colour.

## Palette
Nero seppia `#0f0d0b` (base), Pietra serena `#6e746c` (plinths, secondary), Avorio `#eee7da` (text, blueprint paper), Cuoio `#7b4426` (sparingly), Vino `#5a1a1f` (contact, marbled paper), Ottone `#b39258` (brass: buttons, hairlines, foil, never large areas), Ink `#2e4a6b` (blueprint lines only).

## Type
- Cormorant Garamond for display: the name (600), section titles (500), Italian words and object names (500 italic).
- Hanken Grotesk for everything read: body (400), leads (400), captions and labels (500, letter-spaced, brass).
- Use only the six steps of the scale in `src/style.css` (`--t-hero`, `--t-display`, `--t-title`, `--t-lead`, `--t-body`, `--t-cap`). No ad-hoc sizes.
- Where an Italian word sits over its English line, the Italian takes `--t-title` and the English 1rem, so both read at the same visual weight.
- Reading text is never lighter than 400 and never dimmer than `--muted`.

## Logos
- The houses' official logos live in `src/logos/`, sourced from Wikimedia Commons. Never redraw or retype a logo.
- They are inlined and take the page's colour; size comes from `logo()` in `src/main.ts`, which balances by visual area.

## Copy
- Each section: one Italian title and at most one plain English sentence.
- Captions describe only what is in the photo. No numbers, lead times, minimums or claims the workshop has not confirmed.
- No manifesto lines, no "luxury", "premium", "timeless", "crafted with passion".

## Images
- Only the workshop's own photos, graded warm with deep blacks (see `grade.py` in the project notes), plus visuals built in code (WebGL, three.js).
- Never generate or fake an image of a branded product.
- Blueprints are generic category drawings, never traced copies of a house's design.

## Motion
- Lenis drives GSAP's ticker; eases are `expo.out` and `power3`; nothing bounces.
- One opening ceremony (the foil stamp). Everything else is tied to scroll and can be scrubbed backwards.
- Every WebGL canvas renders only while on screen (`onScreen` in `src/main.ts`).
- Respect `prefers-reduced-motion`: no opening, no smooth scroll.

## Before shipping
Screenshot at 1440 and 390 wide through every section, including each stage of the pinned scenes.
