import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CalendarDays, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { EvoraLogo } from '../components/ui/EvoraLogo';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OnboardingData {
  age: string;
  lastPeriodStart: string;
  avgCycleLength: string;
  avgPeriodLength: string;
  isEstimated: boolean;
  goals: string[];
}

export interface OnboardingPageProps {
  isEmbedded?: boolean;
  onComplete?: () => void;
}

const GOALS = [
  { id: 'track_cycle', label: 'Track my cycle' },
  { id: 'mood_swings', label: 'Understand mood swings' },
  { id: 'symptom_relief', label: 'Get symptom relief tips' },
  { id: 'plan_ahead', label: 'Plan ahead' },
  { id: 'manage_pcos', label: 'Manage PCOS or irregular cycles' },
  { id: 'improve_sleep', label: 'Improve my sleep' },
  { id: 'eat_better', label: 'Eat better during my cycle' },
  { id: 'prepare_pregnancy', label: 'Prepare for pregnancy' },
  { id: 'track_doctor', label: 'Track symptoms for my doctor' },
  { id: 'just_curious', label: 'Just curious' },
];

const TOTAL_STEPS = 6; // including confirmation screen

// ─── Slide variants ──────────────────────────────────────────────────────────
const makeVariants = (direction: 1 | -1) => ({
  enter: { x: direction * 56, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: direction * -56, opacity: 0 },
});

