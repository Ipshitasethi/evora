import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Timer,
  Sparkles,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  ClipboardPlus,
  Smile,
  X,
  Utensils,
  Brain,
  Activity as ActivityIcon,
  Moon,
  Droplet
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { CycleWheel } from '../components/dashboard/CycleWheel';
import { DailyCheckIn } from '../components/dashboard/DailyCheckIn';
import { LogModal } from '../components/ui/LogModal';

import { differenceInCalendarDays, addDays, format, parseISO, startOfDay } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CycleSettings {
  last_period_start: string | null;
  avg_cycle_length: number | null;
  avg_period_length: number | null;
  goals: string[] | null;
}

interface Profile {
  name: string | null;
  onboarding_completed: boolean | null;
}

// ─── Greeting templates ───────────────────────────────────────────────────────
function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getDailyInsight(phase: string | null): string {
  switch (phase) {
    case 'Menstrual': return "Your body is doing important work right now — a great day to prioritize rest and gentle movement.";
    case 'Follicular': return "Your body is entering a period of rising energy. It's a great day to focus on creative tasks and moderate movement.";
    case 'Ovulation': return "You're at your peak energy right now — a perfect time for socializing and tackling challenging projects.";
    case 'Luteal': return "Your body is starting to wind down. Focus on wrapping up tasks and preparing for a restorative phase.";
    default: return "Track your cycle to receive daily insights tailored to your body's rhythm.";
  }
}

function getPhase(day: number, periodLen: number, cycleLen: number) {
  const follicularEnd = Math.floor(cycleLen * 0.46);
  const ovulationEnd = follicularEnd + Math.max(1, Math.floor(cycleLen * 0.07));
  if (day <= periodLen) return 'Menstrual';
  if (day <= follicularEnd) return 'Follicular';
  if (day <= ovulationEnd) return 'Ovulation';
  return 'Luteal';
}

function calculateCycleMetrics(lastPeriodStr: string | null, avgCycle: number, avgPeriod: number) {
  const today = startOfDay(new Date());
  
  if (!lastPeriodStr) return { dayInCycle: null, phase: null, nextPeriod: null, daysToNext: null, rolledLastPeriod: null };

  let baseDate = startOfDay(parseISO(lastPeriodStr));

  // Roll forward if last period is in the past by more than a full cycle
  while (differenceInCalendarDays(today, baseDate) >= avgCycle) {
    baseDate = addDays(baseDate, avgCycle);
  }

  const dayInCycle = differenceInCalendarDays(today, baseDate) + 1;
  const phase = getPhase(dayInCycle, avgPeriod, avgCycle);
  const nextPeriod = addDays(baseDate, avgCycle);
  const daysToNext = Math.max(0, differenceInCalendarDays(nextPeriod, today));

  return { dayInCycle, phase, nextPeriod, daysToNext, rolledLastPeriod: baseDate };
}



