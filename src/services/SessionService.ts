import { ChatProps } from '../components/types';
import { chats } from '../components/data';

const CHAT_STORAGE_KEY = "chat_sessions";


const ChatService = {
  /**
   * Get chat history from localStorage
   * @returns {ChatProps[]} Array of chat messages
   */
  getChatSessions: (): ChatProps[] => {
    const chatData = localStorage.getItem(CHAT_STORAGE_KEY);
    return chatData ? JSON.parse(chatData) : [];
  },

  /**
   * Save a new sessions to chat history
   * @param {ChatProps} sessions - The sessions object
   */
  setChatSessions: (sessions: ChatProps): void => {
    const chatHistory = ChatService.getChatSessions();
    chatHistory.push(sessions);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));
  },

  /**
   * Clear chat history from localStorage
   */
  clearChatHistory: (): void => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  },
};

export default ChatService;
export type { ChatProps };
