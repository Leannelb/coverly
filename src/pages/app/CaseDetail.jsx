import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStore, getCase } from '../../app/store';
import { getSpecialist } from '../../app/specialists';
import { CLAIM_SUBMISSION } from '../../app/coverageRules';
import { extractReceipt } from '../../app/mockExtraction';
import { euro, formatDate, formatDateTime } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Stepper from '../../components/ui/Stepper';
import StatusPill from '../../components/ui/StatusPill';
import FileDrop from '../../components/ui/FileDrop';
import { Field, TextInput, TextArea } from '../../components/ui/Field';

const DOC_ICON = { referral: '📄', policy: '🏥', correspondence: '✉️', receipt: '🧾' };

export default function CaseDetail() {
  const { caseId } = useParams();
  const { state } = useStore();
  const kase = getCase(state, caseId);

  if (!kase) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">We couldn't find that case.</p>
        <Button to="/dashboard" className="mt-4">Back to dashboard</Button>
      </Card>
    );
  }

  const specialist = kase.specialistId ? getSpecialist(kase.specialistId) : null;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_260px]">
      <div>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{kase.referral.specialty} referral</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-secondary">
              {specialist ? specialist.name : 'Choosing a specialist'}
            </h1>
            <StatusPill status={kase.status} />
          </div>
          {specialist && <p className="text-sm text-ink-soft">{specialist.clinic} · {specialist.area}</p>}
        </div>

        <NextAction kase={kase} specialist={specialist} />
        <DocumentVault kase={kase} />
      </div>

      <div className="lg:pt-16">
        <Card>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Case progress</h2>
          <Stepper status={kase.status} statusHistory={kase.statusHistory} />
        </Card>
      </div>
    </div>
  );
}

function NextAction({ kase, specialist }) {
  switch (kase.status) {
    case 'referral_uploaded':
    case 'specialist_selected':
      return (
        <Card className="mb-6">
          <h2 className="mb-2 font-display text-xl text-secondary">Choose a specialist</h2>
          <p className="mb-4 text-sm text-ink-soft">We're still waiting on you to pick and request a specialist for this referral.</p>
          <Button to={`/case/${kase.id}/specialists`}>Browse specialists</Button>
        </Card>
      );
    case 'booking_requested':
      return <BookingRequestedPanel kase={kase} specialist={specialist} />;
    case 'confirmed':
      return <ConfirmedPanel kase={kase} specialist={specialist} />;
    case 'attended':
      return <AttendedPanel kase={kase} />;
    case 'claim_submitted':
      return <ClaimSubmittedPanel kase={kase} />;
    case 'rebate_received':
      return <ReconciliationPanel kase={kase} specialist={specialist} />;
    default:
      return null;
  }
}

function BookingRequestedPanel({ kase }) {
  const { dispatch } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [datetime, setDatetime] = useState('');

  return (
    <Card className="mb-6">
      <h2 className="mb-2 font-display text-xl text-secondary">Waiting on the clinic</h2>
      <p className="mb-4 text-sm text-ink-soft">
        Your booking request has been sent. We'll update this case as soon as the clinic confirms a slot — no need to chase them.
      </p>
      {!confirming ? (
        <Button variant="secondary" onClick={() => setConfirming(true)}>I've heard back from the clinic</Button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'CONFIRM_BOOKING', caseId: kase.id, datetime: new Date(datetime).toISOString() });
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Field label="Confirmed appointment time" required>
              <TextInput type="datetime-local" required value={datetime} onChange={(e) => setDatetime(e.target.value)} />
            </Field>
          </div>
          <Button type="submit">Save & confirm</Button>
        </form>
      )}
    </Card>
  );
}

function ConfirmedPanel({ kase }) {
  const { dispatch } = useStore();
  const requiresPreauth = kase.rebateEstimate?.requiresPreauth;

  return (
    <Card className="mb-6">
      <h2 className="mb-2 font-display text-xl text-secondary">Appointment confirmed</h2>
      <p className="mb-4 text-lg font-semibold text-secondary">{formatDateTime(kase.appointment?.datetime)}</p>

      {requiresPreauth && (
        <label className="mb-4 flex items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={kase.preauthAcknowledged}
            onChange={() => dispatch({ type: 'ACK_PREAUTH', caseId: kase.id })}
          />
          <span>Pre-authorisation is required for this visit on your plan. Check this once you've submitted it to your insurer.</span>
        </label>
      )}

      <Button onClick={() => dispatch({ type: 'MARK_ATTENDED', caseId: kase.id })}>
        I've attended this appointment
      </Button>
    </Card>
  );
}

