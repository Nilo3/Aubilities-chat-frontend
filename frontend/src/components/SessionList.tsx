import type { Session } from "../types/chat";

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onCreateNewSession: () => void;
  onLoadSession: (session: Session) => void;
}

export const SessionList = ({
  sessions,
  currentSessionId,
  onCreateNewSession,
  onLoadSession,
}: SessionListProps) => {
  return (
    <div className="overflow-x-auto flex space-x-2 px-4 py-2 border-b bg-gray-50">
      <button
        className="session-button rounded-full border h-8 min-w-[100px] -ml-2 flex items-center justify-center"
        style={{
          backgroundColor: !currentSessionId ? "#4361ee" : "white",
          fontSize: "0.8rem",
          borderRadius: "20px",
          color: !currentSessionId ? "white" : "black",
          border: !currentSessionId ? "none" : "1px solid #4361ee",
        }}
        onClick={onCreateNewSession}
      >
        <i className="mr-1" style={{ fontSize: "0.9em" }} /> New Chat
      </button>
      {sessions?.map((session: Session) => (
        <button
          key={session.sessionId}
          className="session-button flex items-center justify-center h-8 min-w-[100px]"
          style={{
            backgroundColor:
              session.sessionId === currentSessionId ? "#4361ee" : "white",
            fontSize: "0.8rem",
            borderRadius: "20px",
            color: session.sessionId === currentSessionId ? "white" : "black",
            border:
              session.sessionId === currentSessionId
                ? "none"
                : "1px solid #4361ee",
            padding: "0 12px",
            marginLeft: "0px",
          }}
          onClick={() => onLoadSession(session)}
        >
          {(session.title || "Untitled").slice(0, 10) + "..."}
        </button>
      ))}
    </div>
  );
};
