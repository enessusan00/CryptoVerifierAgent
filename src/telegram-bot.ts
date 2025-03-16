import TelegramBot from 'node-telegram-bot-api';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { isUrl, isEthereumAddress, containsScamPatterns } from './helpers/validators';
import { createUrlAnalysisWorkflow, createTokenAnalysisWorkflow, createMessageAnalysisWorkflow } from './index';
import { setCurrentChatId, updateUserSession, getUserAnalysisHistory } from './shared-state';

// Environment variables validation
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1)
});

// Validate environment variables
const env = envSchema.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
});

/**
 * Generate a short UUID for tracking analysis requests
 */
function generateShortUuid(): string {
  return uuidv4().split('-')[0].substring(0, 5).toUpperCase();
}

// Initialize Telegram bot
export const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

/**
 * Start the Telegram bot and set up message handlers
 */
export function startTelegramBot(): void {
  console.log('Starting CryptoVerifier Telegram bot...');

  // Setup bot commands
  bot.setMyCommands([
    { command: '/start', description: 'Start the bot' },
    { command: '/help', description: 'Get help information' },
    { command: '/check', description: 'Check a URL, token address, or message for scams' },
    { command: '/report', description: 'Report a scam to our database' },
    { command: '/history', description: 'View your analysis history' }
  ]);

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `Welcome to CryptoVerifier Bot! 🛡️\n\nI'll help protect you from crypto scams, phishing attempts, and fraudulent projects.\n\nUse /check followed by a URL, token address, or message to scan for potential threats.`
    );
  });

  // Handle /help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `CryptoVerifier Bot Help 🔍\n\nCommands:\n/start - Start the bot\n/help - Show this help message\n/check [content] - Check a URL, token address, or message for scams\n/report [content] - Report a scam\n/history - View your analysis history\n\nYou can also forward suspicious messages directly to me for analysis.`
    );
  });

  // Handle /check command
  bot.onText(/\/check (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const contentToCheck = match ? match[1].trim() : '';
    
    if (!contentToCheck) {
      await bot.sendMessage(chatId, "Please provide content to check. Example: /check https://example.com");
      return;
    }

    // Send "checking" message
    const checkingMsg = await bot.sendMessage(chatId, "🔍 Checking for potential threats...");
    
    try {
      setCurrentChatId(chatId);
      const requestId = generateShortUuid();
      
      // Determine content type and use appropriate workflow
      if (isUrl(contentToCheck)) {
        updateUserSession(chatId, { id: requestId, type: 'url', content: contentToCheck });
        await bot.sendMessage(chatId, `Analyzing URL (ID: ${requestId}). This may take a few moments...`);
        
        // Start the URL analysis workflow
        await createUrlAnalysisWorkflow(contentToCheck, requestId);
      } 
      else if (isEthereumAddress(contentToCheck)) {
        updateUserSession(chatId, { id: requestId, type: 'token', content: contentToCheck });
        await bot.sendMessage(chatId, `Analyzing token address (ID: ${requestId}). This may take a few moments...`);
        
        // Start the token analysis workflow
        await createTokenAnalysisWorkflow(contentToCheck, 'ethereum', requestId);
      } 
      else {
        updateUserSession(chatId, { id: requestId, type: 'message', content: contentToCheck });
        await bot.sendMessage(chatId, `Analyzing message content (ID: ${requestId}). This may take a few moments...`);
        
        // Start the message analysis workflow
        await createMessageAnalysisWorkflow(contentToCheck, requestId);
      }
    } catch (error) {
      console.error(`Error checking content: ${error}`);
      await bot.sendMessage(chatId, `❌ Error checking content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Delete the "checking" message
      try {
        await bot.deleteMessage(chatId, checkingMsg.message_id);
      } catch (err) {
        console.error(`Failed to delete message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  });

  // Handle /report command
  bot.onText(/\/report (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const contentToReport = match ? match[1].trim() : '';
    
    if (!contentToReport) {
      await bot.sendMessage(chatId, "Please provide content to report. Example: /report https://scam-site.com");
      return;
    }

    try {
      // Simple reporting functionality
      await bot.sendMessage(
        chatId,
        `Thank you for reporting this potential scam. Your report has been recorded and will help protect the community.`
      );
      
      // Log the report for future processing
      console.info(`SCAM REPORT from ${msg.from?.username || msg.from?.id}: ${contentToReport}`);
      
      // Future enhancement: Add to a scam database
    } catch (error) {
      console.error(`Error reporting content: ${error}`);
      await bot.sendMessage(chatId, `❌ Error reporting content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Handle /history command
  bot.onText(/\/history/, async (msg) => {
    const chatId = msg.chat.id;
    const analyses = getUserAnalysisHistory(chatId);
    
    try {
      if (analyses.length === 0) {
        await bot.sendMessage(chatId, "You haven't performed any security analyses yet. Use /check to analyze URLs, tokens, or messages.");
        return;
      }
      
      // Show the 5 most recent analyses
      const recentAnalyses = analyses.slice(-5).reverse();
      let message = "*Your Recent Security Analyses*\n\n";
      
      recentAnalyses.forEach((analysis, index) => {
        const date = analysis.timestamp.toLocaleDateString();
        const time = analysis.timestamp.toLocaleTimeString();
        
        message += `*${index + 1}. ${analysis.type.toUpperCase()} Analysis (${analysis.id})*\n`;
        message += `Content: \`${analysis.content.substring(0, 50)}${analysis.content.length > 50 ? '...' : ''}\`\n`;
        message += `Date: ${date} ${time}\n\n`;
      });
      
      message += "_Use /check to perform a new analysis_";
      
      try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error sending formatted message:', error);
        // Fallback to plain text
        await bot.sendMessage(chatId, message.replace(/[*_`]/g, ''), { parse_mode: undefined });
      }
    } catch (error) {
      console.error(`Error fetching history: ${error}`);
      await bot.sendMessage(chatId, `❌ Error fetching history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Handle message forwarding and regular messages
  bot.on('message', async (msg) => {
    // Skip command messages
    if (msg.text && (msg.text.startsWith('/') || msg.entities?.some(e => e.type === 'bot_command'))) {
      return;
    }

    // Regular message or forwarded message to analyze
    if (msg.text || msg.caption) {
      const chatId = msg.chat.id;
      const content = msg.text || msg.caption || '';
      
      // Skip if there's no content to analyze
      if (!content) return;
      
      // For forwarded messages, perform automatic analysis
      if (msg.forward_date) {
        try {
          // First, do a quick check for obvious scam patterns
          // This is for immediate feedback while the full analysis happens
          const quickCheckResult = containsScamPatterns(content);
          if (quickCheckResult.containsPatterns) {
            await bot.sendMessage(
              chatId,
              `⚠️ Warning: This forwarded message contains potential scam patterns!\n\n${quickCheckResult.patterns.join('\n')}\n\nPerforming detailed analysis...`
            );
          }
          
          setCurrentChatId(chatId);
          const requestId = generateShortUuid();
          
          updateUserSession(chatId, { id: requestId, type: 'message', content });
          
          // Start message analysis workflow with context info
          await createMessageAnalysisWorkflow(content, requestId, "Forwarded message");
        } catch (error) {
          console.error(`Error analyzing forwarded message: ${error}`);
          await bot.sendMessage(chatId, `❌ Error analyzing message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  });

  // Handle error events
  bot.on('error', (error) => {
    console.error('Telegram bot error:', error);
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
  });
}
