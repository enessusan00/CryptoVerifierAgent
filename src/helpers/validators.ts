/**
 * Validator functions for CryptoVerifier input processing
 */

/**
 * Check if text is a valid URL
 * @param text - Text to check
 * @returns Whether text is a valid URL
 */
export function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if text is an Ethereum address
 * @param text - Text to check
 * @returns Whether text is a valid Ethereum address
 */
export function isEthereumAddress(text: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(text);
}

/**
 * Check if text contains common crypto scam patterns
 * @param text - Text to check
 * @returns Object with detection result and patterns found
 */
export function containsScamPatterns(text: string): { 
  containsPatterns: boolean; 
  patterns: string[];
} {
  const scamPatterns = [
    { pattern: /send.*\d+\s*(eth|btc|usdt).*receive.*\d+\s*(eth|btc|usdt)/i, description: "Send X to receive Y scam" },
    { pattern: /private key|recovery phrase|seed phrase/i, description: "Asking for private key or seed phrase" },
    { pattern: /(click|visit|check).*link.*to claim/i, description: "Link to claim tokens/rewards" },
    { pattern: /\bwhitelist\b.*\bopportunity\b/i, description: "Suspicious whitelist opportunity" },
    { pattern: /\bupgrade\b.*\bwallet\b/i, description: "Suspicious wallet upgrade request" },
    { pattern: /\bairdrop\b.*\bclaim\b.*\bconnect\b/i, description: "Suspicious airdrop claim" },
    { pattern: /\bvalidate\b.*\bwallet\b/i, description: "Wallet validation scam" },
    { pattern: /\bmigrate\b.*\btoken\b/i, description: "Token migration scam" }
  ];
  
  const lowerText = text.toLowerCase();
  const foundPatterns: string[] = [];
  
  for (const { pattern, description } of scamPatterns) {
    if (pattern.test(lowerText)) {
      foundPatterns.push(description);
    }
  }
  
  return {
    containsPatterns: foundPatterns.length > 0,
    patterns: foundPatterns
  };
}
