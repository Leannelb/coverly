import Badge from './Badge';
import { STATUS_LABELS } from '../../app/store';

const TONE_BY_STATUS = {
  referral_uploaded: 'neutral',
  specialist_selected: 'neutral',
  booking_requested: 'accent',
  confirmed: 'primary',
  attended: 'primary',
  claim_submitted: 'warning',
  rebate_received: 'primary',
};

export default function StatusPill({ status, className = '' }) {
  return (
    <Badge tone={TONE_BY_STATUS[status] ?? 'neutral'} className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
