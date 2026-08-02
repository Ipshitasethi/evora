import { motion } from 'framer-motion';
import { useMemo, useState, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CycleWheelProps {
  lastPeriodStart: Date;
  avgCycleLength: number;
  periodLength: number;
  currentDateStr?: string;
}

interface PhaseArc {
  name: string;
  startDay: number;
  endDay: number;
  color: string;
  strokeColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RADIUS = 110;
const STROKE = 18;
const CENTER = 140;
const VIEW_BOX = CENTER * 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dayOfCycle(lastPeriodStart: Date, avgCycleLength: number): number {
  const diff = Math.floor((Date.now() - lastPeriodStart.getTime()) / 86_400_000);
  return (Math.max(0, diff) % avgCycleLength) + 1;
}

function buildPhases(cycleLen: number, periodLen: number): PhaseArc[] {
  const follicularEnd = Math.floor(cycleLen * 0.46);
  const ovulationEnd = follicularEnd + Math.max(1, Math.floor(cycleLen * 0.07));
  return [
    { name: 'Menstrual', startDay: 1, endDay: periodLen, color: '#9B4938', strokeColor: '#9B4938' },
    { name: 'Follicular', startDay: periodLen + 1, endDay: follicularEnd, color: '#F2C464', strokeColor: '#F2C464' },
    { name: 'Ovulation', startDay: follicularEnd + 1, endDay: ovulationEnd, color: '#D4829C', strokeColor: '#D4829C' },
    { name: 'Luteal', startDay: ovulationEnd + 1, endDay: cycleLen, color: '#BEB4D4', strokeColor: '#BEB4D4' },
  ];
}

function getCurrentPhase(day: number, phases: PhaseArc[]): PhaseArc {
  const d = ((day - 1) % phases[phases.length - 1].endDay) + 1;
  for (const p of phases) {
    if (d >= p.startDay && d <= p.endDay) return p;
  }
  return phases[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseIllustration({ phase }: { phase: string }) {
  return (
    <svg width="240" height="120" viewBox="0 0 240 120" className="drop-shadow-sm overflow-visible">
      {/* Connecting Line (Fallopian Tube Abstraction) */}
      <path
        d="M 60 55 Q 100 20, 140 60"
        fill="none"
        stroke="#FCF6F0"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M 60 55 Q 100 20, 140 60"
        fill="none"
        stroke="#E6D3D3"
        strokeWidth="10"
        strokeLinecap="round"
      />
      
      {/* Ovary (Left) */}
      <motion.ellipse
        cx="50" cy="55"
        rx="26" ry="32"
        fill="#FCF6F0"
        stroke="#D4829C"
        strokeWidth="4"
        animate={
           phase === 'Follicular' ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 4 } } : {}
        }
      />
      
      {/* Uterus (Right) */}
      <motion.path
        d="M 130 50 C 130 30, 190 30, 190 50 C 195 90, 175 110, 160 110 C 145 110, 125 90, 130 50 Z"
        fill="#FCF6F0"
        stroke="#9B4938"
        strokeWidth="4"
        animate={{
          fill: phase === 'Luteal' ? '#F2C1B6' : '#FCF6F0',
        }}
        transition={{ duration: 1.5 }}
      />
      
      {/* ── Phase specific animations ── */}
      
      {/* Menstrual: red particles shedding from uterus */}
      {phase === 'Menstrual' && (
         <g>
           {[1,2,3].map(i => (
              <motion.circle
                key={`m-${i}`}
                cx={160 + (i - 2) * 12}
                r="3.5"
                fill="#9B4938"
                initial={{ cy: 80, opacity: 1 }}
                animate={{ cy: 120, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              />
           ))}
         </g>
      )}

      {/* Follicular: egg growing in ovary */}
      {phase === 'Follicular' && (
         <motion.circle
            cx="50" cy="55"
            fill="#F2C464"
            initial={{ r: 2 }}
            animate={{ r: 8 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
         />
      )}

      {/* Ovulation: pulse in ovary & egg traveling along line */}
      {phase === 'Ovulation' && (
         <g>
           {/* Glow/Pulse in Ovary */}
           <motion.circle
              cx="50" cy="55" r="8"
              fill="#F2C464"
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: [0.5, 0, 0.5], scale: [1, 2.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
           />
           {/* Traveling egg */}
           <motion.circle
              r="6"
              fill="#F2C464"
              initial={{ cx: 50, cy: 55, opacity: 1 }}
              animate={{ 
                 cx: [50, 95, 135, 145], 
                 cy: [55, 30, 60, 70],
                 opacity: [1, 1, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, times: [0, 0.4, 0.8, 1], ease: "easeInOut" }}
           />
         </g>
      )}
    </svg>
  );
}

function PhaseExplainerCard({ phase }: { phase: string }) {
  let description = '';
  if (phase === 'Menstrual') description = "Your body is shedding your uterine lining — this is your period. It's normal to feel low-energy; rest and gentle movement help.";
  else if (phase === 'Follicular') description = "Your body is preparing an egg, and rising estrogen often brings more energy and focus — a good window for starting new things.";
  else if (phase === 'Ovulation') description = "An egg is released — this is your most fertile window. Many people feel a natural boost in energy and confidence around now.";
  else if (phase === 'Luteal') description = "Hormone levels rise then fall as your body prepares for a possible pregnancy — this is often when PMS symptoms like mood changes or fatigue show up.";

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-sage/20 shadow-sm w-full max-w-md mt-6">
      <div className="h-40 w-full flex items-center justify-center relative mb-4">
        <PhaseIllustration phase={phase} />
      </div>
      <motion.p
        key={phase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-sm text-plum/70 text-center leading-relaxed font-medium"
      >
        {description}
      </motion.p>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export function CycleWheel({ lastPeriodStart, avgCycleLength, periodLength, currentDateStr }: CycleWheelProps) {
  const today = useMemo(() => dayOfCycle(lastPeriodStart, avgCycleLength), [lastPeriodStart, avgCycleLength]);
  const effectiveDay = ((today - 1) % avgCycleLength) + 1;
  const phases = useMemo(() => buildPhases(avgCycleLength, periodLength), [avgCycleLength, periodLength]);
  
  // Interactive Preview State
  const [isDragging, setIsDragging] = useState(false);
  const [previewDay, setPreviewDay] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const displayDay = previewDay !== null ? previewDay : effectiveDay;
  const currentPhase = useMemo(() => getCurrentPhase(displayDay, phases), [displayDay, phases]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + CENTER;
    const cy = rect.top + CENTER;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    
    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI; 
    deg = (deg + 90) % 360; 
    if (deg < 0) deg += 360; 

    let day = Math.round((deg / 360) * avgCycleLength) + 1;
    if (day > avgCycleLength) day = avgCycleLength;
    if (day < 1) day = 1;

    setPreviewDay(day);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Short pause before reverting to today
    hideTimeoutRef.current = window.setTimeout(() => {
      setPreviewDay(null);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Compute indicator position
  const displayAngle = ((displayDay - 1) / avgCycleLength) * 360 - 90; 
  const displayRad = (displayAngle * Math.PI) / 180;
  const dotX = CENTER + RADIUS * Math.cos(displayRad);
  const dotY = CENTER + RADIUS * Math.sin(displayRad);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── SVG Ring ── */}
      <div className="relative">
        <svg ref={svgRef} width={VIEW_BOX} height={VIEW_BOX} className="drop-shadow-sm touch-none">
          {/* Background ring */}
          <circle
            cx={CENTER} cy={CENTER} r={RADIUS}
            fill="none" stroke="#EDE8E4" strokeWidth={STROKE}
          />

          {/* Phase arcs */}
          {phases.map((phase, i) => {
            const segDays = phase.endDay - phase.startDay + 1;
            const segFraction = segDays / avgCycleLength;
            const startFraction = (phase.startDay - 1) / avgCycleLength;

            const dashLen = segFraction * CIRCUMFERENCE;
            const gapLen = CIRCUMFERENCE - dashLen;
            const offset = -(startFraction * CIRCUMFERENCE);

            return (
              <motion.circle
                key={phase.name}
                cx={CENTER} cy={CENTER} r={RADIUS}
                fill="none"
                stroke={phase.strokeColor}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${dashLen} ${gapLen}`}
                strokeDashoffset={offset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 * i, ease: 'easeOut' as const }}
              />
            );
          })}

          {/* Thin separator lines between phases */}
          {phases.map((phase) => {
            const angle = ((phase.startDay - 1) / avgCycleLength) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const inner = RADIUS - STROKE / 2 - 1;
            const outer = RADIUS + STROKE / 2 + 1;
            return (
              <line
                key={`sep-${phase.name}`}
                x1={CENTER + inner * Math.cos(rad)}
                y1={CENTER + inner * Math.sin(rad)}
                x2={CENTER + outer * Math.cos(rad)}
                y2={CENTER + outer * Math.sin(rad)}
                stroke="#FCF6F0" strokeWidth={2}
              />
            );
          })}

          {/* Today/Preview marker — outer dot */}
          <motion.circle
            cx={dotX} cy={dotY} r={10}
            fill="white" stroke={currentPhase.strokeColor} strokeWidth={4}
            initial={{ scale: 0 }}
            animate={{ cx: dotX, cy: dotY, scale: isDragging ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, scale: { duration: 0.2 } }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ cursor: 'grab', touchAction: 'none' }}
          />
          {/* Inner glow */}
          <motion.circle
            cx={dotX} cy={dotY} r={18}
            fill={currentPhase.strokeColor} opacity={0.15}
            initial={{ scale: 0 }}
            animate={{ cx: dotX, cy: dotY, scale: isDragging ? 1.5 : [0, 1.4, 1] }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, scale: { delay: isDragging ? 0 : 0.8, duration: 0.5 } }}
            className="pointer-events-none"
          />
        </svg>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <motion.span 
            className="text-xs uppercase tracking-widest text-plum/45 mb-1"
            animate={{ opacity: isDragging ? 0.7 : 1 }}
          >
            {previewDay !== null ? 'Preview' : 'Current phase'}
          </motion.span>
          
          <motion.span 
            className="font-serif text-2xl font-semibold transition-colors duration-200" 
            style={{ color: currentPhase.color }}
          >
            {currentPhase.name}
          </motion.span>
          
          <span className="text-sm text-plum/55 mt-1 font-medium tabular-nums">
            Day {displayDay} of {avgCycleLength}
          </span>

          <span className="text-[10px] uppercase tracking-wider font-bold text-plum/30 mt-1">
            {currentDateStr || 'Today'}
          </span>
        </div>
      </div>

      {/* ── Phase Legend ── */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 -mt-2">
        {phases.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className={`text-xs ${p.name === currentPhase.name ? 'text-plum font-semibold' : 'text-plum/45'}`}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* ── New Phase Explainer Diagram ── */}
      <PhaseExplainerCard phase={currentPhase.name} />

    </div>
  );
}
