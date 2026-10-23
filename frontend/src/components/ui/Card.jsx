import React from 'react';

const Card = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-2xl border border-slate-800 bg-slate-900/70 shadow-sm backdrop-blur ${className}`}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-5 pb-0 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-lg font-semibold text-slate-50 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`mt-1 text-sm text-slate-400 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`flex items-center gap-3 px-5 pb-5 ${className}`} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
