export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-border/60 text-brand-muted',
    dark: 'bg-brand-dark text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    new: 'bg-brand-darker text-white',
  };
  return (
    <span
      className={`inline-flex items-center text-[10px] tracking-widest uppercase font-medium px-2 py-0.5 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
