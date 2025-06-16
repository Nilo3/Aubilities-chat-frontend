import type { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const renderContent = () => {
    const content = message.content;
    const linkMatch = content.match(/If you want to know more about this topic, you can visit the following link: (.+)$/);

    if (linkMatch) {
      const mainContent = content.replace(linkMatch[0], '').trim();
      const link = linkMatch[1];

      const contentId = extractContentIdFromLink(link);
      const contentName = extractContentNameFromLink(link);

      return (
        <>
          <div>{mainContent}</div>
          <button
            onClick={() => {
              window.parent.postMessage(
                {
                  type: 'OPEN_MODAL_SUGGESTED_CONTENT',
                  payload: {
                    contentId,
                    contentName,
                  },
                },
                '*'
              );
            }}
            className="mt-2 px-4 py-2 text-white rounded"
            style={{ backgroundColor: '#4361ee' }}
          >
            See suggested content
          </button>
        </>
      );
    }

    return content;
  };

  return (
    <div
      className={`px-4 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap break-words text-sm ${
        message.role === 'user'
          ? 'bg-indigo-500 text-white self-end ml-auto'
          : 'bg-gray-100 text-gray-900 self-start mr-auto'
      }`}
    >
      {renderContent()}
    </div>
  );
};

function extractContentIdFromLink(link: string): string {
  const match = link.match(/^(\d+)_/);
  return match ? match[1] : '';
}

function extractContentNameFromLink(link: string): string {
  const match = link.match(/^\d+_([\w\s-]+)\.mp4$/i);
  return match ? match[1] : '';
}
