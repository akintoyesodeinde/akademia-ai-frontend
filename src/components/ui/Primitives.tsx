import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        marginBottom: '1rem',
        fontSize: '0.9rem',
      }}
    >
      {message}
    </div>
  );
}

export function AlertBanner({
  variant = 'info',
  title,
  children,
}: {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}) {
  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    info: { bg: '#eff6ff', fg: '#1e3a8a', border: '#bfdbfe' },
    success: { bg: '#dcfce7', fg: '#166534', border: '#bbf7d0' },
    warning: { bg: '#fef9c3', fg: '#854d0e', border: '#fde047' },
    error: { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca' },
  };
  const colors = palette[variant] ?? palette.info;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      style={{
        padding: '0.875rem 1rem',
        borderRadius: '0.5rem',
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        fontSize: '0.875rem',
      }}
    >
      {title && <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{title}</div>}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: '1.75rem',
        textAlign: 'center',
        border: '1px dashed #cbd5e1',
        borderRadius: '0.75rem',
        color: '#475569',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#0f172a' }}>{title}</div>
      <div style={{ fontSize: '0.9rem' }}>{description}</div>
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  isLoading?: boolean;
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Working...' : children}
    </button>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card" style={{ padding: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function Input({
  label,
  id,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  const inputId = id || `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={inputId} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </label>
      <input id={inputId} {...rest} />
    </div>
  );
}

export function Select({
  label,
  id,
  options,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  const selectId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={selectId} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </label>
      <select id={selectId} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({
  label,
  id,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
}) {
  const textareaId = id || `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={textareaId} style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </label>
      <textarea id={textareaId} {...rest} />
    </div>
  );
}
