/** Constrain a value without relying on Shell's global Math extensions. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
