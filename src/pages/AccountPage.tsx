import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, LogOut, Save, Plus, Bell, Activity, X, CalendarDays } from 'lucide-react';

import { DangerZone } from '../components/ui/DangerZone';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/Toast';
import { ThemeToggle } from '../components/ui/ThemeToggle';

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

// ─── Shared ──────────────────────────────────────────────────────────────────
function FadeCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Profile Details ─────────────────────────────────────────────────────────
function ProfileDetails() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [companionName, setCompanionName] = useState('Evora');
  const [age, setAge] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name, age, companion_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
        if (data?.age) setAge(data.age.toString());
        if (data?.companion_name) setCompanionName(data.companion_name);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name, companion_name: companionName, age: parseInt(age, 10) || null })
      .eq('id', user.id);
    setLoading(false);
    
    if (error) {
      showToast('Failed to update profile.', 'error');
    } else {
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    }
  };

  return (
    <FadeCard delay={0.08} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blush/50 border-2 border-blush flex items-center justify-center">
            <User size={22} className="text-coral" />
          </div>
          <div>
            <p className="font-serif text-xl text-plum">{name || 'Your account'}</p>
            <p className="text-sm text-plum/45">{user?.email}</p>
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-coral hover:text-coral/80 transition-colors">
            Edit
          </button>
        ) : (
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-sm font-medium hover:bg-coral/20 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Save
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <User size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Name</p>
            {isEditing ? (
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
                placeholder="Your name"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{name || '—'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <User size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Name your AI companion</p>
            {isEditing ? (
              <input 
                type="text" 
                value={companionName} 
                onChange={e => setCompanionName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
                placeholder="Evora"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{companionName || 'Evora'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <Activity size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Age</p>
            {isEditing ? (
              <input 
                type="number" 
                value={age} 
                onChange={e => setAge(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
                placeholder="Age"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{age || '—'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <Mail size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Email</p>
            <p className="text-sm text-plum font-medium opacity-70">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-sage/20">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={signOut}
          className="flex items-center gap-2 text-sm font-medium text-plum/60 hover:text-plum transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </motion.button>
      </div>
    </FadeCard>
  );
}

// ─── Cycle Settings ──────────────────────────────────────────────────────────
function CycleSettingsDetails() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('cycle_settings')
      .select('last_period_start, avg_cycle_length, avg_period_length')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.last_period_start) setLastPeriod(data.last_period_start);
        if (data?.avg_cycle_length) setCycleLength(data.avg_cycle_length.toString());
        if (data?.avg_period_length) setPeriodLength(data.avg_period_length.toString());
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('cycle_settings')
      .upsert({ 
        user_id: user.id, 
        last_period_start: lastPeriod || null, 
        avg_cycle_length: parseInt(cycleLength, 10) || 28, 
        avg_period_length: parseInt(periodLength, 10) || 5 
      }, { onConflict: 'user_id' });
    setLoading(false);
    
    if (error) {
      showToast('Failed to update cycle settings.', 'error');
    } else {
      showToast('Cycle settings updated successfully!', 'success');
      setIsEditing(false);
    }
  };

  return (
    <FadeCard delay={0.09} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-coral/10 flex items-center justify-center">
            <CalendarDays size={22} className="text-coral" />
          </div>
          <div>
            <p className="font-serif text-xl text-plum">Cycle Settings</p>
            <p className="text-sm text-plum/45">Your tracked averages</p>
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-coral hover:text-coral/80 transition-colors">
            Edit
          </button>
        ) : (
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-sm font-medium hover:bg-coral/20 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Save
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <CalendarDays size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Last Period Start Date</p>
            {isEditing ? (
              <input 
                type="date" 
                value={lastPeriod} 
                onChange={e => setLastPeriod(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{lastPeriod || 'Not set'}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <Activity size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Average Cycle Length (Days)</p>
            {isEditing ? (
              <input 
                type="number" 
                value={cycleLength} 
                onChange={e => setCycleLength(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{cycleLength}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-cream/70 rounded-2xl px-4 py-3">
          <Activity size={15} className="text-plum/40 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-plum/40">Average Period Length (Days)</p>
            {isEditing ? (
              <input 
                type="number" 
                value={periodLength} 
                onChange={e => setPeriodLength(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-plum font-medium placeholder:text-plum/30"
              />
            ) : (
              <p className="text-sm text-plum font-medium">{periodLength}</p>
            )}
          </div>
        </div>
      </div>
    </FadeCard>
  );
}

// ─── Goals Settings ──────────────────────────────────────────────────────────
function GoalsDetails() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('cycle_settings')
      .select('goals')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.goals) setSelectedGoals(data.goals);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('cycle_settings')
      .update({ goals: selectedGoals })
      .eq('user_id', user.id);
    setLoading(false);
    
    if (error) {
      showToast('Failed to update goals.', 'error');
    } else {
      showToast('Goals updated successfully!', 'success');
      setIsEditing(false);
    }
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <FadeCard delay={0.095} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-lavender/40 flex items-center justify-center">
            <Activity size={22} className="text-plum/70" />
          </div>
          <div>
            <p className="font-serif text-xl text-plum">Your Goals</p>
            <p className="text-sm text-plum/45">What you want out of Evora</p>
          </div>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-coral hover:text-coral/80 transition-colors">
            Edit
          </button>
        ) : (
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-sm font-medium hover:bg-coral/20 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Save
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isEditing ? (
          selectedGoals.length > 0 ? (
            selectedGoals.map(g => {
              const label = GOALS.find(x => x.id === g)?.label || g;
              return (
                <div key={g} className="bg-sage/20 text-plum px-4 py-2 rounded-xl text-sm font-medium border border-sage/30">
                  {label}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-plum/50">No goals selected yet.</p>
          )
        ) : (
          GOALS.map(g => (
            <button
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                selectedGoals.includes(g.id)
                  ? 'bg-coral/20 border-coral/30 text-plum'
                  : 'bg-white border-sage/30 text-plum/60 hover:bg-sage/10'
              }`}
            >
              {g.label}
            </button>
          ))
        )}
      </div>
    </FadeCard>
  );
}

// ─── BMI Calculator ──────────────────────────────────────────────────────────
function BmiCalculator() {
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  
  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);
  
  let bmi: number | null = null;
  let category = '';
  let colorClass = '';

  if (height > 0 && weight > 0) {
    bmi = weight / Math.pow(height / 100, 2);
    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
    } else if (bmi < 25) {
      category = 'Healthy';
      colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (bmi < 30) {
      category = 'Overweight';
      colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
    } else {
      category = 'Obese';
      colorClass = 'bg-terracotta/20 text-terracotta border-terracotta/30';
    }
  }

  return (
    <FadeCard delay={0.10} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <h2 className="font-serif text-lg text-plum mb-4 flex items-center gap-2">
        <Activity size={18} className="text-coral" />
        BMI Calculator
      </h2>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-cream/70 rounded-2xl px-4 py-2 border border-sage/20">
          <label className="text-[10px] uppercase tracking-wider text-plum/50">Height (cm)</label>
          <input 
            type="number" 
            value={heightCm}
            onChange={e => setHeightCm(e.target.value)}
            placeholder="165"
            className="w-full bg-transparent outline-none text-plum font-medium mt-0.5 placeholder:text-plum/30"
          />
        </div>
        <div className="flex-1 bg-cream/70 rounded-2xl px-4 py-2 border border-sage/20">
          <label className="text-[10px] uppercase tracking-wider text-plum/50">Weight (kg)</label>
          <input 
            type="number" 
            value={weightKg}
            onChange={e => setWeightKg(e.target.value)}
            placeholder="60"
            className="w-full bg-transparent outline-none text-plum font-medium mt-0.5 placeholder:text-plum/30"
          />
        </div>
      </div>
      
      {bmi !== null ? (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center justify-between border-t border-sage/20 pt-4 mt-2"
        >
          <div>
            <p className="text-xs text-plum/50">Your BMI</p>
            <p className="font-serif text-2xl text-plum">{bmi.toFixed(1)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
            {category}
          </div>
        </motion.div>
      ) : (
        <p className="text-xs text-plum/40 pt-2 border-t border-sage/10 text-center">
          Enter height and weight to calculate
        </p>
      )}
    </FadeCard>
  );
}

// ─── Reminders ───────────────────────────────────────────────────────────────
function RemindersSection() {
  const [reminders, setReminders] = useState([
    { id: 1, text: 'Period reminder — 3 days before', enabled: true },
    { id: 2, text: 'Log daily mood at 8:00 PM', enabled: false },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('Period reminder');
  const [newTiming, setNewTiming] = useState('1 day before');

  const toggleReminder = (id: number) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleAdd = () => {
    if (newType && newTiming) {
      setReminders([...reminders, { id: Date.now(), text: `${newType} — ${newTiming}`, enabled: true }]);
      setIsAdding(false);
      setNewType('Period reminder');
      setNewTiming('1 day before');
    }
  };

  return (
    <FadeCard delay={0.12} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-lg text-plum flex items-center gap-2">
          <Bell size={18} className="text-amber-500" />
          Reminders
        </h2>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-plum hover:bg-sage/40 transition-colors"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-blush/10 border border-blush/30 rounded-2xl p-4 overflow-hidden"
          >
            <p className="text-xs font-medium text-plum/70 mb-3">Add new reminder</p>
            <div className="space-y-3 mb-3">
              <input 
                type="text" 
                value={newType}
                onChange={e => setNewType(e.target.value)}
                placeholder="e.g. Log symptoms"
                className="w-full bg-white/60 border border-sage/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-coral/40"
              />
              <input 
                type="text" 
                value={newTiming}
                onChange={e => setNewTiming(e.target.value)}
                placeholder="e.g. 8:00 PM every day"
                className="w-full bg-white/60 border border-sage/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-coral/40"
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={!newType || !newTiming}
              className="w-full bg-coral text-white text-sm font-medium py-2 rounded-xl disabled:opacity-50 transition-all hover:bg-coral/90"
            >
              Save Reminder
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {reminders.length === 0 && !isAdding && (
          <p className="text-sm text-plum/40 text-center py-4">No reminders set.</p>
        )}
        {reminders.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-2xl bg-cream/50 border border-sage/10">
            <span className={`text-sm ${r.enabled ? 'text-plum' : 'text-plum/40 line-through'}`}>{r.text}</span>
            <button 
              onClick={() => toggleReminder(r.id)}
              className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${r.enabled ? 'bg-coral' : 'bg-sage/40'}`}
            >
              <motion.div 
                layout
                className="w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ x: r.enabled ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
    </FadeCard>
  );
}

// ─── Appearance ────────────────────────────────────────────────────────────────
function AppearanceSection() {
  return (
    <FadeCard delay={0.13} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-sage/20 shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-serif text-lg text-plum">Appearance</h2>
          <p className="text-sm text-plum/45">Choose your preferred theme</p>
        </div>
      </div>
      <div className="pt-2">
        <ThemeToggle className="max-w-fit" />
      </div>
    </FadeCard>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function AccountPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 space-y-6">
      <FadeCard delay={0}>
          <h1 className="font-serif text-3xl text-plum mb-1">Account</h1>
          <p className="text-sm text-plum/45">Manage your profile, settings, and data.</p>
        </FadeCard>

        <ProfileDetails />
        <CycleSettingsDetails />
        <GoalsDetails />
        <BmiCalculator />
        <RemindersSection />
        <AppearanceSection />
        
        <FadeCard delay={0.15}>
          <DangerZone />
        </FadeCard>
    </div>
  );
}
