import React from 'react';

const variants = {
  primary:
    'bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  outline: 'bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-800',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800',
  danger: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/30',
  success: 'bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 border border-emerald-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = React.forwardRef(
  ({ variant = 'primary', size = 'md', className = '', loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-current" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

export default Button;
