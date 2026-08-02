import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-full border border-sage/30 shadow-sm ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-cream text-coral shadow-sm' : 'text-plum/50 hover:text-plum'}`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-cream text-coral shadow-sm' : 'text-plum/50 hover:text-plum'}`}
        title="System Preference"
      >
        <Monitor size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-cream text-coral shadow-sm' : 'text-plum/50 hover:text-plum'}`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
