import { Link } from 'react-router-dom';
import { useStore } from '../../app/store';
import { formatDate } from '../../app/format';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const DOC_ICON = { referral: '📄', policy: '🏥', correspondence: '✉️', receipt: '🧾' };

export default function Documents() {
  const { state } = useStore();

  const rows = state.cases
    .flatMap((c) => c.documents.map((doc) => ({ ...doc, caseId: c.id, specialty: c.referral.specialty })))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-3xl text-secondary">Document vault</h1>
      <p className="mb-6 text-sm text-ink-soft">Every referral, correspondence and receipt, in one private place.</p>

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">Nothing here yet — documents appear once you upload a referral or receipt.</p>
        </Card>
      ) : (
        <Card>
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((doc) => (
              <li key={doc.id}>
                <Link to={`/case/${doc.caseId}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="text-xl">{DOC_ICON[doc.type] ?? '📎'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary">{doc.name}</p>
                    <p className="text-xs text-ink-soft">{doc.specialty} case · {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <Badge tone="neutral">{doc.type}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
