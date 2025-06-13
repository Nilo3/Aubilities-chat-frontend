export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#4361ee] border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#4361ee] border-r-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading chat...</p>
    </div>
  );
}; 