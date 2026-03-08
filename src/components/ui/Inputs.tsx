import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { ForgeIcon } from './ForgeIcon';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  className?: string;
  id?: string;
}

export const TextInput: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  className, 
  ...props 
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label htmlFor={props.id} className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </label>
    )}
    <div className="relative group">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-emerald-accent transition-colors">
          <ForgeIcon name={icon} size={14} />
        </div>
      )}
      <input 
        className={cn(
          "w-full bg-surface-base border border-surface-border rounded px-3 py-2 text-label-sm text-text-primary placeholder:text-text-muted outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20 transition-all",
          icon && "pl-9",
          error && "border-status-incident/50 focus:border-status-incident",
          className
        )}
        {...props}
      />
    </div>
    {error && <span className="text-[9px] font-bold text-status-incident uppercase tracking-tighter">{error}</span>}
  </div>
);

export const SearchInput: React.FC<InputProps> = (props) => (
  <TextInput 
    icon="magnifer" 
    placeholder="Search..."
    {...props}
    className={cn("bg-surface-raised/50", props.className)} 
  />
);

export const Select = ({ 
  label, 
  options, 
  className, 
  ...props 
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && (
      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </label>
    )}
    <div className="relative">
      <select 
        className={cn(
          "w-full appearance-none bg-surface-base border border-surface-border rounded px-3 py-2 text-label-sm text-text-primary outline-none focus:border-emerald-accent/50 transition-all cursor-pointer",
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
        <ForgeIcon name="alt-arrow-down" size={14} />
      </div>
    </div>
  </div>
);

export const FilterPillGroup = ({ 
  options, 
  activeValue, 
  onChange,
  className 
}: { 
  options: { value: string; label: string }[]; 
  activeValue: string; 
  onChange: (value: string) => void;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap gap-2", className)}>
    {options.map(opt => {
      const isActive = opt.value === activeValue;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
            isActive 
              ? "bg-emerald-accent text-text-inverse border-emerald-accent" 
              : "bg-surface-raised text-text-secondary border-surface-border hover:border-text-muted"
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export const Toggle = ({ 
  checked, 
  onChange, 
  label,
  className 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label?: string;
  className?: string;
}) => (
  <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
    <div 
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-8 h-4 rounded-full transition-all duration-300",
        checked ? "bg-emerald-accent" : "bg-surface-border"
      )}
    >
      <div className={cn(
        "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </div>
    {label && <span className="text-label-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
  </label>
);

export const Checkbox = ({ 
  checked, 
  onChange, 
  label,
  className 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label?: string;
  className?: string;
}) => (
  <label className={cn("flex items-center gap-2.5 cursor-pointer group", className)}>
    <div 
      onClick={() => onChange(!checked)}
      className={cn(
        "w-4 h-4 rounded border flex items-center justify-center transition-all",
        checked ? "bg-emerald-accent border-emerald-accent" : "bg-surface-base border-surface-border group-hover:border-text-muted"
      )}
    >
      {checked && <ForgeIcon name="check-read" size={10} className="text-text-inverse" />}
    </div>
    {label && <span className="text-label-xs font-bold text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>}
  </label>
);
