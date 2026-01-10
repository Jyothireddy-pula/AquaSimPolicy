
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Waves, Play, RefreshCcw, CheckCircle2, 
  BrainCircuit, Pause, Target, BarChart3, Fingerprint, 
  HeartPulse, Wheat, ArrowRight, ChevronRight,
  Activity, XCircle, ShieldCheck,
  ClipboardList, Printer, UserCheck, 
  Info, Bell, Zap, Trophy, TrendingUp, AlertCircle,
  Droplets, Fish, BarChart, FileText, Settings, ShieldAlert, BookOpen,
  ArrowDown, MousePointer2, ArrowLeft, ArrowUp, Calendar
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, 
  Area, Legend
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

import { SimulationState, Policy, AIRecommendation, Scenario, EcosystemStatus, PolicyType } from './types';
import { INITIAL_STATE, AVAILABLE_POLICIES, MAX_BUDGET, SCENARIOS } from './constants';
import { advanceWeek, getEcosystemStatus } from './services/simulationEngine';
import RiverVisualizer from './components/RiverVisualizer';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = Not started, 1-5 = Step-by-step
  const [isAiLoading, setIsAiLoading] = useState(false);

  // PRECISION REAL-TIME: Speed increased to 3 Seconds per Week (3000ms)
  useEffect(() => {
    let timer: number | undefined;
    if (isPlaying && !state.isCollapsed) {
      timer = window.setInterval(() => {
        setState((prev) => advanceWeek(prev));
      }, 3000);
    }
    return () => { 
      if (timer) clearInterval(timer); 
    };
  }, [isPlaying, state.isCollapsed]);

  const addNotification = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setState((prev) => ({
      ...prev,
      notifications: [{ id, message, type, timestamp: Date.now() }, ...prev.notifications].slice(0, 3)
    }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, notifications: prev.notifications.filter((n) => n.id !== id) }));
    }, 4000);
  }, []);

  const selectScenario = (scenario: any) => {
    setState({
      ...INITIAL_STATE,
      ...scenario.initialState,
      activeScenario: scenario.id
    });
    setShowGuide(false);
    setTutorialStep(1); // Start the guided tour
  };

  const handleApplyPolicy = (policy: Policy) => {
    const cost = policy.cost;
    if (state.budgetSpent + cost > MAX_BUDGET) {
      addNotification("No more money in the budget!", "warning");
      return;
    }
    if (state.activePolicies.some((p) => p.id === policy.id)) return;
    
    const newPolicy = { 
      ...policy, 
      active: true, 
      activationWeek: state.week + policy.delayWeeks, 
      age: 0, 
      cost: cost 
    };
    
    setState((prev) => ({
      ...prev,
      budgetSpent: prev.budgetSpent + cost,
      activePolicies: [...prev.activePolicies, newPolicy],
      policyLog: [{ 
        week: prev.week, 
        event: `Action: ${policy.name}`, 
        type: 'POLICY', 
        impact: `The project has started. It will take ${policy.delayWeeks} weeks to build.` 
      }, ...prev.policyLog].slice(0, 15)
    }));
    
    addNotification(`${policy.name} started!`, 'success');
  };

  const requestAIAdvice = async () => {
    if (!process.env.API_KEY) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Water Governance Simulation Week ${state.week}: Toxin Level is ${state.pollutionLevel}, Health is ${state.ecosystemIntegrity}%. Give simple advice for a student manager.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a Professional Water Auditor. Explain things simply. Return ONLY a structured JSON response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessment: { type: Type.STRING },
              justification: { type: Type.STRING },
              risks: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedPolicies: { type: Type.ARRAY, items: { type: Type.STRING } },
              outlook: { type: Type.STRING }
            },
            required: ['assessment', 'justification', 'risks', 'suggestedPolicies', 'outlook']
          }
        }
      });
      const advice = JSON.parse(response.text || '{}') as AIRecommendation;
      setState((prev) => ({ ...prev, aiAdvice: advice }));
      addNotification("Audit Received", 'info');
    } catch (e) {
      console.error(e);
      addNotification("Guide Offline", 'warning');
    } finally {
      setIsAiLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const base = { week: 0, pollution: 25, do: 8.2, integrity: 90, score: 85 };
    return [base, ...state.history];
  }, [state.history]);

  const ecosystemStatus = getEcosystemStatus(state.ecosystemIntegrity);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-['Inter'] antialiased overflow-x-hidden">
      
      {/* NOTIFICATIONS */}
      <div className="fixed top-24 right-8 z-[300] flex flex-col gap-3 pointer-events-none">
        {state.notifications.map((n) => (
          <div key={n.id} className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right duration-300 pointer-events-auto ${n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : n.type === 'warning' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
            <Zap size={18} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest">{n.message}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: SCENARIO SELECTION */}
      {showGuide && (
        <div className="fixed inset-0 z-[400] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 no-print overflow-y-auto">
          <div className="bg-slate-900 rounded-[3.5rem] shadow-[0_0_150px_rgba(37,99,235,0.4)] max-w-7xl w-full border border-white/10 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-1000">
            <div className="bg-gradient-to-b from-blue-600 via-blue-600 to-blue-800 p-12 md:p-20 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none">
                 <Waves size={1000} strokeWidth={0.5} className="absolute -top-1/2 -left-1/4" />
               </div>
               <div className="inline-flex items-center justify-center bg-white/15 w-24 h-24 rounded-[2.5rem] mb-12 border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                 <Waves size={54} className="text-white"/>
               </div>
               <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 leading-none">AquaSim <span className="text-blue-200">Pro</span></h2>
               <p className="text-white font-black text-2xl md:text-4xl tracking-tight max-w-5xl mx-auto uppercase">Advanced Decision Support</p>
            </div>
            
            <div className="p-10 md:p-24 bg-slate-900">
               <div className="mb-24 text-center">
                  <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-16 flex items-center justify-center gap-8">
                    <Trophy size={48} className="text-amber-500 animate-pulse" /> Select Your Task
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                     {SCENARIOS.map((s) => (
                        <button 
                          key={s.id} 
                          onClick={() => selectScenario(s)} 
                          className="group flex flex-col relative text-left p-12 bg-white/5 border-2 border-white/10 rounded-[4rem] hover:bg-white/[0.12] hover:border-blue-500 transition-all duration-500 transform hover:-translate-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] min-h-[480px]"
                        >
                           <h4 className="text-3xl font-black text-white uppercase mb-6 group-hover:text-blue-400 transition-colors leading-tight">{s.name}</h4>
                           <p className="text-slate-100 text-lg font-bold leading-relaxed mb-6">
                             {s.description}
                           </p>
                           <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl mb-8">
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Target Strategy:</p>
                              <p className="text-sm font-bold text-amber-100">{s.quickNote}</p>
                           </div>
                           <div className="mt-auto">
                              <div className="bg-blue-600 border-2 border-blue-400/30 px-8 py-6 rounded-3xl flex items-center justify-between shadow-[0_10px_30px_rgba(37,99,235,0.4)] group-hover:bg-blue-500 transition-all">
                                 <span className="text-base font-black text-white uppercase tracking-widest">{s.goal}</span>
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                   <ArrowRight size={28} className="text-blue-600 font-bold"/>
                                 </div>
                              </div>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="text-center pt-20 border-t-2 border-white/10">
                 <button 
                    onClick={() => selectScenario({ id: 'SANDBOX', initialState: INITIAL_STATE, quickNote: 'Manually adjust all variables to explore limits.' })} 
                    className="relative group inline-flex items-center gap-8 px-16 py-10 bg-emerald-600 hover:bg-emerald-500 text-white border-b-8 border-emerald-800 rounded-[3rem] transition-all duration-300 transform hover:-translate-y-2 shadow-[0_30px_60px_rgba(16,185,129,0.3)] active:translate-y-0 active:border-b-0"
                  >
                   <div className="p-4 bg-white/20 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform">
                     <Settings size={36} className="text-white" />
                   </div>
                   <div className="text-left">
                     <p className="text-xs font-black text-emerald-200 uppercase tracking-[0.4em] mb-1">Expert Training</p>
                     <span className="text-2xl md:text-3xl font-black uppercase tracking-[0.1em]">
                       Enter Manual Practice Mode
                     </span>
                   </div>
                   <div className="ml-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                     <ChevronRight className="text-white" size={32} />
                   </div>
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: INTERACTIVE TUTORIAL - CLEAR ARROWS, NO BLUR */}
      {tutorialStep > 0 && tutorialStep <= 5 && (
        <div className="fixed inset-0 z-[500] pointer-events-none">
           <div className={`absolute transition-all duration-700 p-12 bg-slate-900 border-4 border-blue-600 shadow-[0_0_120px_rgba(37,99,235,0.8)] rounded-[3.5rem] w-[500px] pointer-events-auto z-[600]
              ${tutorialStep === 1 ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110' : ''}
              ${tutorialStep === 2 ? 'top-[420px] left-[400px]' : ''}
              ${tutorialStep === 3 ? 'bottom-[350px] left-1/2 -translate-x-1/2' : ''}
              ${tutorialStep === 4 ? 'top-[350px] right-[450px]' : ''}
              ${tutorialStep === 5 ? 'bottom-[350px] right-[450px]' : ''}
           `}>
              {tutorialStep === 2 && <div className="absolute -left-20 top-1/2 -translate-y-1/2 animate-bounce text-blue-500"><ArrowLeft size={64} strokeWidth={4}/></div>}
              {tutorialStep === 3 && <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 animate-bounce text-emerald-500"><ArrowDown size={64} strokeWidth={4}/></div>}
              {tutorialStep === 4 && <div className="absolute -right-20 top-1/2 -translate-y-1/2 animate-bounce text-amber-500"><ArrowRight size={64} strokeWidth={4}/></div>}
              {tutorialStep === 5 && <div className="absolute -right-20 top-1/2 -translate-y-1/2 animate-bounce text-blue-400"><ArrowRight size={64} strokeWidth={4}/></div>}

              <div className="flex items-center gap-6 mb-8">
                 <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg"><BookOpen size={36}/></div>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center: Step {tutorialStep}/5</h4>
              </div>

              {tutorialStep === 1 && (
                 <div className="animate-in fade-in slide-in-from-bottom duration-500">
                    <p className="text-2xl text-slate-100 font-black leading-tight mb-8 uppercase tracking-tight">Mission Briefing</p>
                    <p className="text-lg text-slate-300 font-medium leading-relaxed mb-10">
                       Task Selected. Let's locate the 4 key tools you'll use to manage the river ecosystem.
                    </p>
                    <button onClick={() => setTutorialStep(2)} className="w-full bg-white text-slate-950 py-7 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-2xl">
                       START TOUR <ArrowRight size={24}/>
                    </button>
                 </div>
              )}

              {tutorialStep === 2 && (
                 <div className="animate-in fade-in slide-in-from-left duration-500">
                    <p className="text-2xl text-blue-400 font-black leading-tight mb-6 uppercase tracking-tight">1. Behavior Control Sliders</p>
                    <div className="bg-blue-600/10 border-2 border-blue-500/20 p-6 rounded-2xl mb-8">
                       <p className="text-sm font-black text-blue-400 uppercase mb-2 italic">Look Left <ArrowLeft className="inline ml-2" size={14}/></p>
                       <p className="text-slate-200 font-bold">Use these to enforce laws. 100% means full compliance.</p>
                    </div>
                    <button onClick={() => setTutorialStep(3)} className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                       NEXT: THE PLANS <ArrowRight size={24}/>
                    </button>
                 </div>
              )}

              {tutorialStep === 3 && (
                 <div className="animate-in fade-in slide-in-from-bottom duration-500">
                    <p className="text-2xl text-emerald-400 font-black leading-tight mb-6 uppercase tracking-tight">2. Long-Term Infrastructure Plans</p>
                    <div className="bg-emerald-600/10 border-2 border-emerald-500/20 p-6 rounded-2xl mb-8">
                       <p className="text-sm font-black text-emerald-400 uppercase mb-2 italic">Look Below <ArrowDown className="inline ml-2" size={14}/></p>
                       <p className="text-slate-200 font-bold">Activate building projects. They take time but clean water permanently.</p>
                    </div>
                    <button onClick={() => setTutorialStep(4)} className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                       NEXT: HEALTH GAUGE <ArrowRight size={24}/>
                    </button>
                 </div>
              )}

              {tutorialStep === 4 && (
                 <div className="animate-in fade-in slide-in-from-right duration-500">
                    <p className="text-2xl text-amber-400 font-black leading-tight mb-6 uppercase tracking-tight">3. River Health Score Gauge</p>
                    <div className="bg-amber-600/10 border-2 border-amber-500/20 p-6 rounded-2xl mb-8">
                       <p className="text-sm font-black text-amber-400 uppercase mb-2 italic">Look Right <ArrowRight className="inline ml-2" size={14}/></p>
                       <p className="text-slate-200 font-bold">Monitor this score. If it hits 0%, you fail the simulation.</p>
                    </div>
                    <button onClick={() => setTutorialStep(5)} className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                       NEXT: AI AUDITOR <ArrowRight size={24}/>
                    </button>
                 </div>
              )}

              {tutorialStep === 5 && (
                 <div className="animate-in fade-in slide-in-from-right duration-500">
                    <p className="text-2xl text-blue-500 font-black leading-tight mb-6 uppercase tracking-tight">4. Professional AI Auditor</p>
                    <div className="bg-blue-600/10 border-2 border-blue-500/20 p-6 rounded-2xl mb-8">
                       <p className="text-sm font-black text-blue-400 uppercase mb-2 italic">Look Down-Right <ArrowRight className="inline ml-2 rotate-45" size={14}/></p>
                       <p className="text-slate-200 font-bold">Ask for help whenever toxicity is too high. AI analyzes and guides you.</p>
                    </div>
                    <button onClick={() => { setTutorialStep(0); setIsPlaying(true); addNotification("Simulation Started!", "success"); }} className="w-full bg-emerald-600 text-white py-8 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-6 hover:bg-emerald-500 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.5)] active:scale-95">
                       DEPLOY GOVERNANCE SYSTEM <Play fill="currentColor" size={32}/>
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <header className="px-12 h-24 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl no-print">
        <div className="flex items-center gap-10">
           <div className="bg-blue-600 p-4 rounded-[1.25rem] shadow-[0_0_20px_rgba(37,99,235,0.4)]"><Waves size={24} className="text-white" /></div>
           <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">AquaSim <span className="text-blue-600">Pro</span></h1>
              <div className="flex gap-5 mt-2 items-center">
                 <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 uppercase tracking-widest">
                   {SCENARIOS.find(s => s.id === state.activeScenario)?.name || 'MASTER SYSTEM'}
                 </div>
                 {/* HIGH VISIBILITY WEEK IN HEADER */}
                 <div className="flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-xl border border-white/10 shadow-inner">
                    <Calendar size={14} className="text-blue-400" />
                    <p className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Week {state.week}</p>
                 </div>
              </div>
           </div>
        </div>
        <div className="flex gap-10 items-center">
          <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center gap-6 px-12 py-5 rounded-[1.5rem] font-black text-[12px] tracking-[0.2em] uppercase transition-all shadow-2xl active:scale-95 border-b-4 ${isPlaying ? 'bg-white text-slate-900 border-slate-300' : 'bg-blue-600 text-white border-blue-800 hover:bg-blue-700 hover:scale-105'}`}>
            {isPlaying ? <><Pause size={20} fill="currentColor"/> PAUSE SIMULATION</> : <><Play size={20} fill="currentColor"/> START SIMULATION</>}
          </button>
          <div className="h-10 w-px bg-white/10"></div>
          <button onClick={() => { setIsPlaying(false); setShowGuide(true); }} className="p-4 bg-white/5 text-slate-400 rounded-2xl border border-white/10 hover:text-rose-500 hover:bg-rose-500/5 transition-all"><RefreshCcw size={24} /></button>
        </div>
      </header>

      {/* DASHBOARD SUMMARY */}
      <section className="px-12 pt-8 no-print">
         <div className="bg-slate-900 border border-blue-500/20 rounded-[3.5rem] p-12 flex flex-wrap gap-12 items-center shadow-2xl relative overflow-hidden group">
            
            {/* ULTRA HIGH VISIBILITY WEEK COUNTER */}
            <div className="flex items-center gap-10 pr-16 border-r border-white/10">
               <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)] animate-in zoom-in duration-500"><Calendar size={40}/></div>
               <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] leading-none mb-4">Current Progress</h4>
                  <p key={state.week} className="text-6xl font-black uppercase tracking-tighter leading-none text-white animate-in slide-in-from-top-4 duration-300">
                    Week {state.week}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-black uppercase mt-3 tracking-widest flex items-center gap-2">
                    <Activity size={14} className="animate-pulse" /> 3s Tempo Active
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-10 pr-16 border-r border-white/10">
               <div className="bg-blue-600/20 p-8 rounded-[2rem] text-blue-500 border border-blue-500/20 shadow-inner"><ClipboardList size={40}/></div>
               <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] leading-none mb-4">River Health Score</h4>
                  <p className={`text-6xl font-black uppercase tracking-tighter leading-none ${state.ecosystemIntegrity > 70 ? 'text-emerald-500' : (state.ecosystemIntegrity > 40 ? 'text-amber-500' : 'text-rose-500')}`}>
                    {state.ecosystemIntegrity}%
                  </p>
                  <p className="text-[11px] text-slate-400 font-black uppercase mt-3 tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Current: {ecosystemStatus}
                  </p>
               </div>
            </div>
            <div className="flex-1 min-w-[400px]">
               <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4 flex items-center gap-3"><BrainCircuit size={16} className="text-blue-500" /> Professional Audit</h4>
               <p className="text-xl font-medium text-slate-300 italic leading-relaxed border-l-4 border-blue-600/40 pl-10">
                 {state.aiAdvice?.assessment || "Governance active. Adjust the sliders on the left and activate plans below to improve watershed stability."}
               </p>
            </div>
            <div className="flex gap-24 pr-12">
               <div className="text-center">
                  <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] mb-3">Total Cost</h4>
                  <p className="text-4xl font-black text-white tracking-tighter">₹{(state.budgetSpent / 100000).toFixed(1)}L</p>
               </div>
               <div className="text-center">
                  <h4 className="text-[11px] font-black uppercase text-rose-500/80 tracking-[0.3em] mb-3">Cleanup Liability</h4>
                  <p className={`text-4xl font-black tracking-tighter ${state.environmentalDebt > 1500000 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{(state.environmentalDebt / 100000).toFixed(1)}L
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-[1800px] mx-auto px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 no-print">
          
          <div className="lg:col-span-3 space-y-10">
             {/* BEHAVIOR SECTION */}
             <div className={`bg-slate-900/50 rounded-[3.5rem] p-10 border transition-all duration-700 ${tutorialStep === 2 ? 'border-blue-500 ring-[12px] ring-blue-600/30 bg-slate-800 scale-[1.05] shadow-[0_0_150px_rgba(37,99,235,0.7)] z-[502]' : 'border-white/5 shadow-xl opacity-100'}`}>
                <div className="flex items-center gap-5 mb-12">
                   <UserCheck size={24} className="text-blue-500"/>
                   <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-400">Behavior Control</h3>
                </div>
                <div className="space-y-12">
                   <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 tracking-widest items-center">
                        <span className="flex items-center gap-3"><Activity size={14}/> Factory Compliance</span>
                        <span className="text-white bg-blue-600/20 px-3 py-1 rounded-lg">{state.industryCompliance}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={state.industryCompliance} onChange={(e) => setState(p => ({...p, industryCompliance: parseInt(e.target.value)}))} className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-600" />
                   </div>
                   <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 tracking-widest items-center">
                        <span className="flex items-center gap-3"><Wheat size={14}/> Farm Bio-Adoption</span>
                        <span className="text-white bg-emerald-600/20 px-3 py-1 rounded-lg">{state.agriCompliance}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={state.agriCompliance} onChange={(e) => setState(p => ({...p, agriCompliance: parseInt(e.target.value)}))} className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500" />
                   </div>
                </div>
             </div>

             <div className="bg-slate-900/50 rounded-[3.5rem] p-10 border border-white/5 shadow-xl">
                <div className="flex items-center gap-5 mb-12">
                   <ShieldAlert size={24} className="text-rose-500"/>
                   <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-400">Public Health Risk</h3>
                </div>
                <div className="grid grid-cols-1 gap-10">
                   <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[3rem] border border-white/5">
                      <HeartPulse size={40} className={`transition-colors ${state.publicHealthRisk > 50 ? 'text-rose-500' : 'text-emerald-500'}`}/>
                      <div>
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Disease Risk</p>
                         <p className={`text-4xl font-black ${state.publicHealthRisk > 50 ? 'text-rose-500' : 'text-emerald-500'}`}>{state.publicHealthRisk}%</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[3rem] border border-white/5">
                      <Wheat size={40} className={`transition-colors ${state.agriYieldIndex < 60 ? 'text-rose-500' : 'text-emerald-500'}`}/>
                      <div>
                         <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Food Safety</p>
                         <p className={`text-4xl font-black ${state.agriYieldIndex < 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{state.agriYieldIndex}%</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-6 space-y-12">
            <RiverVisualizer status={ecosystemStatus} pollution={state.pollutionLevel} />

            <div className="bg-slate-900 rounded-[4.5rem] p-14 border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-16">
                  <div className="flex items-center gap-6">
                     <div className="p-5 bg-blue-600/20 rounded-[1.5rem] text-blue-500 border border-blue-500/10"><BarChart3 size={32} /></div>
                     <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Live Audit Graph</h2>
                  </div>
                  <div className={`px-10 py-4 rounded-[1.5rem] border text-[12px] font-black uppercase tracking-widest shadow-2xl ${state.drinkingWaterSafety === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    Drinking: {state.drinkingWaterSafety}
                  </div>
               </div>

               <div className="h-[550px] w-full bg-slate-950/60 rounded-[4rem] p-10 border border-white/5 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#ffffff08" />
                      <XAxis dataKey="week" stroke="#475569" fontSize={12} fontWeight={900} axisLine={false} tickLine={false}/>
                      <YAxis stroke="#475569" fontSize={12} fontWeight={900} axisLine={false} tickLine={false}/>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '32px', border: '1px solid #1e293b', color: '#fff', fontSize: '12px', fontWeight: 900 }} 
                        formatter={(v: number, name: string) => [v.toFixed(1), name === 'integrity' ? 'Health' : 'Toxins']}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={60} 
                        wrapperStyle={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', paddingBottom: '40px' }}
                        formatter={(value) => value === 'integrity' ? 'Ecosystem Health' : 'Pollution Level'}
                      />
                      {/* Synchronized animation duration with 3s tempo */}
                      <Area name="integrity" type="monotone" dataKey="integrity" stroke="#10b981" strokeWidth={6} fill="url(#hGrad)" animationDuration={2500} />
                      <Area name="pollution" type="monotone" dataKey="pollution" stroke="#f43f5e" strokeWidth={6} fill="url(#pGrad)" animationDuration={2500} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className={`bg-slate-900 rounded-[4.5rem] p-14 border transition-all duration-700 shadow-2xl ${tutorialStep === 3 ? 'border-emerald-500 ring-[12px] ring-emerald-600/30 scale-[1.05] shadow-[0_0_150px_rgba(16,185,129,0.7)] bg-slate-800 z-[502]' : 'border-white/5 opacity-100'}`}>
               <div className="flex items-center gap-6 mb-12">
                  <div className="p-5 bg-emerald-600/20 rounded-[1.5rem] text-emerald-500 border border-emerald-500/10"><ShieldCheck size={36} /></div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Improvement Plans</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {AVAILABLE_POLICIES.map((p) => {
                    const isApplied = state.activePolicies.some((ap) => ap.id === p.id);
                    return (
                     <div key={p.id} className={`group p-12 rounded-[3.5rem] border transition-all duration-500 ${isApplied ? 'bg-[#0a1122] border-blue-600/40 shadow-inner' : 'bg-white/5 border-white/5 hover:border-blue-500/50 hover:bg-white/[0.08]'}`}>
                        <div className="flex justify-between items-start mb-8">
                           <h4 className="font-black text-white text-xl uppercase tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</h4>
                           {isApplied && <CheckCircle2 size={32} className="text-blue-500 animate-in zoom-in" />}
                        </div>
                        <p className="text-sm text-slate-500 mb-10 leading-relaxed italic">"{p.description}"</p>
                        <div className="flex items-center justify-between pt-10 border-t border-white/10">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Cost Outlay</span>
                              <span className="text-lg font-black text-white tracking-tighter">₹{p.cost.toLocaleString()}</span>
                           </div>
                           <button onClick={() => handleApplyPolicy(p)} disabled={isApplied} className={`px-12 py-5 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isApplied ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-950 hover:bg-blue-600 hover:text-white'}`}>
                             {isApplied ? 'AUTHORIZED' : 'ACTIVATE'}
                           </button>
                        </div>
                     </div>
                    );
                 })}
               </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-10">
             {/* HEALTH SCORE SECTION */}
             <div className={`rounded-[4rem] p-14 text-center shadow-2xl transition-all duration-700 relative overflow-hidden group ${tutorialStep === 4 ? 'bg-slate-800 border-4 border-amber-500 ring-[12px] ring-amber-500/40 scale-[1.1] shadow-[0_0_150px_rgba(245,158,11,0.7)] z-[502]' : 'bg-white border border-slate-100'}`}>
                <p className={`text-[13px] font-black uppercase tracking-[0.4em] mb-12 ${tutorialStep === 4 ? 'text-amber-400' : 'text-slate-400'}`}>Current Health Score</p>
                <div className={`inline-flex items-center justify-center w-64 h-64 rounded-full border-[28px] relative mb-12 transition-all ${tutorialStep === 4 ? 'border-amber-500/20 bg-slate-900' : 'border-slate-50 bg-white'}`}>
                   <span className={`text-8xl font-black tracking-tighter ${tutorialStep === 4 ? 'text-white' : 'text-slate-900'}`}>{state.ecosystemIntegrity.toFixed(0)}</span>
                </div>
                <div className="text-left space-y-8 pt-12 border-t border-slate-100">
                   <div className="flex justify-between items-center"><span className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Fish size={18} className="text-blue-500"/> Oxygen Level</span><span className={`text-2xl font-black tracking-tighter ${tutorialStep === 4 ? 'text-blue-400' : 'text-blue-600'}`}>{state.dissolvedOxygen.toFixed(1)}</span></div>
                   <div className="flex justify-between items-center mt-6 border-t border-slate-50 pt-6"><span className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Droplets size={18} className="text-rose-500"/> Toxicity</span><span className={`text-2xl font-black tracking-tighter ${tutorialStep === 4 ? 'text-rose-400' : 'text-rose-600'}`}>{state.pollutionLevel.toFixed(1)}</span></div>
                </div>
             </div>

             {/* AI GUIDE SECTION */}
             <div className={`rounded-[4rem] p-12 shadow-2xl relative group overflow-hidden transform transition-all duration-500 border-b-8 ${tutorialStep === 5 ? 'bg-slate-800 border-blue-400 ring-[12px] ring-blue-500/40 scale-[1.1] shadow-[0_0_150px_rgba(37,99,235,0.7)] z-[502]' : 'bg-blue-600 border-blue-800 text-white'}`}>
                <div className="flex items-center gap-6 mb-10"><BrainCircuit size={32} /><h4 className="text-[14px] font-black uppercase tracking-[0.3em]">Governance Audit</h4></div>
                <p className="text-2xl font-bold leading-relaxed italic border-l-4 border-white/40 pl-10 mb-14 transition-all">"{state.aiAdvice?.justification || "Watershed audit active. Click below to receive a strategic professional assessment."}"</p>
                <button onClick={() => requestAIAdvice()} disabled={isAiLoading} className="w-full bg-white text-blue-600 py-7 rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.4em] hover:bg-slate-100 transition-all active:scale-95 shadow-2xl">
                   {isAiLoading ? 'CONDUCTING AUDIT...' : 'GET PROFESSIONAL GUIDANCE'}
                </button>
             </div>

             <div className="bg-slate-900/50 rounded-[3.5rem] p-10 border border-white/5 shadow-xl">
                <div className="flex items-center gap-5 mb-10">
                   <TrendingUp size={28} className="text-emerald-500"/>
                   <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-400">Impact Log</h3>
                </div>
                <div className="space-y-10 max-h-[450px] overflow-y-auto pr-8 scrollbar-thin scrollbar-thumb-slate-800">
                   {state.policyLog.map((log, i) => (
                     <div key={i} className={`p-8 rounded-[3rem] border border-white/5 transition-all animate-in slide-in-from-bottom duration-500 ${log.type === 'IMPACT' ? 'bg-emerald-500/5 border-l-8 border-l-emerald-500' : log.type === 'SHOCK' ? 'bg-rose-500/5 border-l-8 border-l-rose-500' : 'bg-white/5 border-l-8 border-l-blue-600'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono">Week {log.week}</span>
                        </div>
                        <p className="text-[15px] text-white font-black leading-tight mb-4 tracking-tight uppercase">{log.event}</p>
                        <p className="text-[12px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-4">{log.impact}</p>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {state.isCollapsed && (
          <div className="fixed inset-0 z-[600] bg-slate-950/99 backdrop-blur-3xl flex items-center justify-center p-12 text-white text-center">
             <div className="max-w-5xl w-full p-24 animate-in zoom-in-95 duration-1000">
                <div className="w-40 h-40 bg-rose-600/10 rounded-[5rem] flex items-center justify-center mx-auto mb-16 border-2 border-rose-600/30 text-rose-500 shadow-[0_0_150px_rgba(244,63,94,0.3)]"><XCircle size={120} className="animate-pulse" /></div>
                <h2 className="text-8xl font-black tracking-tighter uppercase mb-16 leading-none">PROJECT FAILURE</h2>
                <div className="bg-white/5 border border-white/10 p-24 rounded-[5rem] text-left mb-24 relative overflow-hidden">
                   <p className="text-5xl font-black leading-tight mb-20 text-rose-100 italic border-l-8 border-rose-500 pl-14">
                     "{state.accountability?.description}"
                   </p>
                   <div className="pt-20 border-t border-white/10 flex justify-between items-end">
                      <div>
                         <p className="text-[16px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em]">Restoration Cost</p>
                         <p className="text-7xl font-black text-rose-500 tracking-tighter">₹{Math.round(state.environmentalDebt).toLocaleString()}</p>
                      </div>
                      <p className="text-5xl font-black text-white tracking-tighter">Lasted {state.week} Weeks</p>
                   </div>
                </div>
                <button onClick={() => { setState(INITIAL_STATE); setShowGuide(true); }} className="w-full bg-white text-slate-950 py-12 rounded-[3.5rem] font-black text-xl uppercase tracking-[0.8em] flex items-center justify-center gap-12 hover:bg-slate-200 transition-all shadow-2xl active:scale-95">RESTART PROJECT</button>
             </div>
          </div>
        )}
      </main>

      <footer className="px-12 py-40 border-t border-white/5 text-center bg-slate-950 relative overflow-hidden">
        <p className="text-[14px] font-bold text-slate-800 uppercase tracking-[1em] mt-24">AquaSim Pro v4.2 • High-Speed Strategy Engine</p>
      </footer>
    </div>
  );
};

export default App;
