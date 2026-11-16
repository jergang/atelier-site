# Atelier Firenze

Website draft for a Florentine leather workshop that makes for the fashion houses. "Atelier Firenze" is a working name: change it in `src/config.ts`.

One page, no commerce, built in code:

| Section | What it is |
|---|---|
| Opening | The name foil-stamped into black calf (WebGL) |
| Hero | The workshop's photo of rows of finished bags, given depth; scrolling cranes down the aisle |
| Maisons | The houses' official logos (from Wikimedia Commons, in `src/logos/`) in one slow row, balanced by visual weight; hover shows a piece made for that house. A 2 x 3 grid on phones |
| La vetrina | three.js gallery: finished pieces cut out of the workshop's photos, in glass cases under spotlights |
| Dal disegno all'oggetto | A box bag's pattern is drawn, cut, folded into a 3D bag, turned through eight colours, then dissolves into the real photo |
| Produzione | Pinned horizontal film strip of the production photos |
| I materiali | Glazed crocodile relit by the cursor, plus relightable swatches cropped from the photos |
| Le mani | Editorial spread of the workshop and quality checks |
| Firenze | The word filled with live Florentine marbled paper |
| Scriveteci | Appointment form on marbled paper (not connected to an inbox yet) |

## Run

```
npm install
npm run dev
npm run build   # static site in dist/
```

Deployed on Vercel (framework preset: Vite).

## Edit

- Name, houses, vitrine pieces, bag colours: `src/config.ts`
- Copy and structure: `index.html`
- Palette and type: `src/style.css`
- WebGL scenes: `src/gl/`
- Images: `public/img/` (graded and cut out from the workshop's photos)

## Still to confirm with the workshop

- The real name and address.
- Written permission for every house named on the site.
- Every caption and claim.

## Skills in this repo

`.claude/skills/` holds the design skills Claude reads when working here: `atelier-house-style` (written for this project), `frontend-design` (anthropics/skills, Apache 2.0), `impeccable` (pbakaus/impeccable, Apache 2.0), `taste-skill` (MIT), and three motion skills from mengto/skills (MIT).

Fonts: Cormorant Garamond (display) and Hanken Grotesk (text), both SIL Open Font License, via Fontsource. The type scale lives at the top of `src/style.css`.
