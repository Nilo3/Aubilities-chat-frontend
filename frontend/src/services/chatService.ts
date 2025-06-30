/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Message, Session } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const chatService = {
    async fetchSessions(userId: string): Promise<Session[]> {
        const response = await fetch(`${API_URL}/chat/user-sessions?userId=${userId}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': localStorage.getItem('csrf_token') ?? ''
            }
        });
        const data = await response.json();
        return data.sessions;
    },

    async createNewSession(userId: string, title: string): Promise<{ chatId: string; sessionId: string }> {
        const response = await fetch(`${API_URL}/chat/sessions`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': localStorage.getItem('csrf_token') || ''
            },
            body: JSON.stringify({ 
                title: title,
                userId: userId
            })
        });
        return response.json();
    },

    async loadSessionHistory(sessionId: string): Promise<Message[]> {
      const response = await fetch(`${API_URL}/chat/history?sessionId=${sessionId}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': localStorage.getItem('csrf_token') ?? ''
        }
      });
          
      const data = await response.json();
      return data.messages;
    },

    async sendMessage(message: string): Promise<{ message: string; chatId?: string }> {
        const csrfToken = localStorage.getItem('csrf_token');
        if (!csrfToken) {
            throw new Error('CSRF token not available');
        }

        const response = await fetch(`${API_URL}/chat/messages`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                _token: csrfToken
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Error response:', error);
            throw new Error('Failed to send message');
        }
        
        return response.json();
    }
}; 