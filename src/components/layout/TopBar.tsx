import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { supabase } from '../../lib/supabaseClient';

interface Reminder {
  id: string;
  reminder_kind: string;
  days_offset: number | null;
  interval_minutes: number | null;
  time_of_day: string | null;
  specific_date: string | null;
  is_enabled: boolean;
}

/** Returns true if the reminder is actually due right now */
function isReminderDue(r: Reminder, nextPeriodDate: Date | null, acknowledged: Set<string>): boolean {
  if (!r.is_enabled) return false;
  if (acknowledged.has(r.id)) return false;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  switch (r.reminder_kind) {
    case 'relative': {
      if (!nextPeriodDate || r.days_offset === null) return false;
      const triggerDate = new Date(nextPeriodDate);
      triggerDate.setDate(triggerDate.getDate() + r.days_offset); // days_offset is negative for "before"
      return triggerDate.toISOString().slice(0, 10) === todayStr;
    }
    case 'specific_date': {
      return r.specific_date === todayStr;
    }
    case 'fixed_time': {
      if (!r.time_of_day) return false;
      const [h, m] = r.time_of_day.split(':').map(Number);
      const triggerTime = new Date();
      triggerTime.setHours(h, m, 0, 0);
      // Due if current time is past the trigger time today
      return now >= triggerTime;
    }
    case 'repeating': {
      if (!r.interval_minutes) return false;
      const lastAckKey = `reminder_last_ack_${r.id}`;
      const lastAck = localStorage.getItem(lastAckKey);
      if (!lastAck) return true; // Never acknowledged = due
      const elapsed = (now.getTime() - parseInt(lastAck)) / 1000 / 60; // minutes
      return elapsed >= r.interval_minutes;
    }
    default:
      return false;
  }
}

function useReminders() {
  const { user } = useAuth();
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // When user visits /notifications, acknowledge all due fixed_time and relative reminders for today
    if (location.pathname === '/notifications') {
      const ackKey = `reminder_acked_${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(ackKey, 'true');
    }

    const compute = async () => {
      // Fetch all enabled reminders
      const { data: reminders } = await supabase
        .from('reminders')
        .select('id, reminder_kind, days_offset, interval_minutes, time_of_day, specific_date, is_enabled')
        .eq('user_id', user.id)
        .eq('is_enabled', true);

      if (!reminders || reminders.length === 0) {
        setDueCount(0);
        return;
      }

      // Fetch next period date from cycle_settings
      let nextPeriodDate: Date | null = null;
      const { data: cycle } = await supabase
        .from('cycle_settings')
        .select('last_period_start, avg_cycle_length')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cycle?.last_period_start && cycle?.avg_cycle_length) {
        let base = new Date(cycle.last_period_start);
        const today = new Date();
        // Roll forward to the next upcoming period
        while (base <= today) {
          base = new Date(base);
          base.setDate(base.getDate() + cycle.avg_cycle_length);
        }
        nextPeriodDate = base;
      }

      // Load today's page-visit acknowledgement
      const ackKey = `reminder_acked_${new Date().toISOString().slice(0, 10)}`;
      const visitedToday = localStorage.getItem(ackKey) === 'true';

      // Build acknowledged set: if user visited notifications today, ack all non-repeating
      const acknowledged = new Set<string>();
      if (visitedToday) {
        (reminders as Reminder[]).forEach(r => {
          if (r.reminder_kind !== 'repeating') acknowledged.add(r.id);
        });
      }

      const due = (reminders as Reminder[]).filter(r => isReminderDue(r, nextPeriodDate, acknowledged));
      setDueCount(due.length);
    };

    compute();

    // Realtime subscription to re-compute on DB changes
    const sub = supabase
      .channel('topbar_reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` }, compute)
      .subscribe();

    // Re-check every minute (for time-based reminders)
    const interval = setInterval(compute, 60_000);

    return () => {
      sub.unsubscribe();
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  return { dueCount };
}

function useProfile() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
      });
    // Check for Supabase auth avatar (Google OAuth)
    const meta = user.user_metadata;
    if (meta?.avatar_url) setAvatarUrl(meta.avatar_url);
  }, [user]);

  const initials = name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return { name, initials, avatarUrl };
}

export function TopBar() {
  const navigate = useNavigate();
  const { dueCount } = useReminders();
  const { initials, avatarUrl } = useProfile();

  return (
    <div className="fixed top-0 right-0 z-50 flex items-center gap-2 p-4 lg:p-5">
      {/* Theme toggle */}
      <ThemeToggle className="hidden sm:flex" />

      {/* Bell */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => navigate('/notifications')}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-sage/20 shadow-sm text-plum hover:border-coral/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <AnimatePresence>
          {dueCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            >
              {dueCount > 9 ? '9+' : dueCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Avatar → Account */}
      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
        <Link
          to="/account"
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 dark:border-white/10 shadow-md flex items-center justify-center bg-coral/20 text-plum font-semibold text-sm"
          aria-label="Account"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="font-sans font-bold text-sm text-plum">{initials}</span>
          )}
        </Link>
      </motion.div>
    </div>
  );
}
