import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isSameDay } from 'date-fns';
import { X, Droplets, Smile, Zap, Moon, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'flow', label: 'Flow', icon: Droplets, color: 'text-coral', bg: 'bg-coral/10' },
  { id: 'mood', label: 'Mood', icon: Smile, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'cramps', label: 'Cramps', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'pms', label: 'PMS', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'energy', label: 'Energy', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const OPTIONS = {
  flow: ['Light', 'Medium', 'Heavy', 'Spotting'],
  mood: ['Great', 'Okay', 'Low', 'Irritable', 'Tired', 'Unwell'],
  cramps: ['None', 'Mild', 'Moderate', 'Severe'],
  pms: ['None', 'Mild', 'Moderate', 'Severe'],
  energy: ['High', 'Normal', 'Low'],
};

export function LogModal({ isOpen, onClose }: LogModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [sleepHours, setSleepHours] = useState('');

  // Fetch hidden categories on mount
  useEffect(() => {
    if (user && isOpen) {
      supabase.from('profiles').select('hidden_categories').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.hidden_categories) {
            setHiddenCategories(data.hidden_categories);
          }
        });
    }
  }, [user, isOpen]);

  // Generate last 7 days
  const dates = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();

  const handleSave = async (category: string, value: string) => {
    if (!user) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      if (category === 'flow') {
        // Upsert to period_logs
        // First check if exists
        const { data: existing } = await supabase
          .from('period_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('log_date', dateStr)
          .maybeSingle();

        if (existing) {
          await supabase.from('period_logs').update({ flow_intensity: value.toLowerCase() }).eq('id', existing.id);
        } else {
          await supabase.from('period_logs').insert({ user_id: user.id, log_date: dateStr, flow_intensity: value.toLowerCase() });
        }
      } else {
        // Upsert to symptom_logs
        const { data: existing } = await supabase
          .from('symptom_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('log_date', dateStr)
          .eq('symptom', category)
          .maybeSingle();

        if (existing) {
          await supabase.from('symptom_logs').update({ value: value.toLowerCase() }).eq('id', existing.id);
        } else {
          await supabase.from('symptom_logs').insert({ user_id: user.id, log_date: dateStr, symptom: category, value: value.toLowerCase() });
        }
      }
      
      showToast(`Logged ${category} successfully`, 'success');
      setActiveCategory(null);
    } catch (err) {
      showToast('Failed to save log', 'error');
    }
  };

  const toggleCategoryHide = async (catId: string) => {
    if (!user) return;
    const newHidden = hiddenCategories.includes(catId) 
      ? hiddenCategories.filter(id => id !== catId)
      : [...hiddenCategories, catId];
      
    setHiddenCategories(newHidden);
    await supabase.from('profiles').update({ hidden_categories: newHidden }).eq('id', user.id);
  };

  const visibleCategories = CATEGORIES.filter(c => !hiddenCategories.includes(c.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-plum/20 backdrop-blur-sm pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white relative overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-sage/20 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <h2 className="font-serif text-2xl text-plum">{showSettings ? 'Customize' : activeCategory ? 'Log Details' : 'Quick Log'}</h2>
              <button onClick={() => {
                if (showSettings) setShowSettings(false);
                else if (activeCategory) setActiveCategory(null);
                else onClose();
              }} className="p-2 rounded-full hover:bg-sage/20 text-plum/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {!showSettings && !activeCategory && (
                <>
                  {/* Date Strip */}
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wide text-plum/40 mb-3 font-medium">Select Date</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                      {dates.map(date => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center min-w-[3rem] h-14 rounded-2xl transition-all ${
                              isSelected ? 'bg-coral text-white shadow-md shadow-coral/20' : 'bg-cream text-plum/60 hover:bg-sage/20'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold">{format(date, 'EEE')}</span>
                            <span className="text-sm font-medium">{format(date, 'd')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categories Grid */}
                  <p className="text-xs uppercase tracking-wide text-plum/40 mb-3 font-medium">What to log?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {visibleCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-3xl bg-cream border border-sage/20 hover:border-coral/30 hover:bg-blush/10 transition-colors gap-2 group"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cat.bg} transition-transform group-hover:scale-110`}>
                          <cat.icon size={20} className={cat.color} />
                        </div>
                        <span className="text-xs font-medium text-plum/70">{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {visibleCategories.length === 0 && (
                    <p className="text-center text-sm text-plum/50 my-8">All categories are hidden.</p>
                  )}

                  <div className="mt-8 pt-4 border-t border-sage/15 text-center">
                    <button onClick={() => setShowSettings(true)} className="text-xs font-medium text-coral hover:text-coral/80 transition-colors underline underline-offset-4 decoration-coral/30">
                      Customize categories
                    </button>
                  </div>
                </>
              )}

              {/* Options View */}
              {activeCategory && !showSettings && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-sm text-plum/60 mb-6">
                    Logging for <span className="font-semibold text-plum">{isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d')}</span>
                  </p>
                  
                  {activeCategory === 'sleep' ? (
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-plum/70">Hours slept</label>
                      <input 
                        type="number" 
                        value={sleepHours}
                        onChange={e => setSleepHours(e.target.value)}
                        placeholder="8"
                        className="w-full px-5 py-4 rounded-2xl bg-cream border border-sage/30 text-lg text-plum outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
                      />
                      <button 
                        onClick={() => handleSave('sleep', sleepHours)}
                        disabled={!sleepHours}
                        className="w-full py-4 bg-coral text-white rounded-2xl font-medium mt-4 disabled:opacity-50"
                      >
                        Save Sleep
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {(OPTIONS as any)[activeCategory]?.map((opt: string) => (
                        <button
                          key={opt}
                          onClick={() => handleSave(activeCategory, opt)}
                          className="w-full py-4 px-6 rounded-2xl bg-cream border border-sage/20 text-left font-medium text-plum/80 hover:bg-blush/10 hover:border-coral/30 hover:text-plum transition-all flex items-center justify-between group"
                        >
                          {opt}
                          <span className="text-coral opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                            +
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Settings View */}
              {showSettings && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                  <p className="text-sm text-plum/60 mb-6">Toggle categories to show or hide them from your quick log grid.</p>
                  {CATEGORIES.map(cat => {
                    const isHidden = hiddenCategories.includes(cat.id);
                    return (
                      <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-cream border border-sage/20">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.bg}`}>
                            <cat.icon size={16} className={cat.color} />
                          </div>
                          <span className="font-medium text-sm text-plum/80">{cat.label}</span>
                        </div>
                        <button
                          onClick={() => toggleCategoryHide(cat.id)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${isHidden ? 'bg-sage/40' : 'bg-coral'}`}
                        >
                          <motion.div 
                            animate={{ x: isHidden ? 4 : 28 }}
                            className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm"
                          />
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
