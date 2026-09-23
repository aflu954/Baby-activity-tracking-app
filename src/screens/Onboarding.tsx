import { useNavigate } from 'react-router-dom';
import { useToday } from '../lib/hooks';
import { BabyForm } from './BabyForm';

export function Onboarding() {
  const today = useToday();
  const navigate = useNavigate();
  return (
    <main className="screen no-tabs">
      <header style={{ paddingTop: 24 }}>
        <p className="label" style={{ color: 'var(--coral-text)' }}>Sbaby Play</p>
        <h1 className="h1">A little play, every day</h1>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          Tell us about your baby and we’ll suggest a short checklist of games for their age each day — about 20–30 minutes.
        </p>
      </header>
      <div className="card">
        <BabyForm today={today} onSaved={() => navigate('/', { replace: true })} submitLabel="Start playing" />
      </div>
      <p className="footer-note">Everything stays on this device. No account needed.</p>
    </main>
  );
}
