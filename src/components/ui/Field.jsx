export function Field({ label, hint, error, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-secondary">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15';

export function TextInput(props) {
  return <input className={inputCls} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={inputCls} {...props}>
      {children}
    </select>
  );
}

export function TextArea(props) {
  return <textarea className={`${inputCls} min-h-24 resize-y`} {...props} />;
}
