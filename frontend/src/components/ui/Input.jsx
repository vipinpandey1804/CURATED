export default function Input({
  label,
  id,
  type = 'text',
  variant = 'box',
  error,
  className = '',
  ...props
}) {
  const inputClass = variant === 'line' ? 'input-base' : 'input-box';
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs tracking-widest uppercase text-brand-muted font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`${inputClass} ${error ? 'border-red-400 focus:border-red-400' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
