export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
}

export interface Session {
  sessionId: string;
  chatId: string;
  title: string;
  lastModified: string;
} 