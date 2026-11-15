import type { Finish, RGB } from './hide';

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;

// The dye house. Keep in step with the custom properties in style.css.
export const DYES = {
  bordeaux: hex('#6b0f22'),
  blu: hex('#1b3a9c'),
  zafferano: hex('#e0a21a'),
  verde: hex('#0e4a37'),
  cipria: hex('#e3b3a4'),
  osso: hex('#eadfcb'),
  notte: hex('#2a0f1c'),
};

// [pebble, cross-hatch, nap, pebble size in px]
export const FINISHES: Record<string, Finish> = {
  vitello: [1, 0, 0, 13],
  saffiano: [0, 0.9, 0, 9],
  vacchetta: [0.14, 0, 0.12, 26],
  nappa: [0.5, 0, 0.05, 6.5],
  suede: [0, 0, 1, 9],
};
