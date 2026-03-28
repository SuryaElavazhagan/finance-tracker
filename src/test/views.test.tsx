import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppProvider } from '../hooks/useAppData'
import { SummaryView } from '../views/SummaryView'
import { DebtsView } from '../views/DebtsView'
import { GoalsView } from '../views/GoalsView'
import { SettingsView } from '../views/SettingsView'
import { ExportImportView } from '../views/ExportImportView'
import { TrendsView } from '../views/TrendsView'
import { CheckInView } from '../views/CheckInView'
import {
  saveData, getDefaultData, addDebt, addGoal, upsertSalary, upsertRemittance,
  addCommitment,
} from '../store/storage'
import type { Debt, Goal, Commitment } from '../types'

function renderWithProvider(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>)
}

function seedDebt(): Debt {
  const debt: Debt = {
    id: 'd1', name: 'HDFC Card', type: 'credit_card',
    currency: 'INR', originalAmount: 80000, currentBalance: 40000,
    monthlyRepayment: 10000, startDate: '2025-01', status: 'active',
  }
  let data = getDefaultData()
  data = addDebt(data, debt)
  saveData(data)
  return debt
}

function seedGoal(): Goal {
  const goal: Goal = {
    id: 'g1', name: 'Emergency Fund', currency: 'JPY',
    targetAmount: 500000, currentAmount: 100000,
    status: 'active', createdAt: '2025-01-01T00:00:00.000Z',
  }
  let data = getDefaultData()
  data = addGoal(data, goal)
  saveData(data)
  return goal
}

// ─── SummaryView ──────────────────────────────────────────────────────────────

describe('SummaryView', () => {
  it('renders JPY and INR sections', () => {
    renderWithProvider(<SummaryView />)
    expect(screen.getByText('JPY')).toBeInTheDocument()
    expect(screen.getByText('INR')).toBeInTheDocument()
  })

  it('shows previous/next month navigation buttons', () => {
    renderWithProvider(<SummaryView />)
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument()
    expect(screen.getByLabelText('Next month')).toBeInTheDocument()
  })

  it('next month button is disabled on current (most recent) month', () => {
    renderWithProvider(<SummaryView />)
    expect(screen.getByLabelText('Next month')).toBeDisabled()
  })

  it('displays salary when data is seeded', () => {
    let data = getDefaultData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    saveData(data)
    renderWithProvider(<SummaryView />)
    // Income row should appear
    expect(screen.getByText('Income')).toBeInTheDocument()
  })
})

// ─── DebtsView ────────────────────────────────────────────────────────────────

describe('DebtsView', () => {
  it('shows empty state when no debts', () => {
    renderWithProvider(<DebtsView />)
    expect(screen.getByText(/No active debts/i)).toBeInTheDocument()
  })

  it('shows Add Debt button', () => {
    renderWithProvider(<DebtsView />)
    expect(screen.getByRole('button', { name: /Add Debt/i })).toBeInTheDocument()
  })

  it('opens add debt form on button click', () => {
    renderWithProvider(<DebtsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Debt/i }))
    expect(screen.getByText('New Debt')).toBeInTheDocument()
  })

  it('renders seeded debt', () => {
    seedDebt()
    renderWithProvider(<DebtsView />)
    expect(screen.getByText('HDFC Card')).toBeInTheDocument()
  })

  it('shows total JPY and INR outstanding cards', () => {
    renderWithProvider(<DebtsView />)
    expect(screen.getByText('Total JPY outstanding')).toBeInTheDocument()
    expect(screen.getByText('Total INR outstanding')).toBeInTheDocument()
  })

  it('cancels add debt form', () => {
    renderWithProvider(<DebtsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Debt/i }))
    expect(screen.getByText('New Debt')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('New Debt')).not.toBeInTheDocument()
  })
})

// ─── GoalsView ────────────────────────────────────────────────────────────────

