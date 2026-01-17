
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Info, Sun, Moon, Leaf, X, Loader2, CheckCircle2, Search, ArrowRight, History, User, LogOut, AlertTriangle, ShieldCheck, Trash2, MessageCircle, Send, ImageIcon, MapPin, Globe, Zap, Mail, Lock, Mail as MailIcon, AlertOctagon, Fingerprint, Command, Sparkles, Filter, Share2, Bell, Droplets, FlaskConical, Calendar, HelpCircle, Archive, Scale, ChevronRight, Activity, Thermometer, Ruler, Lightbulb, Check, Layers, Wind, Sparkle, Keyboard, Plus, Waves } from 'lucide-react';
import { identifyPlant, chatWithExpert, searchPlantByName } from './geminiService';
import { AppState, View, PlantInfo, ChatMessage, Reminder, HomeSearchTab } from './types';

// Keyboard Shortcut Hook for reusable logic
const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-black shadow-sm mx-1 inline-block uppercase transition-colors">{children}</kbd>
);

const LiquidButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  loading?: boolean;
}> = ({ onClick, children, className = "", type = "button", loading = false }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading}
    className={`lg-button rounded-[1.5rem] flex items-center justify-center gap-3 font-bold transition-all shadow-xl disabled:opacity-50 ${className}`}
  >
    {loading ? <Loader2 className="animate-spin" size={20} /> : children}
  </button>
);

