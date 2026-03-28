import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fmt, ProgressBar, MilestoneDots, Card, Badge, Button, LabeledInput } from '../components/ui'

// ─── fmt ──────────────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('formats JPY with ¥ symbol', () => {
    expect(fmt(300000, 'JPY')).toContain('¥')
    expect(fmt(300000, 'JPY')).toContain('300')
  })

  it('formats INR with ₹ symbol', () => {
    expect(fmt(50000, 'INR')).toContain('₹')
    expect(fmt(50000, 'INR')).toContain('50')
  })

  it('rounds to whole numbers', () => {
    expect(fmt(1234.9, 'JPY')).not.toContain('.')
    expect(fmt(1234.9, 'INR')).not.toContain('.')
  })
})

// ─── ProgressBar ──────────────────────────────────────────────────────────────

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressBar percent={60} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '60')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps percent above 100 to 100', () => {
    render(<ProgressBar percent={150} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps percent below 0 to 0', () => {
    render(<ProgressBar percent={-10} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('applies emerald color class at 100%', () => {
    const { container } = render(<ProgressBar percent={100} />)
    const fill = container.querySelector('.bg-emerald-500')
    expect(fill).toBeTruthy()
  })

  it('applies sky color class at 80%', () => {
    const { container } = render(<ProgressBar percent={80} />)
    const fill = container.querySelector('.bg-sky-500')
    expect(fill).toBeTruthy()
  })

  it('applies slate color class at 20%', () => {
    const { container } = render(<ProgressBar percent={20} />)
    const fill = container.querySelector('.bg-slate-500')
    expect(fill).toBeTruthy()
  })
})

// ─── MilestoneDots ────────────────────────────────────────────────────────────

describe('MilestoneDots', () => {
  it('renders four milestones (25, 50, 75, 100)', () => {
    render(<MilestoneDots percent={50} />)
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('marks milestones reached with emerald color', () => {
    const { container } = render(<MilestoneDots percent={55} />)
    const spans = container.querySelectorAll('span')
    // 25% and 50% should be emerald
    expect(spans[0].className).toContain('emerald')
    expect(spans[1].className).toContain('emerald')
    // 75% and 100% should not
    expect(spans[2].className).not.toContain('emerald')
    expect(spans[3].className).not.toContain('emerald')
  })
})

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>hello</span></Card>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies extra className', () => {
    const { container } = render(<Card className="extra-class">x</Card>)
    expect(container.firstChild).toHaveClass('extra-class')
  })
})

// ─── Badge ────────────────────────────────────────────────────────────────────

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>JPY</Badge>)
    expect(screen.getByText('JPY')).toBeInTheDocument()
  })

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">ok</Badge>)
    expect(container.firstChild).toHaveClass('text-emerald-400')
  })

  it('applies muted variant', () => {
    const { container } = render(<Badge variant="muted">paused</Badge>)
    expect(container.firstChild).toHaveClass('text-slate-400')
  })
})

// ─── Button ───────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary styles by default', () => {
    const { container } = render(<Button>Save</Button>)
    expect(container.firstChild).toHaveClass('bg-sky-600')
  })

  it('applies secondary styles', () => {
    const { container } = render(<Button variant="secondary">Cancel</Button>)
    expect(container.firstChild).toHaveClass('bg-slate-700')
  })

  it('applies danger styles', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    expect(container.firstChild).toHaveClass('text-red-400')
  })

  it('passes through disabled prop', () => {
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

// ─── LabeledInput ─────────────────────────────────────────────────────────────

describe('LabeledInput', () => {
  it('renders with label and input', () => {
    render(<LabeledInput label="Salary" type="number" />)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
  })

  it('forwards placeholder', () => {
    render(<LabeledInput label="Amount" placeholder="e.g. 300000" />)
    expect(screen.getByPlaceholderText('e.g. 300000')).toBeInTheDocument()
  })
})
