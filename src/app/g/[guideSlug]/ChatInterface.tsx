'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { sendChatMessage } from '@/app/actions/chat';
import { Send, Camera, Loader2, Plus } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  guideSlug: string;
  guideName: string;
}

export function ChatInterface({ guideSlug, guideName }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Mary, your virtual Israel guide. I'm here to help you get the most out of your journey. How is your trip going?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const result = await sendChatMessage(newMessages, guideSlug);

      if (result.success && result.message) {
        setMessages([...newMessages, { role: 'assistant', content: result.message }]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: "I'm sorry, I'm having trouble responding right now. Please try again." },
        ]);
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-light/30 to-white relative">
      {/* Floating Action Button - Always Visible */}
      <button
        onClick={() => router.push(`/g/${guideSlug}/create`)}
        className="fixed bottom-20 right-4 z-20 w-14 h-14 bg-warm hover:bg-warm/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 hover:shadow-xl"
        aria-label="Share photos"
      >
        <Camera size={24} />
      </button>

      {/* Header */}
      <div className="bg-primary text-white px-4 py-4 shadow-sm flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0 shadow-md">
            <img 
              src="/Logo.png" 
              alt="Agent Mary" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{guideName}</p>
            <p className="text-xs opacity-80">Agent Mary</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className="flex items-start gap-3">
              {msg.role === 'assistant' && (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                  <img 
                    src="/Logo.png" 
                    alt="Mary" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <Card
                className={`flex-1 shadow-sm p-3 ${
                  msg.role === 'user'
                    ? 'bg-secondary/10 border-secondary/20 ml-10'
                    : 'bg-white'
                }`}
              >
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{msg.content}</p>
              </Card>
              {msg.role === 'user' && <div className="w-8 flex-shrink-0"></div>}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img 
                  src="/Logo.png" 
                  alt="Mary" 
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </Card>
            </div>
          )}

          {/* Quick Actions - show only if no conversation yet */}
          {messages.length <= 1 && (
            <div className="flex items-start gap-2">
              <div className="w-10 flex-shrink-0"></div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={() => handleQuickAction("What's the significance of Jerusalem?")}
                  className="text-xs h-auto py-2"
                >
                  Ask about location
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={() => handleQuickAction("What's on the route today?")}
                  className="text-xs h-auto py-2"
                >
                  Today's route
                </SecondaryButton>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t shadow-lg flex-shrink-0">
        <div className="max-w-2xl mx-auto px-3 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask Mary anything..."
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-full focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
