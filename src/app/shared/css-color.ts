/**
 * Reads a color token from :root so canvas, WebGL and d3 drawings use the same
 * value as CSS instead of duplicating hex literals.
 * Returns RGB channels in the 0–1 range.
 */
export function cssColor(token: string, root: Element = document.documentElement): [number, number, number] {
  const value = getComputedStyle(root).getPropertyValue(token).trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1];
  if (!hex) throw new Error(`El token ${token} debe ser un color #rrggbb; se obtuvo "${value}".`);
  const n = parseInt(hex, 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Same token as a CSS color string for canvas 2D (`fillStyle`, `strokeStyle`). */
export function cssColorString(token: string, root?: Element): string {
  const [r, g, b] = cssColor(token, root);
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;
}
