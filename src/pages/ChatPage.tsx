import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Plus, MessageSquare, Menu, X, Trash2, Mic, Image as ImageIcon, Edit2, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';
import { GoogleGenAI } from '@google/genai';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export interface UserContext {
  phase: string | null;
  dayOfCycle: number | null;
  cycleLength: number | null;
  recentSymptoms: string[];
}

// ─── Phase calc ───────────────────────────────────────────────────────────────
function getPhase(day: number, periodLen: number, cycleLen: number): string {
  const follicularEnd = Math.floor(cycleLen * 0.46);
  const ovulationEnd = follicularEnd + Math.max(1, Math.floor(cycleLen * 0.07));
  if (day <= periodLen) return 'Menstrual';
  if (day <= follicularEnd) return 'Follicular';
  if (day <= ovulationEnd) return 'Ovulation';
  return 'Luteal';
}

// ─── Mock responses ───────────────────────────────────────────────────────────
const MOCK_RESPONSES: Record<string, string> = {
  'Why am I tired today?':
    "Feeling tired is very common, especially if you're approaching your luteal phase. Progesterone rises after ovulation and can make you feel sleepy and low-energy. Try to honour that — rest when you can, stay hydrated, and opt for complex carbs like sweet potato or oats to steady your blood sugar. You're not lazy, your body is just doing important work behind the scenes. 💛",
  'Is this cramping normal?':
    "Mild to moderate cramping is a very normal part of your cycle, especially during the menstrual and ovulation phases. Your uterus contracts to shed its lining, and prostaglandins (hormone-like chemicals) are behind the discomfort. Warmth, gentle movement, and anti-inflammatory foods like ginger tea can help. If the pain ever feels severe or disrupts your daily life, it's worth chatting with your doctor — you deserve to feel comfortable. 🌸",
  "Tips for today's phase":
    "Based on where you are in your cycle right now, here are a few things that might help:\n\n• **Nourish** — focus on iron-rich and magnesium-rich foods\n• **Move gently** — walks, yoga, or stretching rather than intense workouts\n• **Rest** — your body is signalling that it needs recovery time\n• **Hydrate** — aim for at least 2L of water today\n\nRemember, there's no \"right\" way to feel. Just tune in and give yourself what you need. 🫧",
};

const FALLBACK_RESPONSES = [
  "That's a great question. Every body is unique, so what you're experiencing is completely valid. Based on your cycle data, I'd suggest paying extra attention to how your energy shifts over the next few days — patterns often reveal more than any single symptom. Would you like me to explain what's typical for your current phase?",
  "I hear you, and I want you to know that what you're feeling is normal. Your cycle affects so much more than just your period — mood, energy, digestion, sleep, and even creativity. Let's dig into what might be going on for you specifically. Can you tell me a bit more?",
  "Thanks for sharing that with me. I'm here to help you make sense of things, not to diagnose — but I can offer some gentle guidance. Your body is incredibly wise, and learning to read its signals is one of the most empowering things you can do. 🌿",
];

async function getMockResponse(message: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  if (MOCK_RESPONSES[message]) return MOCK_RESPONSES[message];
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

const QUICK_REPLIES = [
  'Why am I tired today?',
  'Is this cramping normal?',
  "Tips for today's phase",
];

// ─── UI Components ────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-plum/30"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut' as const,
          }}
        />
      ))}
    </div>
  );
}

