import type { Session } from '../types/chat';

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
        className="session-button rounded-full border h-8 min-w-[56px] -ml-2 flex items-center justify-center"
        style={{
          backgroundColor: !currentSessionId ? '#4361ee' : 'white',
          fontSize: '0.8rem',
          borderRadius: '20px',
          color: !currentSessionId ? 'white' : 'black',
          border: !currentSessionId ? 'none' : '1px solid #4361ee'
        }}
        onClick={onCreateNewSession}
      >
        <i className="mr-1" style={{ fontSize: '0.9em' }} /> New Chat
      </button>
      {sessions.map((session) => (
        <button
          key={session.sessionId}
          className={`session-button px-3 py-1 rounded-full text-sm font-medium border ${
            session.sessionId === currentSessionId ? 'bg-[#4361ee] text-white' : 'bg-white text-black'
          }`}
          onClick={() => onLoadSession(session)}
        >
          {session.title || 'Untitled'}
        </button>
      ))}
    </div>
  );
}; 