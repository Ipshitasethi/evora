import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { groupPeriodLogsIntoCycles } from '../lib/cycleUtils';
import { Printer, ArrowLeft, Info, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ExportSummaryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // User Info
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState<number | null>(null);
  
  // Force Light Mode for the report
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    if (wasDark) root.classList.remove('dark');
    
    return () => {
      if (wasDark) root.classList.add('dark');
    };
  }, []);
  
  // Data
  const [cycles, setCycles] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [allSymptoms, setAllSymptoms] = useState<any[]>([]);
  const [periodLogs, setPeriodLogs] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);
      try {
        const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');

        const [pLogsRes, sLogsRes, profileRes] = await Promise.all([
          supabase.from('period_logs').select('log_date, flow_intensity').eq('user_id', user!.id).order('log_date', { ascending: true }),
          supabase.from('symptom_logs').select('log_date, symptom, value').eq('user_id', user!.id).gte('log_date', ninetyDaysAgo),
          supabase.from('profiles').select('name, age').eq('id', user!.id).maybeSingle()
        ]);

        if (profileRes.data) {
          if (profileRes.data.name) setProfileName(profileRes.data.name);
          if (profileRes.data.age) setProfileAge(profileRes.data.age);
        }

        const pLogs = pLogsRes.data || [];
        const sLogs = sLogsRes.data || [];
        
        setPeriodLogs(pLogs);
        setAllSymptoms(sLogs);
        
        const { periods: p, cycles: c } = groupPeriodLogsIntoCycles(pLogs as any);
        setPeriods(p);
        setCycles(c);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans text-slate-800">
        <p className="text-slate-500 animate-pulse">Generating clinical report...</p>
      </div>
    );
  }

  // --- Process Data ---
  const hasEnoughCycles = cycles.length >= 2;
  const cycleLengths = cycles.map(c => c.length);
  const avgCycle = hasEnoughCycles ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycles.length) : null;
  const minCycle = hasEnoughCycles ? Math.min(...cycleLengths) : null;
  const maxCycle = hasEnoughCycles ? Math.max(...cycleLengths) : null;
  const cycleVariance = hasEnoughCycles ? maxCycle! - minCycle! : null;

  const periodLengths = periods.map(p => p.length);
  const avgPeriod = periodLengths.length > 0 ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length) : null;

  // Process Dynamic Symptoms
  const validSymptoms = ['mood', 'energy', 'cramps', 'pms', 'sleep', 'hydration', 'flow'];
  const symptomBreakdown: Record<string, { total: number, numeric: boolean, sum: number, counts: Record<string, number> }> = {};
  allSymptoms.forEach(log => {
    if (!log.symptom || !log.value) return;
    const sym = log.symptom.toLowerCase();
    const val = log.value.toLowerCase();
    
    if (!validSymptoms.includes(sym)) return;
    
    if (!symptomBreakdown[sym]) {
      symptomBreakdown[sym] = { total: 0, numeric: true, sum: 0, counts: {} };
    }
    
    symptomBreakdown[sym].total += 1;
    symptomBreakdown[sym].counts[val] = (symptomBreakdown[sym].counts[val] || 0) + 1;
    
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      symptomBreakdown[sym].numeric = false;
    } else {
      symptomBreakdown[sym].sum += parsed;
    }
  });

  const generateSymptomSummary = (sym: string, data: any) => {
    const name = sym.charAt(0).toUpperCase() + sym.slice(1);
    if (data.numeric && data.total > 0) {
      const avg = (data.sum / data.total).toFixed(1);
      return `${name} was logged ${data.total} times, averaging ${avg} per entry.`;
    }
    
    const sorted = Object.entries(data.counts).sort((a: any, b: any) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];
    
    let text = `${name} was logged ${data.total} times.`;
    if (top1) {
      if (sorted.length === 1 || (top1[1] as number) > ((top2?.[1] as number) || 0) * 2) {
        text += ` Predominantly reported as '${top1[0]}'.`;
      } else if (top2) {
        text += ` Most frequently reported as '${top1[0]}' and '${top2[0]}'.`;
      }
    }
    return text;
  };

  // Flags & Doctor Notes
  const flags: string[] = [];
  const insights: string[] = [];
  const questions: string[] = [];

  if (hasEnoughCycles) {
    if (cycleVariance! > 7) {
      flags.push(`Significant cycle length variation detected (${cycleVariance} days between shortest and longest).`);
      questions.push("What might be contributing to the significant variation in my cycle lengths?");
    } else if (cycleVariance! <= 3) {
      insights.push("Cycle length is highly consistent, varying by 3 days or less.");
    }

    if (avgPeriod! > 7) {
      flags.push(`Average menstrual bleeding duration (${avgPeriod} days) exceeds typical ranges.`);
      questions.push("Is my longer-than-average menstrual bleeding a cause for concern?");
    } else if (avgPeriod! < 3) {
      flags.push(`Average menstrual bleeding duration (${avgPeriod} days) is notably short.`);
    }
  }

  const flowCounts: Record<string, number> = {};
  periodLogs.forEach(l => {
    if (l.flow_intensity) {
      flowCounts[l.flow_intensity] = (flowCounts[l.flow_intensity] || 0) + 1;
    }
  });
  const totalFlows = Object.values(flowCounts).reduce((a, b) => a + b, 0);
  if (totalFlows > 0) {
    const heavyCount = flowCounts['heavy'] || 0;
    if (heavyCount > totalFlows * 0.4) {
      flags.push("Menstrual flow is frequently reported as 'heavy'.");
      questions.push("Should we investigate the cause of my frequently heavy menstrual flow?");
    }
  }

  if (symptomBreakdown['cramps'] && (symptomBreakdown['cramps'].counts['severe'] > 2)) {
      flags.push("User frequently reports 'severe' cramps.");
      questions.push("What pain management options can we discuss for my severe cramping?");
  }
  
  if (symptomBreakdown['mood']) {
    const badMoods = (symptomBreakdown['mood'].counts['low'] || 0) + (symptomBreakdown['mood'].counts['unwell'] || 0) + (symptomBreakdown['mood'].counts['irritable'] || 0);
    if (badMoods > symptomBreakdown['mood'].total * 0.5) {
      insights.push("Data indicates a recurring pattern of low or irritable mood.");
      questions.push("Could my recurring low moods be tied to hormonal fluctuations, and how can I manage them?");
    }
  }

  let doctorNote = `The patient${profileAge ? ` is a ${profileAge}-year-old who` : ''} has been tracking their health data using Evora. `;
  if (hasEnoughCycles) {
    doctorNote += `Available records indicate an average cycle length of ${avgCycle} days (ranging from ${minCycle} to ${maxCycle} days) and an average period length of ${avgPeriod} days. `;
  } else {
    doctorNote += `There is currently insufficient historical cycle data to establish baseline averages. `;
  }
  
  if (flags.length > 0) {
    doctorNote += `Notable clinical flags identified include: ${flags.map(f => f.toLowerCase()).join('; ')}. `;
  } else {
    doctorNote += `No significant health flags were automatically identified from the available records. `;
  }
  doctorNote += `A full breakdown of dynamically tracked wellness metrics and symptoms is provided below.`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 print:bg-white print:pb-0">
      
      {/* --- Print Controls --- */}
      <div className="print:hidden max-w-4xl mx-auto px-8 pt-8 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/insights" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={18} />
          <span>Back to App</span>
        </Link>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Printer size={18} />
          <span>Save as PDF / Print</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-sm rounded-xl print:rounded-none overflow-hidden">
        
        {/* --- SECTION 1: COVER & EXECUTIVE SUMMARY --- */}
        <div className="p-10 sm:p-14 print:p-8 border-b border-slate-200">
          <header className="mb-12">
            <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">Clinical Health Summary</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span>Evora Platform</span>
              <span>•</span>
              <span>Generated: {format(new Date(), 'MMM d, yyyy')}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Patient Details</h3>
              <p className="text-lg text-slate-800 font-medium">{profileName || 'Not Provided'}</p>
              {profileAge && <p className="text-sm text-slate-600">Age: {profileAge}</p>}
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">Reporting Period</h3>
              <p className="text-lg text-slate-800 font-medium">Last 90 Days</p>
              <p className="text-sm text-slate-600">Based on self-reported tracking</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 sm:p-8 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" />
              Clinical Summary
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {doctorNote}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Health Flags
              </h2>
              {flags.length > 0 ? (
                <ul className="space-y-3">
                  {flags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span className="leading-relaxed">{flag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No significant health flags were identified from the available records.</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Evidence-Based Insights
              </h2>
              {insights.length > 0 ? (
                <ul className="space-y-3">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span className="leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">No significant trends were detected from the available records.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- SECTION 2: CYCLE OVERVIEW & TIMELINE --- */}
        <div className="p-10 sm:p-14 print:p-8 border-b border-slate-200">
          <h2 className="text-2xl font-light text-slate-900 mb-8 border-b border-slate-100 pb-4">Cycle Overview</h2>
          
          {hasEnoughCycles ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Avg Cycle</p>
                  <p className="text-3xl font-light text-slate-800">{avgCycle} <span className="text-sm text-slate-500">days</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Avg Period</p>
                  <p className="text-3xl font-light text-slate-800">{avgPeriod} <span className="text-sm text-slate-500">days</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Shortest</p>
                  <p className="text-2xl font-light text-slate-700">{minCycle} <span className="text-xs text-slate-400">days</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Longest</p>
                  <p className="text-2xl font-light text-slate-700">{maxCycle} <span className="text-xs text-slate-400">days</span></p>
                </div>
              </div>

              {/* Simple Bar Chart for Cycles */}
              <div className="mb-12">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Cycle Length History</h3>
                <div className="flex items-end gap-2 h-32 w-full border-b border-slate-200 pb-2">
                  {cycles.slice().reverse().map((c, i) => {
                    const heightPct = Math.max(10, (c.length / maxCycle!) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                        <div 
                          className="w-full max-w-[2rem] bg-slate-200 rounded-t-sm transition-all group-hover:bg-slate-300 print:bg-slate-300 print:exact-colors"
                          style={{ height: `${heightPct}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        ></div>
                        <span className="text-xs text-slate-400 font-medium">{c.length}d</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>Older</span>
                  <span>More Recent</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-500 italic mb-12">Insufficient historical data to compute average cycle metrics.</p>
          )}

          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cycle Timeline</h3>
          {cycles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-2 font-medium">Cycle Start</th>
                    <th className="py-3 px-2 font-medium">Cycle End</th>
                    <th className="py-3 px-2 font-medium">Length</th>
                    <th className="py-3 px-2 font-medium">Period Length</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle, i) => {
                    const period = periods.find(p => isSameDay(p.startDate, cycle.startDate));
                    const cycleEndDate = addDays(cycle.startDate, cycle.length - 1);
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-2 text-slate-800">{format(cycle.startDate, 'MMM d, yyyy')}</td>
                        <td className="py-3 px-2 text-slate-800">{format(cycleEndDate, 'MMM d, yyyy')}</td>
                        <td className="py-3 px-2 text-slate-600">{cycle.length} days</td>
                        <td className="py-3 px-2 text-slate-600">{period ? `${period.length} days` : 'Not logged'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 italic">No cycle timeline data available.</p>
          )}
        </div>

        {/* --- SECTION 3: LOGGED WELLNESS DATA & QUESTIONS --- */}
        <div className="p-10 sm:p-14 print:p-8">
          <h2 className="text-2xl font-light text-slate-900 mb-8 border-b border-slate-100 pb-4">Logged Wellness Data</h2>
          
          {Object.keys(symptomBreakdown).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mb-12">
              {Object.entries(symptomBreakdown).map(([sym, data]) => (
                <div key={sym} className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 capitalize mb-1">{sym}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {generateSymptomSummary(sym, data)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic mb-12">No wellness metrics or symptoms logged in the reporting period.</p>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-slate-500" />
              Questions to Discuss
            </h2>
            <p className="text-sm text-slate-600 mb-4">Based on the detected patterns, consider asking your healthcare provider:</p>
            {questions.length > 0 ? (
              <ul className="space-y-3">
                {questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span className="leading-relaxed text-slate-700 font-medium">{q}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm">
                   <span className="text-slate-400 mt-0.5">•</span>
                   <span className="leading-relaxed text-slate-700">Based on my recorded data, does everything appear to be within normal, healthy ranges for my age?</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                   <span className="text-slate-400 mt-0.5">•</span>
                   <span className="leading-relaxed text-slate-700">Are there any specific wellness metrics or symptoms I should prioritize tracking more closely?</span>
                </li>
              </ul>
            )}
          </div>

          <footer className="mt-16 pt-8 border-t border-slate-200 text-xs text-slate-400 leading-relaxed">
            <p className="mb-2 uppercase tracking-widest font-semibold">Disclaimer</p>
            <p>
              This report is generated automatically from self-reported user data stored within the Evora application. 
              The statistics, insights, and flags presented are intended solely to support structured conversations 
              with a healthcare professional. This document does not constitute a medical diagnosis, nor does it replace 
              professional medical advice, evaluation, or treatment.
            </p>
          </footer>
        </div>

      </div>
    </div>
  );
}
