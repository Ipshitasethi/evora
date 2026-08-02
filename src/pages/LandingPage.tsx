
import { HeroSection } from '../components/layout/HeroSection';
import { TestimonialsSection } from '../components/layout/TestimonialsSection';
import { motion } from 'framer-motion';
import { Heart, Sparkles, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const FEATURES = [
  {
    icon: <BarChart2 size={22} className="text-coral" />,
    title: 'Cycle Tracking',
    desc: 'Visualize your entire cycle in a beautiful, intuitive wheel. Understand your phases and predict what\'s coming next.',
    bg: 'bg-blush/30',
  },
  {
    icon: <Sparkles size={22} className="text-plum" />,
    title: 'AI Companion',
    desc: 'Chat with an AI that truly understands menstrual health — answering your questions with warmth, not clinical distance.',
    bg: 'bg-lavender/40',
  },
  {
    icon: <Heart size={22} className="text-coral" />,
    title: 'Symptom Journal',
    desc: 'Track moods, cramps, energy levels, and more. Spot patterns over time and share insights with your healthcare provider.',
    bg: 'bg-sage/30',
  },
];

export function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* Features section */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-coral mb-3 tracking-wide uppercase">What Evora does</p>
          <h2 className="font-serif text-4xl md:text-5xl text-plum leading-tight max-w-2xl mx-auto">
            Everything you need,{' '}
            <em className="not-italic text-coral">nothing you don&rsquo;t</em>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`${f.bg} rounded-3xl p-8 border border-sage/20 shadow-sm cursor-default`}
            >
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                {f.icon}
              </div>
              <h3 className="font-serif text-xl text-plum mb-3">{f.title}</h3>
              <p className="text-plum/60 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <TestimonialsSection />

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-coral/10 rounded-[50%] blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-plum leading-tight">
            Ready to start listening to your body?
          </h2>
          <p className="text-plum/60 text-lg">
            Join thousands of women who are finally feeling in sync with themselves.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="primary" className="shadow-lg shadow-coral/20 mt-4">
              Start for free — no credit card needed
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage/20 py-8 px-6 text-center text-plum/40 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full border border-coral flex items-center justify-center">
            <span className="text-[8px] text-coral font-serif font-bold">E</span>
          </div>
          <span className="font-serif text-plum/60 font-medium">Evora</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Evora Wellness. Built with care, for you.</p>
      </footer>
    </>
  );
}
