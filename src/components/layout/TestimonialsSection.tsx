import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      "Evora made me feel like I finally understood what my body was trying to tell me. The AI companion feels like talking to a knowledgeable friend — never clinical, always kind.",
    name: "Priya M.",
    label: "Using Evora for 6 months",
    rotate: -2,
    bg: "bg-white",
    accent: "text-coral",
  },
  {
    quote:
      "I used to dread my period week. Now I can actually plan around it with confidence. The cycle predictions are surprisingly accurate, and the daily tips are so thoughtful.",
    name: "Sara J.",
    label: "Using Evora for 3 months",
    rotate: 1.5,
    bg: "bg-blush/30",
    accent: "text-plum",
  },
  {
    quote:
      "Having an app that doesn't make me feel broken or medicalized is everything. Evora treats my health like something to celebrate, not manage.",
    name: "Leila K.",
    label: "Using Evora for a year",
    rotate: -1,
    bg: "bg-lavender/40",
    accent: "text-coral",
  },
  {
    quote:
      "The symptom tracking is a game changer — my doctor was so impressed with the detailed history I could share. Evora gave me language for things I'd been feeling for years.",
    name: "Meena R.",
    label: "Using Evora for 9 months",
    rotate: 2,
    bg: "bg-white",
    accent: "text-plum",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Soft bg blob */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blush/20 rounded-[50%] blur-3xl" />
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 max-w-2xl mx-auto"
      >
        <p className="text-sm font-medium text-coral mb-3 tracking-wide uppercase">Real stories</p>
        <h2 className="font-serif text-4xl md:text-5xl text-plum leading-tight">
          Women who found{' '}
          <em className="not-italic text-coral">their rhythm</em>
        </h2>
        <p className="mt-4 text-plum/60 text-lg">
          Because every body is different, and every story deserves to be heard.
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start"
      >
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ rotate: `${t.rotate}deg` }}
            className={`${t.bg} rounded-3xl p-6 shadow-md border border-sage/20 flex flex-col gap-4 cursor-default`}
          >
            <Quote size={20} className={`${t.accent} opacity-60 flex-shrink-0`} />
            <p className="text-plum/80 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
            <div className="pt-2 border-t border-sage/20">
              <p className="font-semibold text-plum text-sm">{t.name}</p>
              <p className="text-plum/45 text-xs mt-0.5">{t.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
