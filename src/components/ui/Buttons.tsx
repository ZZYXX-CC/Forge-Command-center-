import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconPosition = 'left', 
  loading,
  className,
  ...props 
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const variants = {
    primary: 'bg-emerald-accent text-text-inverse hover:bg-emerald-mid border-emerald-accent',
    secondary: 'bg-surface-raised text-text-primary hover:bg-surface-hover border-surface-border',
    outline: 'bg-transparent text-emerald-accent border-emerald-accent hover:bg-emerald-accent/10',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover border-transparent',
    danger: 'bg-status-incident text-text-inverse hover:bg-status-incident/90 border-status-incident',
  };

  const sizes = {
    xs: 'px-2 py-1 text-[9px] font-bold uppercase tracking-widest',
    sm: 'px-3 py-1.5 text-label-xs font-bold uppercase tracking-wider',
    md: 'px-4 py-2 text-label-sm font-bold uppercase tracking-wide',
    lg: 'px-6 py-3 text-label-md font-bold uppercase tracking-widest',
  };

  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded border transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={(props as any).disabled || loading}
      {...props}
    >
      {loading && <ForgeIcon name="refresh" size={size === 'xs' ? 10 : 14} className="animate-spin" />}
      {!loading && icon && iconPosition === 'left' && <ForgeIcon name={icon} size={size === 'xs' ? 10 : 14} />}
      {children}
      {!loading && icon && iconPosition === 'right' && <ForgeIcon name={icon} size={size === 'xs' ? 10 : 14} />}
    </button>
  );
};

export const IconButton = ({ 
  icon, 
  size = 'md', 
  variant = 'ghost',
  className,
  ...props 
}: ButtonProps & { icon: string }) => {
  const sizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <Button 
      variant={variant} 
      className={cn("rounded-full", sizes[size], className)} 
      {...props}
    >
      <ForgeIcon name={icon} size={iconSizes[size]} />
    </Button>
  );
};

export const ActionButton = ({ 
  label, 
  icon, 
  onClick,
  className 
}: { 
  label: string; 
  icon: string; 
  onClick?: () => void;
  className?: string;
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded bg-surface-raised border border-surface-border text-text-secondary hover:text-text-primary hover:border-emerald-accent/30 transition-all group",
      className
    )}
  >
    <ForgeIcon name={icon} size={14} className="text-text-muted group-hover:text-emerald-accent" />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export const CopyButton = ({ 
  value, 
  className 
}: { 
  value: string; 
  className?: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        "p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-emerald-accent",
        className
      )}
    >
      <ForgeIcon name={copied ? "check-circle" : "copy"} size={12} />
    </button>
  );
};
