export function parseIntent(text: string) {
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, ''); // Remove diacritics

  // Optional: require "alfred" to avoid false positives
  if (!t.includes('alfred')) return { action: 'none' as const };

  const m1 = t.match(/reproduce\s+(.+?)\s+de\s+(.+)/);
  if (m1)
    return {
      action: 'play' as const,
      song: m1[1].trim(),
      artist: m1[2].trim(),
    };

  const m2 = t.match(/reproduce\s+(.+)/);
  if (m2) return { action: 'play' as const, song: m2[1].trim() };

  return { action: 'none' as const };
}
