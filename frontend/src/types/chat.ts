/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Message {
  id?: string;
  messageId: string;
  type?: 'user' | 'bot';
  role?: 'user' | 'assistant';
  content: string;
  chatId: string;
  createdAt: string;
  status: string;
}

export interface Session {
  sessionId: string;
  chatId: string;
  title: string;
  lastModified: string;
  sessions: any[];
} 