// ContextStrip removed

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' as const }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 mr-2.5 mt-1 border border-sage/30 shadow-sm">
          <img src="/ai-avatar.png" alt="AI Avatar" className="w-full h-full object-cover scale-[1.35]" />
        </div>
      )}
      <div className="flex flex-col items-end gap-2 max-w-[80%] sm:max-w-[70%]">
        {msg.image && (
          <div className="rounded-2xl overflow-hidden border border-sage/20 shadow-sm max-w-[200px] sm:max-w-[250px]">
            <img src={msg.image} alt="Attached" className="w-full h-auto object-cover" />
          </div>
        )}
        <div
          className={[
            'rounded-3xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-coral text-white rounded-br-lg'
              : 'bg-white border border-sage/25 text-plum/80 rounded-bl-lg shadow-sm self-start',
          ].join(' ')}
        >
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ChatPage() {
  const { user } = useAuth();
  const [companionName, setCompanionName] = useState('Evora');
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  
  const [userCtx, setUserCtx] = useState<UserContext>({
    phase: null,
    dayOfCycle: null,
    cycleLength: null,
    recentSymptoms: [],
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Load: Context & Sessions
  useEffect(() => {
    if (!user) return;
    (async () => {
      // 1. Fetch User Context
      const { data: c } = await supabase
        .from('cycle_settings')
        .select('last_period_start, avg_cycle_length, avg_period_length')
        .eq('user_id', user.id)
        .maybeSingle();

      if (c?.last_period_start && c?.avg_cycle_length) {
        const day = ((differenceInDays(new Date(), parseISO(c.last_period_start)) % c.avg_cycle_length) + 1);
        const phase = getPhase(day, c.avg_period_length ?? 5, c.avg_cycle_length);
        setUserCtx((prev) => ({
          ...prev,
          phase,
          dayOfCycle: day,
          cycleLength: c.avg_cycle_length,
        }));
      }

      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('symptom')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (symptoms && symptoms.length > 0) {
        setUserCtx((prev) => ({
          ...prev,
          recentSymptoms: [...new Set(symptoms.map((s) => s.symptom).filter(Boolean) as string[])],
        }));
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('companion_name, name')
        .eq('id', user.id)
        .maybeSingle();
      setCompanionName(p?.companion_name || 'Evora');
      setUserName(p?.name || 'there');

      // 2. Fetch Chat Sessions
      await fetchSessions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch all chat sessions for the sidebar
  const fetchSessions = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (sessionData) {
      setSessions(sessionData);
      // Auto-select the most recent session if none is selected
      if (sessionData.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionData[0].id);
      }
    }
  };

  // Load messages whenever active session changes
  useEffect(() => {
    if (!user) return;
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    (async () => {
      const { data: history } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (history && history.length > 0) {
        setMessages(history.map((h: any) => ({ id: h.id, role: h.role as 'user' | 'assistant', content: h.content || '', image: h.image || undefined })));
      } else {
        setMessages([]);
      }
    })();
  }, [activeSessionId, user]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    await supabase.from('chat_sessions').delete().eq('id', id);
    setSessions(s => s.filter(x => x.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const startEditingSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditSessionTitle(session.title);
  };

  const saveSessionTitle = async (e?: React.MouseEvent | React.FormEvent, id?: string) => {
    if (e) e.stopPropagation();
    const targetId = id || editingSessionId;
    if (!user || !editSessionTitle.trim() || !targetId) {
      setEditingSessionId(null);
      return;
    }
    await supabase.from('chat_sessions').update({ title: editSessionTitle.trim() }).eq('id', targetId);
    setSessions(s => s.map(x => x.id === targetId ? { ...x, title: editSessionTitle.trim() } : x));
    setEditingSessionId(null);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    let currentSessionId = activeSessionId;
    let isNewSession = false;

    // Create a new session if one doesn't exist
    if (!currentSessionId) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title })
        .select('id')
        .single();
      
      if (error || !newSession) {
        console.error('Failed to create session:', error);
        return;
      }
      currentSessionId = newSession.id;
      setActiveSessionId(currentSessionId);
      isNewSession = true;
      // Refresh sidebar
      fetchSessions();
    }

    const currentImg = selectedImage;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      image: currentImg || undefined,
    };

    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);

    await supabase.from('chat_messages').insert({
      id: userMsg.id,
      session_id: currentSessionId,
      user_id: user.id,
      role: 'user',
      content: userMsg.content,
      image: userMsg.image,
    } as any);

    let reply = '';
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (apiKey) {
      try {
        const genAI = new GoogleGenAI({ apiKey });
        
        const systemPrompt = `You are ${companionName}, a warm, supportive menstrual health companion. You are speaking to a user named ${userName}. You offer gentle guidance, not diagnosis, and personalize responses using the user's actual tracked data. You must keep responses relatively concise, warm, and conversational.
User Context: 
- Current Phase: ${userCtx.phase || 'Unknown'}
- Cycle Day: ${userCtx.dayOfCycle || 'Unknown'}
- Cycle Length: ${userCtx.cycleLength || 'Unknown'}
- Recent Symptoms: ${userCtx.recentSymptoms.length ? userCtx.recentSymptoms.join(', ') : 'None logged'}`;

        const historyContext = messages
          .slice(-8)
          .map(m => `${m.role === 'user' ? 'User' : companionName}: ${m.content}`)
          .join('\n\n');
        
        const prompt = `${systemPrompt}\n\nChat History:\n${historyContext}\n\nUser: ${text.trim()}\n${companionName}:`;
        
        const parts: any[] = [{ text: prompt }];
        if (currentImg) {
          parts.push({
            inlineData: {
              data: currentImg.split(',')[1],
              mimeType: currentImg.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
            }
          });
        }
        
        const responseStream = await genAI.models.generateContentStream({
          model: 'gemini-3.6-flash',
          contents: parts,
        });

        setIsTyping(false);
        const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };
        setMessages((m) => [...m, assistantMsg]);

        for await (const chunk of responseStream) {
          reply += chunk.text;
          setMessages((m) => m.map(msg => msg.id === assistantMsg.id ? { ...msg, content: reply } : msg));
        }
      } catch (err) {
        console.error('Gemini API error:', err);
        reply = await getMockResponse(text.trim());
      }
    } else {
      reply = await getMockResponse(text.trim());
    }

    if (!reply) reply = await getMockResponse(text.trim());

    // If we streamed, the message is already in state, but we need to update DB.
    // If it failed and used mock, we need to add the mock message to state.
    setMessages((m) => {
      const exists = m.find(msg => msg.role === 'assistant' && msg.content === reply);
      if (exists) return m;
      // It was mock fallback
      const mockMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: reply };
      return [...m, mockMsg];
    });

    const finalMsgId = messages.find(m => m.content === reply)?.id || crypto.randomUUID();

    setIsTyping(false);

    await supabase.from('chat_messages').insert({
      id: finalMsgId,
      session_id: currentSessionId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });
    
    // Update session updated_at so it bumps to the top
    await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSessionId);
    if (!isNewSession) fetchSessions();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const showQuickReplies = messages.length === 0 && !isTyping;

  return (
    <div className="min-h-screen bg-cream text-plum font-sans flex flex-col lg:flex-row">
      {/* Ambient blob */}
      <div className="fixed -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blush/15 blur-3xl -z-10 pointer-events-none" />

      {/* ─── Chat History Sidebar ────────────────────────────────────────────── */}
      {/* Mobile Toggle Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-plum/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 bg-cream border-r border-sage/20 flex flex-col transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between lg:justify-center border-b border-sage/20 bg-white/40">
          <button 
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 bg-coral text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-coral/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Chat
          </button>
          <button className="lg:hidden p-2 text-plum/60 hover:bg-sage/20 rounded-lg ml-2" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-plum/40 uppercase tracking-wider">History</p>
          {sessions.length === 0 ? (
            <p className="px-3 py-4 text-sm text-plum/40 text-center">No previous chats</p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => { if (editingSessionId !== session.id) { setActiveSessionId(session.id); setSidebarOpen(false); } }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between group cursor-pointer transition-colors ${
                  activeSessionId === session.id 
                    ? 'bg-white shadow-sm border border-sage/30 text-coral font-medium' 
                    : 'text-plum/70 hover:bg-white/50'
                }`}
              >
                {editingSessionId === session.id ? (
                  <form onSubmit={(e) => saveSessionTitle(e, session.id)} className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editSessionTitle}
                      onChange={(e) => setEditSessionTitle(e.target.value)}
                      onBlur={() => saveSessionTitle(undefined, session.id)}
                      autoFocus
                      className="w-full bg-cream px-2 py-1 rounded text-plum text-sm outline-none border border-coral/30"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button type="submit" className="text-coral hover:text-coral/80" onClick={(e) => e.stopPropagation()}>
                      <Check size={14} />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare size={15} className={activeSessionId === session.id ? 'text-coral' : 'text-plum/40'} />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={(e) => startEditingSession(e, session)}
                        className="p-1.5 text-plum/30 hover:text-coral hover:bg-coral/10 rounded-lg transition-all"
                        title="Rename chat"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="p-1.5 text-plum/30 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen lg:min-w-0">
        {/* Header */}
        <div className="border-b border-sage/20 bg-white/60 backdrop-blur-sm px-4 lg:px-6 py-4 flex items-center justify-between gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-plum/60 hover:bg-sage/20 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-sage/30 shadow-sm bg-white">
              <img src="/ai-avatar.png" alt="AI Avatar" className="w-full h-full object-cover scale-[1.35]" />
            </div>
            <div>
              <h1 className="font-serif text-lg text-plum leading-tight">{companionName}</h1>
              <p className="text-xs text-plum/40">Your private wellness chat</p>
            </div>
          </div>
        </div>

        {/* Context strip removed */}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
          {messages.length === 0 && !isTyping ? (
            <div className="h-full flex flex-col items-center justify-center opacity-70 mt-10">
              <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-coral/60" />
              </div>
              <h3 className="font-serif text-xl text-plum mb-2">Hi there 🌸</h3>
              <p className="text-center text-sm text-plum/60 max-w-sm leading-relaxed mb-8">
                I'm your {companionName} wellness companion. I'm here to help you understand your cycle, answer questions about symptoms, and offer gentle guidance — no judgment, ever.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}
            </AnimatePresence>
          )}

          {isTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-sage/30 shadow-sm">
                <img src="/ai-avatar.png" alt="AI Avatar" className="w-full h-full object-cover scale-[1.35]" />
              </div>
              <div className="bg-white border border-sage/25 rounded-3xl rounded-bl-lg shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="px-4 md:px-8 pb-2 flex flex-wrap gap-2 justify-center"
            >
              {QUICK_REPLIES.map((q) => (
                <motion.button
                  key={q}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleQuickReply(q)}
                  className="px-4 py-2 rounded-full bg-white border border-sage/30 text-xs font-medium text-plum/60 hover:border-coral/40 hover:text-coral hover:bg-blush/15 transition-all shadow-sm"
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="border-t border-sage/20 bg-white/70 backdrop-blur-sm px-4 md:px-8 py-4 pb-20 lg:pb-4 flex flex-col gap-2">
          {selectedImage && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-sage/30 shadow-sm mx-auto max-w-3xl self-start mb-2">
              <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => setSelectedImage(null)} 
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto w-full relative">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 mb-1 bg-cream/70 rounded-xl border border-sage/40 text-plum/50 hover:text-coral hover:bg-blush/15 transition-all flex-shrink-0"
              title="Attach image"
            >
              <ImageIcon size={20} />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your cycle…"
                disabled={isTyping}
                rows={1}
                style={{ minHeight: '48px', maxHeight: '150px' }}
                className="w-full px-5 py-3.5 pr-12 rounded-2xl border border-sage/40 bg-cream/70 text-sm text-plum placeholder:text-plum/30 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all disabled:opacity-60 resize-none overflow-y-auto"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3.5 p-1 rounded-full transition-all ${isListening ? 'text-coral bg-coral/10 animate-pulse' : 'text-plum/40 hover:text-coral hover:bg-blush/15'}`}
                title="Dictate message"
              >
                <Mic size={18} />
              </button>
            </div>
            
            <motion.button
              type="submit"
              disabled={!input.trim() || isTyping}
              whileHover={{ scale: input.trim() ? 1.05 : 1 }}
              whileTap={{ scale: input.trim() ? 0.95 : 1 }}
              className={[
                'w-[48px] h-[48px] mb-1 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
                input.trim() && !isTyping
                  ? 'bg-coral text-white shadow-sm shadow-coral/20 hover:bg-coral/90'
                  : 'bg-sage/20 text-plum/25 cursor-not-allowed',
              ].join(' ')}
            >
              <Send size={18} />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
