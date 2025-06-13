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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Inicializar Pusher cuando el componente se monta
  useEffect(() => {
    pusherService.init();

    return () => {
      pusherService.disconnect();
    };
  }, []);

  // Suscribirse al canal de Pusher cuando cambia el chatId
  useEffect(() => {
    if (currentChatId) {
      pusherService.subscribeToChat(currentChatId, (data: any) => {
        console.log("Respuesta del chat recibida:", data);

        // Remover indicador de escritura
        setLoading(false);

        // Agregar mensaje del bot
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
    const initializeChat = async () => {
      try {
        await fetchSessions();
      } finally {
        setInitialLoading(false);
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    window.parent.postMessage({ type: "CHATBOT_READY" }, "*");
    console.log("Solicitando CSRF token al padre...");
    window.parent.postMessage({ type: "REQUEST_CSRF_TOKEN" }, "*");

    const handleMessage = (event: MessageEvent) => {
      console.log(
        "Mensaje recibido en React:",
        event.data,
        "desde origen:",
        event.origin
      );

      if (
        event.origin === "http://localhost" ||
        event.origin === "http://localhost:8000"
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
            console.log("CSRF token recibido:", event.data.token);
            localStorage.setItem("csrf_token", event.data.token);
            setCsrfTokenReady(true);
            break;

          default:
            console.log("Tipo de mensaje no reconocido:", event.data.type);
            break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const fetchSessions = async () => {
    try {
      const sessions = await chatService.fetchSessions();
      setSessions(sessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const createNewSession = async () => {
    try {
      const csrfToken = localStorage.getItem("csrf_token");
      if (!csrfToken) {
        console.error("No hay token CSRF disponible para crear sesión");
        return;
      }

      console.log("Creando nueva sesión...");
      const response = await chatService.createNewSession();
      console.log("Sesión creada:", response);

      setCurrentSessionId(response.sessionId);
      setCurrentChatId(response.chatId);
      setMessages([]);
      await fetchSessions();

      return response;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  };

  const loadSession = async (session: Session) => {
    try {
      setLoadingSession(true);
      console.log("Cargando sesión:", session.sessionId);

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
    console.log("Token CSRF disponible:", csrfToken);

    if (!csrfToken) {
      console.error("No hay token CSRF disponible");
      alert("Token CSRF no disponible. Por favor, recarga la página.");
      return;
    }

    // Si no hay sesión actual, crear una nueva
    if (!currentSessionId) {
      try {
        const newSession = await createNewSession();
        setCurrentChatId(newSession.chatId);
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
      console.log("Enviando mensaje:", messageToSend);
      const response = await chatService.sendMessage(messageToSend);
      console.log("Mensaje enviado, esperando respuesta via WebSocket...");

      // Si hay un nuevo chatId en la respuesta, actualizar
      if (response.chatId && response.chatId !== currentChatId) {
        setCurrentChatId(response.chatId);
      }

      // No agregamos el mensaje del bot aquí porque llegará via WebSocket
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
              console.log("Cerrando chat...");
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
        onCreateNewSession={createNewSession}
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
            csrfTokenReady ? "Type a message..." : "Esperando conexión..."
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
