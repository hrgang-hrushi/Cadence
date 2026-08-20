"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Home, Settings2, Plus, Play, User, Camera, Moon, Timer, Pause, Square, RotateCcw, MoreVertical, Edit2, Trash2, Check, Bookmark, X, Clock, ArrowRight, ChevronDown, ChevronUp, Book } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type ClassMeeting = {
  id: string;
  days: string[];
  timeStart: string;
  timeEnd: string;
};

type ClassInfo = {
  id: string;
  name: string;
  meetings: ClassMeeting[];
  isExpanded: boolean;
};

function Onboarding({ onComplete, initialData }: { onComplete: (data: { name: string, classes: ClassInfo[] }) => void, initialData?: { name: string, classes: ClassInfo[] } | null }) {
  const [step, setStep] = useState(initialData ? 2 : 1);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(initialData?.name || "");
  const [classes, setClasses] = useState<ClassInfo[]>(initialData?.classes?.length ? initialData.classes : [
    { 
      id: "1", 
      name: "", 
      meetings: [{ id: "m1", days: [], timeStart: "", timeEnd: "" }],
      isExpanded: true
    }
  ]);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        onComplete(data);
      } else {
        // No data yet, proceed to step 2 but they are signed in!
        setStep(2);
      }
    } catch (e) {
      console.error(e);
      setStep(2); // Fallback to local
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://localhost:8000/api/upload-schedule", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.status === "success" && data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("Failed to upload schedule:", error);
      alert("Could not process schedule image. Is the Python backend running?");
    } finally {
      setIsUploading(false);
    }
  };

  const handleComplete = () => {
    if (!name.trim()) return;
    const validClasses = classes.filter(c => c.name.trim() !== "");
    onComplete({ name, classes: validClasses });
  };

  const addClass = () => {
    setClasses(prev => [...prev, { 
      id: Math.random().toString(), 
      name: "", 
      meetings: [{ id: Math.random().toString(), days: [], timeStart: "", timeEnd: "" }],
      isExpanded: true 
    }]);
  };

  const updateClass = (id: string, name: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  };

  const toggleClassExpansion = (id: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c));
  };

  const addMeeting = (classId: string) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return { ...c, meetings: [...c.meetings, { id: Math.random().toString(), days: [], timeStart: "", timeEnd: "" }] };
      }
      return c;
    }));
  };

  const updateMeeting = (classId: string, meetingId: string, field: keyof ClassMeeting, value: any) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return { 
          ...c, 
          meetings: c.meetings.map(m => m.id === meetingId ? { ...m, [field]: value } : m) 
        };
      }
      return c;
    }));
  };

  const toggleDay = (classId: string, meetingId: string, day: string) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          meetings: c.meetings.map(m => {
            if (m.id === meetingId) {
              const newDays = m.days.includes(day) ? m.days.filter(d => d !== day) : [...m.days, day];
              return { ...m, days: newDays };
            }
            return m;
          })
        }
      }
      return c;
    }));
  };

  const DAYS = ["M", "T", "W", "Th", "F"];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center p-4 overflow-y-auto bg-[radial-gradient(100%_100%_at_50%_100%,rgba(59,130,246,0.25)_0%,transparent_100%)]">
      <div className="w-full my-auto py-12 flex flex-col items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-10 md:p-14 flex flex-col items-center text-center"
            >
              <img src="/logo.svg" alt="Cadence Logo" className="w-24 h-24 object-contain mb-8 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">Welcome to <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Cadence</span></h1>
              <p className="text-white/40 font-light text-lg mb-10 leading-relaxed">Your intelligent voice note taker designed specifically for students.</p>
              
              <button 
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="w-full relative flex items-center justify-center gap-3 bg-white text-black py-4 rounded-full font-medium hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-70 shadow-[0_0_40px_rgba(255,255,255,0.2)] mb-4"
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 w-full mb-4">
                 <div className="h-px bg-white/10 flex-1"></div>
                 <span className="text-white/40 text-xs font-mono">OR</span>
                 <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={isAuthenticating}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/20 text-white py-4 rounded-full font-medium hover:bg-white/5 active:scale-95 transition-all"
              >
                Continue without account
              </button>
              
              <div className="mt-8 text-sm font-light text-white/40">
                Made for students by <a href="https://hrushi-gr.vercel.app" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Hrushi Gangala</a>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xl p-8 md:p-10 flex flex-col"
            >
              <h2 className="text-2xl font-light tracking-tight mb-2">Almost there!</h2>
              <p className="text-white/40 font-light text-sm mb-8">Let's set up your schedule.</p>
              
              <div className="space-y-8 relative z-10">
                <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl">
                  <label className="block text-xs font-mono tracking-widest text-white/40 uppercase mb-3">Your Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-light shadow-inner"
                  />
                </div>
                
                <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-mono tracking-widest text-white/40 uppercase">Your Classes</label>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-[10px] uppercase font-mono flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors text-white/80 active:scale-95"
                    >
                      <Camera className="w-3 h-3" />
                      {isUploading ? "Scanning..." : "Upload Photo"}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {classes.map((cls, idx) => (
                      <div key={cls.id} className="rounded-2xl bg-[#111] border border-white/5 shadow-inner overflow-hidden transition-all duration-300">
                        {/* Class Header / Accordion Toggle */}
                        <div 
                          className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => toggleClassExpansion(cls.id)}
                        >
                          <input 
                            type="text" 
                            value={cls.name}
                            onChange={(e) => updateClass(cls.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Class ${idx + 1} Name (e.g. Bio 201)`}
                            className="w-full bg-transparent border-b border-transparent focus:border-white/10 px-2 py-1 text-white outline-none transition-colors font-light text-lg"
                          />
                          <button className="p-2 text-white/40 hover:text-white transition-colors flex-shrink-0">
                            {cls.isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        {/* Accordion Body (Meetings) */}
                        <AnimatePresence initial={false}>
                          {cls.isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 border-t border-white/5 space-y-6">
                                {cls.meetings.map((meeting, mIdx) => (
                                  <div key={meeting.id} className="relative bg-black/40 rounded-xl p-4 border border-white/5">
                                    {cls.meetings.length > 1 && (
                                      <div className="absolute -left-2 top-4 bottom-4 w-1 bg-white/10 rounded-full" />
                                    )}
                                    <div className="flex flex-col gap-5">
                                      {/* Days Selector */}
                                      <div>
                                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Days (Slot {mIdx + 1})</p>
                                        <div className="flex flex-wrap gap-2">
                                          {DAYS.map(day => (
                                            <button
                                              key={day}
                                              onClick={() => toggleDay(cls.id, meeting.id, day)}
                                              className={cn(
                                                "w-10 h-10 rounded-full text-xs font-medium transition-colors border flex items-center justify-center",
                                                meeting.days.includes(day) 
                                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                                                  : "bg-black text-white/40 border-white/10 hover:bg-white/5"
                                              )}
                                            >
                                              {day}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {/* Times Selector */}
                                      <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">Start</p>
                                          <input 
                                            type="time" 
                                            value={meeting.timeStart}
                                            onChange={(e) => updateMeeting(cls.id, meeting.id, "timeStart", e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-3 text-white text-sm md:text-base outline-none focus:border-white/30 transition-colors"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">End</p>
                                          <input 
                                            type="time" 
                                            value={meeting.timeEnd}
                                            onChange={(e) => updateMeeting(cls.id, meeting.id, "timeEnd", e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded-lg px-3 py-3 text-white text-sm md:text-base outline-none focus:border-white/30 transition-colors"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <button 
                                  onClick={() => addMeeting(cls.id)}
                                  className="w-full py-3 rounded-lg border border-white/5 border-dashed text-white/30 text-xs hover:text-white/70 hover:bg-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2 mt-2 uppercase tracking-widest font-mono"
                                >
                                  <Plus className="w-3 h-3" /> Add another time slot
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addClass}
                    className="w-full py-4 rounded-xl border border-white/10 border-dashed text-white/40 text-sm hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Plus className="w-4 h-4" /> Add another class
                  </button>
                </div>
              </div>

              <button 
                onClick={handleComplete}
                disabled={!name.trim()}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-full font-medium hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Start Recording <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

type Tab = "home" | "record" | "pomodoro" | "settings";
export default function AppLayout() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userData, setUserData] = useState<{ name: string, classes: ClassInfo[] } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const handleRecordComplete = async (minutes: number) => {
    if (!userData) return;
    const currentStats = (userData as any).stats || { minutesRecorded: 0, streak: 1, lastLoginDate: new Date().toISOString().split('T')[0] };
    const newStats = { ...currentStats, minutesRecorded: currentStats.minutesRecorded + minutes };
    const newData = { ...userData, stats: newStats };
    setUserData(newData);
    localStorage.setItem("cadenceUserData", JSON.stringify(newData));
    if (auth.currentUser) {
       try {
         await setDoc(doc(db, "users", auth.currentUser.uid), { stats: newStats }, { merge: true });
       } catch (e) {
         console.error("Could not update stats in Firestore", e);
       }
    }
  };

  const recordContext = useVoiceRecorder(handleRecordComplete);

  useEffect(() => {
    const processStats = (data: any) => {
      const today = new Date().toISOString().split('T')[0];
      let stats = data.stats || { minutesRecorded: 0, streak: 0, lastLoginDate: "" };
      
      if (stats.lastLoginDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (stats.lastLoginDate === yesterday) {
          stats.streak += 1;
        } else {
          stats.streak = 1;
        }
        stats.lastLoginDate = today;
      }
      return { ...data, stats };
    };

    const cached = localStorage.getItem("cadenceUserData");
    if (cached) {
      try {
        const parsed = processStats(JSON.parse(cached));
        setUserData(parsed);
        setHasOnboarded(true);
      } catch (e) {}
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             const data = processStats(docSnap.data());
             setUserData(data);
             setHasOnboarded(true);
             localStorage.setItem("cadenceUserData", JSON.stringify(data));
             // Save the updated streak back
             await setDoc(doc(db, "users", user.uid), { stats: data.stats }, { merge: true });
          }
        } catch (e) {
          console.error("Firestore read error", e);
        }
      }
      setIsLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const handleOnboardingComplete = async (data: { name: string, classes: ClassInfo[] }) => {
    const newData = { ...data, stats: { minutesRecorded: 0, streak: 1, lastLoginDate: new Date().toISOString().split('T')[0] } };
    setUserData(newData as any);
    setHasOnboarded(true);
    localStorage.setItem("cadenceUserData", JSON.stringify(newData));
    
    if (auth.currentUser) {
       try {
         await setDoc(doc(db, "users", auth.currentUser.uid), newData, { merge: true });
       } catch (e) {
         console.error("Could not save to Firestore", e);
       }
    }
  };

  const handleUpdateName = async (newName: string) => {
    if (!userData) return;
    const newData = { ...userData, name: newName };
    setUserData(newData);
    localStorage.setItem("cadenceUserData", JSON.stringify(newData));
    if (auth.currentUser) {
       try {
         await setDoc(doc(db, "users", auth.currentUser.uid), { name: newName }, { merge: true });
       } catch (e) {
         console.error("Could not update name in Firestore", e);
       }
    }
  };

  if (isLoadingAuth && !hasOnboarded) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} initialData={userData} />;
  }

  return (
    <main className="min-h-screen relative bg-black text-white selection:bg-white/20">
      
      {/* Global Recording Pill */}
      <AnimatePresence>
        {recordContext.isRecording && activeTab !== "record" && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => setActiveTab("record")}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-black border border-rose-500/50 rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.3)] cursor-pointer hover:scale-105 transition-transform"
          >
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-rose-100">Recording...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation - Floating Pill Dock (Bottom Center) */}
      <nav className="fixed bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-3xl border border-white/10 px-6 py-2 md:px-8 md:py-2.5 flex flex-row items-center gap-4 md:gap-6 rounded-full z-50 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <NavItem 
          icon={<Home strokeWidth={activeTab === "home" ? 2 : 1.5} className="w-6 h-6 md:w-7 md:h-7" />} 
          isActive={activeTab === "home"} 
          onClick={() => setActiveTab("home")} 
          glowClass="bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(244,63,94,0.5)_100%)]"
        />
        <NavItem 
          icon={<Mic strokeWidth={activeTab === "record" ? 2 : 1.5} className="w-6 h-6 md:w-7 md:h-7" />} 
          isActive={activeTab === "record"} 
          onClick={() => setActiveTab("record")} 
          glowClass="bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(234,179,8,0.5)_100%)]"
        />
        <NavItem 
          icon={<Timer strokeWidth={activeTab === "pomodoro" ? 2 : 1.5} className="w-6 h-6 md:w-7 md:h-7" />} 
          isActive={activeTab === "pomodoro"} 
          onClick={() => setActiveTab("pomodoro")} 
          glowClass="bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(59,130,246,0.5)_100%)]"
        />
        <NavItem 
          icon={<Settings2 strokeWidth={activeTab === "settings" ? 2 : 1.5} className="w-6 h-6 md:w-7 md:h-7" />} 
          isActive={activeTab === "settings"} 
          onClick={() => setActiveTab("settings")} 
          glowClass="bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(34,211,238,0.5)_100%)]"
        />
      </nav>

      {/* Main Content Area */}
      <div className="w-full h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" onNavigate={setActiveTab} userData={userData} />}
          {activeTab === "record" && <RecordTab key="record" onRecordFinished={handleRecordComplete} recordContext={recordContext} />}
          {activeTab === "pomodoro" && <PomodoroTab key="pomodoro" />}
          {activeTab === "settings" && <SettingsTab key="settings" userData={userData} onModify={() => setHasOnboarded(false)} onUpdateName={handleUpdateName} />}
        </AnimatePresence>
      </div>
    </main>
  );
}

function NavItem({ icon, isActive, onClick, glowClass }: { icon: React.ReactNode, isActive: boolean, onClick: () => void, glowClass?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative px-6 py-2 md:px-8 md:py-2.5 rounded-full transition-all duration-300 group flex items-center justify-center",
        isActive ? "text-white" : "text-white/40 hover:text-white/70 hover:scale-110 active:scale-95"
      )}
    >
      {isActive && (
        <motion.div 
          layoutId="navSpotlight"
          className={cn("absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]", glowClass || "bg-white/15")}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center justify-center">
        {icon}
      </div>
    </button>
  );
}

function HomeTab({ onNavigate, userData }: { onNavigate: (tab: Tab) => void, userData: { name: string, classes: ClassInfo[] } | null }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | "custom">(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const handleDurationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setIsRunning(false);
    if (val === "custom") {
      setSelectedDuration("custom");
    } else {
      const mins = parseInt(val);
      setSelectedDuration(mins);
      setTimeLeft(mins * 60);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (mins > 0) {
      setSelectedDuration(mins);
      setTimeLeft(mins * 60);
      setIsRunning(false);
      setCustomMinutes("");
    }
  };

  const getClassStatus = () => {
    if (!userData?.classes || userData.classes.length === 0) return { type: 'none', classInfo: null, meeting: null };
    
    const dayMap = ["Su", "M", "T", "W", "Th", "F", "Sa"];
    const todayStr = dayMap[currentTime.getDay()];
    const currentSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

    let nextClass = null;
    let minSecondsUntil = Infinity;
    let activeClass = null;

    for (const cls of userData.classes) {
      for (const meeting of cls.meetings) {
        if (meeting.days.includes(todayStr)) {
          const [startH, startM] = meeting.timeStart.split(':').map(Number);
          const [endH, endM] = meeting.timeEnd.split(':').map(Number);
          const startSecs = startH * 3600 + startM * 60;
          const endSecs = endH * 3600 + endM * 60;
          
          if (currentSecs >= startSecs && currentSecs < endSecs) {
            activeClass = { classInfo: cls, meeting, startSecs, endSecs };
          } else if (startSecs > currentSecs) {
            const diff = startSecs - currentSecs;
            if (diff < minSecondsUntil) {
              minSecondsUntil = diff;
              nextClass = { classInfo: cls, meeting, startSecs, endSecs };
            }
          }
        }
      }
    }
    
    if (activeClass) return { type: 'active', ...activeClass };
    if (nextClass) return { type: 'next', ...nextClass };
    return { type: 'none', classInfo: userData.classes[0], meeting: userData.classes[0].meetings[0] };
  };

  const statusData = getClassStatus() as any;
  const currentSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
  
  let progress = 0;
  let badgeLabel = "Happening Soon";
  let dynamicBg = {};
  let showPulse = false;

  if (statusData.type === 'active') {
    badgeLabel = "Live Now";
    showPulse = true;
    const total = statusData.endSecs - statusData.startSecs;
    const elapsed = currentSecs - statusData.startSecs;
    progress = Math.max(0, Math.min(1, elapsed / total));
    // The gradient grows inwards as time progresses
    dynamicBg = { background: `radial-gradient(at center, var(--card-bg) ${100 - (progress * 90)}%, rgba(244, 63, 94, 0.4) 100%)` };
  } else if (statusData.type === 'next') {
    badgeLabel = "Happening Soon";
    showPulse = true;
    dynamicBg = { background: 'radial-gradient(at center, var(--card-bg) 95%, rgba(244, 63, 94, 0.3) 100%)' };
  } else {
    badgeLabel = "No Classes Today";
  }

  // Live Notification when class starts
  const prevStatusRef = useRef<string>(statusData.type);
  useEffect(() => {
    if (statusData.type === 'active' && prevStatusRef.current !== 'active') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("Class Started!", { body: `${statusData.classInfo?.name} is live now.` });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification("Class Started!", { body: `${statusData.classInfo?.name} is live now.` });
            }
          });
        }
      }
    }
    prevStatusRef.current = statusData.type;
  }, [statusData.type, statusData.classInfo?.name]);

  // Real-time stats fallback to dynamic data
  const minutes = (userData as any)?.stats?.minutesRecorded || 0;
  const hoursRecorded = parseFloat((minutes / 60).toFixed(1));
  const studyStreak = (userData as any)?.stats?.streak || 0;

  const liveTimeStr = currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return "";
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getTimeline = () => {
    if (!userData?.classes || userData.classes.length === 0) return [];
    
    const dayMap = ["Su", "M", "T", "W", "Th", "F", "Sa"];
    const todayStr = dayMap[currentTime.getDay()];
    const tomorrowStr = dayMap[(currentTime.getDay() + 1) % 7];
    const currMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    let timelineItems: any[] = [];
    
    for (const cls of userData.classes) {
      for (const meeting of cls.meetings) {
        if (meeting.days.includes(todayStr)) {
          const [startH, startM] = meeting.timeStart.split(':').map(Number);
          const [endH, endM] = meeting.timeEnd.split(':').map(Number);
          const startMins = startH * 60 + startM;
          const endMins = endH * 60 + endM;
          
          let state = 'past';
          if (currMins >= startMins && currMins < endMins) state = 'active';
          else if (startMins > currMins) state = 'future';
          
          timelineItems.push({
            id: cls.id + '-' + meeting.id,
            name: cls.name,
            startMins,
            timeLabel: state === 'active' ? `NOW - ${formatTime(meeting.timeEnd)}` : `${formatTime(meeting.timeStart)} - ${formatTime(meeting.timeEnd)}`,
            state,
          });
        }
      }
    }
    
    timelineItems.sort((a, b) => a.startMins - b.startMins);
    let displayItems = timelineItems.filter(item => item.state === 'active' || item.state === 'future');
    
    let tomorrowsClasses: any[] = [];
    for (const cls of userData.classes) {
      for (const meeting of cls.meetings) {
        if (meeting.days.includes(tomorrowStr)) {
          const [startH, startM] = meeting.timeStart.split(':').map(Number);
          const startMins = startH * 60 + startM;
          tomorrowsClasses.push({
            id: cls.id + '-tom-' + meeting.id,
            name: cls.name,
            startMins,
            timeLabel: 'TOMORROW',
            state: 'tomorrow',
          });
        }
      }
    }
    
    tomorrowsClasses.sort((a, b) => a.startMins - b.startMins);
    displayItems = [...displayItems, ...tomorrowsClasses];
    
    return displayItems.slice(0, 4);
  };

  const timelineItems = getTimeline();
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="px-6 md:px-12 lg:px-20 pt-8 md:pt-12 max-w-[1600px] h-full mx-auto flex flex-col pb-24 md:pb-28"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 mb-8 md:mb-10">
        <div>
          <p className="font-mono text-xs text-white/40 tracking-[0.2em] uppercase mb-3">CMS / Overview</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">{greeting}, {userData?.name || "Hrushi"}</h1>
        </div>
        <button 
          onClick={() => onNavigate('record')}
          className="hidden md:flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full hover:scale-105 transition-transform font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Quick Note</span>
        </button>
      </header>

      {/* Grid Layout */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-3 lg:grid-cols-4 md:grid-rows-3 gap-4 md:gap-6 min-h-0">
        
        {/* 1. Happening Soon / Live Now */}
        <section 
          className="card-minimal p-6 md:p-8 flex flex-col justify-between group md:col-span-2 lg:col-span-2 md:row-span-2 shrink-0 transition-all duration-1000 ease-linear"
          style={dynamicBg}
        >
          <div className="card-content flex justify-between items-start mb-6 md:mb-0">
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest mt-2">{badgeLabel}</p>
            <div className="px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center space-x-2">
              {showPulse && <div className={cn("w-2 h-2 rounded-full", statusData.type === 'active' ? "animate-pulse bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-white/40")} />}
              <span className="font-mono text-sm tracking-wider w-[80px] text-center tabular-nums">
                {liveTimeStr}
              </span>
            </div>
          </div>
          
          <div className="card-content mt-auto md:pt-12">
            <h3 className="text-3xl md:text-5xl font-light">{statusData.classInfo?.name || "No classes scheduled"}</h3>
            
            {statusData.type === 'active' ? (
              <div className="mt-4 flex items-center gap-4">
                <p className="text-rose-400 font-mono text-sm uppercase tracking-widest">
                  Class ends in {Math.ceil((statusData.endSecs - currentSecs) / 60)} minutes
                </p>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                  <motion.div 
                    className="h-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" 
                    style={{ width: `${progress * 100}%` }}
                    layout
                  />
                </div>
              </div>
            ) : statusData.type === 'next' ? (
              <p className="text-white/50 text-sm md:text-lg mt-2 font-light">
                Starts at {(() => {
                  const [h, m] = statusData.meeting.timeStart.split(':').map(Number);
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const hour12 = h % 12 || 12;
                  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                })()}
              </p>
            ) : (
              <p className="text-white/50 text-sm md:text-lg mt-2 font-light">Prepare your notes!</p>
            )}
          </div>
        </section>

        {/* --- MOBILE ONLY: Timer Widget --- */}
        <section className="card-minimal p-6 md:hidden flex flex-col items-center justify-center border border-white/10 side-glow-blue relative overflow-hidden flex-1 shadow-2xl min-h-[300px]">
          {isRunning && (
            <motion.div 
              className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]"
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="flex gap-2 mb-6">
              <select 
                value={selectedDuration === "custom" ? "custom" : selectedDuration}
                onChange={handleDurationSelect}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-white/30 font-light appearance-none text-center cursor-pointer min-w-[120px] shadow-lg backdrop-blur-md text-sm"
              >
                <option value="15" className="bg-[#111] text-white">15 Minutes</option>
                <option value="25" className="bg-[#111] text-white">25 Minutes</option>
                <option value="50" className="bg-[#111] text-white">50 Minutes</option>
                <option value="custom" className="bg-[#111] text-white">Custom...</option>
              </select>
              <AnimatePresence>
                {selectedDuration === "custom" && (
                  <motion.form 
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -10 }}
                    onSubmit={handleCustomSubmit} 
                    className="flex gap-2"
                  >
                    <input 
                      type="number" 
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Min"
                      className="w-16 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-white outline-none text-center font-light shadow-lg backdrop-blur-md text-sm"
                    />
                    <button type="submit" className="bg-white/10 border border-white/10 rounded-xl px-3">
                      <Check className="w-4 h-4 text-white" />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <motion.div 
              className="text-[5rem] font-light tracking-tighter tabular-nums flex items-center justify-center text-white"
              animate={{ scale: isRunning ? 1.05 : 1 }}
            >
              {mins}<span className="text-white/20 -mt-4">:</span>{secs}
            </motion.div>

            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(typeof selectedDuration === "number" ? selectedDuration * 60 : 25 * 60);
                }}
                className="p-3 rounded-full border border-white/10 bg-white/5 text-white/50"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleTimer}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95",
                  isRunning ? "bg-white/10 border border-white/20 text-white" : "bg-white text-black"
                )}
              >
                {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
              </button>
            </div>
          </div>
        </section>

        {/* --- DESKTOP ONLY --- */}
        {/* 2. Timeline Card */}
        <section className="card-minimal side-glow-purple p-8 flex-col md:col-span-1 lg:col-span-1 row-span-2 lg:row-span-3 overflow-hidden hidden md:flex">
          <div className="card-content h-full flex flex-col">
            <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-8">Schedule Timeline</h2>
            
            <div className="relative border-l border-white/10 ml-3 space-y-8 pb-4 flex-1">
              {timelineItems.length > 0 ? (
                timelineItems.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className={cn(
                      "absolute w-3 h-3 rounded-full -left-[6.5px] top-1",
                      item.state === 'active' 
                        ? "bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)]" 
                        : "bg-transparent border-2 border-white/30"
                    )} />
                    <p className={cn(
                      "font-mono text-[10px] mb-1",
                      item.state === 'active' ? "text-white/60" : "text-white/40"
                    )}>
                      {item.timeLabel}
                    </p>
                    <h4 className={cn(
                      "text-lg font-light",
                      item.state === 'active' ? "text-white" : "text-white/60"
                    )}>
                      {item.name}
                    </h4>
                  </div>
                ))
              ) : (
                <div className="pl-6 py-4">
                  <p className="text-white/40 font-light text-sm">No classes scheduled right now.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile Wrap for Stats */}
        <div className="flex md:contents gap-4 shrink-0">
          {/* 3. Quick Stats */}
          <section className="card-minimal side-glow-cyan-right p-4 md:p-6 flex flex-col justify-center items-center text-center md:col-span-1 lg:col-span-1 row-span-1 group hover:border-white/10 transition-colors cursor-pointer flex-1">
            <div className="card-content flex flex-col items-center justify-center">
              <h3 className="text-3xl md:text-4xl font-light text-white">{hoursRecorded}<span className="text-lg md:text-xl text-white/40">h</span></h3>
              <p className="text-[9px] md:text-xs font-mono text-white/40 uppercase tracking-widest mt-2">Recorded this week</p>
            </div>
          </section>

          {/* 3.5 Study Streak */}
          <section className="card-minimal side-glow-orange p-4 md:p-6 flex flex-col justify-center items-center text-center md:col-span-1 lg:col-span-1 row-span-1 group hover:border-white/10 transition-colors cursor-pointer flex-1">
            <div className="card-content flex flex-col items-center justify-center">
              <div className="w-8 h-8 md:w-10 md:h-10 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 md:mb-3">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-light text-white">{studyStreak} Days</h3>
              <p className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">Study Streak</p>
            </div>
          </section>
        </div>

        {/* 4. Start Pomodoro Box */}
        <section 
          onClick={() => onNavigate("pomodoro")}
          className="card-minimal side-glow-blue p-6 flex-col justify-center md:col-span-2 lg:col-span-2 row-span-1 hover:border-white/10 transition-colors cursor-pointer hidden md:flex"
        >
          <div className="card-content flex justify-between items-center w-full">
            <div>
              <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">Focus Flow</h2>
              <h3 className="text-2xl md:text-3xl font-light">Start Pomodoro Session</h3>
              <p className="text-sm text-white/50 mt-1 font-light">25m focus • 5m break</p>
            </div>
            <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <Timer className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </section>

        {/* 5. Mini Record Shortcut */}
        <section 
          onClick={() => onNavigate("record")}
          className="card-minimal side-glow-yellow p-6 flex-col justify-center items-center md:col-span-1 lg:col-span-1 row-span-1 group hover:border-white/10 transition-colors cursor-pointer hidden md:flex"
        >
          <div className="card-content flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 text-black" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-mono text-white/60 uppercase tracking-widest mt-4">One-Tap Memo</p>
          </div>
        </section>

      </div>
    </motion.div>
  );
}

function RecordTab({ 
  onRecordFinished,
  recordContext
}: { 
  onRecordFinished?: (minutes: number) => void,
  recordContext: any
}) {
  const { isRecording, toggleRecording, addBookmark, notes, setNotes, recordingStartTime } = recordContext;
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  
  const ticks = Array.from({ length: 60 });

  const playNote = (url: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (url) {
      new Audio(url).play();
    } else {
      alert("This mock note has no audio attached.");
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev: any) => prev.filter((n: any) => n.id !== id));
    setOpenDropdownId(null);
  };

  const startRename = (id: number, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setOpenDropdownId(null);
  };

  const saveRename = (id: number) => {
    setNotes((prev: any) => prev.map((n: any) => n.id === id ? { ...n, title: editTitle } : n));
    setEditingId(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 md:px-12 lg:px-20 pt-8 md:pt-12 flex flex-col h-full space-y-8 md:space-y-12 max-w-[1400px] mx-auto pb-24 md:pb-28"
    >
      <header className="shrink-0">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Voice note</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 flex-1">
        {/* Main Recording Card */}
        <div className="flex-1 min-h-[500px] lg:min-h-0 relative rounded-[40px] overflow-hidden flex flex-col items-center justify-center border border-white/10"
             style={{ background: 'radial-gradient(ellipse at center, #050505 20%, rgba(134, 239, 172, 0.25) 120%)' }}>
          
          <p className="absolute top-12 text-lg font-light text-center text-white/90 px-8">
            {isRecording ? "Listening to your voice..." : "Tap the center to start recording"}
          </p>

          <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80 mt-8">
            <motion.div 
              animate={{ rotate: isRecording ? 360 : 0 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              {ticks.map((_, i) => (
                <div key={i} className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full" style={{ transform: `rotate(${i * 6}deg)` }}>
                  <div className={cn("w-full rounded-full transition-colors", isRecording && i >= 40 && i <= 45 ? "bg-yellow-300 h-4 md:h-6" : "bg-white/30 h-2 md:h-3")} />
                </div>
              ))}
            </motion.div>

            <div className="absolute inset-10 md:inset-12 rounded-full bg-black/40 border border-white/5 backdrop-blur-md" />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className="absolute inset-14 md:inset-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] z-10 transition-transform"
            >
              {isRecording ? <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm bg-black animate-pulse" /> : <Mic className="w-10 h-10 md:w-12 md:h-12 text-black" strokeWidth={1.5} />}
            </motion.button>
          </div>
          
          {isRecording && (
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={addBookmark}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full hover:bg-white/20 transition-colors z-20 shadow-2xl active:scale-95"
            >
              <Bookmark className="w-5 h-5 text-yellow-300" /> 
              <span className="font-medium">Bookmark</span>
            </motion.button>
          )}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-full pl-6 md:pl-8 pr-2 py-2 w-64 md:w-72 justify-between">
            <span className="text-sm font-medium text-white/80">{isRecording ? "Recording active" : "Start tracking"}</span>
            <button onClick={toggleRecording} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black active:scale-95 transition-transform hover:bg-gray-200 z-10">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Note History sidebar on desktop */}
        <div className="w-full lg:w-96 flex flex-col space-y-6">
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-widest">Note history</h2>
          <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px] pb-32">
            {notes.map((note: any) => (
              <div 
                key={note.id} 
                onClick={() => setSelectedNote(note)}
                className={cn(`card-minimal p-5 flex items-center space-x-5 hover:border-white/10 transition-colors cursor-pointer ${note.color}`, openDropdownId === note.id ? "!overflow-visible z-50 ring-1 ring-white/10" : "z-10")}
              >
                <button 
                  onClick={(e) => playNote(note.audioUrl, e)}
                  className="card-content w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <Play className="w-5 h-5 ml-1" />
                </button>
                <div className="card-content flex-1 overflow-hidden relative">
                  {editingId === note.id ? (
                    <input 
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(note.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(note.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent border-b border-white/20 text-lg font-light outline-none w-full mb-1 text-white"
                    />
                  ) : (
                    <h3 className="font-light text-lg truncate">{note.title}</h3>
                  )}
                  <p className="font-mono text-xs text-white/40 tracking-widest mt-1">{note.time}</p>
                </div>
                
                {/* Dropdown menu */}
                <div className="relative card-content shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === note.id ? null : note.id); }} 
                    className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {openDropdownId === note.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-10 w-36 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <button onClick={(e) => startRename(note.id, note.title, e)} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 transition-colors">
                          <Edit2 className="w-4 h-4" /> Rename
                        </button>
                        <button onClick={(e) => handleDelete(note.id, e)} className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-white/10 text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {selectedNote && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-6"
            onClick={() => setSelectedNote(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn("w-full max-w-3xl bg-[#050505] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]", selectedNote.color)}
            >
              <div className="p-8 border-b border-white/5 flex items-start justify-between bg-white/[0.02] backdrop-blur-xl">
                <div>
                  <h2 className="text-3xl font-light">{selectedNote.title}</h2>
                  <p className="text-white/40 mt-2 font-mono text-sm">{selectedNote.time}</p>
                </div>
                <button onClick={() => setSelectedNote(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 space-y-10 bg-black/40">
                {selectedNote.audioUrl && (
                  <div className="flex items-center gap-6 bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button onClick={() => playNote(selectedNote.audioUrl)} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 ml-1" />
                    </button>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="w-1/3 h-full bg-white/40 rounded-full" />
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Raw Transcript</h3>
                  <p className="text-lg leading-relaxed font-light text-white/80 whitespace-pre-wrap">
                    {selectedNote.transcript || "No transcript available for this note. Transcription requires Chrome or Safari with Web Speech API support."}
                  </p>
                </div>

                {selectedNote.bookmarks && selectedNote.bookmarks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4">Saved Bookmarks</h3>
                    <div className="space-y-3">
                      {selectedNote.bookmarks.map((time: number, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 text-white/60 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                          <Clock className="w-5 h-5 text-yellow-300" />
                          <span className="font-mono text-lg">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                          <span className="font-light">- Important moment flagged</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PomodoroTab() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  const setTimerMode = (newMode: "focus" | "break") => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        background: isRunning
          ? mode === "focus"
            ? [
                'radial-gradient(ellipse at center, #050505 70%, rgba(59, 130, 246, 0.1) 150%)',
                'radial-gradient(ellipse at center, #050505 55%, rgba(59, 130, 246, 0.6) 110%)',
                'radial-gradient(ellipse at center, #050505 70%, rgba(59, 130, 246, 0.1) 150%)'
              ]
            : [
                'radial-gradient(ellipse at center, #050505 70%, rgba(52, 211, 153, 0.1) 150%)',
                'radial-gradient(ellipse at center, #050505 55%, rgba(52, 211, 153, 0.6) 110%)',
                'radial-gradient(ellipse at center, #050505 70%, rgba(52, 211, 153, 0.1) 150%)'
              ]
          : 'radial-gradient(ellipse at center, #050505 40%, rgba(255, 255, 255, 0.05) 120%)'
      }}
      transition={{ background: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-0 flex flex-col items-center justify-center overflow-hidden"
    >
      <header className="absolute top-10 md:top-16 left-0 right-0 text-center z-10">
        <h1 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-white/30">Focus Flow</h1>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center z-10 w-full px-6">
          
          {/* Mode Selector */}
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-full mb-16 backdrop-blur-md">
            <button 
              onClick={() => setTimerMode("focus")}
              className={cn("px-6 py-2 rounded-full text-sm font-medium transition-all", mode === "focus" ? "bg-white text-black" : "text-white/50 hover:text-white")}
            >
              Focus
            </button>
            <button 
              onClick={() => setTimerMode("break")}
              className={cn("px-6 py-2 rounded-full text-sm font-medium transition-all", mode === "break" ? "bg-white text-black" : "text-white/50 hover:text-white")}
            >
              Break
            </button>
          </div>

          {/* Time Display */}
          <motion.div 
            animate={{ scale: isRunning ? 1.05 : 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="text-[6rem] sm:text-[9rem] md:text-[12rem] font-light tracking-tighter leading-none mb-16 font-mono tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-2xl"
          >
            {mins}:{secs}
          </motion.div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTimerMode(mode)}
              className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button 
              onClick={toggleTimer}
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all",
                isRunning ? "bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/20" : "bg-white text-black hover:scale-105"
              )}
            >
              {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
            </button>
            
            <div className="w-14 h-14" /> {/* Spacer for visual balance */}
          </div>
          
        </div>
    </motion.div>
  );
}

function SettingsTab({ userData, onModify, onUpdateName }: { userData: { name: string, classes: ClassInfo[] } | null, onModify: () => void, onUpdateName: (name: string) => void }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userData?.name || "");

  const saveName = () => {
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-12 lg:p-20 pt-8 md:pt-12 space-y-16 max-w-4xl mx-auto h-full overflow-y-auto pb-24 md:pb-28"
    >
      <header className="flex justify-between items-end">
        <div>
          <p className="font-mono text-xs text-white/40 tracking-[0.2em] uppercase mb-3">Preferences</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Settings</h1>
        </div>
        <button 
          onClick={() => {
             auth.signOut();
             localStorage.removeItem("cadenceUserData");
             window.location.reload();
          }}
          className="text-xs font-mono uppercase tracking-widest text-rose-400/80 hover:text-rose-400 border border-rose-400/20 hover:border-rose-400/50 px-4 py-2 rounded-full transition-colors bg-rose-500/5"
        >
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Account Info */}
        <section className="card-minimal side-glow-blue p-10 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
          <div className="card-content w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <User className="w-10 h-10 text-white/50" strokeWidth={1} />
          </div>
          <div className="card-content w-full flex flex-col items-center">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-2 w-full max-w-[200px]">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                  className="bg-[#111] border border-white/20 rounded-lg px-3 py-1 text-white text-center w-full outline-none focus:border-blue-400 transition-colors"
                />
                <button onClick={saveName} className="text-blue-400 p-1 hover:bg-blue-400/10 rounded-full"><ArrowRight className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl font-light tracking-wide">{userData?.name || "Student"}</h2>
                <button onClick={() => { setTempName(userData?.name || ""); setIsEditingName(true); }} className="text-white/40 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-white/40 text-sm mt-2 font-light">
              {userData?.classes?.length || 0} {(userData?.classes?.length === 1) ? "class" : "classes"} enrolled
            </p>
          </div>
        </section>

        <section className="space-y-4 flex flex-col justify-center">
          <div className="card-minimal side-glow-cyan-right p-6 md:p-8 flex flex-col justify-center transition-colors">
            <div className="card-content flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Book className="w-6 h-6 text-white/50" strokeWidth={1.5} />
                <span className="font-light text-xl">Class Information</span>
              </div>
              <button 
                onClick={onModify}
                className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 active:scale-95"
              >
                <Edit2 className="w-4 h-4" /> Modify
              </button>
            </div>
            
            <div className="card-content space-y-3 max-h-[180px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
              {userData?.classes?.map((cls, idx) => (
                <div key={cls.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                  <span className="font-medium text-white/80 tracking-wide">{cls.name || `Class ${idx + 1}`}</span>
                  <span className="text-xs font-mono text-white/30 uppercase tracking-widest">{cls.meetings.length} slots</span>
                </div>
              ))}
              {(!userData?.classes || userData.classes.length === 0) && (
                <p className="text-white/40 text-sm font-light text-center py-4">No classes added yet.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16 text-center text-sm font-light text-white/40 mb-8">
        Made for students by <a href="https://hrushi-gr.vercel.app" target="_blank" rel="noopener noreferrer" className="text-white hover:underline transition-colors">Hrushi Gangala</a>
      </div>
    </motion.div>
  );
}