describe('GoalsView', () => {
  it('shows empty state when no goals', () => {
    renderWithProvider(<GoalsView />)
    expect(screen.getByText(/No active goals/i)).toBeInTheDocument()
  })

  it('shows Add Goal button', () => {
    renderWithProvider(<GoalsView />)
    expect(screen.getByRole('button', { name: /Add Goal/i })).toBeInTheDocument()
  })

  it('opens add goal form on button click', () => {
    renderWithProvider(<GoalsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Goal/i }))
    expect(screen.getByText('New Goal')).toBeInTheDocument()
  })

  it('renders seeded goal', () => {
    seedGoal()
    renderWithProvider(<GoalsView />)
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('shows total JPY and INR saved cards', () => {
    renderWithProvider(<GoalsView />)
    expect(screen.getByText('Total JPY saved')).toBeInTheDocument()
    expect(screen.getByText('Total INR saved')).toBeInTheDocument()
  })

  it('cancels add goal form', () => {
    renderWithProvider(<GoalsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Goal/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('New Goal')).not.toBeInTheDocument()
  })
})

// ─── TrendsView ───────────────────────────────────────────────────────────────

describe('TrendsView', () => {
  it('shows placeholder when fewer than 2 months of data', () => {
    renderWithProvider(<TrendsView />)
    expect(screen.getByText(/Complete at least 2 months/i)).toBeInTheDocument()
  })

  it('renders charts when 2+ months of data exist', () => {
    let data = getDefaultData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertSalary(data, { month: '2025-02', amountJPY: 310000 })
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = upsertRemittance(data, { month: '2025-02', sentJPY: 50000, receivedINR: 32000 })
    saveData(data)
    renderWithProvider(<TrendsView />)
    expect(screen.getByText('Savings per month')).toBeInTheDocument()
    expect(screen.getByText('Overall spend per month')).toBeInTheDocument()
  })
})

// ─── SettingsView ─────────────────────────────────────────────────────────────

describe('SettingsView', () => {
  it('renders default remittance section', () => {
    renderWithProvider(<SettingsView />)
    expect(screen.getByText('Default Remittance')).toBeInTheDocument()
  })

  it('renders recurring commitments section', () => {
    renderWithProvider(<SettingsView />)
    expect(screen.getByText('Recurring Commitments')).toBeInTheDocument()
  })

  it('shows empty commitments message', () => {
    renderWithProvider(<SettingsView />)
    expect(screen.getByText('No commitments yet.')).toBeInTheDocument()
  })

  it('opens commitment form on Add button click', () => {
    renderWithProvider(<SettingsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    expect(screen.getByText('New Commitment')).toBeInTheDocument()
  })
})

// ─── ExportImportView ─────────────────────────────────────────────────────────

describe('ExportImportView', () => {
  beforeEach(() => {
    // Prevent actual DOM anchor creation from causing issues
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders export and import sections', () => {
    renderWithProvider(<ExportImportView />)
    expect(screen.getByText('Export to iCloud')).toBeInTheDocument()
    expect(screen.getByText('Import from backup')).toBeInTheDocument()
  })

  it('renders data summary section', () => {
    renderWithProvider(<ExportImportView />)
    expect(screen.getByText('Data summary')).toBeInTheDocument()
    expect(screen.getByText('Salary records')).toBeInTheDocument()
  })

  it('export button triggers download', () => {
    renderWithProvider(<ExportImportView />)
    // Should not throw
    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /Export backup/i }))
    ).not.toThrow()
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('shows error on invalid import file', async () => {
    renderWithProvider(<ExportImportView />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['{ bad json }}}'], 'bad.json', { type: 'application/json' })
    Object.defineProperty(input, 'files', { value: [file] })
    fireEvent.change(input)
    // FileReader is async — wait for next tick
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.getByText(/Invalid backup file/i)).toBeInTheDocument()
  })
})

// ─── CheckInView ──────────────────────────────────────────────────────────────

