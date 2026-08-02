import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Plus, X } from 'lucide-react';

interface Reminder {
  id: number;
  text: string;
  enabled: boolean;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { id: 1, text: 'Period reminder — 3 days before', enabled: true },
  { id: 2, text: 'Log daily mood at 8:00 PM', enabled: false },
];

function loadReminders(): Reminder[] {
  try {
    const s = localStorage.getItem('evora-reminders');
    return s ? JSON.parse(s) : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem('evora-reminders', JSON.stringify(reminders));
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function NotificationsPage() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('Period reminder');
  const [newTiming, setNewTiming] = useState('3 days before');

  const update = (next: Reminder[]) => {
    setReminders(next);
    saveReminders(next);
  };

  const toggle = (id: number) =>
    update(reminders.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const remove = (id: number) => update(reminders.filter(r => r.id !== id));

  const add = () => {
    if (!newType.trim() || !newTiming.trim()) return;
    const next = [...reminders, { id: Date.now(), text: `${newType.trim()} — ${newTiming.trim()}`, enabled: true }];
    update(next);
    setIsAdding(false);
    setNewType('Period reminder');
    setNewTiming('3 days before');
  };

  const enabledCount = reminders.filter(r => r.enabled).length;

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
              {enabledCount > 0
                ? `${enabledCount} active reminder${enabledCount !== 1 ? 's' : ''}`
                : 'No active reminders'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsAdding(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-coral text-white text-sm font-medium shadow-sm hover:bg-coral/90 transition-colors"
          >
            {isAdding ? <X size={15} /> : <Plus size={15} />}
            {isAdding ? 'Cancel' : 'Add reminder'}
          </motion.button>
        </div>
      </FadeIn>

      {/* Add form */}
      {isAdding && (
        <FadeIn delay={0}>
          <div className="bg-white/80 backdrop-blur-sm border border-sage/20 rounded-3xl p-6 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-plum mb-4">New reminder</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-plum/50 mb-1 block uppercase tracking-wide">Type</label>
                <input
                  type="text"
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  placeholder="e.g. Period reminder"
                  className="w-full bg-cream/60 border border-sage/30 rounded-2xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40 focus:ring-2 focus:ring-coral/15"
                />
              </div>
              <div>
                <label className="text-xs text-plum/50 mb-1 block uppercase tracking-wide">When</label>
                <input
                  type="text"
                  value={newTiming}
                  onChange={e => setNewTiming(e.target.value)}
                  placeholder="e.g. 3 days before"
                  className="w-full bg-cream/60 border border-sage/30 rounded-2xl px-4 py-2.5 text-sm text-plum outline-none focus:border-coral/40 focus:ring-2 focus:ring-coral/15"
                />
              </div>
            </div>
            <button
              onClick={add}
              disabled={!newType.trim() || !newTiming.trim()}
              className="w-full py-2.5 bg-coral text-white rounded-2xl text-sm font-medium disabled:opacity-40 hover:bg-coral/90 transition-colors"
            >
              Save reminder
            </button>
          </div>
        </FadeIn>
      )}

      {/* Empty state */}
      {reminders.length === 0 && !isAdding && (
        <FadeIn delay={0.1}>
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center">
              <BellOff size={28} className="text-plum/30" />
            </div>
            <div>
              <p className="font-serif text-xl text-plum/60 mb-1">No reminders yet</p>
              <p className="text-sm text-plum/35">
                Add a reminder above — like a heads-up before your period or a daily mood log prompt.
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Reminder list */}
      <div className="space-y-3">
        {reminders.map((r, i) => (
          <FadeIn key={r.id} delay={0.05 * i}>
            <div className="group flex items-center justify-between bg-white/80 backdrop-blur-sm border border-sage/20 rounded-2xl px-5 py-4 shadow-sm hover:border-coral/20 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${r.enabled ? 'bg-coral/15' : 'bg-sage/20'}`}>
                  <Bell size={15} className={r.enabled ? 'text-coral' : 'text-plum/30'} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${r.enabled ? 'text-plum' : 'text-plum/35 line-through'}`}>
                    {r.text}
                  </p>
                  <p className="text-[11px] text-plum/40 mt-0.5">
                    {r.enabled ? 'Active · upcoming' : 'Disabled'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => toggle(r.id)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${r.enabled ? 'bg-coral' : 'bg-sage/40'}`}
                  aria-label={r.enabled ? 'Disable' : 'Enable'}
                >
                  <motion.span
                    layout
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: r.enabled ? '22px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                {/* Remove */}
                <button
                  onClick={() => remove(r.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-all"
                  aria-label="Remove reminder"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
