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

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cycle, setCycle] = useState<CycleSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayMood, setTodayMood] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [{ data: p }, { data: c }, { data: m }] = await Promise.all([
        supabase.from('profiles').select('name, onboarding_completed').eq('id', user.id).maybeSingle(),
        supabase.from('cycle_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('symptom_logs').select('value').eq('user_id', user.id).eq('log_date', today).eq('symptom', 'mood').maybeSingle(),
      ]);
      setProfile(p);
      setCycle(c);
      if (m) setTodayMood(m.value);
      setLoading(false);
    })();
  }, [user]);

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

  const handleMoodSelect = (mood: string) => {
    setTodayMood(mood);
    showToast(`Mood logged: ${mood}`, 'success');
    setTimeout(() => setIsMoodModalOpen(false), 1200);
  };

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
                      <Link to="/analysis" className="text-[11px] text-plum/40 hover:text-coral flex items-center gap-1 font-medium mt-1 w-fit transition-colors">
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
                      <Link to="/analysis" className="text-[11px] text-plum/40 hover:text-coral flex items-center gap-1 font-medium mt-1 w-fit transition-colors">
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
                </div>
              </div>
            </>
          )}

      <LogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />

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
