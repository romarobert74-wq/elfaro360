import "server-only";

/**
 * Rate limit básico en memoria (por instancia). Suficiente para frenar abusos
 * de envío de selección. No es distribuido: en serverless puede reiniciarse,
 * pero cubre ráfagas desde un mismo token.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false; // bloqueado
  }
  arr.push(now);
  hits.set(key, arr);
  return true; // permitido
}
