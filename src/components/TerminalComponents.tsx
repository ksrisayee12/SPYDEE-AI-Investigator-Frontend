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
      ? 'bg-[#0F1D18]'
      : variant === 'highlight'
      ? 'bg-[#0B1713] border-[#3C6653]'
      : 'bg-[#0B1713]';

  return (
    <div
      className={`border border-[#27453A] ${bgClass} rounded-sm p-4 relative ${className}`}
      {...props}
    >
      {cornerBrackets && (
        <>
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FFB84D]/60 pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FFB84D]/60 pointer-events-none" />
          <span className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b-2 border-l-2 border-[#FFB84D]/60 pointer-events-none" />
          <span className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b-2 border-r-2 border-[#FFB84D]/60 pointer-events-none" />
        </>
      )}
      {(title || badge || action) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27453A]/80 text-xs">
          <div className="flex items-center gap-2">
            {title && (
              <span className="font-mono uppercase tracking-wider text-[#D8E5DC] font-medium text-xs">
                {title}
              </span>
            )}
            {badge && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[#628C73] text-[#9FE3B1] uppercase">
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
      : 'px-3 py-1.5 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'border border-[#FFB84D] text-[#FFB84D] hover:bg-[#FFB84D]/10 active:bg-[#FFB84D]/20';
      break;
    case 'danger':
      variantClasses =
        'border border-[#E05A52] text-[#E05A52] hover:bg-[#E05A52]/10 active:bg-[#E05A52]/20';
      break;
    case 'success':
      variantClasses =
        'border border-[#9FE3B1] text-[#9FE3B1] hover:bg-[#9FE3B1]/10 active:bg-[#9FE3B1]/20';
      break;
    case 'secondary':
    default:
      variantClasses =
        'border border-[#27453A] text-[#6F887A] hover:border-[#3C6653] hover:text-[#D8E5DC] active:bg-[#27453A]/20';
      break;
  }

  return (
    <button
      className={`font-mono uppercase tracking-wider rounded-sm bg-transparent transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
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

  let colorClasses = 'border-[#27453A] text-[#6F887A]';

  if (s.includes('active') || s.includes('verified') || s.includes('accept') || s.includes('completed') || s.includes('supported') || s.includes('resolved') || s.includes('addressed') || s === 'ready' || s === 'imported' || s === 'observed') {
    colorClasses = 'border-[#9FE3B1] text-[#9FE3B1]';
  } else if (s.includes('inferred') || s.includes('derived') || s.includes('pending') || s.includes('in_progress') || s.includes('uploaded') || s.includes('review') || s.includes('proposed')) {
    colorClasses = 'border-[#628C73] text-[#628C73]';
  } else if (s.includes('need') || s.includes('warn') || s.includes('stale') || s.includes('flag') || s.includes('open') || s === 'medium' || s === 'high') {
    colorClasses = 'border-[#FFB84D] text-[#FFB84D]';
  } else if (s.includes('contradict') || s.includes('fail') || s.includes('reject') || s.includes('critical') || s.includes('error')) {
    colorClasses = 'border-[#E05A52] text-[#E05A52]';
  } else if (s.includes('synthetic') || s.includes('archived') || s.includes('dismiss')) {
    colorClasses = 'border-[#3C6653] text-[#6F887A]';
  }

  const formatted = status.toUpperCase().replace(/_/g, ' ');

  return (
    <span
      className={`font-mono text-[10px] px-1.5 py-0.2 inline-block border rounded-sm tracking-wider uppercase bg-transparent ${colorClasses} ${className}`}
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#27453A]">
      <div>
        {code && (
          <div className="text-[10px] font-mono text-[#6F887A] uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>{code}</span>
            <span className="text-[#27453A]">//</span>
            <span className="text-[#FFB84D]">TERMINAL WORKSPACE</span>
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-mono uppercase tracking-wide font-semibold text-[#D8E5DC]">
          {title}
        </h1>
        {description && (
          <p className="text-xs font-mono text-[#6F887A] mt-1">{description}</p>
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
  onClick?: () => void;
  highlight?: boolean;
  alert?: boolean;
}

export function MetricCell({
  label,
  value,
  sublabel,
  onClick,
  highlight,
  alert,
}: MetricCellProps) {
  const borderClass = alert
    ? 'border-[#E05A52]'
    : highlight
    ? 'border-[#FFB84D]'
    : 'border-[#27453A] hover:border-[#3C6653]';
  const textClass = alert
    ? 'text-[#E05A52]'
    : highlight
    ? 'text-[#FFD27A]'
    : 'text-[#D8E5DC]';

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={`border ${borderClass} bg-[#0B1713] rounded-sm p-3 text-left transition-colors w-full relative ${
        onClick ? 'cursor-pointer hover:bg-[#0F1D18]' : ''
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6F887A] mb-1">
        {label}
      </div>
      <div className={`text-xl md:text-2xl font-mono font-bold ${textClass}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] font-mono text-[#6F887A] mt-1 truncate">
          {sublabel}
        </div>
      )}
    </Comp>
  );
}
