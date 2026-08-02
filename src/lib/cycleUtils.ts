import { differenceInDays, parseISO, format, isValid } from 'date-fns';
import { supabase } from './supabaseClient';

export interface Period {
  startDate: Date;
  endDate: Date;
  length: number;
}

export interface Cycle {
  startDate: Date;
  length: number;
  month: string;
}

/**
 * Parses raw period logs into contiguous periods and full cycles.
 */
export function groupPeriodLogsIntoCycles(logs: { log_date: string; flow_intensity?: string }[]): { periods: Period[], cycles: Cycle[] } {
  const periods: Period[] = [];
  
  if (!logs || logs.length === 0) return { periods: [], cycles: [] };

  // Group continuous days into periods
  let currentStart = parseISO(logs[0].log_date);
  let currentEnd = parseISO(logs[0].log_date);

  for (let i = 1; i < logs.length; i++) {
    const d = parseISO(logs[i].log_date);
    if (!isValid(d)) continue;

    // If within 5 days of the last logged day, it's the same period
    if (differenceInDays(d, currentEnd) <= 5) {
      currentEnd = d;
    } else {
      periods.push({
        startDate: currentStart,
        endDate: currentEnd,
        length: differenceInDays(currentEnd, currentStart) + 1
      });
      currentStart = d;
      currentEnd = d;
    }
  }
  
  // Push the final period
  periods.push({
    startDate: currentStart,
    endDate: currentEnd,
    length: differenceInDays(currentEnd, currentStart) + 1
  });

  // Calculate cycles (requires at least 2 periods)
  const cycles: Cycle[] = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const cLength = differenceInDays(periods[i + 1].startDate, periods[i].startDate);
    cycles.push({
      startDate: periods[i].startDate,
      length: cLength,
      month: format(periods[i].startDate, 'MMM')
    });
  }

  return { periods, cycles };
}

/**
 * Recomputes the user's cycle settings (last_period_start, avg_cycle_length, avg_period_length)
 * by taking a rolling average of their last N actual cycles.
 */
export async function updateCycleAverages(userId: string) {
  try {
    // 1. Fetch all period logs for this user, ordered by date
    const { data: logs } = await supabase
      .from('period_logs')
      .select('log_date, flow_intensity')
      .eq('user_id', userId)
      .order('log_date', { ascending: true });
      
    if (!logs || logs.length === 0) return;

    // 2. Group into periods and cycles
    const validLogs = logs
      .filter((l): l is { log_date: string; flow_intensity: string | null } => l.log_date !== null)
      .map(l => ({ log_date: l.log_date, flow_intensity: l.flow_intensity ?? undefined }));
    const { periods, cycles } = groupPeriodLogsIntoCycles(validLogs);
    
    if (periods.length === 0) return;

    // The most recent period is the last one in the array
    const mostRecentPeriod = periods[periods.length - 1];
    const newLastPeriodStart = format(mostRecentPeriod.startDate, 'yyyy-MM-dd');

    const updates: { last_period_start: string; avg_cycle_length?: number; avg_period_length?: number } = {
      last_period_start: newLastPeriodStart
    };

    // 3. Compute rolling average for cycles (last 6 cycles)
    if (cycles.length > 0) {
      const recentCycles = cycles.slice(-6); // Last 6 cycles
      const totalCycleLen = recentCycles.reduce((acc, c) => acc + c.length, 0);
      updates.avg_cycle_length = Math.round(totalCycleLen / recentCycles.length);
    }

    // 4. Compute rolling average for periods (last 6 periods)
    if (periods.length > 0) {
      const recentPeriods = periods.slice(-6); // Last 6 periods
      const totalPeriodLen = recentPeriods.reduce((acc, p) => acc + p.length, 0);
      updates.avg_period_length = Math.round(totalPeriodLen / recentPeriods.length);
    }

    // 5. Save to database
    await supabase
      .from('cycle_settings')
      .update(updates)
      .eq('user_id', userId);
      
  } catch (error) {
    console.error('Failed to adaptively update cycle averages:', error);
  }
}