// ─── Fade wrapper ─────────────────────────────────────────────────────────────
function Fade({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Wellness Progress Ring ───────────────────────────────────────────────────
function CircularProgress({ value, max, label, icon: Icon, colorClass, strokeClass }: { value: number, max: number, label: string, icon: React.ElementType, colorClass: string, strokeClass: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center w-[48px] h-[48px]">
        {/* Background track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r="18" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-sage/30" />
          {/* Progress fill */}
          {value > 0 && (
            <circle
              cx="24" cy="24" r="18"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={strokeClass}
            />
          )}
        </svg>
        <div className={`absolute ${colorClass}`}>
          <Icon size={14} />
        </div>
      </div>
      <span className="text-[10px] text-plum/50 font-medium tracking-wide uppercase">{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function CyclePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cycle, setCycle] = useState<CycleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [todaySleep, setTodaySleep] = useState<string | null>(null);
  const [todayHydration, setTodayHydration] = useState<string | null>(null);
  const [todayActivity, setTodayActivity] = useState<string | null>(null);
  
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalCategory, setLogModalCategory] = useState<string | undefined>(undefined);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [dailyTips, setDailyTips] = useState<any[]>([]);
  const [allTips, setAllTips] = useState<any[]>([]);
  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [{ data: p }, { data: c }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('name, onboarding_completed').eq('id', user.id).maybeSingle(),
        supabase.from('cycle_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('symptom_logs').select('symptom, value').eq('user_id', user.id).eq('log_date', today),
      ]);
      setProfile(p);
      setCycle(c);
      if (logs) {
        setTodayMood(logs.find(l => l.symptom === 'mood')?.value || null);
        setTodaySleep(logs.find(l => l.symptom === 'sleep')?.value || null);
        setTodayHydration(logs.find(l => l.symptom === 'hydration')?.value || null);
        setTodayActivity(logs.find(l => l.symptom === 'activity')?.value || null);
      }
      setLoading(false);
    })();
  }, [user, refreshTrigger]);

  // Derived
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const cycleLen = cycle?.avg_cycle_length ?? 28;
  const periodLen = cycle?.avg_period_length ?? 5;
  const { dayInCycle, phase, nextPeriod, daysToNext, rolledLastPeriod } = useMemo(
    () => calculateCycleMetrics(cycle?.last_period_start ?? null, cycleLen, periodLen),
    [cycle?.last_period_start, cycleLen, periodLen]
  );

  const greeting = `${getGreetingTime()}, ${firstName}.`;
  const insight = getDailyInsight(phase);

  // Period start prompt logic
  const rawLastPeriod = cycle?.last_period_start ? parseISO(cycle.last_period_start) : null;
  const rawExpectedNext = rawLastPeriod ? addDays(rawLastPeriod, cycleLen) : null;
  const daysLate = rawExpectedNext ? differenceInCalendarDays(startOfDay(new Date()), rawExpectedNext) : -1;
  const isPeriodExpected = daysLate >= 0;
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dismissedKey = `dismissed_period_prompt_${todayStr}`;
  const [isPromptDismissed, setIsPromptDismissed] = useState(localStorage.getItem(dismissedKey) === 'true');

  const handleDismissPrompt = () => {
    localStorage.setItem(dismissedKey, 'true');
    setIsPromptDismissed(true);
  };

  const handleYesPeriod = () => {
    setLogModalCategory('flow');
    setIsLogModalOpen(true);
    handleDismissPrompt();
  };

  // Fetch daily tips when phase changes
  useEffect(() => {
    if (!phase) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('wellness_tips')
        .select('*')
        .eq('phase', phase.toLowerCase());
      
      if (data && data.length > 0) {
        // Store all tips for the modal
        setAllTips(data);

        // Deterministically pick one per category for the dashboard card
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const hash = todayStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        
        const categories = ['nutrition', 'mindfulness', 'movement'];
        const picked = categories.map(cat => {
          const catTips = data.filter((t: any) => t.category === cat);
          if (catTips.length === 0) return null;
          return catTips[hash % catTips.length];
        }).filter(Boolean);
        
        setDailyTips(picked);
      }
    })();
  }, [phase]);

  const handleMoodSelect = (mood: string) => {
    setTodayMood(mood);
    showToast(`Mood logged: ${mood}`, 'success');
    setTimeout(() => setIsMoodModalOpen(false), 1200);
  };

  // Determine personalized message based on snapshot
  const getActivityValue = (val: string | null) => {
    if (!val) return 0;
    const v = val.toLowerCase();
    if (v === 'rest') return 0.25;
    if (v === 'light') return 0.5;
    if (v === 'moderate') return 0.75;
    if (v === 'intense') return 1;
    return 1;
  };

  let snapshotMessage = "Log your daily wellness to see personalized insights.";
  if (todaySleep === null) {
    snapshotMessage = "How did you sleep last night? Log your sleep to see insights.";
  } else if (todayHydration === null) {
    snapshotMessage = "Don't forget to log your water intake today.";
  } else if (todayActivity === null) {
    snapshotMessage = "Take a moment to stretch or move today. Log your activity!";
  } else {
    const hours = parseFloat(todaySleep);
    const water = parseFloat(todayHydration);
    if (hours < 6) {
      snapshotMessage = "You're a bit under your usual sleep — try winding down earlier tonight.";
    } else if (water < 4) {
      snapshotMessage = "You're a bit behind on your hydration goals today.";
    } else {
      snapshotMessage = "Great job keeping up with your wellness tracking today!";
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 pt-8">

          {/* ── Greeting & Insight ── */}
          <Fade delay={0} className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-plum leading-snug">{greeting}</h1>
            <p className="text-plum/70 mt-2 text-[15px] leading-relaxed max-w-2xl">{insight}</p>
          </Fade>

          {loading ? (
            /* Skeleton */
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/50 rounded-3xl h-52 animate-pulse border border-sage/15" />
              ))}
            </div>
          ) : (
            <>
              {/* ── Period Expected Banner ── */}
              {isPeriodExpected && !isPromptDismissed && (
                <Fade delay={0.1} className="mb-6">
                  <div className="bg-coral/10 border border-coral/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center text-coral flex-shrink-0">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="text-plum font-serif text-[17px] font-medium">
                          {daysLate === 0 ? "Your period was expected today." : `Your period is now ${daysLate} day${daysLate === 1 ? '' : 's'} late.`}
                        </h3>
                        <p className="text-sm text-plum/70 mt-0.5">Has it started?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button 
                        onClick={handleDismissPrompt}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-plum/70 hover:bg-black/5 transition-colors"
                      >
                        Not yet
                      </button>
                      <button 
                        onClick={handleYesPeriod}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-coral text-white hover:bg-coral-dark transition-colors shadow-sm"
                      >
                        Yes, it started
                      </button>
                    </div>
                  </div>
                </Fade>
              )}

              {/* ── Cycle wheel + stats grid ── */}
              <div className="grid lg:grid-cols-5 gap-6 mb-8">

                {/* Left column — takes 3 cols */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                  {/* Wheel */}
                  <Fade delay={0.12}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6 md:p-8 flex justify-center">
                      <CycleWheel
                        lastPeriodStart={rolledLastPeriod ?? startOfDay(new Date())}
                        avgCycleLength={cycleLen}
                        periodLength={periodLen}
                        currentDateStr={format(new Date(), 'EEEE, do')}
                      />
                    </div>
                  </Fade>

                  {/* ── Quick Action Tabs ── */}
                  <Fade delay={0.15} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Log Symptoms Card */}
                    <button 
                      onClick={() => setIsLogModalOpen(true)}
                      className="bg-coral/5 backdrop-blur-sm rounded-3xl border border-coral/10 shadow-sm p-5 text-left flex flex-col gap-3 hover:bg-coral/10 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-2xl bg-coral/10 flex items-center justify-center transition-transform group-hover:scale-105">
                          <ClipboardPlus size={20} className="text-coral" />
                        </div>
                        <ArrowUpRight size={18} className="text-plum/25 group-hover:text-coral transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[17px] font-semibold text-plum">Log Symptoms</h3>
                        <p className="text-[13px] text-plum/50 mt-1 leading-relaxed pr-4">Track physical changes, energy, or cravings today.</p>
                      </div>
                    </button>

                    {/* Daily Mood Card */}
                    <button
                      onClick={() => setIsMoodModalOpen(true)}
                      className="bg-sage/15 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-5 text-left flex flex-col gap-3 hover:bg-sage/25 transition-all group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-2xl bg-sage/40 flex items-center justify-center transition-transform group-hover:scale-105">
                          {todayMood ? (
                            <span className="text-xl">
                              {[{emoji:'😊',v:'great'},{emoji:'😐',v:'okay'},{emoji:'😢',v:'low'},{emoji:'😠',v:'irritable'},{emoji:'😴',v:'tired'},{emoji:'😣',v:'unwell'}].find(m => m.v === todayMood)?.emoji || '😊'}
                            </span>
                          ) : (
                            <Smile size={20} className="text-plum/70" />
                          )}
                        </div>
                        <ArrowUpRight size={18} className="text-plum/25 group-hover:text-plum transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-serif text-[17px] font-semibold text-plum">Daily Mood</h3>
                        <p className="text-[13px] text-plum/50 mt-1 leading-relaxed pr-4">How are you feeling emotionally this morning?</p>
                      </div>
                    </button>
                  </Fade>
                </div>

                {/* Stats column — takes 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-4">

                  {/* ── Today's Wellness ── */}
                  <Fade delay={0.25}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-5 flex flex-col">
                      <h3 className="font-serif text-plum font-semibold mb-4 text-[15px]">Today's Wellness</h3>
                      
                      <div className="flex items-center justify-around mb-5">
                        <CircularProgress 
                          value={todaySleep ? parseFloat(todaySleep) : 0} 
                          max={8} 
                          label="Sleep" 
                          icon={Moon} 
                          colorClass="text-indigo-500" 
                          strokeClass="text-indigo-400" 
                        />
                        <CircularProgress 
                          value={todayHydration ? parseFloat(todayHydration) : 0} 
                          max={8} 
                          label="Water" 
                          icon={Droplet} 
                          colorClass="text-cyan-500" 
                          strokeClass="text-cyan-400" 
                        />
                        <CircularProgress 
                          value={getActivityValue(todayActivity)} 
                          max={1} 
                          label="Activity" 
                          icon={ActivityIcon} 
                          colorClass="text-sage-700" 
                          strokeClass="text-sage-600" 
                        />
                      </div>
                      
                      <div className="bg-sage/10 rounded-xl p-3 px-4 border border-sage/20">
                        <p className="text-[13px] text-plum/70 leading-relaxed font-medium">
                          {snapshotMessage}
                        </p>
                      </div>
                    </div>
                  </Fade>

                  {/* Next period card */}
                  <Fade delay={0.18}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-5 flex flex-col gap-3 hover:bg-white/95 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={20} className="text-coral" />
                        </div>
                        <div>
                          <p className="text-xs text-plum/45">Next period</p>
                          <p className="font-serif text-lg text-plum font-medium">
                            {nextPeriod ? format(nextPeriod, 'd MMM') : '—'}
                          </p>
                        </div>
                      </div>
                      <Link to="/insights" className="text-[11px] text-plum/40 hover:text-coral flex items-center gap-1 font-medium mt-1 w-fit transition-colors">
                        View trends <ArrowRight size={10} />
                      </Link>
                    </div>
                  </Fade>

                  {/* Days remaining */}
                  <Fade delay={0.22}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-5 flex flex-col gap-3 hover:bg-white/95 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-lavender/50 flex items-center justify-center flex-shrink-0">
                          <Timer size={20} className="text-plum/60" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-plum/45">Days remaining</p>
                          <p className="font-serif text-lg text-plum font-medium">
                            {daysToNext !== null ? `${daysToNext} days` : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-sage/30 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-plum h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${dayInCycle && cycleLen ? Math.min(100, (dayInCycle / cycleLen) * 100) : 0}%` }} 
                        />
                      </div>
                      <Link to="/insights" className="text-[11px] text-plum/40 hover:text-coral flex items-center gap-1 font-medium mt-1 w-fit transition-colors">
                        View trends <ArrowRight size={10} />
                      </Link>
                    </div>
                  </Fade>



                  {/* AI companion teaser */}
                  <Fade delay={0.3}>
                    <Link to="/chat" className="block">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-br from-plum to-plum/85 rounded-3xl p-5 shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={14} className="text-coral" />
                          </div>
                          <p className="text-white/50 text-xs">AI Companion</p>
                        </div>
                        <p className="text-white font-serif text-sm leading-snug mb-3">
                          &ldquo;How are you feeling in your {phase?.toLowerCase() ?? 'current'} phase today?&rdquo;
                        </p>
                        <div className="flex items-center gap-1.5 text-coral text-xs font-medium">
                          <MessageCircle size={13} />
                          Start chatting
                          <ArrowRight size={12} />
                        </div>
                      </motion.div>
                    </Link>
                  </Fade>

                  {/* Daily Insights Teaser */}
                  {dailyTips.length > 0 && (
                    <Fade delay={0.35}>
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 px-5 border-b border-sage/10 bg-cream/30">
                          <h3 className="font-serif text-plum font-semibold">Daily Insights</h3>
                          <button
                            onClick={() => setIsWellnessModalOpen(true)}
                            className="text-xs text-coral font-medium hover:text-coral/80 transition-colors flex items-center gap-1"
                          >
                            View All <ArrowRight size={12} />
                          </button>
                        </div>
                        <div className="p-2 space-y-1">
                          {dailyTips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-cream/40 transition-colors">
                              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-sage/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {tip.category === 'nutrition' && <Utensils size={14} className="text-coral" />}
                                {tip.category === 'mindfulness' && <Brain size={14} className="text-plum" />}
                                {tip.category === 'movement' && <ActivityIcon size={14} className="text-sage-800" />}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-plum">{tip.title}</h4>
                                <p className="text-[11px] text-plum/50 mt-0.5 leading-relaxed">{tip.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Fade>
                  )}

                </div>
              </div>
            </>
          )}

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => {
          setIsLogModalOpen(false);
          setLogModalCategory(undefined);
          setRefreshTrigger(prev => prev + 1);
        }}
        initialCategory={logModalCategory}
      />

      {/* ── Wellness All Tips Modal ── */}
      {isWellnessModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-plum/25 backdrop-blur-sm"
          onClick={() => setIsWellnessModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] bg-cream rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20 bg-white/60 flex-shrink-0">
              <div>
                <h2 className="font-serif text-xl text-plum">Phase Insights</h2>
                <p className="text-xs text-plum/45 mt-0.5 capitalize">{phase?.toLowerCase()} phase · all tips</p>
              </div>
              <button
                onClick={() => setIsWellnessModalOpen(false)}
                className="w-9 h-9 rounded-full bg-sage/20 hover:bg-sage/40 flex items-center justify-center text-plum/60 hover:text-plum transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 p-5 space-y-6">
              {(['nutrition', 'mindfulness', 'movement'] as const).map((cat) => {
                const catTips = allTips.filter(t => t.category === cat);
                if (catTips.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-sm border border-sage/20 flex items-center justify-center">
                        {cat === 'nutrition' && <Utensils size={13} className="text-coral" />}
                        {cat === 'mindfulness' && <Brain size={13} className="text-plum" />}
                        {cat === 'movement' && <ActivityIcon size={13} className="text-teal-600" />}
                      </div>
                      <h3 className="font-serif text-base text-plum capitalize">{cat}</h3>
                    </div>
                    <div className="space-y-2">
                      {catTips.map((tip: any) => (
                        <div key={tip.id} className="bg-white/80 rounded-2xl border border-sage/15 p-4">
                          <h4 className="text-sm font-semibold text-plum mb-1">{tip.title}</h4>
                          <p className="text-[13px] text-plum/60 leading-relaxed">{tip.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Daily Mood Check-In Modal */}
      {isMoodModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-plum/20 backdrop-blur-sm">
          <div className="w-full max-w-lg relative bg-cream rounded-3xl overflow-hidden shadow-2xl">
            <button 
              onClick={() => setIsMoodModalOpen(false)} 
              className="absolute top-4 right-4 text-plum/50 hover:text-plum hover:bg-sage/20 p-2 rounded-full transition-colors z-50"
            >
              <X size={20} />
            </button>
            <div className="p-2">
              <DailyCheckIn onMoodSelect={handleMoodSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
