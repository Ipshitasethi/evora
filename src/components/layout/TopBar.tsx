import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { supabase } from '../../lib/supabaseClient';

// Local reminder type matching AccountPage's in-memory shape
interface Reminder {
  id: number;
  text: string;
  enabled: boolean;
}

// "Due soon" = any enabled reminder that mentions "period" or "3 day" / "1 day"
// (reminders are local-only, no DB table; we read them via a shared key in
//  localStorage that AccountPage writes, else fall back to default list)
const DEFAULT_REMINDERS: Reminder[] = [
  { id: 1, text: 'Period reminder — 3 days before', enabled: true },
  { id: 2, text: 'Log daily mood at 8:00 PM', enabled: false },
];

function useReminders() {
  const [reminders] = useState<Reminder[]>(() => {
    try {
      const stored = localStorage.getItem('evora-reminders');
      return stored ? JSON.parse(stored) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });

  // Count enabled reminders as "due soon" — simple heuristic
  const dueSoonCount = reminders.filter(r => r.enabled).length;
  return { reminders, dueSoonCount };
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
  const { dueSoonCount } = useReminders();
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
          {dueSoonCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            >
              {dueSoonCount > 9 ? '9+' : dueSoonCount}
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
