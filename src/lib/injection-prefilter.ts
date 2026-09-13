/**
 * Secondary pre-filter for prompt-injection attempts.
 *
 * The LLM-based classifier in moderation.ts reliably blocks injection attempts
 * (approved=false) but does not always return a 'prompt-injection-attempt' flag
 * in its structured output — it sometimes just returns approved=false without
 * a specific flag. This is probabilistic and LLM-model-dependent.
 *
 * As a defense-in-depth layer independent of the LLM, this regex scanner runs
 * BEFORE the OpenAI call and injects 'prompt-injection-attempt' into the flags
 * array if any of the known injection patterns match. This ensures:
 * 1. The hard veto in checkContent() fires reliably, even if the LLM doesn't
 *    explicitly flag the attempt in its response.
 * 2. The flag appears in audit logs regardless of LLM behavior.
 * 3. A future LLM model change or regression cannot accidentally approve an
 *    injection attempt that matches these patterns.
 *
 * This is intentionally conservative — false positives here cause a submission
 * to be flagged (manual review), not silently approved. False negatives are
 * caught by the LLM layer.
 */

/**
 * Known injection patterns — covers common attack vectors without being so
 * broad that they catch legitimate developer content.
 */
const INJECTION_PATTERNS: RegExp[] = [
  // Classic instruction override
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/i,
  // Fake boundary / end-of-prompt attacks
  /---\s*end\s+(submission|prompt|context|system)\s*---/i,
  // Simulated assistant turn injection
  /^assistant\s*:/im,
  /\bassistant:\s*(understood|i will|i'll|i'll|certainly|of course)/i,
  // System message impersonation
  /^system\s*:/im,
  /\bsystem\s*:\s*(the above|this is|ignore)/i,
  // Explicit instruction to override behavior
  /you\s+must\s+(return|output|respond|approve|mark)/i,
  /return\s+\{[^}]*"isClean"\s*:\s*true[^}]*"approved"\s*:\s*true/i,
  // Fake moderator/admin claim
  /\b(i am|this is)\s+(an?\s+)?(admin|moderator|system|operator)\b/i,
  // "Disregard" variants
  /\bdisregard\s+(all\s+)?(previous|above|prior|your)\s+(instructions?|rules?|guidelines?)/i,
  // Jailbreak preamble
  /\bDAN\b|\bDo Anything Now\b/i,
];

/**
 * Checks text for known prompt-injection patterns before the LLM call.
 *
 * @param text The concatenated submission text to check
 * @returns    true if an injection pattern was detected
 */
export function detectInjectionAttempt(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}
