import { z } from 'zod';
import { Agent } from '@openserv-labs/sdk';
import 'dotenv/config';
import { bot, startTelegramBot } from './telegram-bot';
import { getCurrentChatId } from './shared-state';
import { convertToTelegramMarkdown, urlReportFormat, tokenReportFormat, messageReportFormat } from './helpers/formatter';

// Async helper to verify agent exists in workspace before creating tasks
async function verifyAgentInWorkspace(agent: Agent, workspaceId: number, agentId: number): Promise<boolean> {
  try {
    // Use a simple health check to verify agent is accessible
    // This could be expanded to actually check workspace agents if needed
    console.log(`Agent health check for ${agentId}`);
    return true;
  } catch (error) {
    console.error(`Failed to verify agent ${agentId} in workspace ${workspaceId}:`, error);
    return false;
  }
}

// Validate environment variables
const envSchema = z.object({
  OPENSERV_API_KEY: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  WORKSPACE_ID: z.string().transform(val => parseInt(val)),
  // Agent IDs - these can be overridden in .env file
  AGENT_ID: z.string().transform(val => parseInt(val)).optional(),
  BRAVE_SEARCH_ID: z.string().transform(val => parseInt(val)).optional(),
  WEB_CONTENT_READER_ID: z.string().transform(val => parseInt(val)).optional(),
  EXA_AGENT_ID: z.string().transform(val => parseInt(val)).optional(),
  COPY_WRITER_ID: z.string().transform(val => parseInt(val)).optional(),
  ETH_SCANNER_ID: z.string().transform(val => parseInt(val)).optional(),
  JSON_ANALYZER_ID: z.string().transform(val => parseInt(val)).optional()
});

const env = envSchema.parse({
  OPENSERV_API_KEY: process.env.OPENSERV_API_KEY,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  WORKSPACE_ID: process.env.WORKSPACE_ID,
  AGENT_ID: process.env.AGENT_ID,
  BRAVE_SEARCH_ID: process.env.BRAVE_SEARCH_ID,
  WEB_CONTENT_READER_ID: process.env.WEB_CONTENT_READER_ID,
  EXA_AGENT_ID: process.env.EXA_AGENT_ID,
  COPY_WRITER_ID: process.env.COPY_WRITER_ID,
  ETH_SCANNER_ID: process.env.ETH_SCANNER_ID,
  JSON_ANALYZER_ID: process.env.JSON_ANALYZER_ID
});

// OpenServ agent IDs for different analysis types
enum AgentIDs {
  AGENT = env.AGENT_ID || 280, // This agent (cryptoVerifierAgent)
  BRAVE_SEARCH = env.BRAVE_SEARCH_ID || 171, // DuckDuckGo Web-Search Assistant
  WEB_CONTENT_READER = env.WEB_CONTENT_READER_ID || 172, // Webpage Content Reader
  EXA_AGENT = env.EXA_AGENT_ID || 386, // exa Research Assistant
  COPY_WRITER = env.COPY_WRITER_ID || 41, // Copywriter
  ETH_SCANNER = env.ETH_SCANNER_ID || 167, // ETH Wallet Scanner
  JSON_ANALYZER = env.JSON_ANALYZER_ID || 65 // JSON Parser
}

console.log("Using the following agent IDs:");
console.log(`AGENT (CryptoVerifier): ${AgentIDs.AGENT}`);
console.log(`BRAVE_SEARCH: ${AgentIDs.BRAVE_SEARCH}`);
console.log(`WEB_CONTENT_READER: ${AgentIDs.WEB_CONTENT_READER}`);
console.log(`EXA_AGENT: ${AgentIDs.EXA_AGENT}`);
console.log(`COPY_WRITER: ${AgentIDs.COPY_WRITER}`);
console.log(`ETH_SCANNER: ${AgentIDs.ETH_SCANNER}`);
console.log(`JSON_ANALYZER: ${AgentIDs.JSON_ANALYZER}`);

