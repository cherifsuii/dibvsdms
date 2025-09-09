
import React, { useState } from 'react';
import { SendIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="p-4 bg-white border-t sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask a question about DMS or DIB..."
            disabled={isLoading}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 disabled:bg-gray-100"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-700 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            aria-label="Send message"
          >
            <SendIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
};