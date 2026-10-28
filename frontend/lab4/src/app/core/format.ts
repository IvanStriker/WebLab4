export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text.split('-').reverse().join('.');
  }
  return text;
}

export function fieldValue(item: object, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}
