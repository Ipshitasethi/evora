import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Plus, X, Clock, Calendar, Repeat, Activity } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';

interface Reminder {
  id: string;
  user_id: string;
  type: string;
  custom_type_name: string | null;
  reminder_kind: string;
  days_offset: number | null;
  interval_minutes: number | null;
  time_of_day: string | null;
  specific_date: string | null;
  is_enabled: boolean;
  created_at: string;
}

const PRESET_TYPES = ['Period', 'Water', 'Sleep', 'Medication', 'Custom'];
const INTERVAL_OPTIONS = [
  { label: '30 mins', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '8 hours', value: 480 },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function formatReminderText(r: Reminder): string {
  switch (r.reminder_kind) {
    case 'relative': {
      if (r.days_offset === 0) return 'On the day of period';
      if (r.days_offset !== null && r.days_offset < 0) return `${Math.abs(r.days_offset)} days before period`;
      return `${r.days_offset} days after period`;
    }
    case 'repeating': {
      const min = r.interval_minutes;
      if (!min) return 'Repeating';
      if (min < 60) return `Every ${min} minutes`;
      const hrs = min / 60;
      return `Every ${hrs} hour${hrs !== 1 ? 's' : ''}`;
    }
    case 'fixed_time': {
      if (!r.time_of_day) return 'At a specific time';
      const [h, m] = r.time_of_day.split(':');
      const d = new Date();
      d.setHours(parseInt(h, 10), parseInt(m, 10));
      return `Daily at ${format(d, 'h:mm a')}`;
    }
    case 'specific_date': {
      if (!r.specific_date) return 'On a specific date';
      return `On ${format(parseISO(r.specific_date), 'MMM d, yyyy')}`;
    }
    default:
      return 'Custom timing';
  }
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [newType, setNewType] = useState('Period');
  const [newCustomType, setNewCustomType] = useState('');
  const [newKind, setNewKind] = useState('relative'); // relative, repeating, fixed_time, specific_date
  
  // Specific Kind states
  const [newDaysOffset, setNewDaysOffset] = useState('3');
  const [newOffsetDirection, setNewOffsetDirection] = useState('before'); // before, after, on_day
  const [newInterval, setNewInterval] = useState('60');
  const [newTime, setNewTime] = useState('09:00');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    if (!user) return;
    loadReminders();
  }, [user]);

  const loadReminders = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setReminders(data as Reminder[]);
    }
    setIsLoading(false);
  };

  const toggle = async (id: string, currentStatus: boolean) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_enabled: !currentStatus } : r));
    await supabase.from('reminders').update({ is_enabled: !currentStatus }).eq('id', id);
  };

  const remove = async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    await supabase.from('reminders').delete().eq('id', id);
  };

  const resetForm = () => {
    setNewType('Period');
    setNewCustomType('');
    setNewKind('relative');
    setNewDaysOffset('3');
    setNewOffsetDirection('before');
    setNewInterval('60');
    setNewTime('09:00');
    setNewDate('');
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    let days_offset = null;
    if (newKind === 'relative') {
      const val = parseInt(newDaysOffset) || 0;
      days_offset = newOffsetDirection === 'before' ? -val : (newOffsetDirection === 'on_day' ? 0 : val);
    }

    const newReminder = {
      user_id: user.id,
      type: newType,
      custom_type_name: newType === 'Custom' ? newCustomType : null,
      reminder_kind: newKind,
      days_offset,
      interval_minutes: newKind === 'repeating' ? parseInt(newInterval) : null,
      time_of_day: newKind === 'fixed_time' ? newTime : null,
      specific_date: newKind === 'specific_date' ? newDate : null,
      is_enabled: true
    };

    const { data, error } = await supabase
      .from('reminders')
      .insert(newReminder)
      .select()
      .single();

    if (data) {
      setReminders([data as Reminder, ...reminders]);
      resetForm();
    } else {
      console.error('Error saving reminder:', error);
    }
    setIsSaving(false);
  };

  const enabledCount = reminders.filter(r => r.is_enabled).length;

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 pt-20 lg:pt-10">
      <FadeIn delay={0}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-plum mb-1 flex items-center gap-3">
              <Bell size={26} className="text-coral" />
              Notifications
            </h1>
            <p className="text-sm text-plum/45">
              {!isLoading && (enabledCount > 0
                ? `${enabledCount} active reminder${enabledCount !== 1 ? 's' : ''}`
                : 'No active reminders')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => isAdding ? resetForm() : setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-coral text-white text-sm font-medium shadow-sm hover:bg-coral/90 transition-colors"
          >
            {isAdding ? <X size={15} /> : <Plus size={15} />}
            {isAdding ? 'Cancel' : 'Add reminder'}
          </motion.button>
        </div>
      </FadeIn>

      <AnimatePresence mode="popLayout">
        {/* Add form */}
        {isAdding && (
          <FadeIn delay={0}>
            <div className="bg-white/80 backdrop-blur-sm border border-sage/20 rounded-3xl p-6 md:p-8 mb-6 shadow-sm flex flex-col gap-6">
              <div>
                <p className="text-sm font-semibold text-plum mb-3">1. What are we reminding you about?</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        newType === type 
                          ? 'bg-plum text-cream shadow-sm' 
                          : 'bg-sage/10 text-plum hover:bg-sage/20 border border-sage/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {newType === 'Custom' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                    <input
                      type="text"
                      value={newCustomType}
                      onChange={e => setNewCustomType(e.target.value)}
                      placeholder="Enter custom reminder name"
                      className="w-full bg-cream/60 border border-sage/30 rounded-2xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40 focus:ring-2 focus:ring-coral/15"
                    />
                  </motion.div>
                )}
              </div>

              <div className="h-px bg-sage/20 w-full" />

              <div>
                <p className="text-sm font-semibold text-plum mb-3">2. When should we notify you?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {[
                    { id: 'relative', icon: Activity, label: 'Relative to period' },
                    { id: 'repeating', icon: Repeat, label: 'Repeating' },
                    { id: 'fixed_time', icon: Clock, label: 'Specific time' },
                    { id: 'specific_date', icon: Calendar, label: 'Specific date' }
                  ].map(kind => (
                    <button
                      key={kind.id}
                      onClick={() => setNewKind(kind.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-sm font-medium transition-all text-left ${
                        newKind === kind.id 
                          ? 'border-coral/50 bg-coral/5 text-coral' 
                          : 'border-sage/20 bg-white/50 text-plum hover:bg-sage/10'
                      }`}
                    >
                      <kind.icon size={16} />
                      {kind.label}
                    </button>
                  ))}
                </div>

                {/* Sub-forms based on kind */}
                <div className="bg-sage/5 rounded-2xl p-4 border border-sage/10 min-h-[80px] flex flex-col justify-center">
                  
                  {newKind === 'relative' && (
                    <div className="flex items-center gap-3">
                      <select 
                        value={newOffsetDirection}
                        onChange={e => setNewOffsetDirection(e.target.value)}
                        className="bg-white border border-sage/30 rounded-xl px-3 py-2.5 text-sm text-plum outline-none focus:border-coral/40"
                      >
                        <option value="before">Before period</option>
                        <option value="after">After period</option>
                        <option value="on_day">On the day</option>
                      </select>
                      
                      {newOffsetDirection !== 'on_day' && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            min="1" max="30"
                            value={newDaysOffset}
                            onChange={e => setNewDaysOffset(e.target.value)}
                            className="w-16 bg-white border border-sage/30 rounded-xl px-3 py-2.5 text-sm text-plum outline-none focus:border-coral/40"
                          />
                          <span className="text-sm text-plum/60">days</span>
                        </div>
                      )}
                    </div>
                  )}

                  {newKind === 'repeating' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-plum/60">Every</span>
                      <select 
                        value={newInterval}
                        onChange={e => setNewInterval(e.target.value)}
                        className="bg-white border border-sage/30 rounded-xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40"
                      >
                        {INTERVAL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newKind === 'fixed_time' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-plum/60">Daily at</span>
                      <input 
                        type="time"
                        value={newTime}
                        onChange={e => setNewTime(e.target.value)}
                        className="bg-white border border-sage/30 rounded-xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40"
                      />
                    </div>
                  )}

                  {newKind === 'specific_date' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-plum/60">On date</span>
                      <input 
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="bg-white border border-sage/30 rounded-xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40"
                      />
                    </div>
                  )}

                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || (newType === 'Custom' && !newCustomType.trim()) || (newKind === 'specific_date' && !newDate)}
                className="w-full py-3 bg-coral text-white rounded-2xl text-sm font-medium disabled:opacity-40 hover:bg-coral/90 transition-colors mt-2 shadow-sm"
              >
                {isSaving ? 'Saving...' : 'Save reminder'}
              </button>
            </div>
          </FadeIn>
        )}

        {/* Empty state */}
        {!isLoading && reminders.length === 0 && !isAdding && (
          <FadeIn delay={0.1}>
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
                <BellOff size={28} className="text-plum/30" />
              </div>
              <div>
                <p className="font-serif text-xl text-plum/60 mb-1">No reminders yet</p>
                <p className="text-sm text-plum/35 max-w-[280px] mx-auto">
                  Add a structured reminder above — like a heads-up before your period or a repeating hydration prompt.
                </p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Reminder list */}
        {!isLoading && (
          <div className="space-y-3">
            {reminders.map((r, i) => (
              <FadeIn key={r.id} delay={0.05 * i}>
                <div className="group flex items-center justify-between bg-white/80 backdrop-blur-sm border border-sage/20 rounded-2xl px-5 py-4 shadow-sm hover:border-coral/20 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.is_enabled ? 'bg-coral/15' : 'bg-sage/20'}`}>
                      <Bell size={18} className={r.is_enabled ? 'text-coral' : 'text-plum/30'} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${r.is_enabled ? 'text-plum' : 'text-plum/35 line-through'}`}>
                        {r.type === 'Custom' ? r.custom_type_name : r.type}
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${r.is_enabled ? 'text-coral/80' : 'text-plum/30 line-through'}`}>
                        {formatReminderText(r)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggle(r.id, r.is_enabled)}
                      className={`w-10 h-6 rounded-full relative transition-colors ${r.is_enabled ? 'bg-coral' : 'bg-sage/40'}`}
                      aria-label={r.is_enabled ? 'Disable' : 'Enable'}
                    >
                      <motion.span
                        layout
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                        animate={{ left: r.is_enabled ? '22px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                    {/* Remove */}
                    <button
                      onClick={() => remove(r.id)}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-all ml-1"
                      aria-label="Remove reminder"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
