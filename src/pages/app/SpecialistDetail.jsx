import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, getCase, allowanceUsedForCategory } from '../../app/store';
import { getSpecialist } from '../../app/specialists';
import { midpointFee, estimateRebate } from '../../app/coverageEngine';
import { euro } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, TextArea } from '../../components/ui/Field';

export default function SpecialistDetail() {
  const { caseId, specialistId } = useParams();
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [showAssumptions, setShowAssumptions] = useState(false);

  const kase = getCase(state, caseId);
  const specialist = getSpecialist(specialistId);

  if (!kase || !specialist || !state.policy) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">We couldn't find that specialist.</p>
        <Button to="/dashboard" className="mt-4">Back to dashboard</Button>
      </Card>
    );
  }

  const fee = midpointFee(specialist);
  const allowanceUsed = allowanceUsedForCategory(state, kase.category, kase.id);
  const estimate = estimateRebate({
    planName: state.policy.planName,
    category: kase.category,
    fee,
    allowanceUsedThisYear: allowanceUsed,
  });
  const recognised = specialist.insurerRecognition[state.policy.insurer];

  function requestBooking(e) {
    e.preventDefault();
    dispatch({ type: 'SELECT_SPECIALIST', caseId, specialistId, rebateEstimate: estimate });
    dispatch({ type: 'REQUEST_BOOKING', caseId, notes });
    navigate(`/case/${caseId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-ink-soft hover:text-secondary">← Back to results</button>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-secondary">{specialist.name}</h1>
          {recognised ? <Badge tone="primary">Recognised on your plan</Badge> : <Badge tone="neutral">Not recognised</Badge>}
        </div>
        <p className="text-sm text-ink-soft">{specialist.clinic} · {specialist.area}</p>
        <p className="mt-1 text-sm text-ink-soft">★ {specialist.avgRating} ({specialist.reviewCount} reviews) · Next available {specialist.nextAvailable}</p>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-display text-xl text-secondary">Estimated cost for this visit</h2>

        {!estimate.matched ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{estimate.message}</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-ink-soft">Typical consultation fee</dt>
              <dd className="text-right font-semibold text-secondary">{euro(fee)}</dd>
              <dt className="text-ink-soft">Annual allowance remaining</dt>
              <dd className="text-right font-semibold text-secondary">{euro(estimate.allowanceRemaining)} of {euro(estimate.annualCap)}</dd>
              <dt className="text-ink-soft">Per-visit rebate cap</dt>
              <dd className="text-right font-semibold text-secondary">{euro(estimate.perVisitCap)}</dd>
              <dt className="text-ink-soft">Estimated rebate</dt>
              <dd className="text-right font-semibold text-primary">{euro(estimate.estimatedRebate)}</dd>
              <dt className="font-semibold text-secondary">Estimated out-of-pocket</dt>
              <dd className="text-right font-display text-2xl text-secondary">{euro(estimate.estimatedOutOfPocket)}</dd>
            </dl>

            {estimate.requiresPreauth && (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                ⚠ Pre-authorisation is generally required for this category on your plan. Do this before your appointment — we'll track it once you book.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowAssumptions((v) => !v)}
              className="mt-4 text-xs font-semibold text-primary underline underline-offset-2"
            >
              {showAssumptions ? 'Hide' : 'Show'} assumptions used
            </button>
            {showAssumptions && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-ink-soft">
                {estimate.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-ink-soft">
              This is an estimate based on your plan's published rules and a typical fee for this specialty. Actual consultant fees vary — we'll reconcile against the real receipt after your visit.
            </p>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-xl text-secondary">Request this appointment</h2>
        <p className="mb-4 text-sm text-ink-soft">
          We don't have a live calendar for this clinic yet, so this sends a booking request that we track through to confirmation.
        </p>
        <form onSubmit={requestBooking} className="flex flex-col gap-4">
          <Field label="Anything the clinic should know? (optional)">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. preferred mornings, availability next two weeks…"
            />
          </Field>
          <Button type="submit" size="lg">Request appointment</Button>
        </form>
      </Card>
    </div>
  );
}
