// ── EOS Fixture Library Parser ──────────────────────────────────────────────
// Parses the official ETC EOS FixtureList.html into a searchable array.
// The HTML is served from /fixtures/FixtureList.html and parsed client-side once.

export interface EOSFixture {
  /** Manufacturer name */
  m: string;
  /** EOS Type string (exact model string for "Chan X Type Y Enter") */
  t: string;
  /** DMX footprint (channel count) */
  ch: number;
  /** Human-readable full name */
  n: string;
}

let cachedFixtures: EOSFixture[] | null = null;
let loadingPromise: Promise<EOSFixture[]> | null = null;

/**
 * Load and parse the EOS fixture library HTML.
 * Results are cached in memory after first load.
 */
export async function loadEOSFixtures(): Promise<EOSFixture[]> {
  if (cachedFixtures) return cachedFixtures;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const res = await fetch("/fixtures/FixtureList.html");
      if (!res.ok) throw new Error(`Failed to load fixture list: ${res.status}`);
      const html = await res.text();

      const fixtures: EOSFixture[] = [];
      // Each row: <tr><td>Manufacturer</td><td>Model</td><td>DMX</td><td>Cal</td><td>Full Name</td></tr>
      // Some rows have bgcolor attributes on td elements
      const rowRegex = /<tr><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>[^<]*<\/td><td[^>]*>([^<]*)<\/td><\/tr>/gi;
      let match;

      while ((match = rowRegex.exec(html)) !== null) {
        const manufacturer = match[1].trim();
        const model = match[2].trim();
        const dmx = parseInt(match[3].trim(), 10);
        const fullName = match[4].trim();

        // Skip header row and entries with 0 DMX footprint
        if (!model || model === "Model") continue;

        fixtures.push({
          m: manufacturer,
          t: model,
          ch: isNaN(dmx) ? 1 : dmx,
          n: fullName || model.replace(/_/g, " "),
        });
      }

      cachedFixtures = fixtures;
      return fixtures;
    } catch (err) {
      console.error("EOS fixture parser error:", err);
      loadingPromise = null;
      return [];
    }
  })();

  return loadingPromise;
}

/**
 * Search the EOS fixture library by query string.
 * Matches against manufacturer, model, and full name.
 * Returns top `limit` results.
 */
export function searchEOSFixtures(
  fixtures: EOSFixture[],
  query: string,
  limit = 50
): EOSFixture[] {
  if (!query.trim()) return fixtures.slice(0, limit);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  
  return fixtures
    .filter((f) => {
      const searchable = `${f.m} ${f.t} ${f.n}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    })
    .slice(0, limit);
}

/**
 * Extract the fixture-type portion from a natural language patching prompt.
 * E.g. "patch channel 2 address 3 fixture type mac 2000" → "mac 2000"
 *       "patch chan 5 type source four" → "source four"
 */
export function extractFixtureTypeFromPrompt(prompt: string): string | null {
  const match = prompt.match(/(?:fixture\s+)?type\s+(.+?)(?:\s+(?:at|on|to|address|addr|chan(?:nel)?|universe)\s|$)/i);
  if (match) return match[1].trim();
  // Also try end-of-string after "type"
  const endMatch = prompt.match(/(?:fixture\s+)?type\s+(.+)$/i);
  if (endMatch) return endMatch[1].trim();
  return null;
}

/**
 * Fuzzy match returning the top N scored fixtures.
 * Each result includes a normalized score (0–1).
 * Used for disambiguation when multiple fixtures match similarly.
 */
export function fuzzyMatchFixtures(
  fixtures: EOSFixture[],
  query: string,
  limit = 5
): Array<EOSFixture & { score: number }> {
  if (!query.trim()) return [];
  const q = query.toLowerCase().replace(/[_\-]/g, " ");
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: Array<EOSFixture & { score: number }> = [];

  for (const f of fixtures) {
    const searchable = `${f.m} ${f.t} ${f.n}`.toLowerCase().replace(/[_\-]/g, " ");
    let score = 0;
    for (const term of terms) {
      if (searchable.includes(term)) score++;
    }
    const normalized = score / terms.length;
    if (normalized >= 0.5) {
      scored.push({ ...f, score: normalized });
    }
  }

  // Sort by score desc, then by name length (prefer shorter/simpler names)
  scored.sort((a, b) => b.score - a.score || a.n.length - b.n.length);
  return scored.slice(0, limit);
}

/**
 * Fuzzy match a natural language fixture name to an EOS type string.
 * Used by voice/AI commands to resolve "source four" → "Src_Four_750"
 */
export function fuzzyMatchFixture(
  fixtures: EOSFixture[],
  query: string
): EOSFixture | null {
  if (!query.trim()) return null;
  const q = query.toLowerCase().replace(/[_\-]/g, " ");
  
  // Exact model match first
  const exact = fixtures.find((f) => f.t.toLowerCase() === q || f.n.toLowerCase() === q);
  if (exact) return exact;

  // Word-based scoring
  const terms = q.split(/\s+/).filter(Boolean);
  let bestScore = 0;
  let bestMatch: EOSFixture | null = null;

  for (const f of fixtures) {
    const searchable = `${f.m} ${f.t} ${f.n}`.toLowerCase().replace(/[_\-]/g, " ");
    let score = 0;
    for (const term of terms) {
      if (searchable.includes(term)) score++;
    }
    // Normalize by total terms
    const normalized = score / terms.length;
    if (normalized > bestScore && normalized >= 0.5) {
      bestScore = normalized;
      bestMatch = f;
    }
  }

  return bestMatch;
}
