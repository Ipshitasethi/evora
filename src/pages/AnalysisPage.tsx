import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Sparkles, CalendarDays, BarChart3, Activity, Zap, Droplets, Smile, Moon, GlassWater } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, parseISO, format, subDays, startOfDay } from 'date-fns';
import { MonthlyCalendarView } from '../components/analysis/MonthlyCalendarView';
import { groupPeriodLogsIntoCycles } from '../lib/cycleUtils';


interface TrendData {
  category: string;
  label: string;
  icon: React.ReactNode;
  data: { day: string; value: number }[];
  hasEnoughData: boolean;
  statusLabel: string;
  type: 'bar' | 'line';
}

interface Pattern {
  icon: React.ReactNode;
  text: string;
  bg: string;
  border: string;
}

// ─── Fade wrapper ─────────────────────────────────────────────────────────────
function Fade({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
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

export function AnalysisPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Computed Stats
  const [avgCycle, setAvgCycle] = useState<number | null>(null);
  const [avgPeriod, setAvgPeriod] = useState<number | null>(null);
  const [shortestCycle, setShortestCycle] = useState<number | null>(null);
  const [longestCycle, setLongestCycle] = useState<number | null>(null);
  const [hasEnoughCycles, setHasEnoughCycles] = useState(false);

  // Chart Data
  const [cycleTrendData, setCycleTrendData] = useState<{ month: string, length: number }[]>([]);
  // Removed unused symptomData state
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [periodLogs, setPeriodLogs] = useState<{log_date: string, flow_intensity?: string}[]>([]);
  const [allRecentLogs, setAllRecentLogs] = useState<{ log_date: string; category: string; value: string }[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch period logs & group cycles
        const { data: pLogs } = await supabase
          .from('period_logs')
          .select('log_date, flow_intensity')
          .eq('user_id', user!.id)
          .order('log_date', { ascending: true });

        if (pLogs) {
          setPeriodLogs(pLogs as any);
        }

        const { periods, cycles } = groupPeriodLogsIntoCycles((pLogs as any) || []);

        // 2. Fetch symptom logs
        const { data: sLogs } = await supabase
          .from('symptom_logs')
          .select('symptom')
          .eq('user_id', user!.id);

        const symCounts: Record<string, number> = {};
        if (sLogs) {
          sLogs.forEach(log => {
            if (log.symptom) {
              symCounts[log.symptom] = (symCounts[log.symptom] || 0) + 1;
            }
          });
        }
        const topSymptoms = Object.entries(symCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        // setSymptomData(topSymptoms);

        // 2b. Compute 60-day Trend Data
        const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');
        const { data: recentSLogs } = await supabase
          .from('symptom_logs')
          .select('log_date, symptom, value')
          .eq('user_id', user!.id)
          .gte('log_date', sixtyDaysAgo);
          
        const { data: recentPLogs } = await supabase
          .from('period_logs')
          .select('log_date, flow_intensity')
          .eq('user_id', user!.id)
          .gte('log_date', sixtyDaysAgo);

        const allLogs: { log_date: string; category: string; value: string }[] = [];
        if (recentSLogs) {
          recentSLogs.forEach(l => {
            if (l.log_date && l.symptom && l.value) {
              allLogs.push({ log_date: l.log_date, category: l.symptom, value: l.value });
            }
          });
        }
        if (recentPLogs) {
          recentPLogs.forEach(l => {
            if (l.log_date && l.flow_intensity) {
              allLogs.push({ log_date: l.log_date, category: 'flow', value: l.flow_intensity });
            }
          });
        }
        setAllRecentLogs(allLogs);

        // 3. Compute Stats
        // 3. Compute Stats
        if (cycles.length >= 2) {
          setHasEnoughCycles(true);
          const totalCycleLen = cycles.reduce((acc, c) => acc + c.length, 0);
          setAvgCycle(Math.round(totalCycleLen / cycles.length));

          const minC = Math.min(...cycles.map(c => c.length));
          const maxC = Math.max(...cycles.map(c => c.length));
          setShortestCycle(minC);
          setLongestCycle(maxC);

          // We only average period length for the periods that make up these cycles, or all periods
          const totalPeriodLen = periods.reduce((acc, p) => acc + p.length, 0);
          setAvgPeriod(Math.round(totalPeriodLen / periods.length));

          // Set chart data
          const chartData = cycles.map(c => ({
            month: c.month,
            length: c.length
          })).slice(-12); // last 12 cycles
          setCycleTrendData(chartData);

          // Calculate Patterns
          const newPatterns: Pattern[] = [];
          const variance = maxC - minC;
          if (variance <= 3) {
            newPatterns.push({
              icon: <CalendarDays size={18} className="text-coral" />,
              text: "Your cycles are highly regular, varying by 3 days or less.",
              bg: "bg-coral/10",
              border: "border-coral/20"
            });
          } else if (variance >= 5) {
            newPatterns.push({
              icon: <CalendarDays size={18} className="text-coral" />,
              text: "Your cycle length varies notably. This can be normal, but tracking helps spot irregularities.",
              bg: "bg-coral/10",
              border: "border-coral/20"
            });
          }

          if (topSymptoms.length > 0) {
            newPatterns.push({
              icon: <Activity size={18} className="text-plum" />,
              text: `"${topSymptoms[0].name}" is your most frequently logged symptom.`,
              bg: "bg-lavender/30",
              border: "border-lavender/40"
            });
          }

          if (newPatterns.length === 0) {
            newPatterns.push({
              icon: <Sparkles size={18} className="text-coral" />,
              text: "Keep logging to unlock more personalized patterns and insights!",
              bg: "bg-coral/10",
              border: "border-coral/20"
            });
          }
          setPatterns(newPatterns);

        } else {
          setHasEnoughCycles(false);
          setPatterns([
            {
              icon: <Sparkles size={18} className="text-coral" />,
              text: "Log at least 3 periods to start seeing patterns in your cycle.",
              bg: "bg-coral/10",
              border: "border-coral/20"
            }
          ]);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (allRecentLogs.length === 0) {
      setTrends([]);
      return;
    }

    const mapValue = (category: string, val: string): number => {
      const v = val.toLowerCase();
      if (category === 'flow') return { spotting: 1, light: 2, medium: 3, heavy: 4 }[v] || 0;
      if (category === 'energy') return { low: 1, normal: 2, high: 3 }[v] || 0;
      if (category === 'mood') return { unwell: 1, tired: 2, irritable: 3, low: 4, okay: 5, great: 6 }[v] || 0;
      if (category === 'cramps' || category === 'pms') return { none: 0, mild: 1, moderate: 2, severe: 3 }[v] || 0;
      if (category === 'sleep' || category === 'hydration') return parseFloat(v) || 0;
      return 0;
    };

    const categories = [
      { id: 'flow', label: 'Flow', icon: <Droplets size={16} />, type: 'bar' },
      { id: 'mood', label: 'Mood', icon: <Smile size={16} />, type: 'line' },
      { id: 'energy', label: 'Energy', icon: <Zap size={16} />, type: 'bar' },
      { id: 'cramps', label: 'Cramps', icon: <Activity size={16} />, type: 'bar' },
      { id: 'sleep', label: 'Sleep', icon: <Moon size={16} />, type: 'bar' },
      { id: 'hydration', label: 'Hydration', icon: <GlassWater size={16} />, type: 'bar' },
    ];

    const todayDate = startOfDay(new Date());
    const days = timeRange === '7d' ? 7 : 30;
    const dateRange = Array.from({length: days}).map((_, i) => subDays(todayDate, (days - 1) - i));
    const trendResults: TrendData[] = [];

    categories.forEach(cat => {
      const catLogs = allRecentLogs.filter(l => l.category === cat.id);
      if (catLogs.length === 0) return;
      
      const currentPeriodLogs = catLogs.filter(l => differenceInDays(todayDate, parseISO(l.log_date)) < days);
      const previousPeriodLogs = catLogs.filter(l => differenceInDays(todayDate, parseISO(l.log_date)) >= days && differenceInDays(todayDate, parseISO(l.log_date)) < days * 2);
      
      const hasEnoughData = currentPeriodLogs.length >= (timeRange === '7d' ? 3 : 5);
      let statusLabel = 'Insufficient data';
      
      if (hasEnoughData) {
        const currentAvg = currentPeriodLogs.reduce((acc, l) => acc + mapValue(cat.id, l.value), 0) / currentPeriodLogs.length;
        if (previousPeriodLogs.length > 0) {
          const previousAvg = previousPeriodLogs.reduce((acc, l) => acc + mapValue(cat.id, l.value), 0) / previousPeriodLogs.length;
          if (previousAvg === 0) {
            statusLabel = 'Trending UP';
          } else {
            const pct = Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
            if (pct === 0) statusLabel = 'Stable';
            else if (pct > 0) statusLabel = `+${pct}%`;
            else statusLabel = `${pct}%`;
          }
        } else {
          statusLabel = 'New Data';
        }
      }
      
      const chartData = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = currentPeriodLogs.find(l => l.log_date === dateStr);
        return {
          day: timeRange === '7d' ? format(date, 'EEE') : format(date, 'MMM d'),
          value: log ? mapValue(cat.id, log.value) : 0
        };
      });

      trendResults.push({
        category: cat.id,
        label: cat.label,
        icon: cat.icon,
        data: chartData,
        hasEnoughData,
        statusLabel,
        type: cat.type as 'bar' | 'line'
      });
    });
    setTrends(trendResults);
  }, [allRecentLogs, timeRange]);

  if (loading) {
    return <div className="p-10 flex justify-center"><p className="text-plum/50">Loading analysis...</p></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 pt-8 pb-20">

      {/* ── Header ── */}
      <Fade delay={0} className="mb-8 border-b border-sage/20 pb-4">
        <h1 className="font-serif text-3xl md:text-4xl text-plum leading-snug flex items-center gap-3">
          <BarChart3 className="text-coral" size={32} />
          Insights
        </h1>
        <p className="text-plum/50 text-sm mt-2">Insights and trends based on your logged data.</p>
      </Fade>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <MonthlyCalendarView logs={periodLogs} onLogUpdated={() => {
            // Soft refresh data when log is updated
            if (user) {
              supabase.from('period_logs').select('log_date, flow_intensity').eq('user_id', user.id).order('log_date', { ascending: true })
                .then(({ data }) => { if (data) setPeriodLogs(data as any); });
            }
          }} />
        </div>

        <div className="flex-1">
          {hasEnoughCycles ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              <Fade delay={0.1} className="h-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                  <p className="text-xs uppercase tracking-wide text-plum/45 mb-1">Avg Cycle</p>
                  <p className="font-serif text-3xl text-plum font-medium mt-1">{avgCycle} <span className="text-base text-plum/50 font-sans">days</span></p>
                </div>
              </Fade>
              <Fade delay={0.15} className="h-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                  <p className="text-xs uppercase tracking-wide text-plum/45 mb-1">Avg Period</p>
                  <p className="font-serif text-3xl text-plum font-medium mt-1">{avgPeriod} <span className="text-base text-plum/50 font-sans">days</span></p>
                </div>
              </Fade>
              <Fade delay={0.2} className="h-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                  <p className="text-xs uppercase tracking-wide text-plum/45 mb-1">Shortest</p>
                  <p className="font-serif text-3xl text-plum font-medium mt-1">{shortestCycle} <span className="text-base text-plum/50 font-sans">days</span></p>
                </div>
              </Fade>
              <Fade delay={0.25} className="h-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                  <p className="text-xs uppercase tracking-wide text-plum/45 mb-1">Longest</p>
                  <p className="font-serif text-3xl text-plum font-medium mt-1">{longestCycle} <span className="text-base text-plum/50 font-sans">days</span></p>
                </div>
              </Fade>
            </div>
          ) : (
            <Fade delay={0.1} className="h-full">
              <div className="bg-coral/5 rounded-3xl p-8 border border-coral/20 flex flex-col items-center justify-center text-center h-full">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CalendarDays className="text-coral" size={26} />
                </div>
                <h2 className="font-serif text-2xl text-plum mb-3">Keep Tracking!</h2>
                <p className="text-plum/60 text-sm max-w-sm mx-auto leading-relaxed">
                  You need to log at least <strong>3 periods</strong> to establish 2 complete cycles. Once you do, Evora will automatically calculate your averages, detect patterns, and build trends here.
                </p>
              </div>
            </Fade>
          )}
        </div>
      </div>

      {hasEnoughCycles && (

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* ── Trend Chart ── */}
            <Fade delay={0.3} className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm h-full">
                <h3 className="font-serif text-lg text-plum mb-6">Cycle Length Trend</h3>
                <div className="h-64 w-full">
                  {cycleTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cycleTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C6D8C8" opacity={0.5} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9E8E8B', fontSize: 12 }} dy={10} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} tick={{ fill: '#9E8E8B', fontSize: 12 }} dx={-10} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#9B4938', fontWeight: 600 }}
                          labelStyle={{ color: '#2C2422', opacity: 0.7, marginBottom: '4px' }}
                          cursor={{ stroke: '#C6D8C8', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="length"
                          stroke="#9B4938"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#9B4938', strokeWidth: 2, stroke: '#FFF' }}
                          activeDot={{ r: 6, fill: '#9B4938', stroke: '#FFF', strokeWidth: 2 }}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-plum/50">Not enough data to chart</div>
                  )}
                </div>
              </div>
            </Fade>

            {/* ── Patterns We Noticed ── */}
            <Fade delay={0.35} className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={18} className="text-coral" />
                  <h3 className="font-serif text-lg text-plum">Patterns We Noticed</h3>
                </div>
                
                <div className="space-y-4 flex-1">
                  {patterns.map((p, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-2xl border ${p.border} ${p.bg} flex items-start gap-3`}
                    >
                      <div className="mt-0.5 bg-white p-1.5 rounded-lg shadow-sm">
                        {p.icon}
                      </div>
                      <p className="text-sm text-plum/80 leading-relaxed">{p.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Fade>
          </div>
      )}

      {/* ── Trend Analysis Section ── */}
      {trends.length > 0 && (
        <Fade delay={0.4} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-serif text-2xl text-plum">Trend Analysis</h3>
            <div className="flex items-center bg-sage/15 p-1 rounded-xl border border-sage/30">
              <button 
                onClick={() => setTimeRange('7d')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${timeRange === '7d' ? 'bg-white shadow-sm text-plum' : 'text-plum/50 hover:text-plum/80'}`}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => setTimeRange('30d')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${timeRange === '30d' ? 'bg-white shadow-sm text-plum' : 'text-plum/50 hover:text-plum/80'}`}
              >
                Last Month
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trends.map(trend => (
              <div key={trend.category} className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-sage/20 shadow-sm flex flex-col h-48">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-plum/70 font-medium">
                    <div className="bg-coral/10 p-2 rounded-xl text-coral">{trend.icon}</div>
                    {trend.label}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    trend.statusLabel.startsWith('+') ? 'bg-emerald-500/10 text-emerald-600' :
                    trend.statusLabel.startsWith('-') ? 'bg-rose-500/10 text-rose-600' :
                    'bg-sage/30 text-plum/60'
                  }`}>
                    {trend.statusLabel}
                  </span>
                </div>
                
                <div className="flex-1 w-full mt-auto relative">
                  {!trend.hasEnoughData ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-center text-plum/40 px-4">
                      Not enough data in the {timeRange === '7d' ? 'last 7 days' : 'last month'} to chart.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {trend.type === 'bar' ? (
                        <BarChart data={trend.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9E8E8B', fontSize: 10 }} dy={5} />
                          <Bar dataKey="value" fill="#9B4938" radius={[4, 4, 0, 0]} opacity={0.8} />
                        </BarChart>
                      ) : (
                        <LineChart data={trend.data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9E8E8B', fontSize: 10 }} dy={5} />
                          <Line type="monotone" dataKey="value" stroke="#9B4938" strokeWidth={2} dot={{ r: 3, fill: '#9B4938', strokeWidth: 0 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Fade>
      )}

      {/* Show empty symptom state if not enough cycles AND no symptoms */}
      {!hasEnoughCycles && trends.length === 0 && (
        <Fade delay={0.2} className="mt-6">
           <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-sage/20 shadow-sm flex flex-col items-center justify-center text-center">
             <Activity className="text-plum/30 mb-3" size={32} />
             <p className="text-plum/60 font-medium">No symptoms logged recently.</p>
             <p className="text-plum/40 text-sm mt-1">Log how you feel each day to see your trends.</p>
           </div>
        </Fade>
      )}

    </div>
  );
}
