import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Plus, MessageSquare, GraduationCap, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { chatAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const suggestions = [
  { text: 'How do I transition into product management?', emoji: '🚀', label: 'Career Switch' },
  { text: 'Best career paths after B.Tech from IIST?', emoji: '🎓', label: 'IIST Careers' },
  { text: 'What skills should I learn for ML engineering?', emoji: '🤖', label: 'ML Skills' },
  { text: 'How to prepare for campus placements?', emoji: '🎯', label: 'Placements' },
  { text: 'Resume tips for freshers in tech?', emoji: '📝', label: 'Resume Help' },
  { text: 'How to crack FAANG interviews?', emoji: '💡', label: 'Interview Prep' },
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    { id: crypto.randomUUID(), title: 'New Chat', messages: [], createdAt: new Date() },
  ]);
  const [activeId, setActiveId] = useState(sessions[0].id);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeId)!;
  const messages = activeSession.messages;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const updateMessages = (msgs: Message[]) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === activeId
          ? { ...s, messages: msgs, title: msgs.length > 0 ? msgs[0].content.slice(0, 28) + '...' : 'New Chat' }
          : s
      )
    );
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim(), timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    updateMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await chatAPI(text.trim());
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date() };
      updateMessages([...newMessages, assistantMsg]);
    } catch {
      toast.error('Error: Is your backend running at http://127.0.0.1:8000?');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const newChat = () => {
    const session: ChatSession = { id: crypto.randomUUID(), title: 'New Chat', messages: [], createdAt: new Date() };
    setSessions(prev => [session, ...prev]);
    setActiveId(session.id);
  };

  const deleteSession = (id: string) => {
    if (sessions.length === 1) {
      updateMessages([]);
      return;
    }
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (id === activeId) setActiveId(remaining[0].id);
  };

  const clearChat = () => updateMessages([]);

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`}>
        <div className="flex h-full w-72 flex-col rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-card">
          <div className="p-4 border-b border-border/30">
            <Button onClick={newChat} className="w-full gap-2 gradient-hero shadow-md h-11 rounded-xl font-semibold">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
            {sessions.map(s => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  s.id === activeId
                    ? 'bg-primary/8 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <button onClick={() => setActiveId(s.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border/30">
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-hero">
                <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">IIST CareerAI</span>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="shrink-0 rounded-xl"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-foreground font-display">AI Career Mentor</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                IIST × AI — Your personal career guide
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-muted-foreground hover:text-destructive rounded-xl text-xs">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Chat Area */}
        <Card className="flex flex-1 flex-col overflow-hidden shadow-elevated border-0 bg-card/90 backdrop-blur-sm rounded-2xl">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-7 text-center animate-fade-in">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-hero shadow-lg shadow-glow-primary animate-float">
                    <Bot className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full gradient-accent shadow-glow animate-pulse-glow">
                    <Sparkles className="h-4 w-4 text-secondary-foreground" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black font-display text-gradient mb-2">Hi, IIST Student! 👋</h2>
                  <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                    I'm your AI career mentor. Ask me about placements, career paths, skill development, or industry insights.
                  </p>
                </div>
                <div className="grid max-w-xl gap-3 sm:grid-cols-2 lg:grid-cols-3 w-full">
                  {suggestions.map(({ text, emoji, label }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="group flex flex-col items-start gap-2 rounded-2xl border border-border/50 bg-card p-4 text-left text-sm text-muted-foreground transition-all duration-200 hover:shadow-card-hover hover:border-accent/30 hover:text-foreground hover:-translate-y-1 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-lg group-hover:scale-110 transition-transform">{emoji}</span>
                        <Badge variant="outline" className="text-[10px] rounded-full ml-auto">{label}</Badge>
                      </div>
                      <span className="text-xs leading-relaxed">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-scale-in ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-hero shadow-md">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="max-w-[75%] flex flex-col">
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'gradient-hero text-primary-foreground shadow-md rounded-br-lg'
                        : 'bg-muted/60 text-foreground border border-border/40 rounded-bl-lg'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/40">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-accent shadow-md">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-hero shadow-md">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl bg-muted/60 border border-border/40 px-5 py-4 rounded-bl-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground/50">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border/30 bg-card/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask your AI career mentor anything..."
                className="flex-1 h-12 bg-background shadow-card focus:shadow-card-hover transition-shadow rounded-xl text-base border-border/50"
                disabled={isTyping}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                className="gradient-hero shadow-md hover:shadow-lg transition-all shrink-0 h-12 w-12 rounded-xl disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
              IIST CareerAI may produce inaccurate information. Verify important career decisions independently.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
