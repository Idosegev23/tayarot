'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { SecondaryButton } from '@/components/ui/Button';
import { sendChatMessage } from '@/app/actions/chat';
import { useGeolocation } from '@/hooks/useGeolocation';
import { buildLocationContext } from '@/lib/geolocation';
import { Send, Camera, Loader2, MapPin, Images, FileText } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  guideSlug: string;
  guideName: string;
  guideId?: string;
  groupId?: string;
  groupName?: string;
  groupSlug?: string;
  touristName?: string;
}

export function ChatInterface({ guideSlug, guideName, guideId, groupId, groupName, groupSlug, touristName }: ChatInterfaceProps) {
  const router = useRouter();
  const firstName = guideName?.split(' ')[0] || '';
  const personaName = groupId && firstName ? `${firstName} Co-Guide` : 'Mary';
  const greeting = groupId && firstName
    ? `Hi! I'm ${personaName}, your virtual companion for this trip with ${guideName}. How's your journey going?`
    : "Hi! I'm Mary, your virtual Israel guide. I'm here to help you get the most out of your journey. How is your trip going?";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationGreetingSent, setLocationGreetingSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { coords, nearestLocation, status: geoStatus, requestPermission } = useGeolocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a location-aware greeting when GPS first resolves
  useEffect(() => {
    if (nearestLocation && !locationGreetingSent && messages.length <= 2) {
      setLocationGreetingSent(true);
      const locName = nearestLocation.poi
        ? `${nearestLocation.poi.name} in ${nearestLocation.location.name}`
        : nearestLocation.location.name;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I can see you're near ${locName}! What a wonderful place to be. Want me to tell you about what's special here?`,
        },
      ]);
    }
  }, [nearestLocation, locationGreetingSent, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const locationContext = buildLocationContext(coords, nearestLocation, null);
      const result = await sendChatMessage(newMessages, guideSlug, {
        location: nearestLocation?.location.name || undefined,
        hasPhotos: false,
        locationContext: locationContext || undefined,
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
        groupId: groupId || undefined,
        guideName: guideName || undefined,
      });

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
      {/* Floating Action Button */}
      <button
        onClick={() => router.push(`/g/${guideSlug}/create`)}
        className="fixed bottom-20 right-4 z-20 w-14 h-14 bg-gradient-to-br from-warm to-accent text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:scale-110 hover:shadow-xl animate-bounce-in"
        style={{ animationDelay: '1s' }}
        aria-label="Share photos"
      >
        <Camera size={24} />
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-secondary/80 text-white px-4 py-4 shadow-md flex-shrink-0 relative">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0 shadow-md">
            <img
              src="/Logo.png"
              alt="Agent Mary"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{guideName}</p>
            <p className="text-xs opacity-90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-status-pulse inline-block" />
              {personaName}
              {nearestLocation && (
                <span className="ml-1 inline-flex items-center gap-1">
                  <MapPin size={10} />
                  {nearestLocation.poi ? nearestLocation.poi.name : nearestLocation.location.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href={`/g/${guideSlug}/posts`}
              className="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors"
              title="My Posts"
            >
              <FileText size={18} />
            </Link>
            <Link
              href={`/g/${guideSlug}/gallery`}
              className="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors"
              title="Gallery"
            >
              <Images size={18} />
            </Link>
          </div>
        </div>
        {/* Wave divider */}
        <svg className="absolute -bottom-1 left-0 w-full h-3 text-light/30" viewBox="0 0 1440 12" fill="none" preserveAspectRatio="none">
          <path d="M0 4C360 0 720 12 1080 8C1260 6 1380 2 1440 4V12H0V4Z" fill="currentColor" />
        </svg>
      </div>

      {/* Location Permission Banner */}
      {geoStatus === 'idle' && (
        <div className="max-w-2xl mx-auto w-full px-3 pt-3">
          <button
            onClick={requestPermission}
            className="w-full flex items-center gap-2 px-4 py-3 bg-light border border-primary/20 rounded-xl text-sm text-primary hover:bg-primary/10 transition-colors"
          >
            <MapPin size={18} />
            <span>Enable location for a personalized experience</span>
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'animate-slide-in-right' : 'animate-slide-in-left'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
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
                    ? 'bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 ml-10'
                    : 'bg-white border-l-3 border-l-primary'
                }`}
              >
                <p className="text-gray-900 text-sm whitespace-pre-wrap">{msg.content}</p>
              </Card>
              {msg.role === 'user' && <div className="w-8 flex-shrink-0"></div>}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 animate-slide-in-left">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden flex-shrink-0 p-1 shadow-sm">
                <img
                  src="/Logo.png"
                  alt="Mary"
                  className="w-full h-full object-contain"
                />
              </div>
              <Card className="flex-1 bg-white shadow-sm p-3 border-l-3 border-l-primary">
                <div className="flex gap-1.5 py-1 px-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'typing-dot 1.4s infinite', animationDelay: '0s' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'typing-dot 1.4s infinite', animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: 'typing-dot 1.4s infinite', animationDelay: '0.4s' }} />
                </div>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="flex items-start gap-2">
              <div className="w-10 flex-shrink-0"></div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={() => handleQuickAction(
                    nearestLocation
                      ? `Tell me about ${nearestLocation.location.name}`
                      : "What's the significance of Jerusalem?"
                  )}
                  className="text-xs h-auto py-2 animate-fade-in-up stagger-1"
                >
                  {nearestLocation ? `About ${nearestLocation.location.name}` : 'Ask about location'}
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={() => handleQuickAction("What's on the route today?")}
                  className="text-xs h-auto py-2 animate-fade-in-up stagger-2"
                >
                  Today&apos;s route
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
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Ask ${personaName} anything...`}
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
