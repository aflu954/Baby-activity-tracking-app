import { Baby as BabyIcon, Brain, ChevronLeft, Footprints, Heart, MessageCircle, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Area } from '../data/milestones';

export const AREA_ICONS: Record<Area, typeof Footprints> = {
  motor: Footprints,
  language: MessageCircle,
  cognitive: Brain,
  social: Heart,
};

export function AreaIcon({ area, size = 20 }: { area: Area; size?: number }) {
  const Icon = AREA_ICONS[area] ?? BabyIcon;
  return <Icon size={size} strokeWidth={2} aria-hidden />;
}

export function AreaDots({ areas }: { areas: Area[] }) {
  return (
    <span className="dots" aria-hidden>
      {areas.map((a) => <i key={a} className="dot" data-area={a} />)}
    </span>
  );
}

export function ProgressBar({ value, max, color, label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <i style={{ width: `${pct}%`, ...(color ? { ['--bar' as string]: color } : {}) }} />
    </div>
  );
}

export function BackButton({ to, label = 'Back' }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="back" onClick={() => (to ? navigate(to) : navigate(-1))}>
      <ChevronLeft size={18} aria-hidden /> {label}
    </button>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="split">
          <h2 className="h2">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}