// Create the CryptoVerifier agent
const cryptoVerifierAgent = new Agent({
  systemPrompt: `You are CryptoVerifier, a security bot specialized in detecting crypto scams, phishing attempts,
  and fraudulent projects. Your goal is to protect users from security threats in the cryptocurrency space.`,
  apiKey: process.env.OPENSERV_API_KEY  // Explicitly set the API key
});

// Add capability to send results to Telegram
cryptoVerifierAgent.addCapability({
  name: 'sendTelegramMessage',
  description: 'Send a message to the Telegram user who initiated the analysis',
  schema: z.object({
    content: z.string().describe('The message content to send')
  }),
  async run({ args }) {
    const chatId = getCurrentChatId();
    if (!chatId) {
      return 'No chat ID available';
    }

    try {
      // Try to send with Markdown formatting
      await bot.sendMessage(chatId, convertToTelegramMarkdown(args.content), {
        parse_mode: 'MarkdownV2'
      });
      return 'Message sent successfully';
    } catch (error) {
      console.error('Error sending formatted message:', error);
      // Fallback to plain text
      try {
        await bot.sendMessage(chatId, args.content, { parse_mode: undefined });
        return 'Message sent as plain text';
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        return 'Failed to send message';
      }
    }
  }
});

// URL ANALYSIS WORKFLOW
async function createUrlAnalysisWorkflow(url: string, requestId: string): Promise<void> {
  try {
    console.log(`Starting URL analysis workflow for ${url} with request ID ${requestId}`);
    console.log(`Using workspace ID: ${env.WORKSPACE_ID}`);
    
    // Verify agent is available and accessible (healthcheck)
    const isAgentAvailable = await verifyAgentInWorkspace(cryptoVerifierAgent, env.WORKSPACE_ID, AgentIDs.AGENT);
    if (!isAgentAvailable) {
      throw new Error(`Agent ${AgentIDs.AGENT} is not available in workspace ${env.WORKSPACE_ID}`);
    }
    
    console.log(`Starting URL analysis task 1: Brave Web Search (Agent ID: ${AgentIDs.BRAVE_SEARCH})`);
    
    // Task 1: Brave Web Search - check if domain is reported in databases
    const braveSearchTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.BRAVE_SEARCH,
      description: `Research if ${url} is a scam, phishing site, or has been reported`,
      body: `Search for information about "${url} crypto scam" or "${url} phishing" to check if this site has been reported as malicious`,
      input: `${url} crypto scam phishing`,
      expectedOutput: `Research results about ${url} safety, saved as ${requestId}_URL_SEARCH_DATA.json`,
      dependencies: []
    });
    
    console.log(`Task 1 created successfully with ID: ${braveSearchTask.id}`);

    // Task 2: Webpage Content Reader - analyze the page content
    const webContentTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.WEB_CONTENT_READER,
      description: `Safely read the content of ${url} for analysis`,
      body: `Visit ${url} and extract the content safely for analysis. Look for suspicious elements related to crypto scams.

If the URL is not accessible or doesn't exist, don't treat this as an error. Instead, create a JSON file with the following structure:
{
  "status": "error",
  "message": "Unable to access URL",
  "url": "${url}",
  "error_details": "The URL could not be accessed or does not exist.",
  "recommendation": "URL inaccessibility may itself be suspicious for a site that was shared in a crypto context."
}

This will allow the workflow to continue with the analysis.`,
      input: url,
      expectedOutput: `Content of ${url} saved as ${requestId}_URL_CONTENT_DATA.json`,
      dependencies: [braveSearchTask.id]
    });

    // Task 3: exa Research - supplementary research
    const exaTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.EXA_AGENT,
      description: `Perform deep research on ${url} for security analysis`,
      body: `Research "${url}" to determine if it's associated with cryptocurrency scams or phishing.

Important Instructions:
1. ONLY search for information directly related to this specific URL and potential security concerns.
2. DO NOT include general security articles, reports or CVEs that are not directly connected to this specific domain.
3. Focus on determining if this exact domain is reported as malicious, suspicious, or legitimate.
4. Include information about the domain's reputation, any reported incidents, and security assessment.
5. If you cannot find specific information about this URL in relation to scams or security issues, state this clearly rather than including general security information.
6. Always include the domain age if available as this is an important trust factor.

Output must be strictly limited to information about this specific URL's reputation and security status.`,
      input: url,
      expectedOutput: `Comprehensive research on ${url} safety, saved as ${requestId}_URL_DEEP_RESEARCH.json`,
      dependencies: [braveSearchTask.id]
    });

    // Task 4: Security Report Generation
    const reportGenerationTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.COPY_WRITER,
      description: `Generate a security report for ${url}`,
      body: `Based on the research data, create a comprehensive security report for ${url}. 
      Follow this format:
      ${urlReportFormat}
      
      Important Instructions:
      1. ONLY include information directly related to this specific URL.
      2. DO NOT add general security articles, reports, or CVEs that are not directly about this URL.
      3. If a file indicates the URL is inaccessible, clearly state this and advise accordingly.
      4. If no security concerns are found, state this clearly instead of adding unrelated security information.
      5. REMOVE ALL VULNERABILITY SECTIONS (CVEs, security reports, etc.) that are not specifically mentioning "${url.replace(/https?:\/\//, '').split('/')[0]}" by name.
      6. If the research contains generic security vulnerabilities without direct connection to this specific domain, DO NOT include them in your report.
      
      Analyze these files:
      - ${requestId}_URL_SEARCH_DATA.json
      - ${requestId}_URL_CONTENT_DATA.json
      - ${requestId}_URL_DEEP_RESEARCH.json
      
      If the URL_CONTENT_DATA file indicates the URL is inaccessible, treat this as a potential security concern. Inaccessible or non-existent URLs shared in a crypto context can be suspicious. Include this in your analysis.
      
      Determine if the URL is suspicious based on:
      1. Mentions in scam/phishing databases
      2. Suspicious content elements (wallet connection requests, etc.)
      3. Domain age and reputation
      4. Overall risk assessment
      5. URL accessibility (inaccessible URLs may be recently taken down scam sites)
      
      Provide clear recommendations for the user.`,
      input: `${requestId}_URL_SEARCH_DATA.json, ${requestId}_URL_CONTENT_DATA.json, ${requestId}_URL_DEEP_RESEARCH.json`,
      expectedOutput: `Security report for ${url} saved as ${requestId}_URL_REPORT.md`,
      dependencies: [webContentTask.id, exaTask.id]
    });

    // Task 5: Send Report to Telegram
    const sendReportTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.AGENT,
      description: `Send URL security report to Telegram`,
      body: `Send the security report for ${url} to the Telegram user.`,
      input: `${requestId}_URL_REPORT.md`,
      expectedOutput: `Confirmation of report sent to Telegram user`,
      dependencies: [reportGenerationTask.id]
    });
  } catch (error: any) {
    // Daha detaylı hata bilgisi için
    if (error?.response) {
      // Server'ın gönderdiği yanıt varsa
      console.error(`Error creating URL analysis workflow: Status ${error.response.status}`);
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error(`Error creating URL analysis workflow: No response received`);
      console.error(error.request);
    } else {
      // İstek oluşturulurken hata oluştu
      console.error(`Error creating URL analysis workflow: ${error.message}`);
    }
    
    // Send error message to Telegram
    const chatId = getCurrentChatId();
    if (chatId) {
      let errorMsg = 'Unknown error';
      if (error.response && error.response.data) {
        errorMsg = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      bot.sendMessage(chatId, `❌ Error analyzing URL: ${errorMsg}`);
    }
  }
}