describe('CheckInView', () => {
  it('renders step 1 heading and salary input', () => {
    renderWithProvider(<CheckInView />)
    expect(screen.getByText('Monthly Check-in')).toBeInTheDocument()
    expect(screen.getByText('JPY Take-home Salary')).toBeInTheDocument()
  })

  it('shows step indicator with 7 segments', () => {
    const { container } = renderWithProvider(<CheckInView />)
    // 7 step bar segments
    const bars = container.querySelectorAll('.h-1.flex-1.rounded-full')
    expect(bars.length).toBe(7)
  })

  it('advances to step 2 on Save & Continue', () => {
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText('Recurring Bills')).toBeInTheDocument()
  })

  it('goes back to step 1 on Back button', () => {
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText('Recurring Bills')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('JPY Take-home Salary')).toBeInTheDocument()
  })

  it('shows no commitments message on step 2 when none added', () => {
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText(/No active commitments/i)).toBeInTheDocument()
  })

  it('shows no active debts message on step 3', () => {
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // -> step 2
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // -> step 3
    expect(screen.getByText(/No active debts/i)).toBeInTheDocument()
  })

  it('walks through all 7 steps to summary', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 6; i++) {
      // Step 5 has "Finish & View Summary", others have "Save & Continue"
      const btn =
        screen.queryByRole('button', { name: /Finish & View Summary/i }) ??
        screen.getByRole('button', { name: /Save & Continue/i })
      fireEvent.click(btn)
    }
    // Step 7 (index 6) shows summary — no more next button
    expect(screen.queryByRole('button', { name: /Save & Continue/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Finish/i })).not.toBeInTheDocument()
  })

  it('shows salary entered on step 1 saved and reflected in summary', () => {
    renderWithProvider(<CheckInView />)
    const input = screen.getByPlaceholderText('e.g. 300000')
    fireEvent.change(input, { target: { value: '300000' } })
    // Advance all steps
    for (let i = 0; i < 6; i++) {
      const btn =
        screen.queryByRole('button', { name: /Finish & View Summary/i }) ??
        screen.getByRole('button', { name: /Save & Continue/i })
      fireEvent.click(btn)
    }
    expect(screen.getByText('¥300,000')).toBeInTheDocument()
  })

  it('step 4 shows remittance fields', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    expect(screen.getByText('Remittance to India')).toBeInTheDocument()
    expect(screen.getByLabelText(/Sent/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Received/i)).toBeInTheDocument()
  })

  it('step 5 shows overall spend fields', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    expect(screen.getByText('Overall Spend Estimate')).toBeInTheDocument()
  })

  it('step 6 shows no active goals message when none added', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    expect(screen.getByText(/No active goals/i)).toBeInTheDocument()
  })

  it('shows commitment checkboxes when commitments exist', () => {
    let data = getDefaultData()
    const c: Commitment = {
      id: 'c1', name: 'Netflix', currency: 'JPY',
      defaultAmount: 1980, category: 'subscription', active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    data = addCommitment(data, c)
    saveData(data)
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByLabelText(/Mark Netflix as paid/i)).toBeInTheDocument()
  })
})

// ─── DebtsView (extended) ────────────────────────────────────────────────────

describe('DebtsView (extended)', () => {
  it('expands a debt card to show repayment form', () => {
    seedDebt()
    renderWithProvider(<DebtsView />)
    fireEvent.click(screen.getByText('HDFC Card'))
    expect(screen.getByLabelText('Amount paid (₹)')).toBeInTheDocument()
  })

  it('adds a new debt via the form', () => {
    renderWithProvider(<DebtsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Debt/i }))
    fireEvent.change(screen.getByPlaceholderText('e.g. HDFC Credit Card'), { target: { value: 'Car Loan' } })
    fireEvent.change(screen.getByLabelText('Original amount'), { target: { value: '200000' } })
    // Two "Add Debt" buttons exist: header toggle + form submit; click the form submit (index 1)
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Debt' })[1])
    expect(screen.getByText('Car Loan')).toBeInTheDocument()
  })

  it('records a repayment and updates the balance', () => {
    seedDebt()
    renderWithProvider(<DebtsView />)
    // Expand
    fireEvent.click(screen.getByText('HDFC Card'))
    // Enter repayment amount — label is "Amount paid (₹)" for INR debt
    const amountInput = screen.getByLabelText('Amount paid (₹)')
    fireEvent.change(amountInput, { target: { value: '10000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record' }))
    // Balance should update — card still visible
    expect(screen.getByText('HDFC Card')).toBeInTheDocument()
  })
})