const LightMeter: React.FC<{ optimalRange: string }> = ({ optimalRange }) => {
  const [lux, setLux] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
          interval = setInterval(analyzeBrightness, 500);
        })
        .catch(err => {
          console.error("Camera access denied for light meter:", err);
          setIsActive(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const analyzeBrightness = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 100, 100);
    const imageData = ctx.getImageData(0, 0, 100, 100);
    let totalLuminance = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i+1];
      const b = imageData.data[i+2];
      totalLuminance += (0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    const avgLuminance = totalLuminance / (imageData.data.length / 4);
    setLux(Math.round(avgLuminance * 35));
  };

  return (
    <div className="glass p-8 rounded-[3.5rem] space-y-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20"><Lightbulb size={20}/></div>
          <h3 className="text-xl font-black dark:text-white tracking-tight">Photon Analyzer</h3>
        </div>
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${isActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}
        >
          {isActive ? 'Abort Sensor' : 'Start Sensor'}
        </button>
      </div>
      <div className="relative h-48 bg-slate-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-slate-100 dark:border-slate-800">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" />
        <canvas ref={canvasRef} width="100" height="100" className="hidden" />
        <div className="relative z-10 text-center animate-in zoom-in-95 duration-500">
          <p className="text-6xl font-black text-white tracking-tighter">{lux !== null ? lux.toLocaleString() : '--'}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mt-2">Ambient Lux</p>
        </div>
      </div>
      <div className="space-y-4 px-2">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
           <span>Optimal Range</span>
           <span className="text-emerald-500">{optimalRange}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
           <div className="h-full bg-amber-500 transition-all duration-700 rounded-full" style={{ width: `${Math.min(((lux || 0) / 5000) * 100, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const WaterMeter: React.FC = () => {
  const [moisture, setMoisture] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
          interval = setInterval(analyzeMoisture, 500);
        })
        .catch(err => {
          console.error("Camera access denied for moisture sensor:", err);
          setIsActive(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const analyzeMoisture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 100, 100);
    const imageData = ctx.getImageData(0, 0, 100, 100);
    let totalLuminance = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i+1];
      const b = imageData.data[i+2];
      totalLuminance += (0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    const avgLuminance = totalLuminance / (imageData.data.length / 4);
    // Darker surface (low luminance) usually indicates moisture in soil
    // Mapping luminance 0-255 to moisture 100%-0%
    const estimatedMoisture = Math.max(0, Math.min(100, 100 - (avgLuminance / 2.55)));
    setMoisture(Math.round(estimatedMoisture));
  };

  return (
    <div className="glass p-8 rounded-[3.5rem] space-y-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20"><Droplets size={20}/></div>
          <h3 className="text-xl font-black dark:text-white tracking-tight">Hydration Sensor</h3>
        </div>
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${isActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}
        >
          {isActive ? 'Stop Scan' : 'Scan Soil'}
        </button>
      </div>
      <div className="relative h-48 bg-slate-900 rounded-[2.5rem] overflow-hidden flex items-center justify-center border-4 border-slate-100 dark:border-slate-800">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 saturate-150" />
        <canvas ref={canvasRef} width="100" height="100" className="hidden" />
        <div className="relative z-10 text-center animate-in zoom-in-95 duration-500">
          <p className="text-6xl font-black text-white tracking-tighter">{moisture !== null ? `${moisture}%` : '--'}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mt-2">Saturation Level</p>
        </div>
      </div>
      <div className="space-y-4 px-2">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
           <span>Moisture Index</span>
           <span className="text-blue-500">{moisture !== null ? (moisture > 60 ? 'High' : moisture > 30 ? 'Medium' : 'Low') : 'Awaiting Data'}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
           <div className="h-full bg-blue-500 transition-all duration-700 rounded-full" style={{ width: `${moisture || 0}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const ComparisonModal: React.FC<{ isOpen: boolean; onClose: () => void; sourcePlant: PlantInfo }> = ({ isOpen, onClose, sourcePlant }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetPlant, setTargetPlant] = useState<PlantInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const result = await searchPlantByName(searchQuery);
      setTargetPlant(result);
    } catch (err: any) { setError(err.message); } finally { setIsSearching(false); }
  };

  if (!isOpen) return null;

  const careIcons: Record<string, React.ReactNode> = {
    water: <Droplets size={16} />,
    light: <Sun size={16} />,
    soil: <Layers size={16} />,
    humidity: <Wind size={16} />,
    fertilizer: <FlaskConical size={16} />
  };

  const getComparisonStatus = (v1: string, v2: string) => {
    const isMatch = v1.toLowerCase() === v2.toLowerCase();
    return {
      isMatch,
      label: isMatch ? "Identical Requirement" : "Critical Difference",
      colorClass: isMatch ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-500 bg-rose-50 dark:bg-rose-900/30",
      icon: isMatch ? <CheckCircle2 size={12} /> : <Zap size={12} className="animate-pulse" />,
      borderClass: isMatch ? "border-emerald-500/20" : "border-rose-500/40"
    };
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl glass rounded-[4rem] shadow-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-emerald-600/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20"><Scale size={24} /></div>
            <div>
              <h2 className="text-2xl font-black dark:text-white leading-none">Cross-Genomic Analysis</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 mt-1">Real-time Comparative Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {!targetPlant && !isSearching && (
            <div className="max-w-xl mx-auto py-20 text-center space-y-10">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/40 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <Search size={48} />
              </div>
              <h3 className="text-3xl font-black dark:text-white tracking-tight">Select Comparison Target</h3>
              <form onSubmit={handleSearch} className="space-y-6">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter species name..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] outline-none font-bold text-lg dark:text-white focus:ring-4 focus:ring-emerald-500/20 transition-all" />
                <LiquidButton type="submit" className="w-full py-5 text-lg">Initialize Analysis</LiquidButton>
              </form>
            </div>
          )}
          {isSearching && (
            <div className="py-32 flex flex-col items-center gap-8 animate-pulse">
              <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Querying Global Botanical Archives...</p>
            </div>
          )}
          {targetPlant && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-center mb-10">
                <button onClick={() => setTargetPlant(null)} className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2">
                  <ArrowRight className="rotate-180" size={14} /> Change Target
                </button>
              </div>
              <div className="grid grid-cols-2 gap-12 text-center mb-16">
                <div className="space-y-4">
                  <div className="h-64 rounded-[3.5rem] bg-emerald-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden border-4 border-emerald-500/20 shadow-2xl">
                    {sourcePlant.image ? <img src={sourcePlant.image} className="w-full h-full object-cover" /> : <Leaf size={64} className="text-emerald-200" />}
                  </div>
                  <h4 className="text-2xl font-black dark:text-white tracking-tight">{sourcePlant.commonName}</h4>
                </div>
                <div className="space-y-4">
                  <div className="h-64 rounded-[3.5rem] bg-blue-50 dark:bg-slate-900/50 flex items-center justify-center overflow-hidden border-4 border-blue-500/20 shadow-2xl">
                    {targetPlant.image ? <img src={targetPlant.image} className="w-full h-full object-cover" /> : <Search size={64} className="text-blue-200" />}
                  </div>
                  <h4 className="text-2xl font-black dark:text-white tracking-tight">{targetPlant.commonName}</h4>
                </div>
              </div>
              <div className="space-y-10">
                {Object.keys(sourcePlant.care).map(key => {
                  const v1 = sourcePlant.care[key as keyof typeof sourcePlant.care];
                  const v2 = targetPlant.care[key as keyof typeof targetPlant.care];
                  const status = getComparisonStatus(v1, v2);
                  return (
                    <div key={key} className={`glass p-10 rounded-[3.5rem] border-2 transition-all duration-700 ${status.borderClass} hover:translate-x-2`}>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className={`p-3.5 rounded-2xl shadow-lg ${status.isMatch ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40'}`}>
                            {careIcons[key] || <Leaf size={20} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] mb-1">{key}</p>
                            <h5 className="text-lg font-bold dark:text-white">Genomic Comparison</h5>
                          </div>
                        </div>
                        <div className={`px-6 py-2.5 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl ${status.colorClass}`}>
                          {status.icon} {status.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-12 text-base font-bold leading-relaxed relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 -translate-x-1/2 hidden md:block"></div>
                        <div className={`p-6 rounded-[2.5rem] bg-white/60 dark:bg-slate-800/60 border-2 ${status.isMatch ? 'border-emerald-500/10' : 'border-rose-500/20'} shadow-inner`}>
                           {v1}
                        </div>
                        <div className={`p-6 rounded-[2.5rem] bg-white/60 dark:bg-slate-800/60 border-2 ${status.isMatch ? 'border-emerald-500/10' : 'border-rose-500/20'} shadow-inner`}>
                           {v2}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlantTable: React.FC<{ data: PlantInfo; onCompare: () => void }> = ({ data, onCompare }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-12 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 backdrop-blur-3xl shadow-xl transition-all duration-500">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-50/80 dark:bg-slate-800/40 p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl text-white shadow-lg transition-all duration-500 ${isExpanded ? 'bg-emerald-600 rotate-180' : 'bg-slate-500'}`}>
            <Info size={24} />
          </div>
          <div>
            <h3 className="font-black text-xl dark:text-white tracking-tight">Genomic Blueprint</h3>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Specifications & Safety Audit</p>
          </div>
          {data.toxicity.isToxic && (
            <div className="ml-2 flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse">
              <AlertOctagon size={14} /> Hazard Detected
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); onCompare(); }} 
            className="hidden sm:flex px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all shadow-md active:scale-95"
          >
            <Scale size={14} /> Compare
          </button>
          <ChevronRight className={`transition-transform duration-500 ${isExpanded ? 'rotate-90 text-emerald-500' : 'text-slate-300'}`} size={24} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/50 animate-in slide-in-from-top-4 duration-500">
          {[
            { label: "Scientific Name", value: data.scientificName, italic: true },
            { label: "Family", value: data.family },
            { label: "Geographic Origin", value: data.origin },
            { label: "Toxicity Audit", value: data.toxicity.isToxic ? data.toxicity.details : "Non-toxic to humans and common pets.", isHazard: data.toxicity.isToxic },
            { label: "Botanical Trivia", value: data.funFact },
          ].map((row, idx) => (
            <div key={idx} className={`grid grid-cols-3 p-10 transition-colors ${row.isHazard ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}`}>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${row.isHazard ? 'text-red-600' : 'text-slate-400'}`}>{row.label}</span>
              <span className={`col-span-2 font-bold text-base dark:text-slate-100 leading-relaxed ${row.italic ? 'italic' : ''} ${row.isHazard ? 'text-red-700 dark:text-red-400' : ''}`}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedHistory = localStorage.getItem('plant_history');
    const savedReminders = localStorage.getItem('plant_reminders');
    return {
      view: 'home', 
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches, 
      isIdentifying: false, 
      result: null, 
      error: null, 
      history: savedHistory ? JSON.parse(savedHistory) : [], 
      user: null, 
      isChatOpen: false, 
      chatMessages: [], 
      reminders: savedReminders ? JSON.parse(savedReminders) : [], 
      homeSearchTab: 'global'
    };
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Processing Specimen...");
  const [isComparing, setIsComparing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('plant_reminders', JSON.stringify(state.reminders));
  }, [state.reminders]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
         if (e.key === 'Escape') (e.target as HTMLElement).blur();
         return;
      }
      const key = e.key.toUpperCase();
      
      // Numerical Navigation Shortcuts
      if (key === '1') setState(p => ({ ...p, view: 'home', result: null }));
      else if (key === '2') setState(p => ({ ...p, view: 'history', result: null }));
      else if (key === '3') setState(p => ({ ...p, view: 'reminders', result: null }));
      else if (key === '4') setState(p => ({ ...p, view: 'about', result: null }));
      else if (key === '5') setState(p => ({ ...p, view: 'contact', result: null }));
      
      // Action Shortcuts
      else if (key === 'C') setState(p => ({ ...p, isChatOpen: !p.isChatOpen }));
      else if (key === 'D') setState(p => ({ ...p, darkMode: !p.darkMode }));
      else if (key === 'S') { e.preventDefault(); searchInputRef.current?.focus(); }
      else if (key === 'Escape') {
        if (state.isChatOpen) setState(p => ({ ...p, isChatOpen: false }));
        else if (state.result) setState(p => ({ ...p, result: null }));
        else if (isComparing) setIsComparing(false);
      }
      else if (e.key === 'ArrowRight') {
        const views: View[] = ['home', 'history', 'reminders', 'about', 'contact'];
        setState(p => ({ ...p, view: views[(views.indexOf(p.view) + 1) % views.length], result: null }));
      }
      else if (e.key === 'ArrowLeft') {
        const views: View[] = ['home', 'history', 'reminders', 'about', 'contact'];
        setState(p => ({ ...p, view: views[(views.indexOf(p.view) - 1 + views.length) % views.length], result: null }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isChatOpen, state.result, isComparing, state.view]);

  useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.darkMode]);

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewUrl(base64);
      setState(p => ({ ...p, isIdentifying: true, result: null, view: 'home' }));
      try {
        const info = await identifyPlant(base64.split(',')[1]);
        const res = { ...info, id: crypto.randomUUID(), timestamp: Date.now(), image: base64 };
        setState(p => {
          const newHistory = [res, ...p.history].slice(0, 50);
          localStorage.setItem('plant_history', JSON.stringify(newHistory));
          return { ...p, result: res, isIdentifying: false, history: newHistory };
        });
      } catch (err: any) { setState(p => ({ ...p, error: err.message, isIdentifying: false })); }
    };
    reader.readAsDataURL(file);
  };

  const handleGlobalSearch = async (query: string) => {
    setState(p => ({ ...p, isIdentifying: true, result: null, view: 'home' }));
    setPreviewUrl(null);
    try {
      const info = await searchPlantByName(query);
      const res = { ...info, id: crypto.randomUUID(), timestamp: Date.now() };
      setState(p => {
        const newHistory = [res, ...p.history].slice(0, 50);
        localStorage.setItem('plant_history', JSON.stringify(newHistory));
        return { ...p, result: res, isIdentifying: false, history: newHistory };
      });
    } catch (err: any) { setState(p => ({ ...p, error: err.message, isIdentifying: false })); }
  };

  const onSendMessage = async (msg: string) => {
    const userMsg: ChatMessage = { role: 'user', text: msg };
    setState(p => ({ ...p, chatMessages: [...p.chatMessages, userMsg] }));
    const resp = await chatWithExpert(msg, state.chatMessages, state.result || undefined);
    const modelMsg: ChatMessage = { role: 'model', text: resp };
    setState(p => ({ ...p, chatMessages: [...p.chatMessages, modelMsg] }));
  };

  const handleMockLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    // Simulated Secure Handshake
    setTimeout(() => {
      setState(p => ({ ...p, user: { name: 'Botanist Prime', email: 'user@leafid.bio' }, view: 'home' }));
      setIsLoggingIn(false);
    }, 1200);
  };

  const addReminder = (plantId: string, plantName: string, task: string, frequencyDays: number) => {
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      plantId,
      plantName,
      task,
      frequency: `${frequencyDays} days`,
      lastDone: Date.now(),
      nextDue: Date.now() + frequencyDays * 24 * 60 * 60 * 1000,
    };
    setState(p => ({ ...p, reminders: [newReminder, ...p.reminders] }));
  };

  const deleteReminder = (id: string) => {
    setState(p => ({ ...p, reminders: p.reminders.filter(r => r.id !== id) }));
  };

  const renderContent = () => {
    if (state.isIdentifying) {
      return (
        <div className="py-20 text-center space-y-12 animate-in fade-in duration-700">
          <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] liquid-glass mx-auto relative overflow-hidden flex items-center justify-center shadow-4xl border-emerald-500/30">
             {previewUrl && <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110" />}
             <div className="scan-line"></div>
             <div className="relative z-10 p-12 bg-white/20 dark:bg-slate-900/40 rounded-[5rem] backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col items-center">
                <Activity size={80} className="text-white animate-pulse" />
                <div className="mt-6 flex items-center gap-2">
                   <Loader2 size={16} className="text-emerald-400 animate-spin" />
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Neural Audit Active</span>
                </div>
             </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white">Mapping <span className="gradient-text">Genome.</span></h2>
             <p className="text-xl font-bold text-slate-400 animate-pulse tracking-tight">{loadingMessage}</p>
          </div>
        </div>
      );
    }

    if (state.result) {
      return (
        <div className="space-y-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 py-16">
          <button onClick={() => setState(p => ({ ...p, result: null }))} className="flex items-center gap-4 font-black text-slate-400 hover:text-emerald-600 transition-all group glass px-8 py-4 rounded-2xl shadow-lg">
             <ArrowRight className="rotate-180 group-hover:-translate-x-2 transition-transform" size={24} /> New Specimen Deposit <Kbd>ESC</Kbd>
          </button>
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="relative rounded-[5rem] overflow-hidden shadow-4xl border-[16px] border-white dark:border-slate-900 group">
                <img src={state.result.image || previewUrl || ''} className="w-full aspect-[4/5] object-cover" />
                <div className={`absolute top-10 right-10 px-8 py-4 rounded-[2rem] font-black text-xs uppercase flex items-center gap-3 shadow-2xl backdrop-blur-xl ${state.result.diagnosis.status === 'Healthy' ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white animate-bounce'}`}>
                  <Activity size={20} /> Status: {state.result.diagnosis.status}
                </div>
              </div>
              
              <div className="glass p-10 rounded-[3.5rem] space-y-8 border border-white/20">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black dark:text-white flex items-center gap-3"><Bell className="text-emerald-500" /> Reminders</h3>
                   <button 
                     onClick={() => addReminder(state.result!.id, state.result!.commonName, 'Watering Protocol', 7)}
                     className="p-3 bg-emerald-600 text-white rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20"
                   >
                     <Plus size={20} />
                   </button>
                </div>
                <p className="text-sm font-bold text-slate-500">Initialize care scheduling for this specimen.</p>
              </div>

              <div className="glass p-12 rounded-[4.5rem] space-y-10 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl"><Globe size={20}/></div>
                    <h3 className="text-2xl font-black dark:text-white tracking-tight">Biogeographic Distribution</h3>
                 </div>
                 <div className="bg-slate-100 dark:bg-slate-800/60 h-72 rounded-[3.5rem] relative flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="absolute inset-0 opacity-10 pointer-events-none grayscale scale-150"><Globe size={300}/></div>
                    <div className="text-center p-8 space-y-6 relative z-10">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2">Native Biosphere</p>
                       <p className="text-2xl font-bold dark:text-white tracking-tight">{state.result.origin}</p>
                       <div className="flex flex-wrap justify-center gap-3">
                          {state.result.groundingLinks?.map((link, i) => (
                            <a key={i} href={link.uri} target="_blank" className="px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl text-[10px] font-black uppercase text-emerald-600 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                               {link.title}
                            </a>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            <div className="space-y-14">
              <div className="space-y-6">
                <span className="inline-block px-8 py-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 font-black rounded-full text-[10px] uppercase tracking-[0.4em]">{state.result.family}</span>
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none dark:text-white">{state.result.commonName}</h1>
                <p className="text-3xl italic font-bold text-slate-500 dark:text-slate-400 border-l-[10px] border-emerald-500 pl-8">{state.result.scientificName}</p>
              </div>
              <div className="glass p-12 rounded-[4rem] border-red-500/10 space-y-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5 text-red-500 rotate-12"><Activity size={180}/></div>
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg"><ShieldCheck size={20}/></div>
                    <h3 className="text-2xl font-black dark:text-white tracking-tight">AI Health Audit</h3>
                 </div>
                 <div className="space-y-8 relative z-10">
                    <p className="text-xl font-bold text-slate-600 dark:text-slate-300 italic">"{state.result.diagnosis.vitals}"</p>
                    <div className="flex flex-wrap gap-3">
                       {state.result.diagnosis.issues.map((issue, i) => (
                         <div key={i} className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black uppercase border border-red-100 dark:border-red-900/40 rounded-2xl shadow-sm">
                            {issue}
                         </div>
                       ))}
                    </div>
                    <div className="p-8 bg-slate-50 dark:bg-slate-900/60 rounded-[3rem] border-l-[12px] border-emerald-500">
                       <p className="text-[11px] font-black uppercase text-emerald-600 mb-3 tracking-widest">Therapeutic Recovery Protocol</p>
                       <p className="text-lg font-bold dark:text-white leading-relaxed">{state.result.diagnosis.remedy}</p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div className="glass p-10 rounded-[3.5rem] space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 text-blue-500"><Waves size={24}/><p className="text-[10px] font-black uppercase tracking-[0.4em]">Volume</p></div>
                    <p className="text-3xl font-black dark:text-white">{state.result.metrics.waterVolumeMl}</p>
                 </div>
                 <div className="glass p-10 rounded-[3.5rem] space-y-4 shadow-xl">
                    <div className="flex items-center gap-3 text-amber-500"><Ruler size={24}/><p className="text-[10px] font-black uppercase tracking-[0.4em]">Height</p></div>
                    <p className="text-3xl font-black dark:text-white">{state.result.metrics.maxHeightCm}</p>
                 </div>
              </div>

              {/* Advanced Sensors Grid */}
              <div className="grid sm:grid-cols-2 gap-8">
                <LightMeter optimalRange={state.result.metrics.optimalLuxRange} />
                <WaterMeter />
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Sparkle size={20}/></div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">Related Genomes</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {state.result.relatedSpecies.map((rel, i) => (
                    <div key={i} onClick={() => handleGlobalSearch(rel.name)} className="glass p-8 rounded-[3rem] cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all border border-transparent hover:border-emerald-500/20">
                      <h4 className="text-xl font-black dark:text-white mb-1">{rel.name}</h4>
                      <p className="text-xs italic text-slate-400 mb-4">{rel.scientificName}</p>
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{rel.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <PlantTable data={state.result} onCompare={() => setIsComparing(true)} />
            </div>
          </div>
        </div>
      );
    }

    switch (state.view) {
      case 'history':
        return (
          <div className="py-20 animate-in fade-in slide-in-from-left-10 duration-1000">
            <h1 className="text-6xl font-black mb-4 tracking-tighter">Your <span className="gradient-text">Herbal Legacy.</span></h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-bold mb-16">Chronological records of all biological identification events.</p>
            {state.history.length === 0 ? (
              <div className="p-32 glass rounded-[5rem] text-center">
                 <History size={60} className="mx-auto mb-8 text-slate-300"/>
                 <h3 className="text-3xl font-black dark:text-white">Chronicle is Empty</h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {state.history.map(item => (
                  <div key={item.id} onClick={() => setState(p => ({ ...p, result: item }))} className="glass p-6 rounded-[3rem] cursor-pointer group hover:shadow-4xl transition-all">
                    <div className="h-64 rounded-[2.5rem] overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Leaf size={48} className="m-auto mt-20 text-slate-300"/>}
                    </div>
                    <div className="px-4">
                       <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">{new Date(item.timestamp).toLocaleDateString()}</p>
                       <h3 className="text-2xl font-black dark:text-white group-hover:text-emerald-500">{item.commonName}</h3>
                       <p className="text-sm italic text-slate-500">{item.scientificName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'reminders':
        return (
          <div className="py-20 animate-in fade-in slide-in-from-right-10 duration-1000">
            <h1 className="text-6xl font-black mb-4 tracking-tighter">Field <span className="gradient-text">Notes.</span></h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-bold mb-16">Scheduled botanical maintenance and care intervals.</p>
            {state.reminders.length === 0 ? (
              <div className="p-32 glass rounded-[5rem] text-center border-dashed border-4 border-slate-200 dark:border-slate-800/40">
                 <Bell size={60} className="mx-auto mb-8 text-slate-300"/>
                 <h3 className="text-3xl font-black dark:text-white tracking-tight">No Active Schedules</h3>
                 <p className="text-slate-500 font-bold mt-4 uppercase text-[10px] tracking-widest">Identify a specimen to initialize care protocols</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {state.reminders.map(r => (
                  <div key={r.id} className="glass p-8 rounded-[3.5rem] space-y-6 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><Bell size={120} /></div>
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Calendar size={24} /></div>
                      <button onClick={() => deleteReminder(r.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black dark:text-white tracking-tight">{r.plantName}</h3>
                      <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest mt-1">{r.task}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency: {r.frequency}</span>
                       <span className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">Active Protocol</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'about':
        return (
          <div className="py-32 max-w-5xl mx-auto space-y-24 animate-in zoom-in-95 duration-1000">
            <div className="text-center space-y-12">
               <h1 className="text-7xl font-black tracking-tighter leading-none">Intelligence <br/><span className="gradient-text">In Bloom.</span></h1>
               <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">"LeafID is the intersection of high-fidelity visual neural networks and professional botanical archives."</p>
            </div>
            
            {/* Keyboard Command Center - Updated with Numeral Shortcuts */}
            <div className="glass p-16 rounded-[5rem] space-y-12 shadow-4xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-16 opacity-5 rotate-12"><Keyboard size={240} /></div>
               <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl shadow-emerald-500/20"><Command size={32}/></div>
                  <div>
                    <h3 className="text-4xl font-black dark:text-white tracking-tight">Command Center</h3>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Efficiency Protocol Active</p>
                  </div>
               </div>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {[
                    { key: '1', action: 'Core Home', desc: 'Neural Scanner Terminal' },
                    { key: '2', action: 'Vault history', desc: 'Browse captured records' },
                    { key: '3', action: 'Field Notes', desc: 'Access care schedules' },
                    { key: '4', action: 'About Labs', desc: 'System intelligence details' },
                    { key: '5', action: 'Relay link', desc: 'Contact biological support' },
                    { key: 'S', action: 'Global Query', desc: 'Focus botanical search' },
                    { key: 'C', action: 'Bot Agent', desc: 'Toggle Expert Chat Agent' },
                    { key: 'D', action: 'Dark Protocol', desc: 'Toggle high-contrast mode' },
                    { key: 'ESC', action: 'Abort View', desc: 'Reset modals and terminals' },
                  ].map((shortcut, i) => (
                    <div key={i} className="p-8 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border border-white/40 dark:border-slate-800/60 shadow-inner flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                       <Kbd>{shortcut.key}</Kbd>
                       <div>
                          <p className="font-black dark:text-white text-lg leading-none mb-1 group-hover:text-emerald-500 transition-colors">{shortcut.action}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{shortcut.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-12">
               {[
                 { label: "Precision", sub: "99.9% Rate", icon: <ShieldCheck/> },
                 { label: "Latency", sub: "0.12s Query", icon: <Zap/> },
                 { label: "Scale", sub: "20M+ Nodes", icon: <Globe/> }
               ].map((stat, i) => (
                 <div key={i} className="glass p-12 rounded-[4rem] text-center shadow-xl">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-[2rem] mx-auto mb-8 flex items-center justify-center">{stat.icon}</div>
                    <p className="text-4xl font-black mb-2">{stat.label}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.sub}</p>
                 </div>
               ))}
            </div>
          </div>
        );
      case 'signin':
        return (
          <div className="py-32 flex justify-center animate-in zoom-in-95 duration-700">
            <div className="glass w-full max-md p-14 rounded-[4rem] shadow-4xl space-y-10">
               <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl mx-auto flex items-center justify-center"><Lock size={32}/></div>
                  <h2 className="text-4xl font-black dark:text-white tracking-tight">Secure Access</h2>
                  <p className="text-slate-500 font-bold">Authenticate with botanical ID</p>
               </div>
               <form onSubmit={handleMockLogin} className="space-y-6">
                  <div className="relative group">
                     <MailIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20}/>
                     <input type="email" required placeholder="Email Address" className="w-full glass py-5 pl-14 pr-6 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all dark:text-white" />
                  </div>
                  <div className="relative group">
                     <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20}/>
                     <input type="password" required placeholder="System Password" className="w-full glass py-5 pl-14 pr-6 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all dark:text-white" />
                  </div>
                  <LiquidButton type="submit" loading={isLoggingIn} className="w-full py-5 text-lg">Initialize Session</LiquidButton>
               </form>
               <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Protocol: Secure 256-bit AES</p>
               </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="py-24 max-w-6xl mx-auto grid lg:grid-cols-2 gap-24 animate-in slide-in-from-right-10 duration-1000">
             <div className="space-y-12">
                <h1 className="text-7xl font-black tracking-tighter leading-none">Connect <br/><span className="gradient-text">With Labs.</span></h1>
                <p className="text-2xl font-bold text-slate-500 leading-relaxed">Questions about species taxonomy or system feedback? Our botanical agents are on standby.</p>
                <div className="space-y-8">
                   {[
                     { label: "Global Greenhouse", value: "Elmhurst, NY", icon: <MapPin/> },
                     { label: "Support Network", value: "contact@leafid.bio", icon: <Mail/> }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-8 glass p-8 rounded-[3rem] shadow-xl group">
                        <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{item.label}</p>
                           <p className="text-2xl font-bold dark:text-white tracking-tight">{item.value}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="glass p-14 rounded-[4rem] shadow-4xl space-y-8">
                <div className="space-y-3">
                   <p className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">Identify Yourself</p>
                   <input placeholder="Sterling Archer" className="w-full glass p-6 rounded-[2rem] font-bold text-lg outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all dark:text-white" />
                </div>
                <div className="space-y-3">
                   <p className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">Intelligence Log</p>
                   <textarea placeholder="Message Protocol..." rows={5} className="w-full glass p-8 rounded-[3rem] font-bold text-lg outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all dark:text-white resize-none" />
                </div>
                <LiquidButton className="w-full py-6 text-xl">Submit Protocol</LiquidButton>
             </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center space-y-24 relative overflow-hidden">
             <div className="space-y-12">
                <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black tracking-[0.5em] uppercase border border-emerald-500/10 shadow-lg">
                   <Activity size={16} className="animate-pulse" /> Neural Core 7.0 Live
                </div>
                <h1 className="text-8xl md:text-[9rem] font-black tracking-tighter leading-[0.7] dark:text-white">Nature's <br/><span className="gradient-text">Neural Link.</span></h1>
                <div className="flex items-center gap-3 p-1.5 glass rounded-[2.5rem] w-fit mx-auto shadow-2xl">
                   <button onClick={() => setState(p => ({ ...p, homeSearchTab: 'global' }))} className={`px-10 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${state.homeSearchTab === 'global' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Global Index</button>
                   <button onClick={() => setState(p => ({ ...p, homeSearchTab: 'history' }))} className={`px-10 py-3 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${state.homeSearchTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Field Records</button>
                </div>
                <div className="w-full max-w-3xl mx-auto relative group">
                  <form onSubmit={(e) => { e.preventDefault(); const q = (e.target as any).query.value; if(q) handleGlobalSearch(q); }} className="relative z-10 glass p-4 rounded-[3rem] flex items-center gap-4 shadow-4xl">
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl"><Search size={24}/></div>
                    <input ref={searchInputRef} name="query" placeholder={state.homeSearchTab === 'global' ? "Search species (Kbd: S)..." : "Search captured records..."} className="flex-1 bg-transparent border-none outline-none text-2xl font-bold dark:text-white px-4 placeholder:text-slate-300" />
                    <LiquidButton type="submit" className="hidden sm:flex px-12 py-5 text-lg">Query</LiquidButton>
                  </form>
                </div>
             </div>
             <div 
               onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
               onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files[0]; if(file) processFile(file); }}
               onClick={() => document.getElementById('file-deposit')?.click()} 
               className={`group relative w-full max-w-2xl mx-auto p-20 rounded-[5rem] border-4 border-dashed transition-all duration-700 cursor-pointer overflow-hidden shadow-4xl backdrop-blur-3xl ${isDragging ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/60 scale-[1.05]' : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'}`}
             >
                <input id="file-deposit" type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                <div className="w-32 h-32 bg-emerald-600 text-white rounded-[3rem] mx-auto mb-10 flex items-center justify-center shadow-4xl animate-pulse"><ImageIcon size={60}/></div>
                <h3 className="text-4xl font-black mb-8 tracking-tighter dark:text-white">Deposit Specimen Image</h3>
                <p className="text-slate-400 font-bold text-lg mb-12">Drop photos or tap to capture genomic data.</p>
                <div className="flex gap-6 justify-center">
                   <div className="flex-1 glass py-5 rounded-2xl text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-md hover:bg-white transition-colors">Neural Scanner</div>
                   <div className="flex-1 glass py-5 rounded-2xl text-emerald-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-md hover:bg-white transition-colors">Digital Herbarium</div>
                </div>
                {isDragging && (
                  <div className="absolute inset-0 bg-emerald-600/20 flex flex-col items-center justify-center backdrop-blur-sm">
                     <div className="bg-emerald-600 text-white p-8 rounded-[3rem] animate-bounce shadow-2xl"><Upload size={64} /></div>
                     <p className="mt-6 text-emerald-600 font-black uppercase tracking-[0.4em] text-sm">Release for Genomic Audit</p>
                  </div>
                )}
             </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen selection:bg-emerald-500/30 transition-colors duration-1000 ${state.darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50 dark:border-slate-800/40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setState(p => ({ ...p, view: 'home', result: null }))}>
            <div className="bg-emerald-600 p-2 rounded-xl text-white group-hover:rotate-12 transition-transform shadow-lg shadow-emerald-500/20"><Leaf size={20} /></div>
            <span className="font-extrabold text-xl tracking-tighter text-emerald-800 dark:text-emerald-400">LeafID</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-white/40 dark:bg-slate-900/50 rounded-[2rem] border border-white/60 dark:border-slate-800/40">
            {(['home', 'history', 'reminders', 'about', 'contact'] as View[]).map((v) => (
              <button key={v} onClick={() => setState(p => ({ ...p, view: v, result: null }))} className={`capitalize font-bold text-[11px] tracking-widest px-6 py-2.5 rounded-[1.5rem] transition-all flex items-center gap-2 ${state.view === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setState(p => ({ ...p, darkMode: !p.darkMode }))} className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              {state.darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </button>
            {state.user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                   <p className="text-[10px] font-black uppercase text-emerald-600 leading-none mb-1">Authenticated</p>
                   <p className="text-xs font-bold dark:text-white">{state.user.name}</p>
                </div>
                <button onClick={() => setState(p => ({...p, user: null}))} className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 hover:text-red-600 transition-all border border-transparent hover:border-red-500/20"><LogOut size={18} /></button>
              </div>
            ) : (
              <LiquidButton onClick={() => setState(p => ({ ...p, view: 'signin', result: null }))} className="px-6 py-2.5 text-xs">Log In</LiquidButton>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-6 pb-40">
        {state.error && (
          <div className="mt-10 p-10 glass border-red-500/20 rounded-[3rem] text-red-500 font-bold flex items-center gap-8 animate-in zoom-in-95 duration-500">
             <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20"><AlertTriangle size={32}/></div>
             <div><p className="text-[10px] font-black uppercase tracking-widest mb-1">Neural Bridge Interrupted</p><p className="text-xl tracking-tight">{state.error}</p></div>
             <button onClick={() => setState(p => ({ ...p, error: null }))} className="ml-auto p-4"><X/></button>
          </div>
        )}
        {renderContent()}
      </main>

      {state.result && <ComparisonModal isOpen={isComparing} onClose={() => setIsComparing(false)} sourcePlant={state.result} />}

      <button onClick={() => setState(p => ({ ...p, isChatOpen: !p.isChatOpen }))} className={`fixed bottom-12 right-12 w-20 h-20 rounded-[2.5rem] shadow-4xl flex items-center justify-center transition-all z-[102] border-4 border-white dark:border-slate-800 ${state.isChatOpen ? 'bg-slate-900 text-white rotate-90 scale-90' : 'lg-button text-white hover:scale-110 active:scale-95'}`}>
        {state.isChatOpen ? <X size={36}/> : <MessageCircle size={36}/>}
        {!state.isChatOpen && <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-white/20">C</span>}
      </button>

      <ChatBot isOpen={state.isChatOpen} onClose={() => setState(p => ({ ...p, isChatOpen: false }))} messages={state.chatMessages} onSendMessage={onSendMessage} currentPlant={state.result} />
    </div>
  );
};

const ChatBot: React.FC<{ isOpen: boolean; onClose: () => void; messages: ChatMessage[]; onSendMessage: (msg: string) => void; currentPlant?: PlantInfo | null; }> = ({ isOpen, onClose, messages, onSendMessage, currentPlant }) => {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);
  if (!isOpen) return null;
  return (
    <div className="fixed bottom-24 right-6 sm:right-8 w-[calc(100vw-3rem)] sm:w-[380px] h-[550px] max-h-[75vh] glass rounded-[2.5rem] shadow-4xl z-[101] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-emerald-600 p-6 flex items-center justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-white rotate-12"><Leaf size={80} /></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md"><MessageCircle size={20} /></div>
          <div><p className="font-bold uppercase text-[9px] tracking-[0.3em] opacity-80 mb-1">Botanical AI</p><p className="font-bold text-base">Expert Assistant</p></div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-[1.2rem] text-xs font-bold shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>{msg.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onSendMessage(input); setInput(""); } }} className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-white/60 dark:bg-slate-900/60">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." className="flex-1 bg-white dark:bg-slate-800 border-none rounded-[1.2rem] px-6 py-3.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner dark:text-white" />
        <LiquidButton type="submit" className="w-12 h-12 rounded-xl"><Send size={20} /></LiquidButton>
      </form>
    </div>
  );
};

export default App;
