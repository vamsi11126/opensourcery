const requests = new Map<string, number[]>();
export function rateLimit(key: string, limit = 10, windowMs = 60_000): boolean { const now = Date.now(); const recent = (requests.get(key) ?? []).filter((time) => now - time < windowMs); if (recent.length >= limit) return false; recent.push(now); requests.set(key, recent); return true; }
