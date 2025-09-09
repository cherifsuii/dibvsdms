import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import type { Message } from './types';
import { Sender } from './types';
import { generateResponse } from './services/geminiService';
import { UniversityIcon, PlusIcon } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initialMessage: Message = {
    id: 'initial-message',
    text: "Welcome! I am the ENSTP Major Selection Assistant. I can help you choose between the DMS and DIB departments. How can I assist you today? You can ask me a question or select one from the sidebar.",
    sender: Sender.AI,
  };

  // Effect to load messages from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('enstpChatHistory');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to load or parse chat history from localStorage", error);
    }

    setMessages([initialMessage]);
  }, []);

  // Effect to save messages to localStorage whenever they change
  useEffect(() => {
    // Do not save if messages array only contains the initial message and nothing else
    if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'initial-message')) {
      try {
        localStorage.setItem('enstpChatHistory', JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
      }
    }
  }, [messages]);

  const getAiResponse = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const { answer, source } = await generateResponse(query);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: answer,
        sender: Sender.AI,
        source: source,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error: any) {
      console.error("Failed to get response from AI:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: error.message || "An unknown error occurred. Please try again.",
        sender: Sender.AI,
        error: true,
        originalQuery: query,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      sender: Sender.User,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    await getAiResponse(text);
  }, [isLoading, getAiResponse]);

  const handleRetry = useCallback(async (failedQuery: string) => {
    // Remove the error message from the list before retrying
    setMessages((prevMessages) => prevMessages.filter(msg => !msg.error));
    await getAiResponse(failedQuery);
  }, [getAiResponse]);

  const handleFeedback = useCallback((messageId: string, feedback: 'up' | 'down') => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId
          ? { ...msg, feedback: feedback, feedbackSubmitted: true }
          : msg
      )
    );
    // In a real application, you would send this feedback to a logging service
    console.log(`Feedback submitted for message ${messageId}: ${feedback}`);
  }, []);

  const handleNewChat = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new chat? Your current conversation will be erased.")) {
      localStorage.removeItem('enstpChatHistory');
      setMessages([initialMessage]);
    }
  }, []);

  return (
    <div className="flex h-screen font-sans bg-gray-50 text-gray-800">
      <Sidebar onQuestionSelect={handleSendMessage} />
      <main className="flex flex-col flex-1 h-screen">
        <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center">
            <UniversityIcon className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-700">ENSTP Major Selection Assistant</h1>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            aria-label="Start a new chat"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} onRetry={handleRetry} onFeedback={handleFeedback} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;
