export const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#4361ee] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#4361ee] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#4361ee] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm">Typing...</span>
    </div>
  );
}; 