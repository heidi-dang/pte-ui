export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWords(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

export function normalizeBlank(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()\-[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
