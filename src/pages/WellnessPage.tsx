import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Utensils, Brain, Activity, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { differenceInDays, parseISO } from 'date-fns';

interface WellnessTip {
  id: string;
  category: 'nutrition' | 'mindfulness' | 'movement';
  phase: string;
  title: string;
  description: string;
}

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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'nutrition': return <Utensils size={18} className="text-coral" />;
    case 'mindfulness': return <Brain size={18} className="text-plum" />;
    case 'movement': return <Activity size={18} className="text-sage-800" />;
    default: return <Sparkles size={18} className="text-coral" />;
  }
};

const getCategoryLabel = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export function WellnessPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get current phase — inline calculation, no external util needed
      const { data: cycle } = await supabase.from('cycle_settings').select('*').eq('user_id', user.id).maybeSingle();
      const cycleLen: number = cycle?.avg_cycle_length ?? 28;
      const lastPeriodStr: string | null = cycle?.last_period_start ?? null;
      let currentPhase = 'follicular';
      if (lastPeriodStr) {
        const dayInCycle = differenceInDays(new Date(), parseISO(lastPeriodStr)) % cycleLen;
        const periodLen: number = cycle?.avg_period_length ?? 5;
        if (dayInCycle < periodLen) currentPhase = 'menstrual';
        else if (dayInCycle < 13) currentPhase = 'follicular';
        else if (dayInCycle < 16) currentPhase = 'ovulation';
        else currentPhase = 'luteal';
      }
      setPhase(currentPhase);

      // Get tips for this phase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tipsData } = await (supabase as any)
        .from('wellness_tips')
        .select('*')
        .eq('phase', currentPhase);
        
      if (tipsData) {
        setTips(tipsData as WellnessTip[]);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return <div className="p-10 text-center text-plum/50">Loading wellness insights...</div>;
  }

  // Group tips by category
  const groupedTips = tips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<string, WellnessTip[]>);

  const categories = ['nutrition', 'mindfulness', 'movement'];

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-10 pt-8 pb-20">
      <Fade delay={0} className="mb-8 border-b border-sage/20 pb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-plum/50 hover:text-plum mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl text-plum leading-snug flex items-center gap-3">
          <Sparkles className="text-coral" size={32} />
          Phase Insights
        </h1>
        <p className="text-plum/60 text-sm mt-2">
          Wellness practices curated for your current <span className="font-medium text-plum capitalize">{phase}</span> phase.
        </p>
      </Fade>

      <div className="space-y-10">
        {categories.map((cat, i) => {
          const catTips = groupedTips[cat] || [];
          if (catTips.length === 0) return null;
          
          return (
            <Fade key={cat} delay={0.1 + (i * 0.1)}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/50 border border-sage/20 shadow-sm flex items-center justify-center">
                  {getCategoryIcon(cat)}
                </div>
                <h2 className="font-serif text-xl text-plum">{getCategoryLabel(cat)}</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {catTips.map((tip) => (
                  <div key={tip.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-sage/20 shadow-sm p-5 hover:border-coral/20 transition-colors">
                    <h3 className="font-medium text-plum mb-1.5">{tip.title}</h3>
                    <p className="text-sm text-plum/60 leading-relaxed">{tip.description}</p>
                  </div>
                ))}
              </div>
            </Fade>
          );
        })}
      </div>
    </div>
  );
}
