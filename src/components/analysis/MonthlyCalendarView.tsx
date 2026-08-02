import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday,
  isSameDay,
  parseISO
} from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface PeriodLog {
  log_date: string;
  flow_intensity?: string;
}

interface MonthlyCalendarViewProps {
  logs: PeriodLog[];
  onLogUpdated?: () => void;
}

export function MonthlyCalendarView({ logs, onLogUpdated }: MonthlyCalendarViewProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Popover state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedDate(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => { setCurrentDate(addMonths(currentDate, 1)); setSelectedDate(null); };
  const prevMonth = () => { setCurrentDate(subMonths(currentDate, 1)); setSelectedDate(null); };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate empty days to offset the start of the month (0 = Sunday, 1 = Monday, etc.)
  const startDay = monthStart.getDay();
  const emptyDays = Array.from({ length: startDay }).map((_, i) => i);

  // Helper to get flow color
  const getFlowColor = (date: Date) => {
    const log = logs.find(l => isSameDay(parseISO(l.log_date), date));
    if (!log) return 'bg-white border-sage/15 text-plum/60'; // neutral/blank

    const intensity = (log.flow_intensity || '').toLowerCase();
    
    // Consistent progression of coral tones
    switch (intensity) {
      case 'spotting':
        return 'bg-coral/20 border-coral/30 text-coral'; // light coral
      case 'light':
        return 'bg-coral/40 border-coral/50 text-plum'; // medium-light
      case 'medium':
        return 'bg-coral/70 border-coral/80 text-white'; // medium
      case 'heavy':
        return 'bg-coral border-coral text-white shadow-md shadow-coral/20'; // deep coral
      default:
        // Default to a medium shade if flow intensity isn't standard
        return 'bg-coral/50 border-coral/60 text-white';
    }
  };

  const getDayText = (date: Date) => {
    return isToday(date) ? 'font-bold' : 'font-medium';
  };

  const handleUpdateFlow = async (intensity: string | null) => {
    if (!user || !selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    if (intensity === null) {
      // Clear log
      await supabase.from('period_logs').delete().eq('user_id', user.id).eq('log_date', dateStr);
    } else {
      // Upsert log
      const { data: existing } = await supabase.from('period_logs')
        .select('id').eq('user_id', user.id).eq('log_date', dateStr).maybeSingle();
      
      if (existing) {
        await supabase.from('period_logs').update({ flow_intensity: intensity }).eq('id', existing.id);
      } else {
        await supabase.from('period_logs').insert({ user_id: user.id, log_date: dateStr, flow_intensity: intensity });
      }
    }
    
    setSelectedDate(null);
    if (onLogUpdated) onLogUpdated();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm relative h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
            <CalendarDays size={18} className="text-coral" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-plum">Period History</h2>
            <p className="text-xs text-plum/50">Your logged flow</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-sage/20 text-plum/50 hover:text-plum transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-serif text-[15px] text-plum min-w-[100px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-sage/20 text-plum/50 hover:text-plum transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mb-4 text-[10px] font-medium text-plum/50 uppercase tracking-wider flex-wrap">
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-coral/20 border border-coral/30" /> Spotting</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-coral/40 border border-coral/50" /> Light</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-coral/70 border border-coral/80" /> Med</div>
        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-coral shadow-sm shadow-coral/20" /> Heavy</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day labels */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-bold text-plum/40 uppercase tracking-wider mb-2">
            {day}
          </div>
        ))}
        
        {/* Empty slots */}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-transparent" />
        ))}

        {/* Days */}
        {daysInMonth.map(date => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          return (
            <div key={date.toISOString()} className="aspect-square p-0.5 relative">
              <button 
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`w-full h-full rounded-xl border flex items-center justify-center text-[11px] transition-all hover:scale-105 active:scale-95 ${getFlowColor(date)} ${getDayText(date)} ${isSelected ? 'ring-2 ring-plum/20 ring-offset-1' : ''}`}
              >
                {format(date, 'd')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Editable Popover */}
      <AnimatePresence>
        {selectedDate && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="bg-white rounded-2xl shadow-xl border border-sage/20 p-4 w-48 pointer-events-auto"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-plum/60 uppercase tracking-wider">
                  {format(selectedDate, 'MMM d')}
                </span>
                <button onClick={() => setSelectedDate(null)} className="text-plum/40 hover:text-plum/80"><X size={14}/></button>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => handleUpdateFlow('spotting')} className="text-left px-3 py-1.5 text-xs font-medium rounded-lg bg-coral/20 text-coral hover:bg-coral/30 transition-colors">Spotting</button>
                <button onClick={() => handleUpdateFlow('light')} className="text-left px-3 py-1.5 text-xs font-medium rounded-lg bg-coral/40 text-plum hover:bg-coral/50 transition-colors">Light</button>
                <button onClick={() => handleUpdateFlow('medium')} className="text-left px-3 py-1.5 text-xs font-medium rounded-lg bg-coral/70 text-white hover:bg-coral/80 transition-colors">Medium</button>
                <button onClick={() => handleUpdateFlow('heavy')} className="text-left px-3 py-1.5 text-xs font-medium rounded-lg bg-coral text-white hover:bg-coral/90 transition-colors">Heavy</button>
                <div className="h-px bg-sage/20 my-1" />
                <button onClick={() => handleUpdateFlow(null)} className="text-left px-3 py-1.5 text-xs font-medium text-plum/50 hover:text-plum hover:bg-sage/10 rounded-lg transition-colors">Clear</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
