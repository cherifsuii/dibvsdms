import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import type { Message, UserProfile } from './types';
import { Sender } from './types';
import { generateResponse } from './services/geminiService';
import { UniversityIcon, PlusIcon, LogoutIcon } from './components/icons';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const initialMessage: Message = {
    id: 'initial-message',
    text: "Welcome! I am the ENSTP Major Selection Assistant. I can help you choose between the DMS and DIB departments. How can I assist you today? You can ask me a question or select one from the sidebar.",
    sender: Sender.AI,
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('enstpUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('enstpUser');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setMessages([initialMessage]);
      return;
    }
    try {
      const chatHistoryKey = `enstpChatHistory_${user.email}`;
      const savedMessages = localStorage.getItem(chatHistoryKey);
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
  }, [user]);

  useEffect(() => {
    if (user) {
      const chatHistoryKey = `enstpChatHistory_${user.email}`;
      if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'initial-message')) {
        try {
          localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
        } catch (error) {
          console.error("Failed to save chat history to localStorage", error);
        }
      }
    }
  }, [messages, user]);

  const handleLoginSuccess = useCallback((tokenResponse: any) => {
    try {
      const decoded: { name: string; email: string; picture: string } = jwtDecode(tokenResponse.access_token);
      const userProfile: UserProfile = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      };
      localStorage.setItem('enstpUser', JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error("Failed to decode token or set user:", error);
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: (error) => console.error('Login Failed:', error),
    scope: 'profile email',
    flow: 'implicit'
  });

  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to log out?")) {
      googleLogout();
      localStorage.removeItem('enstpUser');
      setUser(null);
    }
  }, []);

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
    console.log(`Feedback submitted for message ${messageId}: ${feedback}`);
  }, []);

  const handleNewChat = useCallback(() => {
    if (window.confirm("Are you sure you want to start a new chat? Your current conversation will be erased.")) {
      if (user) {
        const chatHistoryKey = `enstpChatHistory_${user.email}`;
        localStorage.removeItem(chatHistoryKey);
      }
      setMessages([initialMessage]);
    }
  }, [user]);

  return (
    <div className="flex h-screen font-sans bg-gray-50 text-gray-800">
      <Sidebar onQuestionSelect={handleSendMessage} />
      <main className="flex flex-col flex-1 h-screen">
        <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center">
            <UniversityIcon className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-700">ENSTP Major Selection Assistant</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              aria-label="Start a new chat"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <img src={user.picture} alt="User profile" className="h-10 w-10 rounded-full" />
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Logout"
                >
                    <LogoutIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
               <button onClick={() => login()} className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Login with Google
                </button>
            )}
          </div>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} onRetry={handleRetry} onFeedback={handleFeedback} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
};

export default App;