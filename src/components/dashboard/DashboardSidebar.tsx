import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageCircle,
  BarChart3,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EvoraLogo } from '../ui/EvoraLogo';


const NAV_ITEMS = [
  { path: '/dashboard', label: 'Cycle', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/analysis', label: 'Insights', icon: BarChart3 },
  { path: '/articles', label: 'Library', icon: BookOpen },
];

export function DashboardSidebar() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white/70 backdrop-blur-md border-r border-sage/20 px-3 py-6 fixed top-0 left-0 z-40">
        {/* Logo */}
        <Link to="/" className="flex items-center px-3 mb-10">
          <EvoraLogo size={34} />
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                    active
                      ? 'bg-coral/15 text-plum'
                      : 'text-plum/55 hover:text-plum hover:bg-blush/20',
                  ].join(' ')}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-plum rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <Icon size={18} />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-plum/55 hover:text-coral hover:bg-blush/20 transition-all duration-200 w-full text-left mt-auto mb-3"
        >
          <LogOut size={18} />
          Sign Out
        </button>


      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-sage/20 px-2 py-1.5 flex justify-around items-center">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 py-1 px-2 relative">
              {active && (
                <motion.div
                  layoutId="mobile-tab-active"
                  className="absolute -top-1.5 w-5 h-[3px] bg-coral rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
              <Icon size={20} className={active ? 'text-plum' : 'text-plum/35'} />
              <span className={`text-[10px] ${active ? 'text-plum font-semibold' : 'text-plum/35'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
