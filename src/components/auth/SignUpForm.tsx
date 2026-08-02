import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabaseClient';

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
}

// Google icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export function SignUpForm() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setServerError('');

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    });

    if (error) {
      setServerError(error.message);
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      // Create or update profile entry with the provided name
      const { error: profileError } = await supabase.from('profiles').upsert({ id: authData.user.id, name: data.name });
      if (profileError) {
        console.error("Error saving name to profile:", profileError);
      }
    }

    if (authData.session === null) {
      // Email confirmation is enabled
      setSuccessMessage(`We've sent a confirmation link to ${data.email} — click it to activate your account.`);
      setIsLoading(false);
      return;
    }

    navigate('/onboarding');
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blush/40 blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-lavender/30 blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo link */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="w-8 h-8 rounded-full border-2 border-coral flex items-center justify-center bg-white shadow-sm">
            <span className="text-[9px] text-coral font-serif font-bold">E</span>
          </div>
          <span className="font-serif text-xl text-plum font-semibold group-hover:text-coral transition-colors">Evora</span>
        </Link>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-sage/20 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-plum mb-2">Welcome to Evora</h1>
            <p className="text-plum/55 text-sm">
              Your wellness journey starts here. No judgment, just support.
            </p>
          </div>

          {/* Google button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 border-sage/30 bg-white text-plum font-medium text-sm hover:border-coral/50 hover:bg-blush/10 transition-all duration-200 mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-sage/30" />
            <span className="text-plum/35 text-xs font-medium">or sign up with email</span>
            <div className="flex-1 h-px bg-sage/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-plum/80 mb-1.5">Your name</label>
              <input
                type="text"
                placeholder="e.g. Priya"
                {...register('name', { required: "We'd love to know your name!" })}
                className="w-full px-4 py-3 rounded-2xl border border-sage/40 bg-cream/60 text-plum text-sm placeholder:text-plum/35 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-plum/80 mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email' },
                })}
                className="w-full px-4 py-3 rounded-2xl border border-sage/40 bg-cream/60 text-plum text-sm placeholder:text-plum/35 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-plum/80 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  {...register('password', {
                    required: 'Please create a password',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border border-sage/40 bg-cream/60 text-plum text-sm placeholder:text-plum/35 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/40 hover:text-plum/70 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-coral/10 border border-coral/30 rounded-xl px-4 py-3 text-coral text-sm flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                {serverError}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="bg-sage/10 border border-sage/40 rounded-xl px-4 py-4 text-plum text-sm text-center">
                <h3 className="font-semibold mb-1">Check your email</h3>
                <p className="opacity-80">{successMessage}</p>
              </div>
            )}

            {!successMessage && (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating your account…' : 'Create my account'}
              </Button>
            )}
          </form>

          <p className="text-center text-plum/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-coral hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-plum/35 text-xs mt-6 leading-relaxed">
          By signing up, you agree to our Terms of Service and Privacy Policy.<br />
          Your data is yours. We never sell it.
        </p>
      </motion.div>
    </div>
  );
}
