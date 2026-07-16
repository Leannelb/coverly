import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, makeCaseId, specialtyToCategory } from '../../app/store';
import { extractReferralLetter } from '../../app/mockExtraction';
import { SPECIALTIES } from '../../app/specialists';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FileDrop from '../../components/ui/FileDrop';
import { Field, TextInput, Select } from '../../components/ui/Field';

const URGENCY_OPTIONS = ['Routine', 'Semi-urgent', 'Urgent'];

export default function ReferralNew() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [form, setForm] = useState({ specialty: '', gpName: '', urgency: 'Routine', namedSpecialist: '' });

  async function handleFile(file) {
    setFileName(file.name);
    setExtracting(true);
    const result = await extractReferralLetter(file);
    setExtracting(false);
    setForm(result);
  }

  function submit(e) {
    e.preventDefault();
    const caseId = makeCaseId();
    dispatch({
      type: 'CREATE_CASE',
      caseId,
      referral: { ...form, sourceFileName: fileName ?? 'Referral letter' },
      category: specialtyToCategory(form.specialty),
    });
    navigate(`/case/${caseId}/specialists`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-3xl text-secondary">Upload your referral letter</h1>
      <p className="mb-6 text-sm text-ink-soft">
        A photo from your phone works fine. We'll pull out the specialty and details for you to check before anything else happens.
      </p>

      <Card>
        {!fileName ? (
          <FileDrop onFile={handleFile} loading={extracting} loadingText="Reading your referral letter…" />
        ) : extracting ? (
          <FileDrop onFile={handleFile} loading fileName={fileName} loadingText="Reading your referral letter…" />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="rounded-lg bg-accent/15 px-4 py-3 text-sm text-[#8a5a10]">
              We think this is what your referral says — is that right? Nothing happens until you confirm.
            </div>
            <Field label="Specialty" required>
              <Select
                required
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              >
                <option value="" disabled>Select a specialty</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Referring GP">
              <TextInput
                value={form.gpName}
                onChange={(e) => setForm({ ...form, gpName: e.target.value })}
              />
            </Field>
            <Field label="Priority">
              <Select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </Field>
            <Field label="Named specialist (optional)" hint="Only if your GP asked for someone specific.">
              <TextInput
                value={form.namedSpecialist}
                onChange={(e) => setForm({ ...form, namedSpecialist: e.target.value })}
              />
            </Field>
            <Button type="submit" size="lg" className="mt-2">
              Confirm & find specialists
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
