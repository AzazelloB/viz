const paths = {
  fit: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M8 8h8v8H8z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  expand: '<path d="M8 3H3v5m0-5 6 6m7-6h5v5m0-5-6 6M3 16v5h5m-5 0 6-6m7 6h5v-5m0 5-6-6"/>',
  collapse: '<path d="m3 3 6 6M4 9h5V4m12-1-6 6m0-5v5h5M3 21l6-6m-5 0h5v5m12 1-6-6m0 5v-5h5"/>',
  up: '<path d="M12 20V4m-6 6 6-6 6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}