function AttendedPanel({ kase }) {
  const { state, dispatch } = useStore();
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [draft, setDraft] = useState(null);
  const [claimRef, setClaimRef] = useState('');

  const hasReceipt = !!kase.rebateActual?.actualFee;
  const insurer = state.policy?.insurer;
  const submission = CLAIM_SUBMISSION[insurer];

  async function handleFile(file) {
    setFileName(file.name);
    setExtracting(true);
    const result = await extractReceipt(file, kase.rebateEstimate?.fee);
    setExtracting(false);
    setDraft(result);
  }

  function confirmReceipt(e) {
    e.preventDefault();
    dispatch({ type: 'LOG_RECEIPT', caseId: kase.id, actualFee: Number(draft.actualFee), visitDate: draft.visitDate, fileName });
  }

  if (!hasReceipt) {
    return (
      <Card className="mb-6">
        <h2 className="mb-2 font-display text-xl text-secondary">Upload your receipt</h2>
        <p className="mb-4 text-sm text-ink-soft">
          We'll pull out the fee you actually paid so we can compare it to the estimate and tell you exactly what to submit.
        </p>
        {!draft ? (
          <FileDrop onFile={handleFile} loading={extracting} loadingText="Reading your receipt…" fileName={fileName} />
        ) : (
          <form onSubmit={confirmReceipt} className="flex flex-col gap-4">
            <div className="rounded-lg bg-accent/15 px-4 py-3 text-sm text-[#8a5a10]">
              Auto-filled from your receipt — please confirm the amount before we log it.
            </div>
            <Field label="Fee actually charged (€)" required>
              <TextInput
                type="number"
                required
                value={draft.actualFee}
                onChange={(e) => setDraft({ ...draft, actualFee: e.target.value })}
              />
            </Field>
            <Field label="Visit date">
              <TextInput type="date" value={draft.visitDate} onChange={(e) => setDraft({ ...draft, visitDate: e.target.value })} />
            </Field>
            <Button type="submit">Confirm receipt</Button>
          </form>
        )}
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-2 font-display text-xl text-secondary">Submit your claim</h2>
      <p className="mb-1 text-sm text-ink-soft">Fee paid: <strong className="text-secondary">{euro(kase.rebateActual.actualFee)}</strong></p>
      {submission && (
        <div className="my-4 rounded-lg border border-line px-4 py-3 text-sm text-ink-soft">
          Submit this receipt to <strong className="text-secondary">{insurer}</strong> via {submission.channel}, within{' '}
          <strong className="text-secondary">{submission.windowLabel}</strong>. Missing this window means losing the rebate.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'SUBMIT_CLAIM', caseId: kase.id, claimReference: claimRef });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Field label="Claim reference (optional)">
            <TextInput value={claimRef} onChange={(e) => setClaimRef(e.target.value)} placeholder="From your insurer's confirmation" />
          </Field>
        </div>
        <Button type="submit">I've submitted my claim</Button>
      </form>
    </Card>
  );
}

function ClaimSubmittedPanel({ kase }) {
  const { dispatch } = useStore();
  const [actualRebate, setActualRebate] = useState('');

  return (
    <Card className="mb-6">
      <h2 className="mb-2 font-display text-xl text-secondary">Log your rebate</h2>
      <p className="mb-4 text-sm text-ink-soft">
        Claim submitted{kase.rebateActual?.claimReference ? ` (ref: ${kase.rebateActual.claimReference})` : ''} on {formatDate(kase.rebateActual?.submittedAt)}.
        Once your insurer pays out, log the amount here to see how it compares to our estimate.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'LOG_REBATE_RECEIVED', caseId: kase.id, actualRebate: Number(actualRebate) });
        }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Field label="Rebate received (€)" required>
            <TextInput type="number" required value={actualRebate} onChange={(e) => setActualRebate(e.target.value)} />
          </Field>
        </div>
        <Button type="submit">Log rebate</Button>
      </form>
    </Card>
  );
}

function ReconciliationPanel({ kase }) {
  const { dispatch } = useStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const est = kase.rebateEstimate;
  const act = kase.rebateActual;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-4 font-display text-xl text-secondary">Estimate vs. actual</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium">Estimated</th>
              <th className="pb-2 font-medium">Actual</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-t border-line">
              <td className="py-2 text-ink-soft">Fee</td>
              <td className="py-2 font-semibold text-secondary">{euro(est?.fee)}</td>
              <td className="py-2 font-semibold text-secondary">{euro(act?.actualFee)}</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 text-ink-soft">Rebate</td>
              <td className="py-2 font-semibold text-secondary">{euro(est?.estimatedRebate)}</td>
              <td className="py-2 font-semibold text-primary">{euro(act?.actualRebate)}</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-2 text-ink-soft">Out of pocket</td>
              <td className="py-2 font-semibold text-secondary">{euro(est?.estimatedOutOfPocket)}</td>
              <td className="py-2 font-semibold text-secondary">{euro((act?.actualFee ?? 0) - (act?.actualRebate ?? 0))}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {!kase.review ? (
        <Card>
          <h2 className="mb-2 font-display text-xl text-secondary">How was your visit?</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: 'ADD_REVIEW', caseId: kase.id, rating, comment });
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  aria-pressed={n === rating}
                  className={`text-2xl ${n <= rating ? 'text-accent' : 'text-line'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Field label="Anything worth telling future patients? (optional)">
              <TextArea value={comment} onChange={(e) => setComment(e.target.value)} />
            </Field>
            <Button type="submit" className="self-start">Submit review</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-2 font-display text-xl text-secondary">Your review</h2>
          <p className="text-accent">{'★'.repeat(kase.review.rating)}{'☆'.repeat(5 - kase.review.rating)}</p>
          {kase.review.comment && <p className="mt-2 text-sm text-ink-soft">{kase.review.comment}</p>}
        </Card>
      )}
    </div>
  );
}

function DocumentVault({ kase }) {
  return (
    <Card>
      <h2 className="mb-4 font-display text-xl text-secondary">Document vault</h2>
      <ul className="flex flex-col divide-y divide-line">
        {kase.documents.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 py-3">
            <span className="text-xl">{DOC_ICON[doc.type] ?? '📎'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary">{doc.name}</p>
              <p className="text-xs text-ink-soft">{formatDate(doc.uploadedAt)}</p>
            </div>
            <Badge tone="neutral">{doc.type}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
