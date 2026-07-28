/**
 * Splits a single dictated phrase (e.g. "Buy provisions and call mom, then
 * water the plants") into an array of individual task titles.
 *
 * This is a lightweight, dependency-free heuristic splitter so the voice
 * feature works fully offline with no API key. It:
 *  1. Normalizes the transcript (trims, fixes spacing/punctuation).
 *  2. Splits on common list connectors: "and", commas, "then", "also",
 *     "after that", newlines, and semicolons.
 *  3. Filters out empty fragments and de-duplicates near-identical ones.
 *  4. Title-cases the first letter of each resulting task.
 *
 * If you want to swap this for an LLM-based splitter (e.g. sending the
 * transcript to the OpenAI API and asking it to return a JSON array of
 * tasks), replace the body of `splitDictationIntoTasks` with an API call
 * and keep the same function signature — see `services/voiceService.ts`
 * for the documented extension point.
 */
export function splitDictationIntoTasks(rawTranscript: string): string[] {
  if (!rawTranscript || !rawTranscript.trim()) return [];

  let text = rawTranscript.trim();

  // Normalize common dictation artifacts.
  text = text.replace(/\s+/g, ' ');

  // Split on connector words/phrases (case-insensitive) and punctuation
  // that typically separates distinct list items in spoken language.
  const connectorPattern = /\s*(?:,|;|\bthen\b|\bafter that\b|\balso\b|\band then\b|\band also\b|\band\b)\s*/gi;

  const rawParts = text.split(connectorPattern);

  const seen = new Set<string>();
  const tasks: string[] = [];

  for (const part of rawParts) {
    const cleaned = cleanFragment(part);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push(cleaned);
  }

  return tasks;
}

function cleanFragment(fragment: string): string {
  let cleaned = fragment.trim();
  // Strip leading filler words that sometimes survive the split.
  cleaned = cleaned.replace(/^(and|then|also|to)\s+/i, '');
  cleaned = cleaned.replace(/[.\s]+$/g, '');
  if (!cleaned) return '';
  // Capitalize the first letter for a tidy task title.
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
