
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Info, Sun, Moon, Leaf, X, Loader2, CheckCircle2, Search, ArrowRight, History, User, LogOut, AlertTriangle, ShieldCheck, Trash2, MessageCircle, Send, ImageIcon, MapPin, Globe, Zap, Mail, Lock, Mail as MailIcon, AlertOctagon, Fingerprint, Command, Sparkles, Filter, Share2, Bell, Droplets, FlaskConical, Calendar, HelpCircle } from 'lucide-react';
import { identifyPlant, chatWithExpert, searchPlantByName } from './geminiService';
import { AppState, View, PlantInfo, ChatMessage, Reminder } from './types';

// Reusable Liquid Button Component
const LiquidButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
}> = ({ onClick, children, className = "", type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className={`lg-button rounded-[1.5rem] flex items-center justify-center gap-3 font-bold transition-all shadow-xl ${className}`}
  >
    {children}
  </button>
);

const CARE_TIPS: Record<string, string> = {
  water: "Pro Tip: Use the 'finger test'—insert your finger an inch into the soil. If it's dry, it's time to water.",
  light: "Pro Tip: Periodically rotate your plant to prevent it from leaning toward the light source and to ensure symmetrical growth.",
  soil: "Pro Tip: High-quality potting mix with perlite or vermiculite ensures better aeration and root health.",
  humidity: "Pro Tip: For tropical species, misting leaves or placing the pot on a tray of pebbles and water can mimic their natural habitat.",
  fertilizer: "Pro Tip: Less is often more. Avoid fertilizing during the plant's dormant winter months to prevent nutrient buildup."
};

const Navbar: React.FC<{ 
  currentView: View; 
  setView: (v: View) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  user: any;
  onLogout: () => void;
}> = ({ currentView, setView, darkMode, toggleTheme, user, onLogout }) => (
  <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-slate-800/40 px-6 py-3">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setView('home')}
      >
        <div className="bg-emerald-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-transform shadow-lg shadow-emerald-500/20">
          <Leaf size={20} />
        </div>
        <span className="font-extrabold text-xl tracking-tighter text-emerald-800 dark:text-emerald-400">LeafID</span>
      </div>
      
      <div className="hidden md:flex items-center gap-1.5 p-1 bg-white/40 dark:bg-slate-900/50 rounded-[2rem] border border-white/60 dark:border-slate-800/40">
        {(['home', 'history', 'reminders', 'about', 'contact'] as View[]).map((v, i) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`relative capitalize font-bold text-[11px] tracking-widest px-6 py-2.5 rounded-[1.5rem] transition-all group/nav ${
              currentView === v 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/60 dark:hover:bg-slate-800/40'
            }`}
          >
            {v}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/nav:opacity-100 transition-opacity text-[8px] bg-slate-800 text-white px-1.5 rounded-sm pointer-events-none">{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          title="Toggle Theme (D)"
          className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 shadow-sm hover:shadow-xl transition-all border border-white/80 dark:border-slate-700/60 group relative"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          <span className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] bg-slate-800 text-white px-1 rounded-sm">D</span>
        </button>
        
        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
             <div className="hidden lg:block text-right">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Explorer</p>
               <p className="text-xs font-bold dark:text-slate-200">{user.name}</p>
             </div>
             <button onClick={onLogout} title="Logout and clear history" className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 border border-emerald-200/50 hover:bg-red-50 hover:text-red-600 transition-all">
               <LogOut size={18} />
             </button>
          </div>
        ) : (
          <LiquidButton 
            onClick={() => setView('signin')}
            className="px-6 py-2.5 text-xs"
          >
            Log In
          </LiquidButton>
        )}
      </div>
    </div>
  </nav>
);

const ChatBot: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  messages: ChatMessage[]; 
  onSendMessage: (msg: string) => void;
  currentPlant?: PlantInfo | null;
}> = ({ isOpen, onClose, messages, onSendMessage, currentPlant }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 sm:right-8 w-[calc(100vw-3rem)] sm:w-[380px] h-[550px] max-h-[75vh] glass rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-emerald-600 p-6 flex items-center justify-between text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-white rotate-12"><Leaf size={80} /></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shadow-inner"><MessageCircle size={20} /></div>
          <div>
            <p className="font-bold uppercase text-[9px] tracking-[0.3em] opacity-80 leading-none mb-1">Botanical AI</p>
            <p className="font-bold text-base">Expert Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full transition-colors relative z-10">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/70 dark:bg-slate-950/80">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-[1.2rem] text-xs font-bold shadow-sm leading-relaxed ${
              msg.role === 'user' 
              ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-500/20' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSendMessage(input); setInput(""); } }}
        className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl"
      >
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..." 
          className="flex-1 bg-white dark:bg-slate-800 border-none rounded-[1.2rem] px-6 py-3.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner dark:text-white transition-all duration-500"
        />
        <LiquidButton type="submit" className="w-12 h-12 rounded-xl shadow-emerald-500/20">
          <Send size={20} />
        </LiquidButton>
      </form>
    </div>
  );
};

