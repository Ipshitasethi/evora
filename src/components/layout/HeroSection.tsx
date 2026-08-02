import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

// Animated organic blob background
function HeroBlob({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -18, 0],
        x: [0, 8, 0],
        scale: [1, 1.04, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-6">
      {/* Decorative blobs */}
      <HeroBlob
        delay={0}
        className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-blush/60 blur-3xl -z-10"
      />
      <HeroBlob
        delay={2}
        className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-coral/20 blur-3xl -z-10"
      />
      <HeroBlob
        delay={4}
        className="absolute -bottom-16 left-1/3 w-[360px] h-[360px] rounded-[30%_60%_70%_40%/50%_60%_30%_60%] bg-lavender/50 blur-3xl -z-10"
      />

      {/* Hero content */}
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-5 py-2 rounded-full border border-sage/30 text-sm font-medium text-plum shadow-sm"
        >
          <Sparkles size={14} className="text-coral" />
          <span>AI-powered menstrual wellness companion</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="text-5xl md:text-7xl font-serif text-plum leading-[1.1] tracking-tight"
        >
          Know your body.{' '}
          <br className="hidden sm:block" />
          <em className="text-coral not-italic">Trust your rhythm.</em>
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="text-lg md:text-xl text-plum/65 max-w-2xl mx-auto leading-relaxed"
        >
          Evora gives you personalized menstrual health tracking and an AI wellness
          companion that understands your cycle — so you always feel supported, not alone.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link to="/signup">
            <Button size="lg" variant="primary" className="gap-2 shadow-lg shadow-coral/20">
              Get Started — it&rsquo;s free
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/login" className="text-plum/60 hover:text-coral transition-colors text-sm font-medium underline underline-offset-4">
            Already have an account? Log in
          </Link>
        </motion.div>

        {/* Social proof whisper */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xs text-plum/40 pt-2"
        >
          Trusted by thousands of women on their wellness journey
        </motion.p>
      </div>
    </section>
  );
}
