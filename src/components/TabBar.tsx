import { Gamepad2, LineChart, ListChecks, Sparkles, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Today', icon: ListChecks, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/moments', label: 'Moments', icon: Sparkles },
  { to: '/growth', label: 'Growth', icon: LineChart },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <Icon size={22} strokeWidth={2} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