const transition = { duration: 0.35, ease: 'easeInOut' as const };

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const pct = ((step) / (TOTAL_STEPS - 1)) * 100;
  return (
    <div className="w-full h-1 bg-sage/30 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-coral rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
      />
    </div>
  );
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────
function FieldWrapper({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div className="w-full">
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-sm text-coral/80 flex items-center gap-1.5"
          >
            <Info size={13} className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Input styles ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-5 py-4 rounded-2xl border border-sage/40 bg-cream/70 text-plum text-lg ' +
  'placeholder:text-plum/30 focus:outline-none focus:ring-2 focus:ring-coral/40 ' +
  'focus:border-coral/60 transition-all duration-200';

// ─── Main component ───────────────────────────────────────────────────────────
export function OnboardingPage({ isEmbedded = false, onComplete }: OnboardingPageProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});

  const [data, setData] = useState<OnboardingData>({
    age: '',
    lastPeriodStart: '',
    avgCycleLength: '',
    avgPeriodLength: '',
    isEstimated: false,
    goals: [],
  });

  // ── Validation per step ────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const errs: typeof errors = {};

    if (s === 0) {
      const age = parseInt(data.age);
      if (!data.age || isNaN(age) || age < 10 || age > 80) {
        errs.age = 'Please enter a valid age between 10 and 80.';
      }
    }
    if (s === 1) {
      if (!data.lastPeriodStart && !data.isEstimated) {
        errs.lastPeriodStart = 'Please pick a date, or skip if unsure.';
      } else if (data.lastPeriodStart && new Date(data.lastPeriodStart) > new Date()) {
        errs.lastPeriodStart = 'That date is in the future — pick a past date.';
      }
    }
    if (s === 2) {
      if (!data.avgCycleLength && !data.isEstimated) {
        errs.avgCycleLength = 'Please enter a cycle length, or skip if unsure.';
      } else if (data.avgCycleLength) {
        const len = parseInt(data.avgCycleLength);
        if (isNaN(len) || len < 15 || len > 60) {
          errs.avgCycleLength = 'Most cycles are between 15–60 days. Try a number in that range.';
        }
      }
    }
    if (s === 3) {
      if (!data.avgPeriodLength && !data.isEstimated) {
        errs.avgPeriodLength = 'Please enter a period length, or skip if unsure.';
      } else if (data.avgPeriodLength) {
        const len = parseInt(data.avgPeriodLength);
        if (isNaN(len) || len < 1 || len > 14) {
          errs.avgPeriodLength = 'Most periods are between 1–14 days. Try a number in that range.';
        }
      }
    }
    if (s === 4) {
      if (data.goals.length === 0) {
        errs.goals = 'Pick at least one — even "Just curious" works!';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canAdvance = (): boolean => {
    if (step === 0) return !!data.age && parseInt(data.age) >= 10;
    if (step === 1) return !!data.lastPeriodStart || data.isEstimated;
    if (step === 2) return !!data.avgCycleLength || data.isEstimated;
    if (step === 3) return !!data.avgPeriodLength || data.isEstimated;
    if (step === 4) return data.goals.length > 0;
    return true;
  };

  const next = () => {
    if (!validate(step)) return;
    setDirection(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    setErrors({});
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSkip = (field: keyof OnboardingData) => {
    setData((d) => ({ ...d, [field]: '', isEstimated: true }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setDirection(1);
    setStep((s) => s + 1);
  };

  const toggleGoal = (id: string) => {
    setData((d) => ({
      ...d,
      goals: d.goals.includes(id) ? d.goals.filter((g) => g !== id) : [...d.goals, id],
    }));
    setErrors((e) => ({ ...e, goals: undefined }));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);

    // Upsert cycle settings
    await supabase.from('cycle_settings').upsert({
      user_id: user.id,
      last_period_start: data.lastPeriodStart || null,
      avg_cycle_length: data.avgCycleLength ? parseInt(data.avgCycleLength) : 28,
      avg_period_length: data.avgPeriodLength ? parseInt(data.avgPeriodLength) : 5,
      is_estimated: data.isEstimated,
      goals: data.goals,
      updated_at: new Date().toISOString(),
    });

    // Recover name from user metadata just in case sign-up upsert failed due to RLS
    const nameToSave = user.user_metadata?.name;

    // Update profile age, name, and onboarding completion
    const { error: profileErr } = await supabase.from('profiles').upsert({ 
      id: user.id, 
      onboarding_completed: true, 
      age: parseInt(data.age),
      ...(nameToSave ? { name: nameToSave } : {})
    });
    
    if (profileErr) {
      console.error("Failed to update profile during onboarding:", profileErr);
    }
    
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  };

  // ── Step content ────────────────────────────────────────────────────────────
  const steps: React.ReactNode[] = [
    /* 0 — Age */
    <div key="age" className="space-y-6">
      <StepHeader
        emoji="🌸"
        title="How old are you?"
        sub="This helps us personalise your insights and cycle predictions."
      />
      <FieldWrapper error={errors.age}>
        <input
          type="number"
          inputMode="numeric"
          className={inputCls}
          placeholder="e.g. 26"
          value={data.age}
          min={10}
          max={80}
          onChange={(e) => {
            setData((d) => ({ ...d, age: e.target.value }));
            setErrors((e2) => ({ ...e2, age: undefined }));
          }}
          autoFocus
        />
      </FieldWrapper>
    </div>,

    /* 1 — Last period */
    <div key="period" className="space-y-6">
      <StepHeader
        emoji="📅"
        title="When did your last period start?"
        sub="An approximate date is totally fine — Evora will help you refine it over time."
      />
      <FieldWrapper error={errors.lastPeriodStart}>
        <div className="relative">
          <input
            type="date"
            className={inputCls + ' pr-12'}
            max={new Date().toISOString().split('T')[0]}
            value={data.lastPeriodStart}
            onChange={(e) => {
              setData((d) => ({ ...d, lastPeriodStart: e.target.value }));
              setErrors((e2) => ({ ...e2, lastPeriodStart: undefined }));
            }}
          />
          <CalendarDays
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-plum/35 pointer-events-none"
          />
        </div>
        <div className="mt-3 text-center">
          <button 
            type="button" 
            onClick={() => handleSkip('lastPeriodStart')}
            className="text-sm text-plum/50 hover:text-plum/80 underline decoration-plum/30 underline-offset-2 transition-colors"
          >
            I'm not sure
          </button>
        </div>
      </FieldWrapper>
    </div>,

    /* 2 — Cycle length */
    <div key="cycle" className="space-y-6">
      <StepHeader
        emoji="🔄"
        title="How long is your average cycle?"
        sub={
          <span>
            Count from the first day of one period to the first day of the next.
            <span className="block mt-1 text-plum/45 italic">
              Don&rsquo;t know exactly? You can update this later.
            </span>
          </span>
        }
      />
      <FieldWrapper error={errors.avgCycleLength}>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            className={inputCls + ' pr-16'}
            placeholder="28"
            min={15}
            max={60}
            value={data.avgCycleLength}
            onChange={(e) => {
              setData((d) => ({ ...d, avgCycleLength: e.target.value }));
              setErrors((e2) => ({ ...e2, avgCycleLength: undefined }));
            }}
            autoFocus
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-plum/40 text-sm font-medium pointer-events-none">
            days
          </span>
        </div>
        <div className="mt-3 text-center">
          <button 
            type="button" 
            onClick={() => handleSkip('avgCycleLength')}
            className="text-sm text-plum/50 hover:text-plum/80 underline decoration-plum/30 underline-offset-2 transition-colors"
          >
            I'm not sure
          </button>
        </div>
      </FieldWrapper>
    </div>,

    /* 3 — Period length */
    <div key="period_length" className="space-y-6">
      <StepHeader
        emoji="🩸"
        title="How many days does your period usually last?"
        sub={
          <span>
            On average, how many days do you bleed?
            <span className="block mt-1 text-plum/45 italic">
              Don&rsquo;t know exactly? You can update this later.
            </span>
          </span>
        }
      />
      <FieldWrapper error={errors.avgPeriodLength}>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            className={inputCls + ' pr-16'}
            placeholder="5"
            min={1}
            max={14}
            value={data.avgPeriodLength}
            onChange={(e) => {
              setData((d) => ({ ...d, avgPeriodLength: e.target.value }));
              setErrors((e2) => ({ ...e2, avgPeriodLength: undefined }));
            }}
            autoFocus
          />
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-plum/40 text-sm font-medium pointer-events-none">
            days
          </span>
        </div>
        <div className="mt-3 text-center">
          <button 
            type="button" 
            onClick={() => handleSkip('avgPeriodLength')}
            className="text-sm text-plum/50 hover:text-plum/80 underline decoration-plum/30 underline-offset-2 transition-colors"
          >
            I'm not sure
          </button>
        </div>
      </FieldWrapper>
    </div>,

    /* 4 — Goals */
    <div key="goals" className="space-y-6">
      <StepHeader
        emoji="💫"
        title="What brings you to Evora?"
        sub="Select everything that resonates — you can change this anytime."
      />
      <FieldWrapper error={errors.goals}>
        <div className="flex flex-wrap gap-3">
          {GOALS.map((g) => {
            const selected = data.goals.includes(g.id);
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={[
                  'px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200',
                  selected
                    ? 'bg-coral text-white border-coral shadow-md shadow-coral/20'
                    : 'bg-white text-plum border-sage/40 hover:border-coral/50 hover:bg-blush/20',
                ].join(' ')}
              >
                {selected && <Check size={13} className="inline mr-1.5 -mt-px" />}
                {g.label}
              </motion.button>
            );
          })}
        </div>
      </FieldWrapper>
    </div>,

    /* 5 — Done */
    <div key="done" className="space-y-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="w-20 h-20 bg-coral/15 rounded-full flex items-center justify-center mx-auto text-4xl"
      >
        🌺
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="space-y-3"
      >
        <h2 className="font-serif text-3xl text-plum">You&rsquo;re all set!</h2>
        <p className="text-plum/60 leading-relaxed max-w-sm mx-auto">
          Welcome to Evora. Your insights are ready — and your data stays private,
          always. Let&rsquo;s go explore together.
        </p>
      </motion.div>

    </div>,
  ];

  const isFinalStep = step === TOTAL_STEPS - 1;

  return (
    <div className={`${isEmbedded ? 'w-full py-2' : 'min-h-screen bg-cream flex flex-col items-center justify-start pt-10 pb-16 px-5'} relative overflow-hidden`}>
      {/* Ambient blobs (only if not embedded) */}
      {!isEmbedded && (
        <>
          <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-blush/40 blur-3xl -z-10" />
          <div className="absolute -bottom-24 -right-24 w-[380px] h-[380px] rounded-full bg-lavender/35 blur-3xl -z-10" />
        </>
      )}

      <div className="w-full max-w-lg mx-auto">
        {/* Logo (only if not embedded) */}
        {!isEmbedded && (
          <div className="flex items-center gap-2 mb-10">
            <EvoraLogo size={32} />
          </div>
        )}

        <div className="mb-2">
          <ProgressBar step={step} />
        </div>
        <p className="text-right text-xs text-plum/35 mb-8">
          Step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
        </p>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-sage/20 p-8 md:p-10 min-h-[340px] relative overflow-hidden flex flex-col justify-between gap-8">
          {/* Step content with slide animation */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={makeVariants(direction)}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="w-full"
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav buttons */}
          <div className={`flex items-center ${step === 0 ? 'justify-end' : 'justify-between'} pt-4 border-t border-sage/15`}>
            {step > 0 && (
              <motion.button
                whileHover={{ x: -2 }}
                onClick={back}
                disabled={isFinalStep}
                className="flex items-center gap-2 text-plum/50 hover:text-plum text-sm font-medium transition-colors disabled:opacity-0"
              >
                <ArrowLeft size={15} /> Back
              </motion.button>
            )}

            {isFinalStep ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={finish}
                disabled={saving}
                className="flex items-center gap-2 bg-coral text-white px-7 py-3 rounded-2xl font-medium text-sm shadow-lg shadow-coral/20 hover:bg-coral/90 transition-all disabled:opacity-70"
              >
                {saving ? 'Saving…' : 'Go to my dashboard'}
                {!saving && <ArrowRight size={15} />}
              </motion.button>
            ) : (
              <motion.button
                whileHover={canAdvance() ? { scale: 1.02 } : {}}
                whileTap={canAdvance() ? { scale: 0.98 } : {}}
                onClick={next}
                disabled={!canAdvance()}
                className={[
                  'flex items-center gap-2 px-7 py-3 rounded-2xl font-medium text-sm transition-all duration-200',
                  canAdvance()
                    ? 'bg-coral text-white shadow-lg shadow-coral/20 hover:bg-coral/90'
                    : 'bg-sage/25 text-plum/35 cursor-not-allowed',
                ].join(' ')}
              >
                Continue <ArrowRight size={15} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step header helper ───────────────────────────────────────────────────────
function StepHeader({
  emoji,
  title,
  sub,
}: {
  emoji: string;
  title: string;
  sub: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="text-3xl">{emoji}</span>
      <h2 className="font-serif text-2xl text-plum leading-snug">{title}</h2>
      <p className="text-sm text-plum/55 leading-relaxed">{sub}</p>
    </div>
  );
}
