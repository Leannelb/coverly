import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, buildReminders, allowanceUsedForCategory } from '../../app/store';
import { getPlanRules, CATEGORY_LABELS } from '../../app/coverageRules';
import { getSpecialist } from '../../app/specialists';
import { euro, formatDate } from '../../app/format';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';

export default function Home() {
  const { state } = useStore();
  const { user, policy, cases } = state;
  const rules = policy ? getPlanRules(policy.planName) : null;

  const reminders = useMemo(() => buildReminders(cases), [cases]);
  const activeCases = cases.filter((c) => c.status !== 'rebate_received').length;
  const documentCount = cases.reduce((sum, c) => sum + c.documents.length, 0);
  const recentCases = useMemo(
    () => [...cases].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3),
    [cases]
  );

  const cards = [
    {
      to: '/referral/new',
      icon: '📤',
      title: 'Upload a referral',
      subtitle: 'Takes 2 minutes',
      highlight: true,
    },
    {
      to: '/dashboard',
      icon: '🗂️',
      title: 'My cases',
      subtitle: cases.length === 0 ? 'Nothing tracked yet' : `${activeCases} active`,
    },
    {
      to: '/coverage',
      icon: '🛡️',
      title: 'Coverage',
      subtitle: policy ? policy.planName : 'Add your policy',
    },
    {
      to: '/documents',
      icon: '📄',
      title: 'Documents',
      subtitle: documentCount === 0 ? 'Nothing uploaded yet' : `${documentCount} file${documentCount === 1 ? '' : 's'}`,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-ink-soft">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</p>
      <h1 className="mb-6 font-display text-3xl text-secondary">Your dashboard</h1>

      {reminders.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {reminders.map((r) => (
            <Link
              key={r.id}
              to={`/case/${r.caseId}`}
              className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
            >
              ⚠ {r.text}
            </Link>
          ))}
        </div>
      )}

      {policy && (
        <Card className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your cover</p>
          <h2 className="mb-3 font-display text-xl text-secondary">{policy.planName}</h2>
          {rules && (
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(rules.rules).slice(0, 3).map(([category, rule]) => {
                const used = allowanceUsedForCategory(state, category);
                const remaining = Math.max(0, rule.annualCap - used);
                return (
                  <div key={category}>
                    <p className="text-xs text-ink-soft">{CATEGORY_LABELS[category]}</p>
                    <p className="font-display text-lg text-secondary">{euro(remaining)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`rounded-2xl border p-5 transition-colors ${
              c.highlight
                ? 'border-primary bg-primary text-white hover:bg-primary-dark'
                : 'border-line bg-white hover:border-primary/40 hover:bg-primary-light'
            }`}
          >
            <span
              className={`mb-5 flex h-9 w-9 items-center justify-center rounded-lg text-lg ${
                c.highlight ? 'bg-white/15' : 'bg-primary-light'
              }`}
            >
              {c.icon}
            </span>
            <span className={`block whitespace-nowrap text-lg font-medium ${c.highlight ? 'text-white' : 'text-secondary'}`}>
              {c.title}
            </span>
            <span className={`block text-xs ${c.highlight ? 'text-white/80' : 'text-ink-soft'}`}>{c.subtitle}</span>
          </Link>
        ))}
      </div>

      {recentCases.length > 0 && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent</p>
          <div className="flex flex-col gap-2">
            {recentCases.map((c) => {
              const specialist = c.specialistId ? getSpecialist(c.specialistId) : null;
              return (
                <Link key={c.id} to={`/case/${c.id}`}>
                  <Card className="flex items-center justify-between gap-3 py-3 transition-colors hover:border-primary/40">
                    <div>
                      <p className="text-sm font-medium text-secondary">
                        {c.referral.specialty}
                        {specialist ? ` · ${specialist.name}` : ''}
                      </p>
                      <p className="text-xs text-ink-soft">Updated {formatDate(c.updatedAt)}</p>
                    </div>
                    <StatusPill status={c.status} />
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
