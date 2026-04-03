export default function Button({ variant = 'primary', children, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    dark: 'bg-brand-dark text-white text-xs tracking-widest uppercase font-medium px-6 py-3 hover:bg-brand-darker transition-colors duration-200',
    outline: 'border border-brand-border text-brand-dark text-xs tracking-widest uppercase font-medium px-6 py-3 hover:border-brand-dark transition-colors duration-200',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
