/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, Session } from '../types/chat';

export const chatService = {
  async fetchSessions(): Promise<Session[]> {
    const res = await fetch('/chatbot/sessions');
    const data = await res.json();
    return data.sessions ?? [];
  },

  async createNewSession(): Promise<{ chatId: string; sessionId: string }> {
    const res = await fetch('/chatbot/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    });
    return res.json();
  },

  async loadSessionHistory(sessionId: string): Promise<Message[]> {
    const res = await fetch(`/chatbot/history?sessionId=${sessionId}`);
    const data = await res.json();
    const sorted = data.messages.sort((messageA: any, messageB: any) =>
      new Date(messageA.createdAt).getTime() - new Date(messageB.createdAt).getTime()
    );
    return sorted.map((msg: any) => ({
      type: msg.role === 'user' ? 'user' : 'bot',
      content: msg.content,
    }));
  },

  async sendMessage(message: string): Promise<{ message: string }> {
    const response = await fetch('/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    return response.json();
  }
}; 