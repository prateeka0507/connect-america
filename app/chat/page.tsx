'use client';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  urls?: Array<{ url: string; content: string }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getDocumentTitle = (url: string) => {
    const filename = url.split('/').pop() || '';
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\.[^/.]+$/, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDownload = async (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = url.split('/').pop() || 'document.pdf';
      link.target = '_blank';
      
      if (url.toLowerCase().endsWith('.pdf')) {
        try {
          const response = await fetch(url, {
            mode: 'cors',
            credentials: 'include',
            headers: {
              'Accept': 'application/pdf'
            }
          });
          const blob = await response.blob();
          link.href = window.URL.createObjectURL(blob);
        } catch (error) {
          console.warn('Blob creation failed, falling back to direct download', error);
        }
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (link.href.startsWith('blob:')) {
        window.URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const sendMessageToAPI = async (message: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setError(null);
      setLoading(true);
      
      const userMessage: Message = { role: 'user', content: inputValue };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');

      try {
        const aiResponse = await sendMessageToAPI(inputValue);
        setMessages(prev => [...prev, aiResponse]);
      } catch (err: unknown) {
        console.error('Chat Error:', err);
        setError('Failed to get response. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight(textareaRef.current);
    }
  }, []);

  const References = ({ urls }: { urls: Array<{ url: string; content: string }> }) => {
    if (!urls || urls.length === 0) return null;

    return (
      <div className="flex flex-col gap-4 p-4 relative z-10 bg-transparent">
        <h2 className="text-xl font-semibold text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Referenced Documents
        </h2>
        <div className="flex flex-col gap-3">
          {urls.map(({ url }, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors bg-white shadow-sm hover:shadow-md">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-semibold">#{index + 1}</span>
                  <h3 className="text-gray-900 text-lg font-medium">
                    {getDocumentTitle(url)}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {url.includes('.pdf') ? 'PDF Document' : 
                   url.includes('.doc') ? 'Word Document' : 
                   'Document'}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <a 
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-1 sm:flex-initial justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </a>
                <a 
                  href={url}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors flex-1 sm:flex-initial justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownload(url);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="flex h-screen relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0A0F5C] z-40 flex items-center px-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 hover:bg-blue-900 rounded-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-4">
          <h1 className="text-lg font-bold text-white">ConnectAmerica</h1>
          <p className="text-sm text-gray-300">AI Support Assistant</p>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        w-64 h-full
        bg-[#0A0F5C] text-white
        transition-transform duration-300 ease-in-out
        z-40 lg:z-auto
        ${isSidebarOpen ? 'top-14 h-[calc(100%-56px)]' : 'top-0 h-full'} 
        lg:top-0 lg:h-full
      `}>
        <div className="p-4 flex flex-col h-full">
          <div className="mb-8 hidden lg:block">
            <h1 className="text-xl font-bold">ConnectAmerica</h1>
            <p className="text-sm text-gray-300 mt-2">AI Support Assistant</p>
          </div>
          
          <nav className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-teal-400">💬</span>
              <span className="text-teal-400 font-semibold">Recent Chats</span>
            </div>
            
            <div className="space-y-2">
              {messages.length > 0 ? (
                messages
                  .filter(msg => msg.role === 'user')
                  .slice(-5)
                  .map((msg, idx) => (
                    <div key={idx} className="p-2 rounded hover:bg-blue-900 cursor-pointer truncate text-sm">
                      {msg.content}
                    </div>
                  ))
              ) : (
                <div className="text-gray-400 text-sm">No recent chats</div>
              )}
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer">
              <span>⚙️</span>
              <span>Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white py-4 px-6">
          <h2 className="text-lg font-semibold text-gray-800">Chat Assistant</h2>
          <p className="text-sm text-gray-500">Ask me anything about Connect America</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-gray-50 overflow-y-auto px-2 sm:px-4 pt-14 lg:pt-0">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10 px-4">
              <p className="text-lg">👋 Welcome to Connect America Support</p>
              <p className="text-sm mt-2">How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index}>
              <div className={`${
                message.role === 'assistant' 
                  ? 'bg-white' 
                  : 'bg-[#F5F7FF]'
              } py-4 sm:py-5 px-5 sm:px-6 mb-2`}>
                <div className="text-sm font-medium mb-1.5 text-gray-600">
                  {message.role === 'assistant' ? 'AI Assistant' : 'You'}
                </div>
                <div className="text-gray-800 prose max-w-none">
                  <ReactMarkdown 
                    className="markdown-content
                      [&>h2]:text-[20px] [&>h2]:font-bold [&>h2]:mb-6 [&>h2]:mt-8
                      [&>h2:has(strong)]:text-[#000066] [&>h2:has(strong)]:!text-[#000066]
                      [&>p>strong]:text-[#000066] [&>p>strong]:!text-[#000066]
                      [&>p]:mb-6 [&>p]:text-[16px] [&>p]:text-gray-700 [&>p]:leading-8
                      [&>ul]:space-y-3 [&>ul]:mb-6
                      [&>ul>li]:text-[16px] [&>ul>li]:text-gray-700 [&>ul>li]:pl-4 [&>ul>li]:relative [&>ul>li]:leading-8
                      [&>ul>li>ul]:mt-3 [&>ul>li>ul]:space-y-3
                      [&>ul>li>ul>li]:text-[16px] [&>ul>li>ul>li]:text-gray-600 [&>ul>li>ul>li]:pl-4
                      [&>ul>li:before]:content-['•'] [&>ul>li:before]:absolute [&>ul>li:before]:left-0 [&>ul>li:before]:text-gray-400
                      [&>h2:first-child]:mt-0"
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              {message.urls && message.urls.length > 0 && (
                <References urls={message.urls} />
              )}
            </div>
          ))}
          
          {loading && (
            <div className="bg-white py-3 px-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin">⟳</div>
                <div>Processing your request...</div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-2">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#F0F2FF]">
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            className="relative flex items-center"
          >
            <textarea 
              ref={textareaRef}
              className="w-full bg-[#F5F7FF] focus:bg-white
                text-gray-800 text-base sm:text-lg font-medium placeholder-gray-400
                border-0 outline-none resize-none 
                py-6 px-6 sm:px-8
                min-h-[80px] sm:min-h-[100px] max-h-[300px] 
                overflow-auto transition-colors duration-200
                focus:ring-2 focus:ring-blue-500
                cursor-text"
              placeholder="Type your message here..."
              rows={1}
              value={inputValue}
              onChange={(e) => {
                const target = e.target;
                setInputValue(target.value);
                adjustTextareaHeight(target);
              }}
              onFocus={(e) => {
                const target = e.target;
                setTimeout(() => adjustTextareaHeight(target), 0);
              }}
              onClick={(e) => {
                e.currentTarget.focus();
              }}
              disabled={loading}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              style={{ WebkitAppearance: 'none' }}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-4 sm:right-6 
                bg-[#0A0F5C] text-white 
                p-3 sm:p-3.5
                rounded-lg hover:bg-blue-900 
                transition-colors disabled:opacity-50 
                flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-spin text-xl">⟳</span>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13.5 19l7-7-7-7M20.5 12H4" 
                  />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
