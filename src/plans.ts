// Technical drawings for the four product families. Generic category drawings, not copies of any house's design.
const dim = (x1: number, y1: number, x2: number, y2: number, label: string, vertical = false) => {
  const t = 6;
  const ticks = vertical
    ? `<path class="bp bp--dim" d="M${x1 - t} ${y1}H${x1 + t}M${x2 - t} ${y2}H${x2 + t}"/>`
    : `<path class="bp bp--dim" d="M${x1} ${y1 - t}V${y1 + t}M${x2} ${y2 - t}V${y2 + t}"/>`;
  const tx = vertical ? `<text class="bp-t" x="${x1 + 10}" y="${(y1 + y2) / 2 + 4}">${label}</text>` : `<text class="bp-t" x="${(x1 + x2) / 2}" y="${y1 - 9}" text-anchor="middle">${label}</text>`;
  return `<path class="bp bp--dim" d="M${x1} ${y1}L${x2} ${y2}"/>${ticks}${tx}`;
};
const frame = (title: string, ref: string, body: string) => `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect class="bp bp--dim" x="16" y="16" width="368" height="468"/>
  ${body}
  <path class="bp bp--dim" d="M16 430H384M250 430V484"/>
  <text class="bp-t bp-t--title" x="30" y="463">${title}</text>
  <text class="bp-t" x="262" y="452">Rif. ${ref}</text>
  <text class="bp-t" x="262" y="472">Scala 1:4</text>
</svg>`;

export const PLANS: Record<string, string> = {
  tophandle: frame('Borsa a mano', 'BM-01', `
    <path class="bp" d="M150 190C150 112 250 112 250 190"/>
    <path class="bp" d="M164 190C164 128 236 128 236 190"/>
    <path class="bp" d="M96 190H304L330 360H70Z"/>
    <path class="bp" d="M96 190L118 250H282L304 190"/>
    <path class="bp bp--st" d="M104 200H296L320 352H80Z"/>
    <rect class="bp" x="186" y="246" width="28" height="22" rx="3"/>
    ${dim(70, 395, 330, 395, '26 cm')}
    ${dim(350, 190, 350, 360, '17 cm', true)}`),
  cardholder: frame('Porta carte', 'PC-04', `
    <rect class="bp" x="90" y="140" width="220" height="150" rx="6"/>
    <path class="bp" d="M90 188C160 180 240 180 310 188"/>
    <path class="bp" d="M90 230C160 222 240 222 310 230"/>
    <path class="bp bp--st" d="M98 148H302V282H98Z"/>
    <path class="bp bp--dim" d="M90 320H310M90 334H310"/>
    <text class="bp-t" x="200" y="356" text-anchor="middle">Taglio: 3 tasche, 1 fondo</text>
    ${dim(90, 112, 310, 112, '10,5 cm')}
    ${dim(334, 140, 334, 290, '7,5 cm', true)}`),
  zipwallet: frame('Portafoglio zip', 'PZ-02', `
    <rect class="bp" x="70" y="160" width="260" height="150" rx="16"/>
    <path class="bp" d="M86 160V150Q86 144 92 144H308Q314 144 314 150V160"/>
    <path class="bp bp--st" d="M80 170H320V300H80Z"/>
    <path class="bp" d="M314 150l18 10l-6 6"/>
    <path class="bp bp--dim" d="M70 330l40 30M130 330l40 30M190 330l40 30M250 330l40 30"/>
    <text class="bp-t" x="200" y="386" text-anchor="middle">Zip a giro, 2 soffietti</text>
    ${dim(70, 120, 330, 120, '19 cm')}
    ${dim(350, 160, 350, 310, '10 cm', true)}`),
  tote: frame('Shopper', 'SH-07', `
    <path class="bp" d="M110 200H290V360H110Z"/>
    <path class="bp" d="M290 200L320 220V378L290 360"/>
    <path class="bp" d="M110 360L140 378H320"/>
    <path class="bp" d="M150 200V160Q150 140 170 140H186Q200 140 200 160V200"/>
    <path class="bp" d="M210 200V160Q210 140 230 140H246Q260 140 260 160V200"/>
    <path class="bp bp--st" d="M118 208H282V352H118Z"/>
    ${dim(110, 400, 290, 400, '18 cm')}
    ${dim(70, 200, 70, 360, '16 cm', true)}`),
};
