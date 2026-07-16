import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore, allowanceUsedForCategory, buildReminders } from '../../app/store';
import { getPlanRules, CATEGORY_LABELS } from '../../app/coverageRules';
import { getSpecialist } from '../../app/specialists';
import { euro, formatDate } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';

export default function Dashboard() {
  const { state } = useStore();
  const { policy, cases } = state;
  const rules = policy ? getPlanRules(policy.planName) : null;

  const reminders = useMemo(() => buildReminders(cases), [cases]);
  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [cases]
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-soft">Welcome back{state.user?.name ? `, ${state.user.name.split(' ')[0]}` : ''}</p>
          <h1 className="font-display text-3xl text-secondary">Your dashboard</h1>
        </div>
        <Button to="/referral/new" size="lg">+ Upload a new referral</Button>
      </div>

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
        <Card className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your cover</p>
              <h2 className="font-display text-2xl text-secondary">{policy.planName}</h2>
              <p className="text-sm text-ink-soft">{policy.insurer} · Policy {policy.policyNumber} · Excess {euro(policy.excess)}</p>
            </div>
            <Button variant="secondary" to="/coverage">View full coverage</Button>
          </div>

          {rules && (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Object.entries(rules.rules).slice(0, 3).map(([category, rule]) => {
                const used = allowanceUsedForCategory(state, category);
                const remaining = Math.max(0, rule.annualCap - used);
                return (
                  <div key={category}>
                    <p className="text-xs text-ink-soft">{CATEGORY_LABELS[category]}</p>
                    <p className="font-display text-xl text-secondary">{euro(remaining)}</p>
                    <p className="text-xs text-ink-soft">of {euro(rule.annualCap)} remaining</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <h2 className="mb-4 font-display text-xl text-secondary">Your referrals</h2>
      {sortedCases.length === 0 ? (
        <Card className="text-center">
          <p className="mb-4 text-sm text-ink-soft">No referrals yet. Upload a GP referral letter to get matched with specialists.</p>
          <Button to="/referral/new" className="mx-auto">Upload a referral</Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedCases.map((c) => {
            const specialist = c.specialistId ? getSpecialist(c.specialistId) : null;
            return (
              <Link key={c.id} to={`/case/${c.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg text-secondary">{c.referral.specialty}</h3>
                      <Badge tone="neutral">{c.referral.urgency}</Badge>
                    </div>
                    <p className="text-sm text-ink-soft">
                      {specialist ? `${specialist.name} · ${specialist.clinic}` : 'Specialist not yet chosen'}
                    </p>
                    <p className="text-xs text-ink-soft">Updated {formatDate(c.updatedAt)}</p>
                  </div>
                  <StatusPill status={c.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
