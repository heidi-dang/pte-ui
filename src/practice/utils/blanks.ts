export function splitPromptIntoBlankParts(promptText: string): string[] {
  return promptText.split(/(?:\[\d+\]|_{2,})/);
}

export function countBlanks(promptText: string): number {
  const parts = splitPromptIntoBlankParts(promptText);
  return Math.max(0, parts.length - 1);
}

export function normalizeBlankOptions(item: Record<string, unknown>, blankIndex: number): string[] {
  if (item.optionsJson) {
    try {
      const parsed = typeof item.optionsJson === 'string' ? JSON.parse(item.optionsJson) : item.optionsJson;
      if (Array.isArray(parsed)) {
        if (Array.isArray(parsed[blankIndex])) return parsed[blankIndex] as string[];
        return parsed as string[];
      }
    } catch { }
  }
  const raw = (item.options as unknown[])?.[blankIndex];
  if (typeof raw === 'string') return raw.split(', ');
  if (Array.isArray(item.options)) {
    if (Array.isArray((item.options as unknown[])[blankIndex])) return (item.options as unknown[])[blankIndex] as string[];
    return item.options as string[];
  }
  return [];
}
