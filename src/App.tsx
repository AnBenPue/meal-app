import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  ClipboardList,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
} from 'lucide-react';
import Dashboard from '@/pages/Dashboard';
import Recipes from '@/pages/Recipes';
import Planner from '@/pages/Planner';
import FoodLog from '@/pages/FoodLog';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/log', label: 'Food Log', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

function App() {
  const { loaded, loadSettings } = useSettingsStore();
  const { user, loading: authLoading, initialize, signOut } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user && !loaded) loadSettings();
  }, [user, loaded, loadSettings]);

  useTheme();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen">
        {/* Sidebar — desktop */}
        <nav className="hidden md:flex w-64 flex-col border-r bg-card p-4 gap-1 shrink-0">
          <h1 className="text-xl font-bold text-primary mb-6 px-3">
            MealApp
          </h1>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <div className="mt-auto">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </nav>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/log" element={<FoodLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card flex justify-around py-2 z-50">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
