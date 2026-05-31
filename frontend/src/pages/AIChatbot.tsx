import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { aiApi, alumniApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Bot, Send, User, Brain, FileText, Upload, Sparkles, BookOpen, Trash2, Clipboard, ChevronRight } from 'lucide-react';

interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  content: string;
  citations?: any[];
  created_at?: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  last_message?: string;
}

export default function AIChatbot() {
  const { user } = useAppStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resume Analyzer States
  const [analyzerFile, setAnalyzerFile] = useState<File | null>(null);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);

  // Outreach Helper States
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<number | null>(null);
  const [outreachPurpose, setOutreachPurpose] = useState('advice');
  const [outreachInterests, setOutreachInterests] = useState('');
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await aiApi.getHistory();
      setSessions(data);
      if (data.length > 0 && activeSession === null) {
        handleSelectSession(data[0].id);
      }
    } catch {
      toast.error('Failed to load chat history');
    }
  };

  useEffect(() => {
    fetchSessions();
    // Load alumni for outreach helper
    alumniApi.getAlumni().then(setAlumniList).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectSession = async (sessId: number) => {
    setActiveSession(sessId);
    setLoading(true);
    try {
      const data = await aiApi.getSessionMessages(sessId);
      setMessages(data);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    const title = prompt('Enter a title for this new chat session:');
    if (!title) return;
    try {
      const res = await aiApi.createHistory(title);
      setSessions(prev => [res, ...prev]);
      setActiveSession(res.id);
      setMessages([]);
    } catch {
      toast.error('Failed to create session');
    }
  };

  const handleDeleteSession = async (sessId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      await aiApi.deleteHistory(sessId);
      setSessions(prev => prev.filter(s => s.id !== sessId));
      if (activeSession === sessId) {
        setActiveSession(null);
        setMessages([]);
      }
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const query = customText || inputValue;
    if (!query.trim()) return;
    
    // Ensure we have an active session or create one dynamically
    let sessId = activeSession;
    if (!sessId) {
      try {
        const res = await aiApi.createHistory(`Discussion on ${query.slice(0, 15)}...`);
        setSessions(prev => [res, ...prev]);
        sessId = res.id;
        setActiveSession(res.id);
      } catch {
        toast.error('Failed to initialize session');
        return;
      }
    }

    const userMsg: ChatMessage = { sender: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await aiApi.chat(query, String(sessId));
      setMessages(prev => [...prev, { sender: 'ai', content: res.response, citations: res.citations }]);
      // Refresh session sidebar preview
      fetchSessions();
    } catch {
      toast.error('Failed to get AI advisor response');
    } finally {
      setLoading(false);
    }
  };

  // Resume Upload File Handler
  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAnalyzerFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeSubmit = async () => {
    if (!analyzerFile) return;
    setAnalyzerLoading(true);
    try {
      const res = await aiApi.reviewResume(analyzerFile);
      setAnalyzerResult(res);
      toast.success('Resume analysis complete!');
    } catch {
      toast.error('Failed to analyze resume file');
    } finally {
      setAnalyzerLoading(false);
    }
  };

  // Outreach Draft Generator
  const handleGenerateOutreach = async () => {
    if (!selectedAlumni) {
      toast.warning('Please select an alumnus from the list');
      return;
    }
    setOutreachLoading(true);
    try {
      const res = await aiApi.outreachHelper({
        alumni_id: selectedAlumni,
        purpose: outreachPurpose,
        key_interests: outreachInterests
      });
      setGeneratedOutreach(res.outreach);
      toast.success('Outreach message drafted!');
    } catch {
      toast.error('Failed to draft outreach message');
    } finally {
      setOutreachLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 max-w-7xl h-[calc(100vh-8rem)]">
      <Tabs defaultValue="chatbot" className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-[#111827] border border-[#374151]/50 p-1 rounded-xl">
            <TabsTrigger value="chatbot" className="rounded-lg font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">AI Advisor</TabsTrigger>
            <TabsTrigger value="resume" className="rounded-lg font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">Resume Review</TabsTrigger>
            <TabsTrigger value="outreach" className="rounded-lg font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">Outreach Helper</TabsTrigger>
          </TabsList>
        </div>

        {/* ──── TAB 1: RAG CHATBOT ──── */}
        <TabsContent value="chatbot" className="flex-1 min-h-0 flex gap-6 mt-0">
          {/* Sidebar Chat Logs History */}
          <Card className="w-80 bg-[#111827]/90 border-[#374151]/50 rounded-2xl flex flex-col hidden md:flex overflow-hidden">
            <div className="p-4 border-b border-[#374151]/30">
              <Button onClick={handleNewSession} className="w-full h-11 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-bold gap-2 shadow-md">
                + New Discussion
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest px-2 mb-2">Past Discussions</p>
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                    activeSession === s.id 
                      ? 'bg-[#1f2937]/90 text-white border border-[#374151]' 
                      : 'text-[#9ca3af] hover:bg-[#1f2937]/45 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="h-4 w-4 text-[#8b5cf6] shrink-0" />
                    <span className="text-xs font-semibold truncate leading-tight">{s.title}</span>
                  </div>
                  <button onClick={(e) => handleDeleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 transition-all rounded">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Chat Window Panel */}
          <Card className="flex-1 bg-[#111827]/85 border-[#374151]/50 rounded-2xl flex flex-col overflow-hidden relative">
            {/* Header bar */}
            <div className="p-4 border-b border-[#374151]/30 flex justify-between items-center bg-[#111827]/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow-md animate-float">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">AlumniAI Advisor</h3>
                  <p className="text-[10px] font-medium text-emerald-400">Knowledge base: Ingested placement metrics</p>
                </div>
              </div>
            </div>

            {/* Chat Body messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-[#0a0f1e]/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-6 max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center border border-[#6366f1]/20 shadow-glow-primary">
                    <Brain className="h-8 w-8 text-[#6366f1]" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-lg text-white">Ask AlumniAI Advisor</h4>
                    <p className="text-xs text-[#9ca3af] leading-relaxed">I am trained on IIST Indore's placement reports, company interview experiences, and custom career roadmaps. What's on your mind?</p>
                  </div>
                  
                  {/* Suggest Prompt chips */}
                  <div className="grid grid-cols-1 gap-2.5 w-full pt-4">
                    {[
                      "How do I crack Amazon SDE interviews?",
                      "What should a 2nd year CSE student focus on?",
                      "Which alumni from our college are at Google?",
                      "Suggest a roadmap for data science"
                    ].map(promptText => (
                      <button 
                        key={promptText}
                        onClick={() => handleSendMessage(promptText)}
                        className="text-left text-xs font-semibold p-3.5 bg-[#1f2937]/50 hover:bg-[#1f2937] border border-[#374151]/50 rounded-xl text-[#9ca3af] hover:text-white transition-all duration-200 flex justify-between items-center"
                      >
                        {promptText}
                        <ChevronRight className="h-3.5 w-3.5 text-[#6366f1]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex gap-3 max-w-[80%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      m.sender === 'user' ? 'bg-[#6366f1] text-white' : 'gradient-hero text-white'
                    }`}>
                      {m.sender === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                    </div>
                    <div className="space-y-2">
                      <div className={`p-4 rounded-2xl leading-relaxed text-sm ${
                        m.sender === 'user' 
                          ? 'bg-[#6366f1] text-white rounded-tr-none shadow' 
                          : 'bg-[#1f2937]/90 border border-[#374151]/50 text-[#f9fafb] rounded-tl-none shadow-elevated border-gradient'
                      }`}>
                        {m.content}
                      </div>

                      {/* RAG Source Citation Pills */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-wider self-center mr-1">Sources:</span>
                          {m.citations.map((cit: any, cidx: number) => (
                            <Badge key={cidx} variant="outline" className="bg-[#1f2937]/50 border-[#374151] text-[10px] text-primary hover:text-white cursor-pointer px-2 py-0.5 rounded-lg">
                              {cit.type === 'alumni' ? `@ ${cit.name} (${cit.company})` : cit.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center shrink-0 text-white">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-[#1f2937]/90 border border-[#374151]/50 text-[#9ca3af] text-sm italic font-semibold shadow animate-pulse">
                    AlumniAI is thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input sending bar */}
            <div className="p-4 bg-[#111827]/60 border-t border-[#374151]/30 flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your career question or select a prompt suggestion..."
                className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/40 focus:ring-[#6366f1] focus:border-[#6366f1]"
              />
              <Button onClick={() => handleSendMessage()} className="h-12 w-12 gradient-hero rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 shrink-0 border-0">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ──── TAB 2: RESUME ANALYSIS ──── */}
        <TabsContent value="resume" className="flex-1 flex flex-col lg:flex-row gap-6 mt-0">
          {/* File upload panel */}
          <Card className="flex-1 bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 flex flex-col justify-center items-center min-h-[300px]">
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleResumeDrop}
              className="border-2 border-dashed border-[#374151] hover:border-[#6366f1] rounded-2xl w-full flex-1 flex flex-col justify-center items-center p-8 text-center cursor-pointer transition-all duration-300 relative"
            >
              <input 
                type="file" 
                onChange={(e) => e.target.files && setAnalyzerFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-12 w-12 text-[#9ca3af] mb-4 group-hover:text-white" />
              <h4 className="font-extrabold text-base text-white mb-2">
                {analyzerFile ? analyzerFile.name : 'Upload Your Resume'}
              </h4>
              <p className="text-xs text-[#9ca3af] max-w-xs leading-relaxed">
                Drag-and-drop your resume PDF/Text file or click here to browse local drives.
              </p>
            </div>
            
            {analyzerFile && (
              <Button 
                onClick={handleResumeSubmit}
                disabled={analyzerLoading}
                className="mt-6 w-full h-12 rounded-xl gradient-hero font-bold text-white shadow-lg border-0"
              >
                {analyzerLoading ? 'Analyzing Resume File...' : 'Initiate AI Analysis'}
              </Button>
            )}
          </Card>

          {/* Feedback Report Panel */}
          <Card className="flex-1 bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 flex flex-col scrollbar-thin overflow-y-auto">
            {analyzerResult ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-[#374151]/30 pb-4">
                  <div>
                    <h3 className="font-extrabold text-lg text-white">AI Feedback Report</h3>
                    <p className="text-xs text-[#9ca3af]">Analyzed for Big Tech SDE roles</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#9ca3af] uppercase">ATS Score</span>
                    <h2 className="text-3xl font-black text-emerald-400">{analyzerResult.ats_score}/100</h2>
                  </div>
                </div>

                <div className="text-sm text-[#f9fafb] leading-relaxed whitespace-pre-wrap font-mono bg-[#0a0f1e]/40 p-4 rounded-xl border border-[#374151]/30">
                  {analyzerResult.raw_feedback}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
                <FileText className="h-10 w-10 text-[#374151]" />
                <h4 className="font-bold text-white">No Analysis Generated Yet</h4>
                <p className="text-xs text-[#9ca3af] max-w-xs">Upload your resume on the left panel to trigger detailed structured recruiter assessment reports.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ──── TAB 3: OUTREACH HELPER ──── */}
        <TabsContent value="outreach" className="flex-1 flex flex-col lg:flex-row gap-6 mt-0">
          <Card className="flex-1 bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <h3 className="font-bold text-lg text-white">Outreach Personalizer</h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Select Target Alumnus</label>
              <select
                onChange={(e) => setSelectedAlumni(Number(e.target.value))}
                className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-sm outline-none focus:ring-1 ring-[#6366f1]"
              >
                <option value="">-- Choose Alumnus --</option>
                {alumniList.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role} @ {a.company})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Purpose of Connection</label>
              <select
                value={outreachPurpose}
                onChange={(e) => setOutreachPurpose(e.target.value)}
                className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-sm outline-none"
              >
                <option value="career advice">General Career Advice</option>
                <option value="mock interview review">Requesting Mock Interview</option>
                <option value="referral request">Job Referral Application</option>
                <option value="project collaboration">Project Collaboration</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Key Interests / Shared Skills</label>
              <Textarea
                placeholder="Mention specific skills, mutual topics, or current roles you'd like to talk about..."
                value={outreachInterests}
                onChange={(e) => setOutreachInterests(e.target.value)}
                rows={3}
                className="bg-[#1f2937]/50 border-[#374151] rounded-xl text-white"
              />
            </div>

            <Button 
              onClick={handleGenerateOutreach}
              disabled={outreachLoading}
              className="w-full h-11 rounded-xl gradient-hero font-bold text-white shadow-lg border-0"
            >
              {outreachLoading ? 'Writing Personalized Draft...' : 'Write Cold Outreach Draft'}
            </Button>
          </Card>

          <Card className="flex-1 bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 flex flex-col scrollbar-thin">
            {generatedOutreach ? (
              <div className="flex-1 flex flex-col space-y-4 justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-white border-b border-[#374151]/30 pb-2 mb-4">Draft Template</h4>
                  <Textarea
                    readOnly
                    value={generatedOutreach}
                    rows={12}
                    className="w-full bg-[#0a0f1e]/40 border border-[#374151]/30 rounded-xl p-4 text-sm text-[#f9fafb] font-mono leading-relaxed"
                  />
                </div>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedOutreach);
                    toast.success('Draft copied to clipboard!');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 h-11 rounded-xl font-bold text-white gap-2"
                >
                  <Clipboard className="h-4 w-4" /> Copy Message Draft
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
                <FileText className="h-10 w-10 text-[#374151]" />
                <h4 className="font-bold text-white">No Message Drafted</h4>
                <p className="text-xs text-[#9ca3af] max-w-xs">Fill details in the left panel to auto-generate personalized outreach copy.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
