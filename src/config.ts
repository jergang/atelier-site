// Everything a non-developer is likely to change lives here.

// Working name for the draft. Swap for the workshop's real name.
export const NAME = 'Atelier Firenze';

export interface House {
  name: string;
  /** a photo of a piece made for this house, from the workshop's own pictures */
  image?: string;
  piece?: string;
}

// Houses named on the site. Prada and Chanel have no photo yet, so they show no preview.
export const HOUSES: House[] = [
  { name: 'Balenciaga', image: 'img/embossed-photo.webp', piece: 'Quilted top-handle bag' },
  { name: 'Saint Laurent', image: 'img/cherry-photo.webp', piece: 'Printed calfskin pouch' },
  { name: 'Givenchy', image: 'img/denim-photo.webp', piece: 'Denim zip wallet' },
  { name: 'Maison Margiela', image: 'img/components-photo.webp', piece: 'Grained calf wallets' },
  { name: 'Prada' },
  { name: 'Chanel' },
];

// The vitrine: cut-outs of finished pieces, in the order the visitor walks past them.
export const VITRINE = [
  { src: 'img/obj-embossed.webp', height: 'img/obj-embossed-h.webp', house: 'Balenciaga', object: 'Top-handle bag', detail: 'Quilted calf with an embossed monogram and matte hardware' },
  { src: 'img/obj-cherry.webp', height: 'img/obj-cherry-h.webp', house: 'Saint Laurent', object: 'Zip pouch', detail: 'Printed calfskin, cherry print, gold monogram' },
  { src: 'img/obj-denim.webp', height: 'img/obj-denim-h.webp', house: 'Givenchy', object: 'Zip-around wallet', detail: 'Washed denim with a printed logo, calf trim' },
  { src: 'img/obj-components.webp', height: 'img/obj-components-h.webp', house: 'Maison Margiela', object: 'Wallets', detail: 'Grained calf with the four-stitch mark, mid-production' },
];

// The eight colours of the box bag in the drawing section, taken from the workshop's colour-row photo.
export const BAG_COLOURS = ['#7b4426', '#151312', '#e9dfcc', '#9c2a55', '#c98b3a', '#1e1b19', '#d9ccb2', '#a8743f', '#6b5340'];
