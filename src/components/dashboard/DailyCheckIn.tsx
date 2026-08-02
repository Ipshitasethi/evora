import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MoodOption {
  emoji: string;
  label: string;
  value: string;
}

interface DailyCheckInProps {
  onMoodSelect?: (mood: string) => void;
}

const MOODS: MoodOption[] = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😢', label: 'Low', value: 'low' },
  { emoji: '😠', label: 'Irritable', value: 'irritable' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
  { emoji: '😣', label: 'Unwell', value: 'unwell' },
];

export function DailyCheckIn({ onMoodSelect }: DailyCheckInProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTodayMood = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('id, value')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .eq('symptom', 'mood')
        .maybeSingle();

      if (!error && data) {
        setExistingLogId(data.id);
        if (data.value) setSelected(data.value);
      }
      setIsFetching(false);
    };

    fetchTodayMood();
  }, [user]);

  const handleSelect = async (value: string) => {
    setSelected(value);
    if (onMoodSelect) onMoodSelect(value);

    if (!user) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');

    if (existingLogId) {
      // Update existing entry
      await supabase
        .from('symptom_logs')
        .update({ value: value })
        .eq('id', existingLogId);
    } else {
      // Insert new entry
      const { data, error } = await supabase
        .from('symptom_logs')
        .insert({
          user_id: user.id,
          log_date: today,
          symptom: 'mood',
          value: value,
        })
        .select()
        .single();
        
      if (!error && data) {
        setExistingLogId(data.id);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' as const }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6"
    >
      <p className="text-xs uppercase tracking-wide text-plum/45 mb-1">Daily check-in</p>
      <h3 className="font-serif text-lg text-plum mb-5">How are you feeling today?</h3>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {MOODS.map((m) => {
          const isActive = selected === m.value;
          return (
            <motion.button
              key={m.value}
              onClick={() => handleSelect(m.value)}
              disabled={isFetching}
              whileHover={!isFetching ? { scale: 1.06 } : undefined}
              whileTap={!isFetching ? { scale: 0.95 } : undefined}
              className={[
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all duration-200 relative',
                isActive
                  ? 'bg-coral/10 ring-2 ring-coral/40 shadow-md shadow-coral/10'
                  : 'hover:bg-blush/30',
                isFetching ? 'opacity-70 cursor-default' : ''
              ].join(' ')}
            >
              {/* Glow ring behind selected emoji */}
              {isActive && (
                <motion.div
                  layoutId="mood-glow"
                  className="absolute inset-0 rounded-2xl bg-coral/5"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}

              <motion.span
                className="text-2xl relative z-10"
                animate={isActive ? { scale: [1, 1.25, 1.1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                {m.emoji}
              </motion.span>
              <span
                className={`text-xs relative z-10 transition-colors ${
                  isActive ? 'text-coral font-semibold' : 'text-plum/45'
                }`}
              >
                {m.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Confirmation whisper */}
      {selected && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-plum/40 text-center mt-4"
        >
          Noted! You're feeling{' '}
          <span className="text-coral font-medium">{MOODS.find((m) => m.value === selected)?.label.toLowerCase()}</span>{' '}
          today.
        </motion.p>
      )}
    </motion.div>
  );
}
