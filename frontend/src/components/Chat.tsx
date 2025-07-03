/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import type { Message, Session } from "../types/chat";
import { chatService } from "../services/chatService";
import { pusherService } from "../services/pusherService";
import { ChatMessage } from "./ChatMessage";
import { SessionList } from "./SessionList";
import { LoadingSpinner } from "./LoadingSpinner";
import { TypingIndicator } from "./TypingIndicator";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [csrfTokenReady, setCsrfTokenReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Pusher when the component mounts
  useEffect(() => {
    pusherService.init();

    return () => {
      pusherService.disconnect();
    };
  }, []);

  // Subscribe to Pusher channel when chatId changes
  useEffect(() => {
    if (currentChatId) {
      pusherService.subscribeToChat(currentChatId, (data: any) => {
        // Remove loading indicator
        setLoading(false);

        // Add bot message
        const botMessage: Message = {
          id: Math.random().toString(36).substring(2, 9),
          role: "assistant",
          content: data.response,
          messageId: data.messageId || "",
          chatId: data.chatId || "",
          createdAt: data.createdAt || "",
          status: data.status || "",
        };

        setMessages((prev) => [...prev, botMessage]);
      });
    }

    return () => {
      if (currentChatId) {
        pusherService.unsubscribeFromChat();
      }
    };
  }, [currentChatId]);

  useEffect(() => {
    window.parent.postMessage({ type: "CHATBOT_READY" }, "*");
    window.parent.postMessage({ type: "REQUEST_CSRF_TOKEN" }, "*");

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === "http://localhost" ||
        event.origin === "http://localhost:8000" ||
        event.origin === import.meta.env.VITE_APP_URL
      ) {
        switch (event.data.type) {
          case "CLOSE_CHAT":
            setMessages([]);
            setInput("");
            setCurrentSessionId(null);
            setCurrentChatId(null);
            pusherService.unsubscribeFromChat();
            break;

          case "CSRF_TOKEN":
            localStorage.setItem("csrf_token", event.data.token);
            setUserId(event.data.userId);
            setCsrfTokenReady(true);
            break;

          default:
            break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (userId) {
          await fetchSessions(userId);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    initializeChat();
  }, [userId]);

  const fetchSessions = async (userId: string) => {
    try {
      const sessions = await chatService.fetchSessions(userId);
      setSessions(sessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const createNewSession = async (initialMessage: string) => {
    try {
      const csrfToken = localStorage.getItem("csrf_token");
      if (!csrfToken) {
        console.error("No hay token CSRF disponible para crear sesión");
        return;
      }

      const title =
        initialMessage.length > 0
          ? initialMessage.substring(0, 10) + "..."
          : "";

      const response = await chatService.createNewSession(userId ?? "", title);

      setCurrentSessionId(response.sessionId);
      setCurrentChatId(response.chatId);
      setMessages([]);
      await fetchSessions(userId ?? "");

      return response;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  };

  const loadSession = async (session: Session) => {
    try {
      setLoadingSession(true);

      const messages = await chatService.loadSessionHistory(session.sessionId);
      setMessages(messages);
      setCurrentSessionId(session.sessionId);
      setCurrentChatId(session.chatId);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const csrfToken = localStorage.getItem("csrf_token");

    if (!csrfToken) {
      console.error("No hay token CSRF disponible");
      alert("Token CSRF no disponible. Por favor, recarga la página.");
      return;
    }

    // If there is no current session, create a new one
    if (!currentSessionId) {
      try {
        const newSession = await createNewSession(input);
        setCurrentChatId(newSession?.chatId ?? "");
      } catch (error) {
        console.error("Error creando sesión antes de enviar mensaje:", error);
        return;
      }
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      content: input,
      messageId: "",
      chatId: currentChatId || "",
      createdAt: new Date().toISOString(),
      status: "",
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const messageToSend = input;
    setInput("");

    try {
      const response = await chatService.sendMessage(messageToSend);

      // If there is a new chatId in the response, update it
      if (response.chatId && response.chatId !== currentChatId) {
        setCurrentChatId(response.chatId);
      }

      // We don't add the bot message here because it will come via WebSocket
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setLoading(false);

      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: "Oops! Something went wrong. Please try again.",
        messageId: "",
        chatId: currentChatId || "",
        createdAt: new Date().toISOString(),
        status: "error",
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  if (initialLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 bg-[#4361ee] text-white py-5">
        <h3 className="text-xl font-medium">AI Coach</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              csrfTokenReady ? "bg-green-400" : "bg-red-400"
            }`}
            title={csrfTokenReady ? "Token CSRF listo" : "Esperando token CSRF"}
          ></div>

          <button
            className="close-fab w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:bg-opacity-20 transition-colors"
            onClick={() => {
              window.parent.postMessage({ type: "CLOSE_CHAT" }, "*");
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <SessionList
        sessions={sessions}
        currentSessionId={currentSessionId}
        onCreateNewSession={() => createNewSession(input)}
        onLoadSession={loadSession}
      />

      <div
        className="flex-1 overflow-y-auto px-4 py-2 space-y-2"
        id="chatboxWrapper"
      >
        {loadingSession ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {Array.isArray(messages) &&
              messages.map((msg: Message) => (
                <ChatMessage
                  key={msg.id || msg.messageId || Math.random()}
                  message={msg}
                />
              ))}
            {loading && <TypingIndicator />}
            {messages.length === 0 && !loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>¡Hola! ¿En qué puedo ayudarte hoy?</p>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center border-t border-gray-200 p-3"
      >
        <textarea
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded px-3 py-4 text-sm focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto placeholder-gray-400 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={
            csrfTokenReady ? "Type a message..." : "Waiting for connection..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
          disabled={loading || !csrfTokenReady}
        />
        <button
          type="submit"
          style={{ backgroundColor: "#4361ee", color: "white" }}
          className="ml-2 px-4 py-4 h-14 w-14 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !csrfTokenReady || !input.trim()}
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </form>
    </div>
  );
}
