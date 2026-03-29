import type { Currency } from '../types'

export function fmt(amount: number, currency: Currency): string {
  if (currency === 'JPY') {
    return '¥' + Math.round(amount).toLocaleString('ja-JP')
  }
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

/** Returns masked placeholder when privacy mode is on */
export function fmtPrivate(amount: number, currency: Currency, hidden: boolean): string {
  if (hidden) return currency === 'JPY' ? '¥ ••••' : '₹ ••••'
  return fmt(amount, currency)
}

interface ProgressBarProps {
  percent: number
  className?: string
}

export function ProgressBar({ percent, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const color =
    clamped >= 100
      ? 'bg-emerald-500'
      : clamped >= 75
        ? 'bg-sky-500'
        : clamped >= 50
          ? 'bg-violet-500'
          : 'bg-slate-500'

  return (
    <div
      className={`h-2 w-full rounded-full bg-slate-700 overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

interface MilestoneDotsProps {
  percent: number
}

export function MilestoneDots({ percent }: MilestoneDotsProps) {
  const milestones = [25, 50, 75, 100]
  return (
    <div className="flex gap-2 mt-1">
      {milestones.map((m) => (
        <span
          key={m}
          className={`text-xs px-1.5 py-0.5 rounded ${
            percent >= m
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-700 text-slate-500'
          }`}
        >
          {m}%
        </span>
      ))}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-800 rounded-xl p-4 ${className}`}>{children}</div>
  )
}

interface SectionTitleProps {
  children: React.ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="text-base font-semibold text-slate-200 mb-3">{children}</h2>
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'muted'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const cls =
    variant === 'success'
      ? 'bg-emerald-500/20 text-emerald-400'
      : variant === 'muted'
        ? 'bg-slate-700 text-slate-400'
        : 'bg-sky-500/20 text-sky-400'
  return <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{children}</span>
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function LabeledInput({ label, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1 w-full min-w-0">
      <span className="text-xs text-slate-400">{label}</span>
      <input
        {...props}
        className={
          'bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 ' +
          'text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-full min-w-0 ' +
          (props.className ?? '')
        }
      />
    </label>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}

export function LabeledSelect({ label, options, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        {...props}
        className={
          'bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 ' +
          'text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-full ' +
          (props.className ?? '')
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-40'
  const styles = {
    primary: 'bg-sky-600 hover:bg-sky-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
    ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400',
  }
  return (
    <button {...props} className={`${base} ${styles[variant]} ${className}`} />
  )
}
