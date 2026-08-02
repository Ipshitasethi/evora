import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { ArrowLeft, Clock, Share2, BookmarkPlus } from 'lucide-react';

export function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Placeholder content since we don't have a real CMS yet
  const title = id === '1' ? 'Managing Back Pain During Periods' : 'Understanding Your Body';
  const category = 'Symptom Relief';
  const readTime = '5 min read';

  return (
    <article className="max-w-3xl mx-auto px-5 md:px-10 pt-8">
          
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/articles')}
            className="flex items-center gap-2 text-sm text-plum/60 hover:text-coral transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to articles
          </motion.button>

          {/* ── Header ── */}
          <motion.header 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-coral/10 text-coral rounded-full text-[10px] font-semibold uppercase tracking-wider">
                {category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-plum/40">
                <Clock size={14} />
                {readTime}
              </span>
            </div>
            
            <h1 className="font-serif text-3xl md:text-5xl text-plum leading-tight mb-6">
              {title}
            </h1>

            <div className="flex items-center justify-between py-4 border-y border-sage/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-plum/10 flex items-center justify-center font-serif text-plum">
                  E
                </div>
                <div>
                  <p className="text-sm font-medium text-plum">Evora Editorial</p>
                  <p className="text-xs text-plum/40">Reviewed by Medical Team</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-white border border-sage/30 flex items-center justify-center text-plum/60 hover:text-coral hover:border-coral/30 transition-colors shadow-sm">
                  <BookmarkPlus size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white border border-sage/30 flex items-center justify-center text-plum/60 hover:text-coral hover:border-coral/30 transition-colors shadow-sm">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.header>

          {/* ── Hero Image ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full aspect-[21/9] bg-blush/30 rounded-3xl mb-12 relative overflow-hidden"
          >
             <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-coral/20 to-plum/10" />
             <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-coral/20 blur-3xl" />
          </motion.div>

          {/* ── Content ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-plum max-w-none prose-p:text-plum/80 prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-plum prose-a:text-coral"
          >
            <p className="text-lg md:text-xl leading-relaxed text-plum/90 font-medium mb-8">
              Lower back pain during your period is incredibly common, but that doesn't mean you just have to power through it. Here's a gentle guide to understanding why it happens and how to find relief.
            </p>

            <h2>Why does my back hurt?</h2>
            <p>
              During your period, your body releases prostaglandins — hormone-like substances that help your uterus contract and shed its lining. If your body produces too many prostaglandins, these contractions can be stronger and the pain can radiate from your lower abdomen into your lower back and thighs.
            </p>

            <h2>Gentle ways to find relief</h2>
            <ul>
              <li><strong>Heat therapy:</strong> A heating pad or hot water bottle placed on your lower back increases blood flow and relaxes tense muscles.</li>
              <li><strong>Gentle movement:</strong> While a heavy workout might feel impossible, light stretching or walking can release endorphins, which are natural painkillers.</li>
              <li><strong>Hydration:</strong> Drinking plenty of water helps reduce bloating, which can sometimes exacerbate back pressure.</li>
            </ul>

            <div className="my-10 p-6 bg-lavender/30 rounded-2xl border border-lavender/50 italic text-plum/70">
              "Remember, your body is doing hard work right now. It is completely okay to pause and give yourself the comfort you need."
            </div>

            <h2>When to talk to a doctor</h2>
            <p>
              While mild to moderate back pain is standard, severe pain that stops you from doing daily activities, or pain that persists long after your period ends, is worth discussing with a healthcare professional to rule out conditions like endometriosis.
            </p>
          </motion.div>

          {/* ── Related ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 pt-10 border-t border-sage/20"
          >
            <h3 className="font-serif text-2xl text-plum mb-6">Read next</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Link key={i} to="/articles/2" className="group">
                  <div className="bg-white/60 backdrop-blur-sm border border-sage/20 rounded-3xl overflow-hidden shadow-sm p-4 flex gap-4 transition-all hover:bg-white/90 hover:shadow-md">
                    <div className="w-24 h-24 rounded-2xl bg-sage/30 flex-shrink-0" />
                    <div className="flex flex-col justify-center">
                      <h4 className="font-serif text-plum group-hover:text-coral transition-colors mb-1 line-clamp-2">Sleep and the Menstrual Cycle</h4>
                      <span className="text-xs text-plum/40">7 min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </article>
      );
}
