export function withAlpha(hexColor: string, alpha: number) {
  const sanitized = hexColor.replace('#', '');
  if (sanitized.length !== 6) {
    return hexColor;
  }

  const r = Number.parseInt(sanitized.slice(0, 2), 16);
  const g = Number.parseInt(sanitized.slice(2, 4), 16);
  const b = Number.parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
