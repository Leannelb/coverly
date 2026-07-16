import { useStore, allowanceUsedForCategory } from '../../app/store';
import { getPlanRules, CATEGORY_LABELS } from '../../app/coverageRules';
import { euro } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function Coverage() {
  const { state } = useStore();
  const { policy } = state;
  const rules = policy ? getPlanRules(policy.planName) : null;

  if (!policy) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">No policy on file yet.</p>
        <Button to="/onboarding" className="mt-4">Add your policy</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{policy.insurer}</p>
          <h1 className="font-display text-3xl text-secondary">{policy.planName}</h1>
          <p className="text-sm text-ink-soft">
            Policy {policy.policyNumber} · Excess {euro(policy.excess)} ·{' '}
            {policy.source === 'ocr_confirmed' ? 'Added from uploaded document' : 'Entered manually'}
          </p>
        </div>
        <Button variant="secondary" to="/onboarding">Change plan</Button>
      </div>

      {!rules ? (
        <Card>
          <p className="text-sm text-amber-800">
            We don't have confirmed coverage rules for this plan yet. Rebate estimates won't be available until we do — check caps directly with {policy.insurer} in the meantime.
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-4 font-display text-xl text-secondary">What's covered, outpatient</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Annual allowance</th>
                <th className="pb-2 font-medium">Remaining</th>
                <th className="pb-2 font-medium">Per-visit cap</th>
                <th className="pb-2 font-medium">Pre-auth</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rules.rules).map(([category, rule]) => {
                const used = allowanceUsedForCategory(state, category);
                const remaining = Math.max(0, rule.annualCap - used);
                return (
                  <tr key={category} className="border-b border-line last:border-0">
                    <td className="py-3 font-medium text-secondary">{CATEGORY_LABELS[category]}</td>
                    <td className="py-3">{euro(rule.annualCap)}</td>
                    <td className="py-3">{euro(remaining)}</td>
                    <td className="py-3">{euro(rule.perVisitCap)}</td>
                    <td className="py-3">
                      {rule.requiresPreauth ? <Badge tone="warning">Required</Badge> : <Badge tone="primary">Not required</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-ink-soft">
            Rules are maintained against {policy.insurer}'s published plan brochure and may change roughly annually. Always treat figures here as an estimate rather than a guarantee of payment.
          </p>
        </Card>
      )}
    </div>
  );
}