const PlantTable: React.FC<{ data: PlantInfo }> = ({ data }) => (
  <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-3xl shadow-xl transition-all duration-1000">
    {/* Toxicity Header Badge (Prominent) */}
    {data.toxicity.isToxic && (
      <div className="bg-red-600/90 backdrop-blur-md px-8 py-4 flex items-center gap-4 text-white animate-pulse">
        <div className="bg-white/20 p-2 rounded-lg">
          <AlertOctagon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Biological Hazard Detected</p>
          <p className="text-sm font-bold leading-tight">{data.toxicity.details}</p>
        </div>
      </div>
    )}

    <div className="bg-slate-50/80 dark:bg-slate-800/40 p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <h3 className="font-bold text-xl flex items-center gap-3 dark:text-white">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 shadow-inner"><Info size={22} /></div>
        Genomic Blueprint
      </h3>
      <div className="flex items-center gap-3">
        <div className="px-4 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-200/50 dark:border-emerald-500/20">Verified</div>
      </div>
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
      {[
        { label: "Scientific Name", value: data.scientificName, italic: true },
        { label: "Family", value: data.family },
        { label: "Geographic Origin", value: data.origin },
      ].map((row, idx) => (
        <div key={idx} className="grid grid-cols-3 p-8 group hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors">
          <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{row.label}</span>
          <span className={`col-span-2 font-bold text-base dark:text-slate-100 ${row.italic ? 'italic' : ''} transition-all duration-500`}>{row.value}</span>
        </div>
      ))}
      <div className="grid grid-cols-3 p-8">
        <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Care System</span>
        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10 text-sm">
          {Object.entries(data.care).map(([key, val]) => (
            <div key={key} className="space-y-3 group/item relative">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-[0.3em]">{key}</p>
                <div className="cursor-help text-slate-300 hover:text-emerald-500 transition-colors">
                  <HelpCircle size={14} />
                </div>
              </div>
              <p className="font-bold text-base text-slate-800 dark:text-slate-200 transition-colors duration-500 leading-tight pr-4">{val}</p>
              
              {/* Floating Pro Tip Tooltip */}
              <div className="care-tooltip absolute bottom-full left-0 mb-3 w-64 glass p-4 rounded-2xl shadow-2xl z-20 pointer-events-none">
                 <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Genomic Insight</span>
                 </div>
                 <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    {CARE_TIPS[key] || "Optimal care practices ensure biological longevity."}
                 </p>
                 <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-800 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedHistory = localStorage.getItem('plant_history');
    const savedUser = localStorage.getItem('plant_user');
    const savedReminders = localStorage.getItem('plant_reminders');
    return {
      view: 'home',
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isIdentifying: false,
      result: null,
      error: null,
      history: savedHistory ? JSON.parse(savedHistory) : [],
      user: savedUser ? JSON.parse(savedUser) : null,
      isChatOpen: false,
      chatMessages: [],
      reminders: savedReminders ? JSON.parse(savedReminders) : []
    };
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isShareSuccess, setIsShareSuccess] = useState(false);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is focused on an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') target.blur();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
          break;
        case 'c':
          setState(prev => ({ ...prev, isChatOpen: !prev.isChatOpen }));
          break;
        case '1':
          setState(prev => ({ ...prev, view: 'home', result: null }));
          break;
        case '2':
          setState(prev => ({ ...prev, view: 'history' }));
          break;
        case '3':
          setState(prev => ({ ...prev, view: 'reminders' }));
          break;
        case '4':
          setState(prev => ({ ...prev, view: 'about' }));
          break;
        case '5':
          setState(prev => ({ ...prev, view: 'contact' }));
          break;
        case 'escape':
          if (state.isChatOpen) {
            setState(prev => ({ ...prev, isChatOpen: false }));
          } else if (state.result) {
            resetSearch();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isChatOpen, state.result]);

  useEffect(() => {
    // Only persist if a user is logged in
    if (state.user) {
      localStorage.setItem('plant_history', JSON.stringify(state.history));
      localStorage.setItem('plant_user', JSON.stringify(state.user));
      localStorage.setItem('plant_reminders', JSON.stringify(state.reminders));
    }
  }, [state.history, state.user, state.reminders]);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const toggleReminder = (task: string, frequency: string) => {
    if (!state.result) return;
    const existing = state.reminders.find(r => r.plantId === state.result!.id && r.task === task);
    if (existing) {
      setState(prev => ({
        ...prev,
        reminders: prev.reminders.filter(r => r.id !== existing.id)
      }));
    } else {
      const now = Date.now();
      const newReminder: Reminder = {
        id: crypto.randomUUID(),
        plantId: state.result.id,
        plantName: state.result.commonName,
        task,
        frequency,
        lastDone: now,
        nextDue: now + 7 * 24 * 60 * 60 * 1000 // Default to 1 week if unparseable, just for demo
      };
      setState(prev => ({
        ...prev,
        reminders: [...prev.reminders, newReminder]
      }));
    }
  };

  const checkReminder = (id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => {
        if (r.id === id) {
          const now = Date.now();
          return { ...r, lastDone: now, nextDue: now + 7 * 24 * 60 * 60 * 1000 };
        }
        return r;
      })
    }));
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Full = e.target?.result as string;
      setPreviewUrl(base64Full);
      const pureBase64 = base64Full.split(',')[1];
      setState(prev => ({ ...prev, isIdentifying: true, error: null, result: null, view: 'home' }));
      try {
        const info = await identifyPlant(pureBase64);
        const resultWithMeta = { ...info, id: crypto.randomUUID(), timestamp: Date.now(), image: base64Full };
        setState(prev => ({ 
          ...prev, 
          result: resultWithMeta, 
          isIdentifying: false,
          history: [resultWithMeta, ...prev.history].slice(0, 50) 
        }));
      } catch (err: any) {
        setState(prev => ({ ...prev, error: err.message, isIdentifying: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGlobalSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    e?.preventDefault();
    const query = queryOverride || globalSearchQuery;
    if (!query.trim()) return;
    
    setState(prev => ({ ...prev, isIdentifying: true, error: null, result: null, view: 'home' }));
    setPreviewUrl(null); // No photo for text search
    
    try {
      const info = await searchPlantByName(query);
      const resultWithMeta = { ...info, id: crypto.randomUUID(), timestamp: Date.now() };
      setState(prev => ({ 
        ...prev, 
        result: resultWithMeta, 
        isIdentifying: false,
        history: [resultWithMeta, ...prev.history].slice(0, 50) 
      }));
      setGlobalSearchQuery("");
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isIdentifying: false }));
    }
  };

  const onSendMessage = async (msg: string) => {
    const userMessage: ChatMessage = { role: 'user', text: msg };
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, userMessage] }));
    try {
      const responseText = await chatWithExpert(msg, state.chatMessages, state.result || undefined);
      const modelMessage: ChatMessage = { role: 'model', text: responseText };
      setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, modelMessage] }));
    } catch (error) {
      console.error("Chat Error:", error);
    }
  };

  const handleShare = async () => {
    if (!state.result) return;
    
    let shareUrl = window.location.href;
    try {
      const parsedUrl = new URL(shareUrl);
      if (!parsedUrl.protocol.startsWith('http')) {
        shareUrl = ""; 
      }
    } catch {
      shareUrl = "";
    }

    const shareData = {
      title: `LeafID: ${state.result.commonName}`,
      text: `I just identified this ${state.result.commonName} (${state.result.scientificName}) using LeafID! Fun fact: ${state.result.funFact}`,
      ...(shareUrl ? { url: shareUrl } : {}),
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const fallbackText = `${shareData.text}${shareUrl ? `\nView here: ${shareUrl}` : ''}`;
        await navigator.clipboard.writeText(fallbackText);
        setIsShareSuccess(true);
        setTimeout(() => setIsShareSuccess(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Error sharing specimen:", err);
      }
    }
  };

  const resetSearch = () => {
    setPreviewUrl(null);
    setState(prev => ({ ...prev, result: null, error: null, view: 'home' }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = { name: authForm.name || authForm.email.split('@')[0], email: authForm.email };
    setState(prev => ({ ...prev, user, view: 'home' }));
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleLogout = () => {
    setState(prev => ({ 
      ...prev, 
      user: null, 
      history: [], 
      result: null, 
      chatMessages: [], 
      reminders: [],
      view: 'home' 
    }));
    localStorage.removeItem('plant_history');
    localStorage.removeItem('plant_user');
    localStorage.removeItem('plant_reminders');
  };

  const renderContent = () => {
    switch (state.view) {
      case 'signin':
      case 'signup':
        const isSignUp = state.view === 'signup';
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
             <div className="blob blob-emerald top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20"></div>
             <div className="glass w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="flex justify-center mb-8">
                   <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                      <Leaf size={32} />
                   </div>
                </div>
                <h2 className="text-3xl font-black text-center mb-2 tracking-tight dark:text-white">
                  {isSignUp ? 'Create Identity' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-10 font-bold text-sm">
                  {isSignUp ? 'Join the global botanical index' : 'Access your botanical legacy'}
                </p>
                
                <form onSubmit={handleLogin} className="space-y-6">
                   {isSignUp && (
                    <div className="relative group">
                       <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                       <input 
                         type="text" 
                         placeholder="Full Name" 
                         required
                         value={authForm.name}
                         onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                         className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all dark:text-white" 
                       />
                    </div>
                   )}
                   <div className="relative group">
                      <MailIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        type="email" 
                        placeholder="Botanist Email" 
                        required
                        value={authForm.email}
                        onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all dark:text-white" 
                      />
                   </div>
                   <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        required
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl py-4.5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all dark:text-white" 
                      />
                   </div>
                   <LiquidButton type="submit" className="w-full py-5 text-base uppercase tracking-widest mt-4">
                      {isSignUp ? 'Initialize Profile' : 'Access Vault'}
                   </LiquidButton>
                </form>

                <div className="mt-8 text-center">
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                      {isSignUp ? 'Already registered?' : 'New to LeafID?'}
                      <button 
                        onClick={() => setState(p => ({ ...p, view: isSignUp ? 'signin' : 'signup' }))}
                        className="ml-2 text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                         {isSignUp ? 'Sign In' : 'Sign Up'}
                      </button>
                   </p>
                </div>
             </div>
          </div>
        );

      case 'history':
        return (
          <div className="max-w-7xl mx-auto py-20 px-8 relative">
            <div className="blob blob-emerald top-0 -left-40"></div>
            <div className="blob blob-blue bottom-0 -right-40"></div>
            <div className="flex flex-col sm:flex-row items-end justify-between gap-10 mb-20">
              <div className="animate-in slide-in-from-left-12 duration-1000">
                <h1 className="text-5xl font-black tracking-tight mb-4 leading-none">Your <br/><span className="gradient-text">Herbal Legacy.</span></h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed">A high-fidelity record of your botanical journey.</p>
              </div>
              {state.history.length > 0 && (
                <LiquidButton 
                  onClick={() => { if(confirm("Permanently erase journal?")) setState(p => ({ ...p, history: [] })) }} 
                  className="bg-red-500 hover:bg-red-600 px-8 py-4 text-white text-base shadow-red-500/30"
                >
                  <Trash2 size={20} /> Purge Records
                </LiquidButton>
              )}
            </div>
            
            {state.history.length === 0 ? (
              <div className="glass p-32 rounded-[3rem] text-center border-dashed border-4 border-slate-200 dark:border-slate-800/40 shadow-xl">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/60 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-300 dark:text-slate-600 shadow-inner">
                  <History size={60} />
                </div>
                <h3 className="text-2xl font-black mb-4">Chronicle is Empty</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto font-bold">Your future discoveries will be cataloged here.</p>
                <LiquidButton onClick={() => setState(p => ({ ...p, view: 'home' }))} className="px-10 py-5 mx-auto text-base uppercase tracking-widest shadow-2xl">Start Scanning</LiquidButton>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {state.history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setState(p => ({ ...p, result: item, view: 'home' }))}
                    className="group glass liquid-card p-6 rounded-[2.5rem] cursor-pointer"
                  >
                    <div className="relative h-64 rounded-[2rem] overflow-hidden mb-8 shadow-xl">
                      {item.image ? (
                         <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={item.commonName} />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                           <Leaf size={64} />
                        </div>
                      )}
                      <div className="absolute top-5 right-5 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setState(p => ({ ...p, history: p.history.filter(i => i.id !== item.id) })) }} 
                          className="p-4 bg-black/40 backdrop-blur-2xl rounded-2xl text-white hover:bg-red-600 transition-all border border-white/20 shadow-xl"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.4em] mb-3">{new Date(item.timestamp).toLocaleDateString()}</p>
                      <h3 className="font-bold text-xl mb-1 line-clamp-1 dark:text-white group-hover:text-emerald-50 transition-colors duration-500">{item.commonName}</h3>
                      <p className="text-xs italic text-slate-500 dark:text-slate-400 mb-8 line-clamp-1">{item.scientificName}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Molecular Data</span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'reminders':
        return (
          <div className="max-w-7xl mx-auto py-20 px-8 relative">
            <div className="blob blob-emerald top-0 -left-40"></div>
            <div className="flex flex-col sm:flex-row items-end justify-between gap-10 mb-20">
              <div className="animate-in slide-in-from-left-12 duration-1000">
                <h1 className="text-5xl font-black tracking-tight mb-4 leading-none">Care <br/><span className="gradient-text">Protocols.</span></h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-bold max-w-xl leading-relaxed">Automated survival alerts for your flora.</p>
              </div>
            </div>

            {state.reminders.length === 0 ? (
              <div className="glass p-32 rounded-[3rem] text-center border-dashed border-4 border-slate-200 dark:border-slate-800/40 shadow-xl">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/60 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-slate-300 dark:text-slate-600 shadow-inner">
                  <Bell size={60} />
                </div>
                <h3 className="text-2xl font-black mb-4">No Active Alerts</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto font-bold">Enable reminders on any plant's profile to stay updated.</p>
                <LiquidButton onClick={() => setState(p => ({ ...p, view: 'home' }))} className="px-10 py-5 mx-auto text-base uppercase tracking-widest shadow-2xl">Browse Species</LiquidButton>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {state.reminders.map((reminder) => {
                  const isOverdue = Date.now() > reminder.nextDue;
                  return (
                    <div key={reminder.id} className={`glass p-8 rounded-[3rem] relative overflow-hidden transition-all duration-700 ${isOverdue ? 'border-red-500/30 bg-red-500/5 shadow-red-500/10' : 'border-emerald-500/10'}`}>
                      <div className="flex items-center justify-between mb-8">
                        <div className={`p-4 rounded-2xl ${reminder.task === 'Watering' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                           {reminder.task === 'Watering' ? <Droplets size={24} /> : <FlaskConical size={24} />}
                        </div>
                        {isOverdue && <span className="px-4 py-1 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">Critical</span>}
                      </div>
                      <h3 className="text-2xl font-black mb-2 dark:text-white leading-tight">{reminder.plantName}</h3>
                      <p className="text-slate-400 font-bold text-sm mb-10">{reminder.task} • {reminder.frequency}</p>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <span>Next Service</span>
                           <span className={isOverdue ? 'text-red-500' : 'text-emerald-600'}>{new Date(reminder.nextDue).toLocaleDateString()}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${isOverdue ? 'bg-red-500 w-full' : 'bg-emerald-500 w-1/2'}`}
                          ></div>
                        </div>
                        <button 
                          onClick={() => checkReminder(reminder.id)}
                          className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                          <CheckCircle2 size={16} /> Mark Completed
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'about':
        return (
          <div className="max-w-5xl mx-auto py-24 px-10 text-center relative">
            <div className="blob blob-blue top-1/4 left-1/2 -translate-x-1/2 opacity-25"></div>
            <div className="inline-block p-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-[3rem] text-emerald-600 mb-14 shadow-inner">
              <Zap size={60} className="animate-pulse" />
            </div>
            <h1 className="text-6xl lg:text-7xl font-black mb-10 tracking-tighter leading-[0.9] animate-in zoom-in-95 duration-1000">Intelligence <br/><span className="gradient-text">In Bloom.</span></h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-bold leading-relaxed mb-32 max-w-3xl mx-auto">
              LeafID is the intersection of high-fidelity visual neural networks and botanical archives. We map the genetic signatures of nature to your device.
            </p>
            
            <div className="grid md:grid-cols-3 gap-12 mb-32">
              {[
                { label: "20M+", sub: "Neural Nodes", icon: <Globe size={36} /> },
                { label: "0.12s", sub: "Latency Speed", icon: <Zap size={36} /> },
                { label: "99.9%", sub: "Species Coverage", icon: <ShieldCheck size={36} /> }
              ].map((stat, i) => (
                <div key={i} className="glass p-14 rounded-[4rem] group hover:bg-emerald-600 transition-all duration-1000 shadow-xl">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:bg-white/20 group-hover:text-white transition-all shadow-inner">
                    {stat.icon}
                  </div>
                  <p className="text-5xl font-black mb-3 group-hover:text-white transition-colors duration-500 tracking-tighter">{stat.label}</p>
                  <p className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-100 font-bold uppercase text-[11px] tracking-[0.3em] transition-colors duration-500">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="glass p-20 lg:p-32 rounded-[5rem] relative overflow-hidden text-left shadow-2xl group mb-32">
              <div className="absolute top-0 right-0 p-20 opacity-5 text-emerald-600 rotate-12 group-hover:scale-125 transition-transform duration-[5s]"><Leaf size={400} /></div>
              <div className="relative z-10">
                <h2 className="text-5xl font-black mb-8 leading-[0.9]">The Botanical <br/>Renaissance.</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-3xl mb-12">
                  LeafID was founded to bridge the gap between technical science and everyday exploration. We believe that when you truly see nature, you truly care for it.
                </p>
                <div className="flex gap-8 items-center">
                   <div className="w-2 h-24 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   <p className="text-xl font-bold italic max-w-2xl text-slate-500 dark:text-slate-400 leading-snug">"Nature does not hurry, yet everything is accomplished."</p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div className="glass p-16 rounded-[4rem] text-left border-emerald-500/20 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5"><Command size={180} /></div>
               <h3 className="text-3xl font-black mb-8 flex items-center gap-4 dark:text-white">
                 <Command className="text-emerald-600" /> Command Protocol
               </h3>
               <div className="grid sm:grid-cols-2 gap-10">
                 {[
                   { key: "D", action: "Toggle Night/Day Cycle" },
                   { key: "C", action: "Initialize Neural Chat" },
                   { key: "1-5", action: "Rapid View Navigation" },
                   { key: "Esc", action: "Abort / Clear Results" }
                 ].map((s, i) => (
                   <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800">
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-emerald-600 shadow-sm border-b-4 border-slate-300 dark:border-slate-700">{s.key}</div>
                      <p className="font-bold text-slate-600 dark:text-slate-400">{s.action}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-6xl mx-auto py-32 px-10 relative">
            <div className="blob blob-emerald top-20 right-0 opacity-25"></div>
            <div className="grid lg:grid-cols-2 gap-32 items-center">
              <div className="space-y-14 animate-in slide-in-from-left-16 duration-1000">
                <h1 className="text-7xl font-black tracking-tight leading-[0.8] mb-6">Connect <br/><span className="gradient-text">With Labs.</span></h1>
                <p className="text-2xl text-slate-500 dark:text-slate-400 font-bold leading-relaxed">Questions about species or feature feedback? We're on standby.</p>
                
                <div className="space-y-8">
                  {[
                    { icon: <Mail size={32} />, label: "Support Network", value: "liyanshaikhusa@gmail.com" },
                    { icon: <MapPin size={32} />, label: "Global Greenhouse", value: "Elmhurst, NY" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-8 p-8 glass rounded-[3rem] hover:bg-white/70 dark:hover:bg-slate-900/60 transition-all duration-700 shadow-xl group">
                       <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">{item.icon}</div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2 transition-colors duration-500">{item.label}</p>
                         <p className="text-2xl font-bold dark:text-white transition-colors duration-500 tracking-tighter">{item.value}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="glass p-16 rounded-[4rem] border-slate-200/50 shadow-2xl animate-in slide-in-from-right-16 duration-1000">
                <form className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.4em] ml-6">Identity</p>
                    <input placeholder="Sterling Archer" className="w-full bg-white dark:bg-slate-950 px-10 py-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-lg dark:text-white duration-500 shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.4em] ml-6">Direct Channel</p>
                    <input placeholder="archer@spy.com" className="w-full bg-white dark:bg-slate-950 px-10 py-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-lg dark:text-white duration-500 shadow-inner" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-[0.4em] ml-6">Intelligence Log</p>
                    <textarea placeholder="How can we help?" rows={5} className="w-full bg-white dark:bg-slate-950 px-10 py-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-lg resize-none dark:text-white duration-500 shadow-inner"></textarea>
                  </div>
                  <LiquidButton type="button" className="w-full py-8 rounded-[2rem] text-white font-black text-xl shadow-4xl uppercase tracking-[0.2em] mt-6">Submit Inquiry</LiquidButton>
                </form>
              </div>
            </div>
          </div>
        );

      default:
        // HOME VIEW (including Search History and Global Search)
        const filteredHistory = state.history.filter(item => 
          item.commonName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
          item.scientificName.toLowerCase().includes(historySearchQuery.toLowerCase())
        );

        return (
          <div className="max-w-7xl mx-auto px-10 py-20">
            {!state.result && !state.isIdentifying && (
              <div className="text-center py-20 relative min-h-[80vh] flex flex-col items-center justify-center">
                <div className="blob blob-emerald top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-30"></div>
                <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black mb-12 tracking-[0.5em] uppercase shadow-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Neural Vision Core 6.0 Active
                </div>
                
                <h1 className="text-7xl md:text-[8rem] font-black mb-14 tracking-tighter leading-[0.75] animate-in slide-in-from-top-12 duration-[1.5s]">
                  The Plant <br/><span className="gradient-text">Genome Kit.</span>
                </h1>
                <p className="text-2xl md:text-3xl text-slate-700 dark:text-slate-300 max-w-4xl mx-auto mb-20 font-bold leading-tight tracking-tight opacity-90">
                  Instantly reveal the molecular blueprint of any specimen with the world's most precise AI.
                </p>

                {/* Global Search Bar (Liquid Glass UI) */}
                <div className="w-full max-w-3xl mb-12 relative group">
                  <div className="absolute -inset-4 liquid-glass opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none"></div>
                  <form onSubmit={handleGlobalSearch} className="relative z-10 glass p-4 rounded-[2.5rem] flex items-center gap-4 shadow-2xl border border-white/40">
                    <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg">
                      <Sparkles size={24} />
                    </div>
                    <input 
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Search any species by name..." 
                      className="flex-1 bg-transparent border-none outline-none text-xl font-bold dark:text-white px-4 placeholder:text-slate-400"
                    />
                    <LiquidButton type="submit" className="px-10 py-4 h-full rounded-2xl text-base uppercase tracking-widest hidden sm:flex">
                      Identify
                    </LiquidButton>
                  </form>
                </div>

                {/* Trending / Suggested Tags */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-32 opacity-80 animate-in fade-in duration-1000 delay-300">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Trending:</p>
                  {['Monstera Deliciosa', 'Fiddle Leaf Fig', 'Snake Plant', 'Lavender'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => handleGlobalSearch(undefined, tag)}
                      className="px-5 py-2 rounded-full glass hover:bg-emerald-600 hover:text-white transition-all text-[11px] font-bold border border-slate-200 dark:border-slate-800"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) processFile(f); }}
                  className={`relative w-full max-w-2xl mx-auto p-12 lg:p-16 rounded-[4rem] border-4 border-dashed transition-all duration-1000 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                    isDragging 
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/80 shadow-[0_80px_160px_-40px_rgba(16,185,129,0.5)] scale-[1.05]' 
                    : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/90 shadow-4xl backdrop-blur-3xl'
                  }`}
                >
                  <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-600 text-white flex items-center justify-center mb-10 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.6)] animate-pulse"><ImageIcon size={64} /></div>
                  <h3 className="text-3xl font-black mb-12 tracking-tighter dark:text-white">Deposit Specimen Image</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-6 w-full">
                    <label className="lg-button flex-1 py-6 rounded-[1.5rem] text-white font-bold text-xl flex items-center justify-center gap-4 cursor-pointer shadow-xl">
                      <Camera size={28} /> Capture
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) processFile(f); }} />
                    </label>
                    <label className="flex-1 py-6 rounded-[1.5rem] bg-white dark:bg-slate-900 text-emerald-600 font-bold text-xl flex items-center justify-center gap-4 cursor-pointer shadow-3xl border border-slate-200 dark:border-slate-800 transition-all hover:bg-emerald-50 dark:hover:bg-slate-800 duration-500">
                      <Upload size={28} /> Gallery
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) processFile(f); }} />
                    </label>
                  </div>
                </div>

                {/* Local History Quick Look with Search */}
                {state.history.length > 0 && (
                  <div className="w-full mt-40 space-y-12 text-left animate-in slide-in-from-bottom-12 duration-1000">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-200 dark:border-slate-800 pb-12">
                      <div className="flex items-center gap-6">
                         <div className="p-5 bg-emerald-100 dark:bg-emerald-900/40 rounded-[2rem] text-emerald-600"><History size={32} /></div>
                         <div>
                            <h2 className="text-4xl font-black tracking-tight dark:text-white leading-none mb-2">Personal Archives</h2>
                            <p className="font-bold text-slate-500 dark:text-slate-400">Search your findings</p>
                         </div>
                      </div>
                      
                      <div className="relative group max-w-sm w-full">
                        <div className="absolute -inset-2 liquid-glass opacity-20 group-focus-within:opacity-40 transition-opacity pointer-events-none"></div>
                        <div className="relative z-10">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                          <input 
                            type="text" 
                            value={historySearchQuery}
                            onChange={(e) => setHistorySearchQuery(e.target.value)}
                            placeholder="Find saved specimen..." 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] py-4.5 pl-14 pr-14 text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                          />
                          {historySearchQuery && (
                            <button 
                              onClick={() => setHistorySearchQuery("")}
                              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {filteredHistory.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredHistory.slice(0, 3).map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => setState(p => ({ ...p, result: item, view: 'home' }))}
                            className="group glass liquid-card p-5 rounded-[2.5rem] cursor-pointer"
                          >
                            <div className="relative h-48 rounded-[2rem] overflow-hidden mb-6 shadow-md">
                              {item.image ? (
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={item.commonName} />
                              ) : (
                                <div className="w-full h-full bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-emerald-600/30">
                                   <Leaf size={48} />
                                </div>
                              )}
                            </div>
                            <div className="px-2">
                              <h3 className="font-bold text-xl line-clamp-1 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">{item.commonName}</h3>
                              <p className="text-xs italic text-slate-500 dark:text-slate-400">{item.scientificName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 glass rounded-[3rem] border-dashed border-2 border-slate-200 dark:border-slate-800/60">
                         <Filter className="mx-auto mb-6 text-slate-300" size={48} />
                         <p className="text-xl font-bold text-slate-500 dark:text-slate-400 italic">No matching botanical records found.</p>
                         <button onClick={() => setHistorySearchQuery("")} className="mt-6 text-emerald-600 font-bold hover:underline">Clear Filters</button>
                      </div>
                    )}

                    {state.history.length > 3 && !historySearchQuery && (
                      <div className="flex justify-center">
                        <LiquidButton onClick={() => setState(p => ({ ...p, view: 'history' }))} className="px-12 py-4 text-sm uppercase tracking-widest">
                          View All Archives ({state.history.length})
                        </LiquidButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {state.isIdentifying && (
              <div className="flex flex-col items-center justify-center py-20 min-h-[85vh] relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      className="w-full h-full object-cover blur-[80px] opacity-30 scale-150 animate-pulse" 
                      alt="Processing background" 
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-900 opacity-20 blur-[80px] animate-pulse"></div>
                  )}
                  <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-950/60 backdrop-blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-16 group">
                    <div className="w-[380px] h-[380px] md:w-[480px] md:h-[480px] liquid-glass flex items-center justify-center border-emerald-500/40 p-10 shadow-[0_0_120px_rgba(16,185,129,0.3)] dark:shadow-[0_0_160px_rgba(16,185,129,0.15)] overflow-hidden">
                       {previewUrl && (
                        <img 
                          src={previewUrl} 
                          className="w-full h-full object-cover rounded-[5rem] blur-2xl opacity-60 scale-110 animate-bloom" 
                          alt="Specimen preview"
                        />
                       )}
                       <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-transparent to-blue-500/20"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/10 dark:bg-slate-900/20 p-12 rounded-[4rem] backdrop-blur-3xl border border-white/20 shadow-4xl flex flex-col items-center">
                             <Fingerprint size={80} className="text-white animate-pulse mb-4" />
                             <Loader2 size={40} className="text-emerald-400 animate-spin" />
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="text-center space-y-6 max-w-lg">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                      {previewUrl ? "Neural Vision Protocol Active" : "Querying Botanical Database"}
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 leading-none dark:text-white">
                      Mapping <span className="gradient-text">Genomics.</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-bold tracking-tight animate-pulse">
                      Processing Specimen...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {state.result && (
              <div className="animate-in fade-in slide-in-from-bottom-20 duration-1000 py-16">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-20 gap-8">
                  <button onClick={resetSearch} className="w-full sm:w-auto flex items-center justify-center gap-6 font-bold text-slate-400 hover:text-emerald-600 transition-all group px-10 py-5 glass rounded-[2rem] shadow-lg text-base">
                    <ArrowRight className="rotate-180 group-hover:-translate-x-3 transition-transform" size={26} />
                    New Field Exploration
                  </button>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                      onClick={handleShare}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 transition-all shadow-lg active:scale-95 group"
                    >
                      <Share2 size={20} className="text-emerald-600 group-hover:rotate-12 transition-transform" /> 
                      {isShareSuccess ? "Summary Copied!" : "Share Specimen"}
                    </button>
                  </div>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-32 items-start">
                  <div className="lg:sticky lg:top-40">
                    <div className="relative rounded-[6rem] overflow-hidden shadow-[0_100px_200px_-50px_rgba(0,0,0,0.4)] border-[20px] border-white dark:border-slate-900 transition-all duration-1000 group animate-bloom">
                      {state.result.image ? (
                        <img src={previewUrl || state.result.image} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-[6s]" />
                      ) : (
                        <div className="w-full aspect-[4/5] bg-emerald-100 dark:bg-slate-900 flex items-center justify-center text-emerald-600">
                           <Leaf size={160} />
                        </div>
                      )}
                      {state.result.toxicity.isToxic && (
                        <div className="absolute top-12 right-12 px-10 py-6 bg-red-600 text-white rounded-[2rem] font-black text-xs uppercase flex items-center gap-4 shadow-2xl animate-bounce">
                          <AlertTriangle size={24} /> BIOHAZARD: TOXIC
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-20">
                    <div className="animate-in slide-in-from-right-16 duration-1000">
                      <span className="inline-block px-8 py-4 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 font-bold rounded-[1.5rem] text-[11px] uppercase tracking-[0.6em] mb-10 shadow-inner">{state.result.family} Core Index</span>
                      <h1 className="text-7xl md:text-8xl font-black mb-10 tracking-tighter leading-[0.75] dark:text-white transition-all duration-500">{state.result.commonName}</h1>
                      <p className="text-3xl text-slate-600 dark:text-slate-400 italic font-bold leading-tight border-l-[12px] border-emerald-500 pl-12 transition-colors duration-500">{state.result.description}</p>
                    </div>

                    <div className="lg-button p-16 rounded-[4rem] text-white shadow-[0_60px_120px_-30px_rgba(16,185,129,0.5)] group transition-all duration-700 relative overflow-hidden">
                      <div className="absolute -bottom-16 -right-16 p-16 opacity-10 text-white group-hover:rotate-12 transition-transform duration-[3s]"><Leaf size={300}/></div>
                      <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="p-4 bg-white/20 rounded-2xl shadow-inner"><Zap size={32} /></div>
                        <h4 className="font-bold uppercase text-[11px] tracking-[0.6em] opacity-80">Genomic Summary</h4>
                      </div>
                      <p className="text-4xl font-black leading-tight italic tracking-tighter relative z-10">"{state.result.funFact}"</p>
                    </div>

                    {/* Care Protocol / Reminders Section */}
                    <div className="glass p-12 rounded-[3.5rem] border-emerald-500/20 shadow-2xl space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg"><Calendar size={20}/></div>
                        <h3 className="text-2xl font-black dark:text-white">Care Protocol</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                          { task: 'Watering', frequency: state.result.care.water, icon: <Droplets size={20}/> },
                          { task: 'Fertilizing', frequency: state.result.care.fertilizer, icon: <FlaskConical size={20}/> }
                        ].map(item => {
                          const isActive = state.reminders.some(r => r.plantId === state.result!.id && r.task === item.task);
                          return (
                            <button 
                              key={item.task}
                              onClick={() => toggleReminder(item.task, item.frequency)}
                              className={`p-8 rounded-[2.5rem] text-left transition-all group flex flex-col justify-between h-48 ${
                                isActive 
                                ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                                : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-500/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600'}`}>
                                  {item.icon}
                                </div>
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-white border-white text-emerald-600 scale-110' : 'border-slate-300 dark:border-slate-700'}`}>
                                  {isActive && <CheckCircle2 size={16} />}
                                </div>
                              </div>
                              <div>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-emerald-100' : 'text-emerald-600'}`}>{item.task}</p>
                                <p className="font-bold text-sm leading-tight line-clamp-2">{isActive ? 'Alert Active' : 'Enable Tracking'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <PlantTable data={state.result} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="pb-40 overflow-x-hidden selection:bg-emerald-500/30 transition-all duration-1000">
      <Navbar 
        currentView={state.view} 
        setView={(v) => setState(p => ({ ...p, view: v }))} 
        darkMode={state.darkMode} 
        toggleTheme={() => setState(p => ({ ...p, darkMode: !p.darkMode }))}
        user={state.user}
        onLogout={handleLogout}
      />
      
      <main className="relative min-h-[calc(100vh-140px)]">
        {renderContent()}
      </main>

      <button 
        onClick={() => setState(p => ({ ...p, isChatOpen: !p.isChatOpen }))}
        title="Toggle Chat (C)"
        className={`fixed bottom-12 right-12 w-20 h-20 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(16,185,129,0.5)] flex items-center justify-center transition-all z-[101] border-4 border-white/70 dark:border-slate-700/70 group ${
          state.isChatOpen ? 'bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 rotate-90 scale-90' : 'lg-button text-white hover:scale-110 active:scale-95'
        }`}
      >
        {state.isChatOpen ? <X size={36} /> : <MessageCircle size={36} />}
        {!state.isChatOpen && <span className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-full shadow-lg">C</span>}
      </button>

      <ChatBot 
        isOpen={state.isChatOpen} 
        onClose={() => setState(p => ({ ...p, isChatOpen: false }))} 
        messages={state.chatMessages} 
        onSendMessage={onSendMessage} 
        currentPlant={state.result}
      />
    </div>
  );
};

export default App;
