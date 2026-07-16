import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, getCase } from '../../app/store';
import { findSpecialistsBySpecialty } from '../../app/specialists';
import { midpointFee, estimateRebate } from '../../app/coverageEngine';
import { allowanceUsedForCategory } from '../../app/store';
import { euro } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function SpecialistResults() {
  const { caseId } = useParams();
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const kase = getCase(state, caseId);

  const results = useMemo(() => {
    if (!kase) return [];
    const list = findSpecialistsBySpecialty(kase.referral.specialty);
    const insurer = state.policy?.insurer;
    return [...list].sort((a, b) => {
      const aRec = insurer ? Number(!!a.insurerRecognition[insurer]) : 0;
      const bRec = insurer ? Number(!!b.insurerRecognition[insurer]) : 0;
      if (aRec !== bRec) return bRec - aRec;
      return b.avgRating - a.avgRating;
    });
  }, [kase, state.policy]);

  if (!kase) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">We couldn't find that case.</p>
        <Button to="/dashboard" className="mt-4">Back to dashboard</Button>
      </Card>
    );
  }

  const insurer = state.policy?.insurer;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Referral for {kase.referral.specialty}
        </p>
        <h1 className="font-display text-3xl text-secondary">Specialists for you</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ranked by recognition on your {insurer} plan, then rating. "Recognised" affects your rebate — it doesn't mean other specialists are off-limits.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {results.map((sp) => {
          const recognised = insurer ? sp.insurerRecognition[insurer] : false;
          const fee = midpointFee(sp);
          const allowanceUsed = allowanceUsedForCategory(state, kase.category, kase.id);
          const estimate = state.policy
            ? estimateRebate({ planName: state.policy.planName, category: kase.category, fee, allowanceUsedThisYear: allowanceUsed })
            : null;
          const shortlisted = kase.shortlist.includes(sp.id);

          return (
            <Card key={sp.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl text-secondary">{sp.name}</h2>
                  {recognised ? (
                    <Badge tone="primary">Recognised on your plan</Badge>
                  ) : (
                    <Badge tone="neutral">Not recognised — rebate may not apply</Badge>
                  )}
                </div>
                <p className="text-sm text-ink-soft">{sp.clinic} · {sp.area}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  ★ {sp.avgRating} ({sp.reviewCount} reviews) · Next available {sp.nextAvailable}
                </p>
                <p className="mt-2 text-sm text-secondary">
                  Typical fee {euro(sp.typicalFeeMin)}–{euro(sp.typicalFeeMax)}
                  {estimate?.matched && (
                    <> · Estimated cost to you <strong>{euro(estimate.estimatedOutOfPocket)}</strong></>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE_SHORTLIST', caseId, specialistId: sp.id })}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
                    shortlisted ? 'border-primary bg-primary-light text-primary' : 'border-line text-ink-soft'
                  }`}
                  aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                  aria-pressed={shortlisted}
                >
                  {shortlisted ? '♥' : '♡'}
                </button>
                <Button onClick={() => navigate(`/case/${caseId}/specialist/${sp.id}`)}>
                  View & book
                </Button>
              </div>
            </Card>
          );
        })}
        {results.length === 0 && (
          <Card>
            <p className="text-sm text-ink-soft">
              No specialists listed yet for {kase.referral.specialty} in this launch city. We're expanding the directory — check back soon.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
