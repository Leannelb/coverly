export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(26,58,74,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
