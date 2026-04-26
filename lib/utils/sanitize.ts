const MAX_QUERY_LENGTH = 500;
const DANGEROUS = /<script|javascript:|on\w+\s*=/gi;

/**
 * Sanitizes and length-limits a user query before sending to any external API.
 * @param raw  Raw user input
 * @returns    Sanitized string safe for API use
 * @throws     Error if query is empty after sanitization
 */
export function sanitizeQuery(raw: string): string {
  const trimmed = raw.trim().replace(DANGEROUS, '').slice(0, MAX_QUERY_LENGTH);
  if (!trimmed) throw new Error("Query is empty after sanitization.");
  return trimmed;
}