// ─── GoalsView (extended) ────────────────────────────────────────────────────

describe('GoalsView (extended)', () => {
  it('expands a goal card to show deposit form', () => {
    seedGoal()
    renderWithProvider(<GoalsView />)
    fireEvent.click(screen.getByText('Emergency Fund'))
    expect(screen.getByLabelText(/Added/i)).toBeInTheDocument()
  })

  it('adds a new goal via the form', () => {
    renderWithProvider(<GoalsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add Goal/i }))
    fireEvent.change(screen.getByPlaceholderText('e.g. Emergency fund'), { target: { value: 'New Laptop' } })
    fireEvent.change(screen.getByPlaceholderText('e.g. 500000'), { target: { value: '150000' } })
    // Two "Add Goal" buttons: header toggle + form submit; click the form submit (index 1)
    fireEvent.click(screen.getAllByRole('button', { name: 'Add Goal' })[1])
    expect(screen.getByText('New Laptop')).toBeInTheDocument()
  })

  it('records a deposit', () => {
    seedGoal()
    renderWithProvider(<GoalsView />)
    fireEvent.click(screen.getByText('Emergency Fund'))
    const input = screen.getByLabelText(/Added/i)
    fireEvent.change(input, { target: { value: '20000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    // Goal should still be shown
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })
})

// ─── SettingsView (extended) ──────────────────────────────────────────────────

describe('SettingsView (extended)', () => {
  it('saves updated default remittance', () => {
    renderWithProvider(<SettingsView />)
    const input = screen.getByLabelText('Default monthly remittance (¥)')
    fireEvent.change(input, { target: { value: '60000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText(/¥60,000/)).toBeInTheDocument()
  })

  it('adds a commitment and it appears in the list', () => {
    renderWithProvider(<SettingsView />)
    fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    fireEvent.change(screen.getByPlaceholderText('e.g. Netflix'), { target: { value: 'Gym' } })
    fireEvent.change(screen.getByLabelText('Default amount'), { target: { value: '3000' } })
    // Two "Add" buttons: header toggle + form submit; click the form submit (index 1)
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[1])
    expect(screen.getByText('Gym')).toBeInTheDocument()
  })

  it('edits a commitment', () => {
    let data = getDefaultData()
    const c: Commitment = {
      id: 'c1', name: 'Netflix', currency: 'JPY',
      defaultAmount: 1980, category: 'subscription', active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    data = addCommitment(data, c)
    saveData(data)
    renderWithProvider(<SettingsView />)
    fireEvent.click(screen.getByLabelText('Edit Netflix'))
    // Form appears in edit mode with existing values
    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument()
  })

  it('deletes a commitment', () => {
    let data = getDefaultData()
    const c: Commitment = {
      id: 'c1', name: 'Netflix', currency: 'JPY',
      defaultAmount: 1980, category: 'subscription', active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    data = addCommitment(data, c)
    saveData(data)
    renderWithProvider(<SettingsView />)
    expect(screen.getByText('Netflix')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Delete Netflix'))
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument()
  })
})

// ─── SummaryView (extended) ───────────────────────────────────────────────────

describe('SummaryView (extended)', () => {
  it('navigates to previous month when data exists', () => {
    let data = getDefaultData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertSalary(data, { month: '2025-02', amountJPY: 310000 })
    saveData(data)
    renderWithProvider(<SummaryView />)
    // months = [currentMonth, '2025-02', '2025-01'] — need to click prev twice to reach Jan 2025
    const prev = screen.getByLabelText('Previous month')
    fireEvent.click(prev) // -> 2025-02
    fireEvent.click(prev) // -> 2025-01
    // Should show Jan 2025 summary
    expect(screen.getByText(/Jan 2025/i)).toBeInTheDocument()
  })
})

// ─── TrendsView (extended) ────────────────────────────────────────────────────

describe('TrendsView (extended)', () => {
  it('renders remittance and debt charts with 2+ months of data', () => {
    let data = getDefaultData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertSalary(data, { month: '2025-02', amountJPY: 310000 })
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = upsertRemittance(data, { month: '2025-02', sentJPY: 55000, receivedINR: 34000 })
    saveData(data)
    renderWithProvider(<TrendsView />)
    expect(screen.getByText('Remittance sent (¥)')).toBeInTheDocument()
    expect(screen.getByText('Debt outstanding')).toBeInTheDocument()
  })
})

// ─── CheckInView (with data) ──────────────────────────────────────────────────

describe('CheckInView (with data)', () => {
  it('saves salary on step 0 and advances', () => {
    renderWithProvider(<CheckInView />)
    const input = screen.getByPlaceholderText('e.g. 300000')
    fireEvent.change(input, { target: { value: '280000' } })
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText('Recurring Bills')).toBeInTheDocument()
  })

  it('step 2 with active debt shows repayment inputs', () => {
    seedDebt()
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // step 1
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // step 2
    expect(screen.getByLabelText(/Repayment for HDFC Card/i)).toBeInTheDocument()
  })

  it('saves debt repayment on step 2 and advances', () => {
    seedDebt()
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // step 1
    // Enter repayment on step 2
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // step 2 render
    const repayInput = screen.getByLabelText(/Repayment for HDFC Card/i)
    fireEvent.change(repayInput, { target: { value: '10000' } })
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // save step 2
    expect(screen.getByText('Remittance to India')).toBeInTheDocument()
  })

  it('step 1 with commitment shows checkbox and amount input', () => {
    let data = getDefaultData()
    const c: Commitment = {
      id: 'c1', name: 'Netflix', currency: 'JPY',
      defaultAmount: 1980, category: 'subscription', active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    data = addCommitment(data, c)
    saveData(data)
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByLabelText(/Mark Netflix as paid/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount for Netflix/i)).toBeInTheDocument()
  })

  it('saves commitment record on step 1', () => {
    let data = getDefaultData()
    const c: Commitment = {
      id: 'c2', name: 'Electricity', currency: 'JPY',
      defaultAmount: 5000, category: 'utility', active: true,
      createdAt: '2025-01-01T00:00:00.000Z',
    }
    data = addCommitment(data, c)
    saveData(data)
    renderWithProvider(<CheckInView />)
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // go to step 1
    // Uncheck the commitment
    fireEvent.click(screen.getByLabelText(/Mark Electricity as paid/i))
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i })) // save step 1
    expect(screen.getByText('Debt Repayments')).toBeInTheDocument()
  })

  it('saves remittance on step 3 and advances', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    // Now on step 3 - remittance
    fireEvent.change(screen.getByLabelText(/Sent/i), { target: { value: '50000' } })
    fireEvent.change(screen.getByLabelText(/Received/i), { target: { value: '32000' } })
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText('Overall Spend Estimate')).toBeInTheDocument()
  })

  it('saves spend on step 4 and advances', () => {
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    // Now on step 4 - spend
    fireEvent.change(screen.getByLabelText(/JPY spend/i), { target: { value: '80000' } })
    fireEvent.change(screen.getByLabelText(/INR spend/i), { target: { value: '15000' } })
    fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    expect(screen.getByText('Update Savings Goals')).toBeInTheDocument()
  })

  it('step 5 with active goal shows goal deposit input', () => {
    seedGoal()
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('saves goal deposit on step 5 and shows summary', () => {
    seedGoal()
    renderWithProvider(<CheckInView />)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
    }
    // step 5: enter deposit
    const depositInput = screen.getByLabelText(/Amount added this month/i)
    fireEvent.change(depositInput, { target: { value: '20000' } })
    fireEvent.click(screen.getByRole('button', { name: /Finish & View Summary/i }))
    // step 6 summary
    expect(screen.getByText(/Check-in complete/i)).toBeInTheDocument()
  })
})
