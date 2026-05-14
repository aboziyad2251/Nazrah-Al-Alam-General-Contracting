/**
 * Token-based pricing table (USD per 1 million tokens).
 * Sources: Anthropic / Google AI pricing pages.
 * Update when providers change rates.
 */
export interface ModelPrice {
  input: number; // USD per 1M input tokens
  output: number; // USD per 1M output tokens
}

export const PRICING: Record<string, ModelPrice> = {
  // Anthropic
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5': { input: 0.8, output: 4.0 },

  // Google Gemini
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
};

/**
 * Returns cost in USD for a single model call.
 * @param model  The model identifier used in routing
 * @param tokensIn   Input (prompt) token count
 * @param tokensOut  Output (completion) token count
 */
export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const price = PRICING[model];
  if (!price) return 0;
  const cost = (tokensIn / 1_000_000) * price.input + (tokensOut / 1_000_000) * price.output;
  // Round to 8 decimal places to avoid floating-point noise
  return Math.round(cost * 1e8) / 1e8;
}

/** Human-readable cost string, e.g. "$0.00234" */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(6)}`;
}
