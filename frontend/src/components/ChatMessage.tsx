import type { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div
      className={`px-4 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap break-words text-sm ${
        message.type === 'user'
          ? 'bg-indigo-500 text-white self-end ml-auto'
          : 'bg-gray-100 text-gray-900 self-start mr-auto'
      }`}
    >
      {message.content}
    </div>
  );
}; 