import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { useActiveBaby, useToday } from './lib/hooks';
import { GamePlay } from './screens/GamePlay';
import { Growth } from './screens/Growth';
import { Library } from './screens/Library';
import { Moments } from './screens/Moments';
import { Onboarding } from './screens/Onboarding';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Today } from './screens/Today';

const TAB_PATHS = ['/', '/games', '/moments', '/growth', '/progress'];

export function App() {
  const baby = useActiveBaby();
  const today = useToday();
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (baby === undefined) return <div className="app" aria-busy="true" />;
  if (baby === null) {
    return (
      <div className="app">
        <Routes><Route path="*" element={<Onboarding />} /></Routes>
      </div>
    );
  }

  const props = { baby, today };
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today {...props} />} />
        <Route path="/games" element={<Library {...props} />} />
        <Route path="/game/:id" element={<GamePlay key={pathname} {...props} />} />
        <Route path="/moments" element={<Moments {...props} />} />
        <Route path="/growth" element={<Growth {...props} />} />
        <Route path="/progress" element={<Progress {...props} />} />
        <Route path="/settings" element={<Settings {...props} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {TAB_PATHS.includes(pathname) && <TabBar />}
    </div>
  );
}
