import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Droplets,
  Moon,
  Sun,
  Wind,
  Heart,
  MessageCircle,
  Bell,
  Settings,
  ChevronRight,
  Zap,
  Smile,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { differenceInDays, addDays, format, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CycleSettings {
  last_period_start: string | null;
  avg_cycle_length: number | null;
  avg_period_length: number | null;
  goals: string[] | null;
}

interface Profile {
  name: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCyclePhase(dayOfCycle: number, periodLen: number, cycleLen: number) {
  if (dayOfCycle <= periodLen) return { phase: 'Menstrual', emoji: '🌑', color: 'text-coral', bg: 'bg-coral/10' };
  if (dayOfCycle <= 13) return { phase: 'Follicular', emoji: '🌒', color: 'text-plum', bg: 'bg-lavender/40' };
  if (dayOfCycle <= 16) return { phase: 'Ovulation', emoji: '🌕', color: 'text-amber-600', bg: 'bg-amber-50' };
  if (dayOfCycle <= cycleLen) return { phase: 'Luteal', emoji: '🌘', color: 'text-plum/70', bg: 'bg-sage/30' };
  return { phase: 'Menstrual', emoji: '🌑', color: 'text-coral', bg: 'bg-coral/10' };
}

const PHASE_TIPS: Record<string, { energy: string; mood: string; tip: string }> = {
  Menstrual: {
    energy: 'Rest & restore',
    mood: 'Introspective',
    tip: 'Your body is working hard. Honour it with warmth, gentle movement, and iron-rich foods like lentils and leafy greens.',
  },
  Follicular: {
    energy: 'Rising energy',
    mood: 'Optimistic',
    tip: 'Oestrogen is climbing — great time to start new projects, try new workouts, and plan social events.',
  },
  Ovulation: {
    energy: 'Peak energy',
    mood: 'Confident & social',
    tip: 'You\'re at your most radiant. Tackle your biggest tasks, speak up, and enjoy the natural glow.',
  },
  Luteal: {
    energy: 'Winding down',
    mood: 'Reflective',
    tip: 'Progesterone rises — prioritise sleep, gentle yoga, and complex carbs to support serotonin.',
  },
};

const QUICK_LOGS = [
  { icon: <Droplets size={18} className="text-coral" />, label: 'Log flow', bg: 'bg-coral/10' },
  { icon: <Smile size={18} className="text-plum" />, label: 'Log mood', bg: 'bg-lavender/40' },
  { icon: <Zap size={18} className="text-amber-500" />, label: 'Log energy', bg: 'bg-amber-50' },
  { icon: <Heart size={18} className="text-rose-400" />, label: 'Log symptom', bg: 'bg-rose-50' },
];

const UPCOMING: { day: string; event: string; color: string }[] = [
  { day: 'Tomorrow', event: 'Ovulation window opens', color: 'bg-amber-100 text-amber-700' },
  { day: 'In 4 days', event: 'Peak energy phase', color: 'bg-lavender/50 text-plum' },
  { day: 'In 9 days', event: 'Luteal phase begins', color: 'bg-sage/40 text-plum/70' },
];

// ─── Cycle Ring SVG ───────────────────────────────────────────────────────────
function CycleRing({ day, total }: { day: number; total: number }) {
  const pct = Math.min(day / total, 1);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#C6D8C8" strokeWidth="8" />
        <motion.circle
          cx="64" cy="64" r={r} fill="none"
          stroke="#9B4938" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl text-plum font-semibold leading-none">{day}</span>
        <span className="text-xs text-plum/45 mt-0.5">day {day > total ? total : day}</span>
      </div>
    </div>
  );
}

// ─── Card animation wrapper ───────────────────────────────────────────────────
function FadeCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPlaceholder() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cycle, setCycle] = useState<CycleSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        supabase.from('cycle_settings').select('*').eq('user_id', user.id).single(),
      ]);
      setProfile(p);
      setCycle(c);
      setLoading(false);
    })();
  }, [user]);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Cycle calculations
  const dayOfCycle = cycle?.last_period_start
    ? differenceInDays(new Date(), parseISO(cycle.last_period_start)) + 1
    : null;
  const cycleLen = cycle?.avg_cycle_length ?? 28;
  const periodLen = cycle?.avg_period_length ?? 5;
  const phaseInfo = dayOfCycle ? getCyclePhase(dayOfCycle, periodLen, cycleLen) : null;
  const phaseTips = phaseInfo ? PHASE_TIPS[phaseInfo.phase] : null;
  const nextPeriod = cycle?.last_period_start
    ? addDays(parseISO(cycle.last_period_start), cycleLen)
    : null;
  const daysToNext = nextPeriod ? differenceInDays(nextPeriod, new Date()) : null;

  return (
    <div className="min-h-screen bg-cream text-plum font-sans">
      {/* Ambient blobs */}
      <div className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blush/30 blur-3xl -z-10 pointer-events-none" />
      <div className="fixed -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-lavender/25 blur-3xl -z-10 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-5 md:px-10 pb-20 pt-4">
        {/* ── Greeting ── */}
        <FadeCard delay={0.05} className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-plum/45 mb-1">
                {format(new Date(), 'EEEE, d MMMM')}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-plum">
                {greeting}, <em className="not-italic text-coral">{firstName}</em> 🌸
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-white border border-sage/30 flex items-center justify-center text-plum/50 hover:text-coral transition-colors shadow-sm">
                <Bell size={16} />
              </button>
              <Link to="/settings">
                <button className="w-9 h-9 rounded-full bg-white border border-sage/30 flex items-center justify-center text-plum/50 hover:text-coral transition-colors shadow-sm">
                  <Settings size={16} />
                </button>
              </Link>
            </div>
          </div>
        </FadeCard>

        {loading ? (
          /* Loading skeleton */
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/60 rounded-3xl h-48 animate-pulse border border-sage/15" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Top row ── */}
            <div className="grid md:grid-cols-3 gap-5 mb-5">

              {/* Cycle status card */}
              <FadeCard delay={0.1} className="md:col-span-1">
                <div className={`rounded-3xl p-6 border border-sage/20 shadow-sm h-full flex flex-col items-center text-center gap-4 ${phaseInfo?.bg ?? 'bg-white'}`}>
                  <CycleRing day={dayOfCycle ?? 1} total={cycleLen} />
                  {phaseInfo ? (
                    <>
                      <div>
                        <p className="text-xs text-plum/45 mb-1 uppercase tracking-wide">Current phase</p>
                        <p className={`font-serif text-xl font-semibold ${phaseInfo.color}`}>
                          {phaseInfo.emoji} {phaseInfo.phase}
                        </p>
                      </div>
                      {daysToNext !== null && daysToNext > 0 && (
                        <p className="text-xs text-plum/50 bg-white/60 rounded-full px-3 py-1">
                          Next period in <span className="font-semibold text-plum">{daysToNext} days</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-serif text-lg text-plum">Set up your cycle</p>
                      <Link to="/onboarding">
                        <Button size="sm" variant="primary">Start onboarding</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </FadeCard>

              {/* Phase insight card */}
              <FadeCard delay={0.15} className="md:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm h-full flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-plum/45 uppercase tracking-wide">Today&rsquo;s insight</p>
                    <span className="text-xs text-coral font-medium">{phaseInfo?.phase ?? 'Unknown'} phase</span>
                  </div>

                  {phaseTips ? (
                    <>
                      <div className="flex gap-4">
                        <div className="flex-1 bg-cream rounded-2xl px-4 py-3 text-center">
                          <Sun size={16} className="text-amber-400 mx-auto mb-1" />
                          <p className="text-xs text-plum/50">Energy</p>
                          <p className="text-sm font-medium text-plum mt-0.5">{phaseTips.energy}</p>
                        </div>
                        <div className="flex-1 bg-cream rounded-2xl px-4 py-3 text-center">
                          <Moon size={16} className="text-plum/60 mx-auto mb-1" />
                          <p className="text-xs text-plum/50">Mood</p>
                          <p className="text-sm font-medium text-plum mt-0.5">{phaseTips.mood}</p>
                        </div>
                        <div className="flex-1 bg-cream rounded-2xl px-4 py-3 text-center">
                          <Wind size={16} className="text-sage mx-auto mb-1" />
                          <p className="text-xs text-plum/50">Focus</p>
                          <p className="text-sm font-medium text-plum mt-0.5">Self-care</p>
                        </div>
                      </div>
                      <p className="text-sm text-plum/60 leading-relaxed border-t border-sage/20 pt-4">
                        {phaseTips.tip}
                      </p>
                    </>
                  ) : (
                    <p className="text-plum/50 text-sm">Complete your onboarding to see personalised insights.</p>
                  )}
                </div>
              </FadeCard>
            </div>

            {/* ── Middle row ── */}
            <div className="grid md:grid-cols-3 gap-5 mb-5">

              {/* Quick log */}
              <FadeCard delay={0.2} className="md:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm h-full">
                  <p className="text-xs text-plum/45 uppercase tracking-wide mb-4">Quick log</p>
                  <div className="grid grid-cols-2 gap-3">
                    {QUICK_LOGS.map((q, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className={`${q.bg} rounded-2xl p-3 flex flex-col items-center gap-2 text-xs font-medium text-plum/70 hover:shadow-sm transition-all`}
                      >
                        {q.icon}
                        {q.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </FadeCard>

              {/* AI companion teaser */}
              <FadeCard delay={0.22} className="md:col-span-2">
                <div className="bg-gradient-to-br from-plum to-plum/80 rounded-3xl p-6 border border-plum/20 shadow-sm h-full flex flex-col justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} className="text-coral" />
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">Evora AI Companion</p>
                      <p className="text-white font-serif text-lg leading-snug">
                        You&rsquo;re in your {phaseInfo?.phase ?? 'cycle'} phase —
                        want to talk through how you&rsquo;re feeling today?
                      </p>
                    </div>
                  </div>

                  {/* Mock chat bubble */}
                  <div className="bg-white/10 rounded-2xl p-4 text-white/70 text-sm italic leading-relaxed">
                    "It's completely normal to feel more inward and reflective right now. Your body is doing something remarkable…"
                  </div>

                  <Link to="/chat">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 bg-coral text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-coral/90 transition-colors w-fit"
                    >
                      <MessageCircle size={15} />
                      Open AI Companion
                    </motion.button>
                  </Link>
                </div>
              </FadeCard>
            </div>

            {/* ── Bottom row ── */}
            <div className="grid md:grid-cols-3 gap-5">

              {/* Upcoming */}
              <FadeCard delay={0.28} className="md:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm">
                  <p className="text-xs text-plum/45 uppercase tracking-wide mb-4">Coming up</p>
                  <div className="space-y-3">
                    {UPCOMING.map((u, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${u.color}`}>{u.day}</span>
                        <span className="text-sm text-plum/70 flex-1">{u.event}</span>
                        <ChevronRight size={14} className="text-plum/25" />
                      </div>
                    ))}
                  </div>
                </div>
              </FadeCard>

              {/* Streak / well-being */}
              <FadeCard delay={0.3} className="md:col-span-1">
                <div className="bg-blush/30 rounded-3xl p-6 border border-sage/20 shadow-sm h-full flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm text-2xl">
                    🔥
                  </div>
                  <div>
                    <p className="font-serif text-3xl text-plum font-semibold">1</p>
                    <p className="text-xs text-plum/50 mt-0.5">day streak</p>
                  </div>
                  <p className="text-xs text-plum/50 leading-relaxed">
                    Keep logging daily to build your health picture.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="text-xs font-medium text-coral hover:underline"
                  >
                    Log today →
                  </motion.button>
                </div>
              </FadeCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
