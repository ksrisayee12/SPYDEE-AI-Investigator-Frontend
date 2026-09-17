import React from 'react';

// ==========================================
// TerminalPanel: Primary technical container
// ==========================================
interface TerminalPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  badge?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'raised' | 'highlight';
  cornerBrackets?: boolean;
}

export function TerminalPanel({
  title,
  badge,
  action,
  variant = 'default',
  cornerBrackets = true,
  children,
  className = '',
  ...props
}: TerminalPanelProps) {
  const bgClass =
    variant === 'raised'
      ? 'bg-[#14110C]'
      : variant === 'highlight'
      ? 'bg-[#0D0B08] border-[#66451B]'
      : 'bg-[#0D0B08]';

  return (
    <div
      className={`border border-[#3D2A12] ${bgClass} rounded-xs p-4 relative ${className}`}
      {...props}
    >
      {cornerBrackets && (
        <>
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b-2 border-r-2 border-[#FF9E1B] pointer-events-none" />
        </>
      )}
      {(title || badge || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3D2A12] text-xs">
          <div className="flex items-center gap-2">
            {title && (
              <span className="font-mono uppercase tracking-wider text-[#FFBA42] font-semibold text-xs flex items-center gap-1.5">
                <span className="text-[#FF9E1B] text-[10px]">▶</span>
                {title}
              </span>
            )}
            {badge && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[#34D399] text-[#34D399] uppercase bg-[#34D399]/5">
                {badge}
              </span>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ==========================================
// TerminalButton: Compact technical control
// ==========================================
interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'xs';
}

export function TerminalButton({
  variant = 'secondary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: TerminalButtonProps) {
  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'sm'
      ? 'px-2.5 py-1 text-xs'
      : 'px-3.5 py-1.5 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-[#FF9E1B] text-[#080705] font-bold border border-[#FF9E1B] hover:bg-[#FFAE3B] active:bg-[#D97E06] shadow-sm';
      break;
    case 'danger':
      variantClasses =
        'border border-[#EF4444] text-[#EF4444] bg-[#EF4444]/5 hover:bg-[#EF4444]/15 active:bg-[#EF4444]/25';
      break;
    case 'success':
      variantClasses =
        'border border-[#34D399] text-[#34D399] bg-[#34D399]/5 hover:bg-[#34D399]/15 active:bg-[#34D399]/25';
      break;
    case 'secondary':
    default:
      variantClasses =
        'border border-[#3D2A12] text-[#FFBA42] bg-[#0D0B08] hover:border-[#FF9E1B] hover:text-[#FFE7B8] hover:bg-[#14110C] active:bg-[#1A160F]';
      break;
  }

  return (
    <button
      className={`font-mono uppercase tracking-wider rounded-xs transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// ==========================================
// StatusBadge: Epistemic & State Chip
// ==========================================
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  if (!status) return null;
  const s = status.toLowerCase();

  let colorClasses = 'border-[#3D2A12] text-[#A6732E]';

  if (s.includes('active') || s.includes('verified') || s.includes('accept') || s.includes('completed') || s.includes('supported') || s.includes('resolved') || s.includes('addressed') || s === 'ready' || s === 'imported' || s === 'observed' || s === 'linked') {
    colorClasses = 'border-[#34D399] text-[#34D399] bg-[#34D399]/5';
  } else if (s.includes('inferred') || s.includes('derived') || s.includes('pending') || s.includes('in_progress') || s.includes('uploaded') || s.includes('review') || s.includes('proposed')) {
    colorClasses = 'border-[#996515] text-[#FFBA42] bg-[#996515]/10';
  } else if (s.includes('need') || s.includes('warn') || s.includes('stale') || s.includes('flag') || s.includes('open') || s === 'medium' || s === 'high') {
    colorClasses = 'border-[#FF9E1B] text-[#FF9E1B] bg-[#FF9E1B]/10';
  } else if (s.includes('contradict') || s.includes('fail') || s.includes('reject') || s.includes('critical') || s.includes('error')) {
    colorClasses = 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10';
  } else if (s.includes('synthetic') || s.includes('archived') || s.includes('dismiss') || s === 'new') {
    colorClasses = 'border-[#3D2A12] text-[#A6732E] bg-[#14110C]';
  }

  const formatted = status.toUpperCase().replace(/_/g, ' ');

  return (
    <span
      className={`font-mono text-[10px] px-2 py-0.5 inline-block border rounded-xs tracking-wider uppercase ${colorClasses} ${className}`}
    >
      [ {formatted} ]
    </span>
  );
}

// ==========================================
// WorkspaceHeader: Consistent Workspace Bar
// ==========================================
interface WorkspaceHeaderProps {
  code?: string;
  title: string;
  description?: string;
  statusBadge?: React.ReactNode;
  children?: React.ReactNode;
}

export function WorkspaceHeader({
  code,
  title,
  description,
  statusBadge,
  children,
}: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-5 border-b border-[#3D2A12]">
      <div>
        {code && (
          <div className="text-[10px] font-mono text-[#A6732E] uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>{code}</span>
            <span className="text-[#3D2A12]">//</span>
            <span className="text-[#FF9E1B]">TERMINAL WORKSPACE</span>
          </div>
        )}
        <h1 className="text-lg md:text-xl font-mono uppercase tracking-wide font-bold text-[#FFBA42] flex items-center gap-2">
          <span className="text-[#FF9E1B]">//</span>
          {title}
        </h1>
        {description && (
          <p className="text-xs font-mono text-[#A6732E] mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {statusBadge}
        {children}
      </div>
    </div>
  );
}

// ==========================================
// MetricCell: Technical numeric display
// ==========================================
interface MetricCellProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  highlight?: boolean;
  alert?: boolean;
}

export function MetricCell({
  label,
  value,
  sublabel,
  icon,
  onClick,
  highlight,
  alert,
}: MetricCellProps) {
  const borderClass = alert
    ? 'border-[#EF4444]'
    : highlight
    ? 'border-[#FF9E1B]'
    : 'border-[#3D2A12] hover:border-[#66451B]';
  const textClass = alert
    ? 'text-[#EF4444]'
    : highlight
    ? 'text-[#FFD27A]'
    : 'text-[#FFBA42]';

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={`border ${borderClass} bg-[#0D0B08] rounded-xs p-3 text-left transition-colors w-full relative ${
        onClick ? 'cursor-pointer hover:bg-[#14110C]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6732E]">
          {label}
        </span>
        {icon && <span className="text-[#A6732E]">{icon}</span>}
      </div>
      <div className={`text-xl md:text-2xl font-mono font-bold ${textClass}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] font-mono text-[#A6732E] mt-1 truncate">
          {sublabel}
        </div>
      )}
    </Comp>
  );
}

