# CryptoVerifier: Telegram Scam Detection Bot

## Project Overview
CryptoVerifier is a Telegram bot designed to protect cryptocurrency users from scams, phishing attempts, and fraudulent projects. By leveraging the OpenServ platform and its collaborative AI agent ecosystem, the bot analyzes URLs, token addresses, smart contracts, and messages to identify potential threats and provide security recommendations.

## Features

### URL Security Analysis
- Domain reputation checking
- Phishing site detection
- Content analysis for scam indicators
- Suspicious pattern matching
- Detailed security reports

### Token Contract Analysis
- Contract code analysis
- Liquidity and ownership verification
- Transaction pattern analysis
- Honeypot detection
- Risk assessment scoring

### Message Phishing Detection
- Pattern recognition
- Urgency detection
- Scam keyword identification
- Link extraction and analysis
- Comprehensive security assessment

### User-Friendly Reports
- Clear security recommendations
- Confidence scoring
- User-friendly language
- Detailed explanations
- Telegram-compatible formatting

## Technology Stack

- **Language**: TypeScript
- **Framework**: OpenServ SDK
- **Bot API**: node-telegram-bot-api
- **Validation**: Zod
- **Unique IDs**: UUID

## Architecture

### OpenServ Agent Collaboration

CryptoVerifier uses OpenServ's multi-agent architecture to perform comprehensive security analysis:

1. **Brave Search Assistant** (Agent #171): Performs web searches to check domain reputation
2. **Webpage Content Reader** (Agent #172): Safely reads website content for analysis
3. **Perplexity Research Assistant** (Agent #140): Performs detailed research on security aspects
4. **ETH Wallet Scanner** (Agent #167): Analyzes token contracts and transaction patterns
5. **JSON Parser** (Agent #65): Processes and extracts data from analysis results
6. **Copywriter** (Agent #41): Generates well-formatted security reports

### Sequential Task Workflows

Each analysis request follows a specific sequential workflow:

1. **URL Analysis Workflow**:
   - Web search for domain reputation
   - Safe content extraction
   - Detailed security research
   - Report generation
   - Telegram notification

2. **Token Analysis Workflow**:
   - Contract scanning
   - Reputation research
   - Transaction pattern analysis
   - Security report generation
   - Telegram notification

3. **Message Analysis Workflow**:
   - URL extraction
   - Content analysis
   - Scam pattern detection
   - Security report generation
   - Telegram notification

## Getting Started

### Prerequisites
- Node.js (v18+)
- OpenServ API key
- Telegram Bot token (from BotFather)
- A workspace ID on the OpenServ platform

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-verifier-openserv.git
cd crypto-verifier-openserv
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file and add your API keys and configuration, including:
- OPENSERV_API_KEY
- TELEGRAM_BOT_TOKEN
- WORKSPACE_ID

4. Build the project:
```bash
npm run build
```

5. Start the bot:
```bash
npm start
```

## Usage

### Telegram Commands

- `/start` - Start the bot
- `/help` - Display help information
- `/check [content]` - Analyze a URL, token address, or message
- `/report [content]` - Report a scam to the database
- `/history` - View your analysis history

### Example Usages

#### URL Check
```
/check https://example-crypto-scam.com
```

#### Token Analysis
```
/check 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

#### Message Analysis
```
/check Please validate your wallet by connecting to our site and sync your assets to prevent loss during the migration
```

## Future Enhancements

- Persistent database for scam reporting and history
- Enhanced agent collaboration with more specialized agents
- Real-time token price and liquidity monitoring
- Community reporting mechanism
- Multi-platform support (Discord, Slack)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenServ Labs for the SDK framework
- The crypto security community for research and insights

---

Built with ❤️ to protect the crypto community from scams
