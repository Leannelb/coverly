import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../app/store';
import { INSURERS, plansForInsurer, getPlanRules } from '../../app/coverageRules';
import { extractPolicyDocument } from '../../app/mockExtraction';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import FileDrop from '../../components/ui/FileDrop';
import { Field, TextInput, Select } from '../../components/ui/Field';

const CONSENT_VERSION = '1.0';

const CONSENT_PURPOSES = [
  {
    key: 'storeHealthDocs',
    label: 'Store my policy details and referral documents',
    desc: 'Required so Coverly can keep a live picture of your cover and match you to specialists.',
    required: true,
  },
  {
    key: 'specialistOutreach',
    label: 'Share relevant referral details with specialists I choose to book with',
    desc: 'Required so we can request appointments on your behalf.',
    required: true,
  },
  {
    key: 'marketing',
    label: 'Send me occasional product updates',
    desc: 'Optional — withdraw anytime from your account.',
    required: false,
  },
  {
    key: 'research',
    label: 'Use anonymised data to improve rebate estimates',
    desc: 'Optional — helps future estimates get more accurate for everyone.',
    required: false,
  },
];

const STEPS = ['account', 'consent', 'insurer', 'policy'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Onboarding() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [account, setAccount] = useState({ name: '', email: '' });
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [consents, setConsents] = useState(
    Object.fromEntries(CONSENT_PURPOSES.map((p) => [p.key, p.required]))
  );
  const [insurer, setInsurer] = useState(null);

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submitAccount(e) {
    e.preventDefault();
    if (!account.name.trim()) {
      setNameError('Enter your full name');
      return;
    }
    if (!EMAIL_PATTERN.test(account.email)) {
      setEmailError('Enter a valid email address, like you@example.com');
      return;
    }
    dispatch({ type: 'SET_USER', user: account });
    next();
  }

  function submitConsent(e) {
    e.preventDefault();
    const grantedAt = new Date().toISOString();
    const record = Object.fromEntries(
      Object.entries(consents).map(([key, granted]) => [
        key,
        { granted, version: CONSENT_VERSION, grantedAt, withdrawnAt: null },
      ])
    );
    dispatch({ type: 'SET_CONSENTS', consents: record });
    next();
  }

  function chooseInsurer(name) {
    setInsurer(name);
    next();
  }

  function finishPolicy(policy) {
    dispatch({ type: 'SET_POLICY', policy });
    navigate('/home');
  }

  const requiredOk = CONSENT_PURPOSES.filter((p) => p.required).every((p) => consents[p.key]);

  return (
    <div className="mx-auto max-w-xl">
      <ol className="mb-8 flex items-center gap-2" aria-label="Onboarding progress">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`}
          />
        ))}
      </ol>

      {step === 0 && (
        <Card>
          <h1 className="mb-1 font-display text-3xl text-secondary">Let's set up your account</h1>
          <p className="mb-6 text-sm text-ink-soft">Takes about 2 minutes. No referral letter needed yet.</p>
          <form onSubmit={submitAccount} noValidate className="flex flex-col gap-4">
            <Field label="Full name" required error={nameError}>
              <TextInput
                required
                value={account.name}
                onChange={(e) => {
                  setAccount({ ...account, name: e.target.value });
                  if (nameError) setNameError('');
                }}
                placeholder="Leanne Byrne"
              />
            </Field>
            <Field label="Email" required error={emailError}>
              <TextInput
                required
                type="email"
                value={account.email}
                onChange={(e) => {
                  setAccount({ ...account, email: e.target.value });
                  if (emailError) setEmailError('');
                }}
                onBlur={() => {
                  if (account.email && !EMAIL_PATTERN.test(account.email)) {
                    setEmailError('Enter a valid email address, like you@example.com');
                  }
                }}
                placeholder="you@example.com"
              />
            </Field>
            <Button type="submit" size="lg" className="mt-2">Continue</Button>
          </form>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <h1 className="mb-1 font-display text-3xl text-secondary">Before we go further</h1>
          <p className="mb-6 text-sm text-ink-soft">
            Your policy and referral details are health-related data. We ask for consent per purpose, not one bundled checkbox — you can withdraw any of these later from your account.
          </p>
          <form onSubmit={submitConsent} className="flex flex-col gap-4">
            {CONSENT_PURPOSES.map((p) => (
              <label key={p.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 hover:border-primary/40">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#6D4FD1]"
                  checked={consents[p.key]}
                  disabled={p.required}
                  onChange={(e) => setConsents({ ...consents, [p.key]: e.target.checked })}
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    {p.label}
                    {p.required && <Badge tone="primary">Required</Badge>}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{p.desc}</span>
                </span>
              </label>
            ))}
            <div className="mt-2 flex gap-3">
              <Button type="button" variant="secondary" onClick={back}>Back</Button>
              <Button type="submit" size="lg" disabled={!requiredOk} className="flex-1">
                Agree & continue
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h1 className="mb-1 font-display text-3xl text-secondary">Who's your insurer?</h1>
          <p className="mb-6 text-sm text-ink-soft">We'll match this against our maintained plan rules.</p>
          <div className="flex flex-col gap-3">
            {INSURERS.map((name) => (
              <button
                key={name}
                onClick={() => chooseInsurer(name)}
                className="flex items-center justify-between rounded-xl border border-line px-5 py-4 text-left font-display text-xl text-secondary transition-colors hover:border-primary hover:bg-primary-light"
              >
                {name}
                <span className="text-primary">→</span>
              </button>
            ))}
          </div>
          <Button variant="secondary" className="mt-6" onClick={back}>Back</Button>
        </Card>
      )}

      {step === 3 && insurer && (
        <PolicyStep insurer={insurer} onBack={back} onDone={finishPolicy} />
      )}
    </div>
  );
}

function PolicyStep({ insurer, onBack, onDone }) {
  const [mode, setMode] = useState('manual');
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [source, setSource] = useState('manual');
  const plans = plansForInsurer(insurer);
  const [form, setForm] = useState({
    policyNumber: '',
    planName: plans[0] ?? '',
    excess: getPlanRules(plans[0])?.excessDefault ?? 100,
  });

  async function handleFile(file) {
    setFileName(file.name);
    setExtracting(true);
    const result = await extractPolicyDocument(file);
    setExtracting(false);
    setSource('ocr_confirmed');
    setForm({ policyNumber: result.policyNumber, planName: result.planName, excess: result.excess });
  }

  function handlePlanChange(planName) {
    setForm((f) => ({ ...f, planName, excess: getPlanRules(planName)?.excessDefault ?? f.excess }));
  }

  function submit(e) {
    e.preventDefault();
    onDone({ insurer, planName: form.planName, policyNumber: form.policyNumber, excess: Number(form.excess), source });
  }

  return (
    <Card>
      <h1 className="mb-1 font-display text-3xl text-secondary">Add your {insurer} policy</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Manual entry is fastest and always accurate. Uploading your policy document pre-fills the form for you to confirm — we never save extracted numbers without your review.
      </p>

      <div className="mb-5 inline-flex rounded-lg border border-line p-1">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold ${mode === 'manual' ? 'bg-primary text-white' : 'text-ink-soft'}`}
        >
          Enter manually
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold ${mode === 'upload' ? 'bg-primary text-white' : 'text-ink-soft'}`}
        >
          Upload document
        </button>
      </div>

      {mode === 'upload' && (
        <div className="mb-5">
          <FileDrop onFile={handleFile} loading={extracting} loadingText="Reading your policy document…" fileName={fileName} />
        </div>
      )}

      {(mode === 'manual' || fileName) && (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {source === 'ocr_confirmed' && !extracting && (
            <div className="rounded-lg bg-accent/15 px-4 py-3 text-sm text-[#8a5a10]">
              Auto-filled from your document — please check every field before confirming.
            </div>
          )}
          <Field label="Plan name" required hint="Not listed? Choose the closest match — we'll flag it as unconfirmed.">
            <Select value={form.planName} onChange={(e) => handlePlanChange(e.target.value)}>
              {plans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="">Other / not listed</option>
            </Select>
          </Field>
          <Field label="Policy number" required>
            <TextInput
              required
              value={form.policyNumber}
              onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
              placeholder="e.g. LA-482913"
            />
          </Field>
          <Field label="Excess (€)" hint="Per-visit excess before your plan pays out, if any.">
            <TextInput
              type="number"
              min="0"
              value={form.excess}
              onChange={(e) => setForm({ ...form, excess: e.target.value })}
            />
          </Field>
          <div className="mt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
            <Button type="submit" size="lg" className="flex-1">Confirm & see my cover</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
