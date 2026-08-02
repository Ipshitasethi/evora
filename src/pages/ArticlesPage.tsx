import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { BookOpen, PlayCircle, Clock } from 'lucide-react';

// ─── Shared ──────────────────────────────────────────────────────────────────
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

// ─── Data ────────────────────────────────────────────────────────────────────
const ARTICLES = [
  { id: '1', title: 'Managing Back Pain During Periods', excerpt: 'Gentle stretches and remedies to ease lower back discomfort.', readTime: '5 min read', category: 'Symptom Relief' },
  { id: '2', title: 'Sleep and the Menstrual Cycle', excerpt: 'How fluctuating hormones impact your sleep quality and what you can do.', readTime: '7 min read', category: 'Wellness' },
  { id: '3', title: 'Understanding UTIs', excerpt: 'Causes, prevention, and when it is time to see a doctor.', readTime: '6 min read', category: 'Health' },
  { id: '4', title: 'Nutrition During Your Cycle', excerpt: 'Foods that support your body through each phase of your cycle.', readTime: '8 min read', category: 'Nutrition' },
  { id: '5', title: 'Managing Mood Swings', excerpt: 'Navigating emotional changes with self-compassion and care.', readTime: '5 min read', category: 'Mental Health' },
];

const VIDEOS = [
  { id: '1', title: 'Guided Stretches for Period Cramps', duration: '12:40', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: '2', title: 'Yoga for PCOS', duration: '20:15', thumbnail: 'https://images.unsplash.com/photo-1593810450967-f9c42732e326?auto=format&fit=crop&q=80&w=400&h=250' },
  { id: '3', title: 'Understanding Your Cycle Simply', duration: '08:30', thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=400&h=250' },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export function ArticlesPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 pt-8">
          
          <Fade delay={0} className="mb-8 border-b border-sage/20 pb-4">
            <h1 className="font-serif text-3xl md:text-4xl text-plum leading-snug flex items-center gap-3">
              <BookOpen className="text-coral" size={32} />
              Library
            </h1>
            <p className="text-plum/50 text-sm mt-2">Articles and guides tailored to your well-being.</p>
          </Fade>

          {/* ── Articles Grid ── */}
          <div className="mb-12">
            <Fade delay={0.1}>
              <h2 className="font-serif text-xl text-plum mb-6">Featured Articles</h2>
            </Fade>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ARTICLES.map((article, i) => (
                <Fade key={article.id} delay={0.15 + i * 0.05}>
                  <Link to={`/articles/${article.id}`}>
                    <motion.div 
                      whileHover={{ y: -4 }}
                      className="bg-white/80 backdrop-blur-sm border border-sage/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all h-full flex flex-col group"
                    >
                      <div className="h-40 bg-blush/30 relative overflow-hidden">
                        {/* Placeholder abstract shapes for images */}
                        <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-coral/20 to-plum/10" />
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-coral/20 blur-xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-white/70 backdrop-blur-md rounded-full text-[10px] font-semibold text-plum uppercase tracking-wider">
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-serif text-lg text-plum mb-2 group-hover:text-coral transition-colors">{article.title}</h3>
                        <p className="text-sm text-plum/60 mb-4 flex-1 line-clamp-2">{article.excerpt}</p>
                        <div className="flex items-center gap-1.5 text-xs text-plum/40 mt-auto">
                          <Clock size={14} />
                          {article.readTime}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </Fade>
              ))}
            </div>
          </div>

          {/* ── Watch & Learn ── */}
          <div>
            <Fade delay={0.3}>
              <h2 className="font-serif text-xl text-plum mb-6 flex items-center gap-2">
                <PlayCircle className="text-coral" size={24} />
                Watch & Learn
              </h2>
            </Fade>
            <div className="flex overflow-x-auto pb-6 -mx-5 px-5 md:mx-0 md:px-0 gap-6 snap-x hide-scrollbar">
              {VIDEOS.map((video, i) => (
                <Fade key={video.id} delay={0.35 + i * 0.05} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/80 backdrop-blur-sm border border-sage/20 rounded-3xl overflow-hidden shadow-sm cursor-pointer group"
                  >
                    <div className="relative aspect-video bg-sage/20">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-plum/20 group-hover:bg-plum/10 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <PlayCircle className="text-coral ml-1" size={24} />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-base text-plum line-clamp-2">{video.title}</h3>
                    </div>
                  </motion.div>
                </Fade>
              ))}
            </div>
          </div>
    </div>
  );
}
