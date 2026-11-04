import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { applyTheme } from './lib/theme';
import { useStore } from './store/useStore';
import { useOffersBadge } from './store/selectors';
import Dashboard from './pages/Dashboard';
import Offers from './pages/Offers';
import Settings from './pages/Settings';
import SubscriptionEdit from './pages/SubscriptionEdit';
import Welcome from './pages/Welcome';
import { routerFuture } from './routerFuture';

/** Applies the theme (following the system setting live) and the document language. */
function usePreferences() {
  const theme = useStore((s) => s.profile.theme);
  const language = useStore((s) => s.profile.language);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
}

/** Not onboarded → Welcome. (Welcome itself sends already-onboarded users to the dashboard.) */
function OnboardingGuard({ children }: { children: ReactNode }) {
  const onboarded = useStore((s) => s.onboarded);
  const { pathname } = useLocation();
  if (!onboarded && pathname !== '/welcome') return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function TabLayout() {
  const badge = useOffersBadge();
  return (
    <>
      <Outlet />
      <BottomNav offersBadge={badge} />
    </>
  );
}

export function AppRoutes() {
  usePreferences();
  return (
    <OnboardingGuard>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route element={<TabLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/subscription/new" element={<SubscriptionEdit />} />
        <Route path="/subscription/:id" element={<SubscriptionEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </OnboardingGuard>
  );
}

export default function App() {
  return (
    <HashRouter future={routerFuture}>
      <AppRoutes />
    </HashRouter>
  );
}
