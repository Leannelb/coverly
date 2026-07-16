const TONES = {
  neutral: 'bg-secondary/8 text-secondary',
  primary: 'bg-primary-light text-primary',
  accent: 'bg-accent/15 text-[#8a5a10]',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-50 text-red-700',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
