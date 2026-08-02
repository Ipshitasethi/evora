import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardSidebar } from '../dashboard/DashboardSidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export function AppLayout() {
  const { session, loading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setIsCheckingOnboarding(false);
      return;
    }
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setHasCompletedOnboarding(data?.onboarding_completed === true);
        setIsCheckingOnboarding(false);
      });
  }, [session]);

  if (loading || isCheckingOnboarding) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (hasCompletedOnboarding === false) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-cream text-plum font-sans">
      {/* Ambient blobs */}
      <div className="fixed -top-40 -right-40 w-[550px] h-[550px] rounded-full bg-blush/20 blur-3xl -z-10 pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-[450px] h-[450px] rounded-full bg-lavender/15 blur-3xl -z-10 pointer-events-none" />

      <DashboardSidebar />
      <TopBar />

      {/* Main content — offset on desktop for sidebar */}
      <main className="lg:ml-56 pb-24 lg:pb-12">
        <Outlet />
      </main>

    </div>
  );
}
