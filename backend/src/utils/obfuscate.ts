/**
 * Obfuscate an API key for display
 * Shows first 7 characters and last 4 characters
 * Example: sk-proj-abc123xyz -> sk-proj-...xyz
 */
export function obfuscateKey(key: string | null | undefined): string {
  if (!key || key.length < 12) {
    return '';
  }

  const start = key.substring(0, 7);
  const end = key.substring(key.length - 4);
  return `${start}...${end}`;
}
