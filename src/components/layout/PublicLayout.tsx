import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-cream text-plum font-sans relative">
      <Navbar />
      <Outlet />
    </div>
  );
}
