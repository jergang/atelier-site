# Atelier Firenze

Website for a Florentine leather workshop that designs and makes leather goods to order. "Atelier Firenze" is a working name: change it in `src/main.ts` (`NAME`).

Plain HTML, CSS and a small script, built with Vite. Deployed on Vercel.

## Sections
Hero, Su misura (design, prototype, leather and colour, production), the leathers, hardware and finishing, Le creazioni (gallery), L'atelier, Houses we have produced for (logos plus past production), contact form.

## Edit
- Copy and photos: `index.html`
- Colours and type: top of `src/style.css`
- Houses: `HOUSES` in `src/main.ts`; logos in `src/logos/` (official, from Wikimedia Commons)
- Images: `public/img/` (`p` = photo in its own setting, `c` = cut out, `m` = material, `h` = hardware, `o` = earlier factory photos)

## Run
```
npm install
npm run dev
npm run build
```

## Still to confirm
The real name and address, permission for every house shown, and an inbox for the form.

Fonts: Cormorant Garamond and Hanken Grotesk (SIL Open Font License).