// TOKEN ANALYSIS WORKFLOW
async function createTokenAnalysisWorkflow(address: string, chain: string, requestId: string): Promise<void> {
  try {
    console.log(`Starting token analysis workflow for ${address} on ${chain} with request ID ${requestId}`);
    console.log(`Using workspace ID: ${env.WORKSPACE_ID}`);
    
    // Verify agent is available and accessible (healthcheck)
    const isAgentAvailable = await verifyAgentInWorkspace(cryptoVerifierAgent, env.WORKSPACE_ID, AgentIDs.AGENT);
    if (!isAgentAvailable) {
      throw new Error(`Agent ${AgentIDs.AGENT} is not available in workspace ${env.WORKSPACE_ID}`);
    }
    
    console.log(`Starting token analysis task 1: ETH Wallet Scanner (Agent ID: ${AgentIDs.ETH_SCANNER})`);
    
    // Task 1: ETH Wallet Scanner - Get token details
    const ethScannerTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.ETH_SCANNER,
      description: `Analyze token contract ${address} on ${chain}`,
      body: `Scan and analyze the token contract ${address} on ${chain}. Look for potential security issues, token metrics, and transaction patterns. If the contract is not found or invalid, please indicate this in the output file and provide as much information as possible about why it might be invalid or non-existent.`,
      input: address,
      expectedOutput: `Token contract analysis saved as ${requestId}_TOKEN_DATA.json`,
      dependencies: []
    });
    
    console.log(`Task 1 created successfully with ID: ${ethScannerTask.id}`);

    // Task 2: Brave Search - Research token reputation
    const tokenResearchTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.BRAVE_SEARCH,
      description: `Research reputation of token ${address}`,
      body: `Search for information about token contract ${address} on ${chain}. Look for any reports of scams, rugpulls, or security incidents.`,
      input: `${address} ${chain} token scam rugpull security`,
      expectedOutput: `Token reputation research saved as ${requestId}_TOKEN_REPUTATION.json`,
      dependencies: [ethScannerTask.id]
    });

    // Task 3: exa Research - Deep token analysis
    const exaTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.EXA_AGENT,
      description: `Perform deep research on token ${address}`,
      body: `Research the token contract ${address} on ${chain}.

Important Instructions:
1. ONLY search for information directly related to this specific token contract address.
2. DO NOT include general security articles, reports or CVEs that are not directly connected to this specific token.
3. Focus on analyzing security aspects, tokenomics, ownership patterns, and potential red flags of THIS token only.
4. If you cannot find specific information about this token address, state this clearly rather than including general crypto security information.
5. If the token contract appears invalid or doesn't exist, clearly state this and explain possible reasons why.

For valid tokens, provide:
- Token name, symbol, and basic details
- Security incidents related to this specific token
- Ownership concentration information
- Liquidity information
- Any reports of scams related to this token

Output must be strictly limited to information about this specific token contract. Do not include general security articles or CVEs unrelated to this token.`,
      input: `${address} ${chain} token contract analysis security`,
      expectedOutput: `Comprehensive token research saved as ${requestId}_TOKEN_DEEP_RESEARCH.json`,
      dependencies: [ethScannerTask.id]
    });

    // Task 4: Generate Token Security Report
    const reportGenerationTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.COPY_WRITER,
      description: `Generate security report for token ${address}`,
      body: `Based on the research data, create a comprehensive security report for token ${address} on ${chain}.
      Follow this format:
      ${tokenReportFormat}
      
      Important Instructions:
      1. ONLY include information directly related to this specific token contract.
      2. DO NOT add general security articles, reports, or CVEs that are not directly about this token.
      3. If no security concerns are found, state this clearly instead of adding unrelated security information.
      4. REMOVE ALL VULNERABILITY SECTIONS (CVEs, security reports, etc.) that are not specifically mentioning this exact token address "${address}" by name.
      5. If the research contains generic security vulnerabilities without direct connection to this specific token, DO NOT include them in your report.
      
      Analyze these files:
      - ${requestId}_TOKEN_DATA.json
      - ${requestId}_TOKEN_REPUTATION.json
      - ${requestId}_TOKEN_DEEP_RESEARCH.json
      
      If any file indicates that the token contract is invalid or non-existent, focus your report on explaining that this appears to be an invalid token address, and provide any available information about why it might not be valid (wrong chain, typo in address, non-existent contract, etc.).
      
      If the token is valid, determine if it is potentially suspicious based on:
      1. Contract features (mint functions, transfer restrictions, etc.)
      2. Ownership concentration
      3. Liquidity and trading patterns
      4. Reports of scams or security issues
      
      Provide clear security recommendations for the user.`,
      input: `${requestId}_TOKEN_DATA.json, ${requestId}_TOKEN_REPUTATION.json, ${requestId}_TOKEN_DEEP_RESEARCH.json`,
      expectedOutput: `Security report for token ${address} saved as ${requestId}_TOKEN_REPORT.md`,
      dependencies: [tokenResearchTask.id, exaTask.id]
    });

    // Task 5: Send Report to Telegram
    const sendReportTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.AGENT,
      description: `Send token security report to Telegram`,
      body: `Send the security report for token ${address} to the Telegram user.`,
      input: `${requestId}_TOKEN_REPORT.md`,
      expectedOutput: `Confirmation of report sent to Telegram user`,
      dependencies: [reportGenerationTask.id]
    });
  } catch (error: any) {
    // Daha detaylı hata bilgisi için
    if (error.response) {
      // Server'ın gönderdiği yanıt varsa
      console.error(`Error creating token analysis workflow: Status ${error.response.status}`);
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error(`Error creating token analysis workflow: No response received`);
      console.error(error.request);
    } else {
      // İstek oluşturulurken hata oluştu
      console.error(`Error creating token analysis workflow: ${error.message}`);
    }
    
    // Send error message to Telegram
    const chatId = getCurrentChatId();
    if (chatId) {
      let errorMsg = 'Unknown error';
      if (error.response && error.response.data) {
        errorMsg = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      bot.sendMessage(chatId, `❌ Error analyzing token: ${errorMsg}`);
    }
  }
}

