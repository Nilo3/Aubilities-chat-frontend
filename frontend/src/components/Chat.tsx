import { useEffect, useRef, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import type { Message, Session } from '../types/chat';
import { chatService } from '../services/chatService';
import { ChatMessage } from './ChatMessage';
import { SessionList } from './SessionList';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open]);

  const fetchSessions = async () => {
    try {
      const sessions = await chatService.fetchSessions();
      setSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const { chatId, sessionId } = await chatService.createNewSession();
      console.log(chatId, sessionId);
      setCurrentSessionId(sessionId);
      setMessages([]);
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadSession = async (session: Session) => {
    try {
      const messages = await chatService.loadSessionHistory(session.sessionId);
      setMessages(messages);
      setCurrentSessionId(session.sessionId);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Math.random().toString(36).substring(2, 9),
      type: 'user', 
      content: input 
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { message } = await chatService.sendMessage(input);
      const botMessage: Message = { 
        id: Math.random().toString(36).substring(2, 9),
        type: 'bot', 
        content: message 
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'bot',
        content: 'Oops! Something went wrong. Please try again.',
      };
      console.log(error);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          className="custom-fab fixed bottom-5 right-8 w-14 h-14 shadow-lg flex items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <i className="fas fa-comment-dots"></i>
        </button>
      )}

      <div
        className={`fixed top-0 right-0 h-screen w-[400px] bg-white shadow-lg transform transition-transform duration-300 z-50 flex flex-col border-l ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 bg-[#4361ee] text-white py-5">
          <h3 className="text-xl font-medium">AI Coach</h3>
          <button
            className="close-fab w-10 h-10 rounded-full flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onCreateNewSession={createNewSession}
          onLoadSession={loadSession}
        />

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" id="chatboxWrapper">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {loading && <div className="text-gray-400 italic">Typing...</div>}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="flex items-center border-t border-gray-200 p-3"
        >
          <textarea
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded px-3 py-4 text-sm focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto placeholder-gray-400"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#4361ee', color: 'white' }}
            className="ml-2 px-4 py-4 h-14 w-14 rounded"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
    </>
  );
}