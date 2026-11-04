import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useStore } from '../store/useStore';
import { useT } from '../store/selectors';
import { usePageTitle } from './usePageTitle';

export default function Welcome() {
  const t = useT();
  const navigate = useNavigate();
  const loadDemo = useStore((s) => s.loadDemo);
  const startEmpty = useStore((s) => s.startEmpty);
  // Checked once on mount: the buttons below set `onboarded` themselves and then navigate.
  const [alreadyOnboarded] = useState(() => useStore.getState().onboarded);
  usePageTitle(t('welcome.pageTitle'));

  if (alreadyOnboarded) return <Navigate to="/" replace />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-start gap-6">
        <Logo size={48} />
        <div className="flex flex-col gap-3">
          <h1 className="text-display text-text">{t('welcome.headline')}</h1>
          <p className="text-body text-text-muted">{t('welcome.subline')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          fullWidth
          icon={Sparkles}
          onClick={() => {
            loadDemo();
            navigate('/', { replace: true });
          }}
        >
          {t('welcome.demo')}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={Plus}
          onClick={() => {
            startEmpty();
            navigate('/subscription/new', { replace: true });
          }}
        >
          {t('welcome.manual')}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={Upload}
          onClick={() => {
            startEmpty();
            navigate('/', { replace: true, state: { openImport: true } });
          }}
        >
          {t('welcome.import')}
        </Button>
      </div>
      <p className="text-caption text-text-muted">{t('welcome.note')}</p>
    </main>
  );
}
