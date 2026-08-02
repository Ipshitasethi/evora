import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { EvoraLogo } from '../ui/EvoraLogo';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full py-5 px-6 md:px-12 flex items-center justify-between z-50 relative">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <EvoraLogo size={38} />
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-plum/70 hover:text-coral transition-colors text-sm font-medium">Features</a>
        <a href="#testimonials" className="text-plum/70 hover:text-coral transition-colors text-sm font-medium">Stories</a>
        {user ? (
          <>
            <Link to="/cycle">
              <Button variant="ghost" size="sm">Cycle</Button>
            </Link>
            <Link to="/account">
              <Button variant="ghost" size="sm">Account</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={signOut}>Sign Out</Button>
          </>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </>
        )}
      </nav>

      {/* Mobile menu toggle */}
      <button
        className="md:hidden text-plum p-1"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 bg-cream/95 backdrop-blur-sm border-b border-sage/20 px-6 py-6 flex flex-col gap-4 md:hidden shadow-md"
          >
            <a href="#features" className="text-plum/70 hover:text-coral transition-colors font-medium" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#testimonials" className="text-plum/70 hover:text-coral transition-colors font-medium" onClick={() => setMenuOpen(false)}>Stories</a>
            <div className="flex flex-col gap-3 pt-2 border-t border-sage/20">
              {user ? (
                <>
                  <Button variant="secondary" onClick={() => { navigate('/cycle'); setMenuOpen(false); }}>Cycle</Button>
                  <Button variant="primary" onClick={() => { signOut(); setMenuOpen(false); }}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Log In</Button>
                  <Button variant="primary" onClick={() => { navigate('/signup'); setMenuOpen(false); }}>Get Started</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
