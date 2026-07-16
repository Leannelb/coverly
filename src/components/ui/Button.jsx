import { Link } from 'react-router-dom';

const VARIANTS = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white text-secondary border border-line hover:border-primary/40 hover:bg-primary-light',
  ghost: 'text-secondary hover:text-primary',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
};

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  sm: 'px-3.5 py-2 text-xs',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  className = '',
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
