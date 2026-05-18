export function buildAllowedOrigins(frontendUrl: string, rawOrigins?: string): string[] {
  const configuredOrigins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([frontendUrl, ...(configuredOrigins ?? [])]));
}
