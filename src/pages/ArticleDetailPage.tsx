import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { ArrowLeft, Clock, Share2, BookmarkPlus } from 'lucide-react';

export function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const ARTICLES_DB: Record<string, any> = {
    '1': {
      title: 'Understanding Your Cycle Phases',
      category: 'Health',
      readTime: '5 min read',
      thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200&h=600',
      content: (
        <>
          <p className="text-lg md:text-xl leading-relaxed text-plum/90 font-medium mb-8">
            Your menstrual cycle is much more than just your period. It is a continuous, month-long sequence of hormonal changes that influence everything from your energy levels to your mood. Understanding the four phases can help you work with your body, not against it.
          </p>
          <h2>1. Menstruation (Days 1-5)</h2>
          <p>
            This is the start of your cycle, when your estrogen and progesterone levels drop, triggering your uterus to shed its lining. It's completely normal to feel more tired, withdrawn, or reflective during this time.
          </p>
          <ul>
            <li><strong>How you might feel:</strong> Low energy, cramps, wanting to rest.</li>
            <li><strong>What to do:</strong> Prioritize rest, gentle stretching, and warmth. Don't push yourself too hard.</li>
          </ul>
          <h2>2. The Follicular Phase (Days 6-14)</h2>
          <p>
            As your period ends, your pituitary gland releases Follicle Stimulating Hormone (FHS). Estrogen starts to rise, which thickens your uterine lining and boosts your energy and mood.
          </p>
          <ul>
            <li><strong>How you might feel:</strong> Creative, outgoing, energetic, and optimistic.</li>
            <li><strong>What to do:</strong> Start new projects, socialize, and enjoy more intense workouts.</li>
          </ul>
          <h2>3. Ovulation (Around Day 14)</h2>
          <p>
            Estrogen peaks, triggering a surge of Luteinizing Hormone (LH) which releases an egg. This is the shortest phase, lasting only 24 to 48 hours, but you might feel at your absolute best.
          </p>
          <ul>
            <li><strong>How you might feel:</strong> Highly communicative, confident, and energetic.</li>
            <li><strong>What to do:</strong> Schedule important meetings, connect with friends, and enjoy feeling your strongest.</li>
          </ul>
          <h2>4. The Luteal Phase (Days 15-28)</h2>
          <p>
            After ovulation, progesterone rises to prepare your body for a potential pregnancy. If the egg isn't fertilized, hormone levels drop abruptly, leading into PMS symptoms.
          </p>
          <ul>
            <li><strong>How you might feel:</strong> Inward-focused, easily fatigued, hungry, or irritable (especially in the late luteal phase).</li>
            <li><strong>What to do:</strong> Focus on completing tasks, organizing, eating nutrient-dense foods, and scaling back on high-intensity workouts.</li>
          </ul>
          <div className="my-10 p-6 bg-lavender/30 rounded-2xl border border-lavender/50 italic text-plum/70">
            "Your cycle is a vital sign. By paying attention to these shifts, you can start treating your body with the grace and flexibility it deserves."
          </div>
        </>
      )
    },
    '2': {
      title: 'Nutrition for Luteal Phase',
      category: 'Nutrition',
      readTime: '4 min read',
      thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1200&h=600',
      content: (
        <>
          <p className="text-lg md:text-xl leading-relaxed text-plum/90 font-medium mb-8">
            The week before your period—the late luteal phase—is notorious for cravings, mood dips, and bloating. But what you eat can dramatically smooth out these hormonal bumps.
          </p>
          <h2>Why we crave carbs</h2>
          <p>
            During the luteal phase, your basal metabolic rate actually increases slightly. Your body is working harder and needs more calories (about 100-300 more per day). At the same time, serotonin (the "feel-good" hormone) dips. Your body craves carbs because they provide quick energy and help synthesize serotonin.
          </p>
          <h2>What to eat</h2>
          <ul>
            <li><strong>Complex Carbohydrates:</strong> Instead of fighting the carb craving, satisfy it with sweet potatoes, brown rice, quinoa, and oats. These stabilize blood sugar and prevent the crash that worsens PMS mood swings.</li>
            <li><strong>Magnesium-Rich Foods:</strong> Magnesium is a wonder mineral for PMS. It helps reduce water retention, eases breast tenderness, and can alleviate headaches. Load up on spinach, pumpkin seeds, and dark chocolate (yes, that's why you crave chocolate!).</li>
            <li><strong>Healthy Fats:</strong> Omega-3 fatty acids help reduce the inflammation that causes cramps. Think wild-caught salmon, chia seeds, and walnuts.</li>
          </ul>
          <h2>What to limit</h2>
          <p>
            While cravings are strong, try to limit excess sodium (which worsens bloating) and caffeine (which can heighten anxiety and breast tenderness). If you need coffee, make sure you drink it after eating something protein-rich.
          </p>
          <div className="my-10 p-6 bg-lavender/30 rounded-2xl border border-lavender/50 italic text-plum/70">
            "Don't fight your body's increased need for fuel. Nourish it with warm, grounding, and nutrient-dense foods."
          </div>
        </>
      )
    },
    '3': {
      title: 'Gentle Movement for Cramps',
      category: 'Wellness',
      readTime: '3 min read',
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200&h=600',
      content: (
        <>
          <p className="text-lg md:text-xl leading-relaxed text-plum/90 font-medium mb-8">
            When you're dealing with period cramps, the last thing you might want to do is move. However, specific, gentle stretches can increase blood flow to the pelvic region and release tension in your lower back.
          </p>
          <h2>Child's Pose (Balasana)</h2>
          <p>
            This foundational yoga pose targets the lower back muscles, which often ache during menstruation. 
          </p>
          <ul>
            <li>Kneel on the floor with your toes together and knees apart.</li>
            <li>Exhale and lay your torso down between your thighs.</li>
            <li>Extend your arms out in front of you or rest them alongside your body.</li>
            <li>Breathe deeply into your lower back for 1-2 minutes.</li>
          </ul>
          <h2>Supine Twist (Supta Matsyendrasana)</h2>
          <p>
            Twists help stimulate circulation in the abdominal area and relieve spinal tension.
          </p>
          <ul>
            <li>Lie on your back and hug your knees into your chest.</li>
            <li>Drop both knees to the right side, opening your arms out to a "T" shape.</li>
            <li>Gaze over your left shoulder and hold for 5-10 breaths.</li>
            <li>Slowly bring the knees back to center and repeat on the left side.</li>
          </ul>
          <h2>Cat-Cow (Marjaryasana-Bitilasana)</h2>
          <p>
            This gentle flow warms up the spine and gently massages the abdominal organs.
          </p>
          <ul>
            <li>Start on your hands and knees in a tabletop position.</li>
            <li>Inhale as you drop your belly and lift your chest and tailbone (Cow).</li>
            <li>Exhale as you round your spine toward the ceiling and tuck your chin (Cat).</li>
            <li>Move fluidly through these shapes for 10 rounds.</li>
          </ul>
        </>
      )
    }
  };

  const article = ARTICLES_DB[id || '1'] || ARTICLES_DB['1'];
  const { title, category, readTime, thumbnail, content } = article;

  return (
    <article className="max-w-3xl mx-auto px-5 md:px-10 pt-8">
          
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/library')}
            className="flex items-center gap-2 text-sm text-plum/60 hover:text-coral transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to library
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
             <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          </motion.div>

          {/* ── Content ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-plum max-w-none prose-p:text-plum/80 prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-plum prose-a:text-coral"
          >
            {content}
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
              {Object.keys(ARTICLES_DB).filter(k => k !== id).slice(0, 2).map((k) => (
                <Link key={k} to={`/library/${k}`} className="group">
                  <div className="bg-white/60 backdrop-blur-sm border border-sage/20 rounded-3xl overflow-hidden shadow-sm p-4 flex gap-4 transition-all hover:bg-white/90 hover:shadow-md h-full">
                    <div className="w-24 h-24 rounded-2xl bg-sage/30 flex-shrink-0 overflow-hidden">
                      <img src={ARTICLES_DB[k].thumbnail} alt={ARTICLES_DB[k].title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-serif text-plum group-hover:text-coral transition-colors mb-1 line-clamp-2">{ARTICLES_DB[k].title}</h4>
                      <span className="text-xs text-plum/40">{ARTICLES_DB[k].readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </article>
      );
}
