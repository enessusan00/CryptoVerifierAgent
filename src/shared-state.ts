/**
 * Shared state management for the CryptoVerifier bot
 */

// Global state to store the current chat ID
export let currentChatId: number | null = null;

// Interface for user sessions
export interface UserSession {
  chatId: number;
  lastInteraction: Date;
  analyses: {
    id: string;
    type: 'url' | 'token' | 'message';
    content: string;
    timestamp: Date;
  }[];
}

// In-memory storage for user sessions
const userSessions = new Map<number, UserSession>();

// Function to update the current chat ID
export function setCurrentChatId(chatId: number): void {
  currentChatId = chatId;
}

// Function to get the current chat ID
export function getCurrentChatId(): number | null {
  return currentChatId;
}

// Function to add or update a user session
export function updateUserSession(chatId: number, analysisDetails?: { 
  id: string, 
  type: 'url' | 'token' | 'message', 
  content: string 
}): UserSession {
  const existingSession = userSessions.get(chatId);
  
  if (existingSession) {
    existingSession.lastInteraction = new Date();
    
    if (analysisDetails) {
      existingSession.analyses.push({
        ...analysisDetails,
        timestamp: new Date()
      });
    }
    
    return existingSession;
  } else {
    const newSession: UserSession = {
      chatId,
      lastInteraction: new Date(),
      analyses: analysisDetails ? [{
        ...analysisDetails,
        timestamp: new Date()
      }] : []
    };
    
    userSessions.set(chatId, newSession);
    return newSession;
  }
}

// Function to get a user session
export function getUserSession(chatId: number): UserSession | undefined {
  return userSessions.get(chatId);
}

// Function to get all analysis history for a user
export function getUserAnalysisHistory(chatId: number): UserSession['analyses'] {
  const session = userSessions.get(chatId);
  return session ? session.analyses : [];
}
