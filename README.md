# CryptoVerifier: Telegram Scam Detection Agent

![a-circular-logo-with-a-deep-blue-shield-_STW75hXpR9GQcUMedTJaPQ_3oWw9DUfS3egT97Ofpor5Q 1](https://github.com/user-attachments/assets/99d7f81e-5612-4428-b2db-9e769e3c12e3)


## 🛡️ Project Overview
CryptoVerifier is a sophisticated Telegram bot designed to protect cryptocurrency users from scams, phishing attempts, and fraudulent projects. Using OpenServ's multi-agent architecture, the bot analyzes URLs, token addresses, smart contracts, and messages to identify potential threats and provide detailed security recommendations.

## ✨ Key Features

### 🔍 URL Security Analysis
- Domain reputation verification
- Phishing site detection with 90%+ accuracy
- Typosquatting identification (similar to legitimate domains)
- Content analysis for suspicious elements (wallet connection requests, etc.)
- Domain age and history verification
- Special handling for inaccessible or non-existent URLs

### 💰 Token Contract Analysis
- Smart contract code vulnerability detection
- Ownership concentration analysis
- Liquidity verification and monitoring
- Rugpull risk assessment
- Honeypot detection
- Invalid token address handling with explanatory details

### 💬 Message Phishing Detection
- Sophisticated scam pattern recognition
- Urgency tactics detection
- Sensitive information request identification
- Impersonation detection
- Contextual safety analysis for crypto-related messages
- Handles messages with and without URLs

### 📊 Comprehensive Security Reports
- Clear security status indicators
- Confidence/risk scoring
- User-friendly, actionable recommendations
- Telegram-formatted reports with proper styling
- Tailored to cryptocurrency users' needs

## 🚀 Unique Advantages

### Advanced Content Filtering
- Strict relevance filtering ensures all analysis and recommendations are directly related to the specific content
- Eliminates irrelevant CVEs, security articles, and general warnings
- Focused reports that address only the actual security concerns of the analyzed content

### Robust Error Handling
- Graceful handling of inaccessible URLs with meaningful analysis
- Clear explanations for invalid token addresses
- Continues analysis even when parts of the workflow encounter issues

### Multi-Stage Verification
- Multiple agents collaborate to verify findings
- Cross-checks information from different sources for accuracy
- Filters out false positives for more reliable results

## 🛠️ Technology Stack

- **Core Framework**: OpenServ SDK
- **Language**: TypeScript
- **Bot Interface**: Telegram Bot API
- **Validation**: Zod
- **Unique IDs**: UUID

## 🏗️ Architecture

### OpenServ Agent Collaboration

CryptoVerifier orchestrates multiple specialized agents:

1. **Main Coordinator**: CryptoVerifierAgent (Agent #280)
2. **URL Analysis**: 
   - Brave Search Assistant (Agent #171)
   - Webpage Content Reader (Agent #172)
3. **Deep Research**: EXA Agent (Agent #386)
4. **Token Analysis**: ETH Wallet Scanner (Agent #167)
5. **Data Processing**: JSON Parser (Agent #65)
6. **Report Generation**: Copywriter (Agent #41)

### Sequential Task Workflows

Each analysis request follows a specific workflow with multiple stages:

1. **Content Retrieval**: Safely fetching data about the URL/token/message
2. **Primary Analysis**: Identifying basic security indicators
3. **Deep Analysis**: Researching reputation and security history
4. **Comprehensive Assessment**: Combining all findings into a risk evaluation
5. **Report Generation**: Creating a user-friendly security report
6. **Delivery**: Sending the formatted report to the user via Telegram

## 📋 Usage Instructions

### Telegram Commands

- `/start` - Start the bot
- `/help` - Display help information
- `/check [content]` - Analyze a URL, token address, or message
- `/history` - View your analysis history

### Example Usages

#### URL Check
```
/check https://example-crypto-site.com
```

#### Token Analysis
```
/check 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

#### Message Analysis
```
/check Please validate your wallet by connecting to our site and sync your assets to prevent loss during the migration
```

## 🚦 Getting Started

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

## 🧩 How It Works

1. **User Submits Content**: Via Telegram using the `/check` command
2. **Content Classification**: System identifies if it's a URL, token address, or message
3. **Workflow Initiation**: The appropriate analysis workflow is started
4. **Multi-Agent Processing**: 
   - For URLs: Domain checks, content analysis, reputation research
   - For tokens: Contract analysis, transaction patterns, ownership verification
   - For messages: Pattern matching, URL extraction, phishing detection
5. **Report Generation**: Findings are combined into a comprehensive security report
6. **User Notification**: Security analysis is delivered to the user via Telegram

## 🔒 Privacy & Security

- Does not store user messages beyond analysis session
- Does not request private keys or wallet information
- All analysis is performed via secure API integrations
- Handles all data according to strict security principles

## 🔮 Future Enhancements

- Cross-platform support (Discord, Slack)
- Security alerts for trending scams
- Machine learning for pattern detection
- Community-driven scam database
- Custom alerts for specific tokens/domains

## 👥 Contributing

We welcome contributions to improve CryptoVerifier! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenServ Labs for the SDK framework
- The crypto security community for research and insights
- All contributors and testers who helped improve this project

---

Built with ❤️ to protect the crypto community from scams
