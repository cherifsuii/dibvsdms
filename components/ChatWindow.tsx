import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { Sender } from '../types';
import { UserIcon, AiIcon, ThumbUpIcon, ThumbDownIcon, BookOpenIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onRetry: (failedQuery: string) => void;
  onFeedback: (messageId: string, feedback: 'up' | 'down') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onRetry, onFeedback }) => {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const renderMessage = (message: Message) => {
    if (message.error && message.originalQuery) {
      return (
        <div key={message.id} className="flex items-start gap-3 my-4 justify-start">
          <AiIcon className="h-8 w-8 text-red-500 flex-shrink-0 mt-1" aria-hidden="true" />
          <div className="max-w-xl p-4 rounded-xl shadow-md bg-red-50 border border-red-200 text-red-800 rounded-bl-none">
            <div className="prose prose-sm max-w-none text-inherit">
              <p>{message.text}</p>
            </div>
            <button
              onClick={() => onRetry(message.originalQuery!)}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              Retry Request
            </button>
          </div>
        </div>
      );
    }

    const isUser = message.sender === Sender.User;
    const Icon = isUser ? UserIcon : AiIcon;
    const bubbleClasses = isUser
      ? 'bg-orange-600 text-white rounded-br-none'
      : 'bg-white text-gray-800 rounded-bl-none border border-gray-200';
    const containerClasses = isUser ? 'justify-end' : 'justify-start';

    return (
      <div key={message.id} className={`flex items-start gap-3 my-4 ${containerClasses}`}>
        {!isUser && <Icon className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" aria-hidden="true" />}
        <div className="flex flex-col">
          <div className={`max-w-xl p-4 rounded-xl shadow-md ${bubbleClasses}`}>
            <div className="prose prose-sm max-w-none text-inherit">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
            </div>
            {!isUser && !message.error && (
              <div className="mt-3 pt-2 border-t border-gray-200/80">
                {message.feedbackSubmitted ? (
                  <p className="text-xs text-gray-500 italic">Thank you for your feedback!</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Was this helpful?</span>
                    <button
                      onClick={() => onFeedback(message.id, 'up')}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="Good response"
                    >
                      <ThumbUpIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onFeedback(message.id, 'down')}
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="Bad response"
                    >
                      <ThumbDownIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {!isUser && !message.error && message.source && message.source !== "N/A" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 px-1" aria-label={`Source: ${message.source}`}>
              <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
              <span>Source: <strong>{message.source}</strong></span>
            </div>
          )}
        </div>
        {isUser && <Icon className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" aria-hidden="true" />}
      </div>
    );
  };

  const TypingIndicator = () => (
    <div className="flex items-start gap-3 my-4 justify-start">
      <AiIcon className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" aria-hidden="true" />
      <div className="bg-white text-gray-800 rounded-xl rounded-bl-none border border-gray-200 p-4 shadow-md">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center space-x-1" aria-hidden="true">
            <span className="h-2 w-2 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 bg-orange-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 bg-orange-600 rounded-full animate-bounce"></span>
          </div>
          <span className="text-sm text-gray-600">Assistant is typing...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {messages.map(renderMessage)}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