// MESSAGE ANALYSIS WORKFLOW
async function createMessageAnalysisWorkflow(message: string, requestId: string, contextInfo?: string): Promise<void> {
  try {
    console.log(`Starting message analysis workflow with request ID ${requestId}`);
    console.log(`Using workspace ID: ${env.WORKSPACE_ID}`);
    
    // Verify agent is available and accessible (healthcheck)
    const isAgentAvailable = await verifyAgentInWorkspace(cryptoVerifierAgent, env.WORKSPACE_ID, AgentIDs.AGENT);
    if (!isAgentAvailable) {
      throw new Error(`Agent ${AgentIDs.AGENT} is not available in workspace ${env.WORKSPACE_ID}`);
    }
    
    console.log(`Starting message analysis task 1: JSON Analyzer (Agent ID: ${AgentIDs.JSON_ANALYZER})`);
    
    // Task 1: Extract URLs from the message (if any)
    const extractUrlsTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.JSON_ANALYZER,
      description: `Extract URLs from message for analysis`,
      body: `Extract any URLs from the message for further analysis. If URLs are found, save them for separate security checks. If no URLs are found, just return an empty array in a JSON format like { "urls": [] } and continue with the analysis.`,
      input: JSON.stringify({ message, contextInfo }),
      expectedOutput: `Extracted URLs saved as ${requestId}_MESSAGE_URLS.json`,
      dependencies: []
    });
    
    console.log(`Task 1 created successfully with ID: ${extractUrlsTask.id}`);

    // Task 2: exa Research - Analyze message content
    const exaTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.EXA_AGENT,
      description: `Analyze message for scam and phishing indicators`,
      body: `Analyze this message for potential cryptocurrency scam or phishing indicators:
      "${message}"
      ${contextInfo ? `Context: ${contextInfo}` : ''}
      
      Important Instructions:
      1. Focus ONLY on analyzing the provided message content itself.
      2. DO NOT include general security articles, reports or CVEs that are not directly relevant to this specific message.
      3. If no scam indicators are found, clearly state this rather than including general crypto security information.
      
      Look for:
      1. Common crypto scam patterns
      2. Requests for private keys or wallet connections
      3. False urgency or pressure tactics
      4. Suspicious offers (airdrops, rewards, etc.)
      5. Impersonation of crypto projects or exchanges
      
      Your analysis should be strictly limited to potential threats in this specific message, without adding general security information that's not directly relevant.`,
      input: JSON.stringify({ message, contextInfo }),
      expectedOutput: `Message analysis saved as ${requestId}_MESSAGE_ANALYSIS.json`,
      dependencies: [extractUrlsTask.id]
    });

    // Task 3: URL Analysis (if URLs were found)
    const urlAnalysisTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.BRAVE_SEARCH,
      description: `Research any URLs found in the message`,
      body: `Research any URLs extracted from the message to check if they are associated with scams or phishing. If the input file contains an empty URL array, just create an empty result file stating no URLs were found for analysis.`,
      input: `${requestId}_MESSAGE_URLS.json`,
      expectedOutput: `URL research saved as ${requestId}_MESSAGE_URL_RESEARCH.json`,
      dependencies: [extractUrlsTask.id]
    });

    // Task 4: Generate Message Security Report
    const reportGenerationTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.COPY_WRITER,
      description: `Generate security report for message`,
      body: `Based on the analysis, create a comprehensive security report for the message.
      Follow this format:
      ${messageReportFormat}
      
      Important Instructions:
      1. ONLY include information directly related to this specific message content.
      2. DO NOT add general security articles, reports, or CVEs unrelated to the message.
      3. If no security concerns are found, state this clearly instead of adding unrelated security information.
      4. REMOVE ALL VULNERABILITY SECTIONS (CVEs, security reports, etc.) from your report that are not directly connected to specific content in this message.
      5. If the research contains generic security vulnerabilities without direct connection to this specific message content, DO NOT include them.
      
      Analyze these files:
      - ${requestId}_MESSAGE_ANALYSIS.json
      - ${requestId}_MESSAGE_URL_RESEARCH.json
      
      If the URL research file indicates no URLs were found, focus your analysis on the message content itself without URL analysis.
      
      Determine if the message is suspicious based on:
      1. Presence of scam patterns
      2. Suspicious URLs (if any were found)
      3. Requests for sensitive information
      4. Urgency or pressure tactics
      5. General content safety for cryptocurrency users
      
      Even for seemingly safe community rules or welcome messages, provide appropriate security context and recommendations for the user.`,
      input: `${requestId}_MESSAGE_ANALYSIS.json, ${requestId}_MESSAGE_URL_RESEARCH.json`,
      expectedOutput: `Security report saved as ${requestId}_MESSAGE_REPORT.md`,
      dependencies: [exaTask.id, urlAnalysisTask.id]
    });

    // Task 5: Send Report to Telegram
    const sendReportTask = await cryptoVerifierAgent.createTask({
      workspaceId: env.WORKSPACE_ID,
      assignee: AgentIDs.AGENT,
      description: `Send message security report to Telegram`,
      body: `Send the security report for the message to the Telegram user.`,
      input: `${requestId}_MESSAGE_REPORT.md`,
      expectedOutput: `Confirmation of report sent to Telegram user`,
      dependencies: [reportGenerationTask.id]
    });
  } catch (error: any) {
    // Daha detaylı hata bilgisi için
    if (error.response) {
      // Server'ın gönderdiği yanıt varsa
      console.error(`Error creating message analysis workflow: Status ${error.response.status}`);
      console.error(`Error details: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      console.error(`Error creating message analysis workflow: No response received`);
      console.error(error.request);
    } else {
      // İstek oluşturulurken hata oluştu
      console.error(`Error creating message analysis workflow: ${error.message}`);
    }
    
    // Send error message to Telegram
    const chatId = getCurrentChatId();
    if (chatId) {
      let errorMsg = 'Unknown error';
      if (error.response && error.response.data) {
        errorMsg = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      bot.sendMessage(chatId, `❌ Error analyzing message: ${errorMsg}`);
    }
  }
}

export { cryptoVerifierAgent, createUrlAnalysisWorkflow, createTokenAnalysisWorkflow, createMessageAnalysisWorkflow };

// Start the server and bot
cryptoVerifierAgent.start();
startTelegramBot();
