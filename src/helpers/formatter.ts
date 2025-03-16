/**
 * Formatting utilities for CryptoVerifier bot
 */

export function convertToTelegramMarkdown(text: string): string {
  // First, escape special characters that need escaping in MarkdownV2
  const escapeChars = (str: string): string => {
    return str.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  };

  return text
    .split('\n')
    .map(line => escapeChars(line))
    .join('\n')
    // Then apply markdown formatting
    // Headers (convert to bold)
    .replace(/^\\\#\\\#\\\# (.*$)/gm, '*$1*')
    .replace(/^\\\#\\\# (.*$)/gm, '*$1*')
    .replace(/^\\\# (.*$)/gm, '*$1*')

    // Bold (already escaped * will be unescaped for actual formatting)
    .replace(/\\\*\\\*(.*?)\\\*\\\*/g, '*$1*')
    .replace(/\\_\\_(.*?)\\_\\\_/g, '*$1*')

    // Italic (already escaped * and _ will be unescaped for actual formatting)
    .replace(/\\\*(.*?)\\\*/g, '_$1_')
    .replace(/\\_(.*?)\\_/g, '_$1_')

    // Lists (escape bullet points)
    .replace(/^\\-\s+/gm, '• ')
    .replace(/^\d+\\\.\s+/gm, '• ')

    // Links (handle already escaped brackets and parentheses)
    .replace(/\\\[(.*?)\\\]\\\((.*?)\\\)/g, '[$1]($2)')

    // Remove multiple newlines
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Format templates for different types of security reports
 */

export const urlReportFormat = `### URL Security Analysis Report

## Overview
- URL: [URL]
- Domain: [DOMAIN]
- Status: [STATUS]
- Confidence: [CONFIDENCE]%

## Findings
[FINDINGS]

## Recommendations
[RECOMMENDATIONS]

---
Report generated [TIMESTAMP] via CryptoVerifier
`;

export const tokenReportFormat = `### Token Security Analysis Report

## Basic Information
- Token Name: [NAME]
- Symbol: [SYMBOL]
- Contract Address: [ADDRESS]
- Chain: [CHAIN]

## Security Assessment
- Risk Level: [RISK_LEVEL]
- Confidence: [CONFIDENCE]%

## Key Findings
[FINDINGS]

## Contract Analysis
- Verified: [VERIFIED]
- Has Mint Function: [MINT_FUNCTION]
- Transfer Restrictions: [TRANSFER_RESTRICTIONS]
- Honeypot Potential: [HONEYPOT]

## Market Data
- Liquidity: [LIQUIDITY]
- Holders: [HOLDERS]
- Ownership Concentration: [CONCENTRATION]%

## Recommendations
[RECOMMENDATIONS]

---
Report generated [TIMESTAMP] via CryptoVerifier
`;

export const messageReportFormat = `### Message Security Analysis Report

## Overview
- Status: [STATUS]
- Confidence: [CONFIDENCE]%

## Message Excerpt
"[EXCERPT]"

## Suspicious Indicators
[INDICATORS]

## Recommendations
[RECOMMENDATIONS]

---
Report generated [TIMESTAMP] via CryptoVerifier
`;
