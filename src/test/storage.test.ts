import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDefaultData,
  loadData,
  saveData,
  clearData,
  upsertSalary,
  getSalaryForMonth,
  upsertRemittance,
  getRemittanceForMonth,
  addCommitment,
  updateCommitment,
  deleteCommitment,
  upsertCommitmentRecord,
  getCommitmentRecordsForMonth,
  addDebt,
  updateDebt,
  addDebtRepayment,
  getDebtRepaymentsForMonth,
  upsertMonthlySpend,
  getMonthlySpendForMonth,
  addGoal,
  updateGoal,
  addGoalDeposit,
  getGoalDepositsForGoal,
  updateSettings,
  importData,
  getMonthSummary,
  computeDebtMetrics,
  computeGoalMetrics,
  getLast3MonthsAvgDeposit,
  currentMonth,
  formatMonth,
} from '../store/storage'
import type { AppData, Commitment, Debt, Goal } from '../types'

function makeData(): AppData {
  return getDefaultData()
}

const COMMITMENT: Commitment = {
  id: 'c1',
  name: 'Netflix',
  currency: 'JPY',
  defaultAmount: 1980,
  category: 'subscription',
  active: true,
  createdAt: '2025-01-01T00:00:00.000Z',
}

const DEBT: Debt = {
  id: 'd1',
  name: 'HDFC',
  type: 'credit_card',
  currency: 'INR',
  originalAmount: 80000,
  currentBalance: 40000,
  monthlyRepayment: 10000,
  startDate: '2025-01-01',
  status: 'active',
}

const GOAL: Goal = {
  id: 'g1',
  name: 'Emergency Fund',
  currency: 'JPY',
  targetAmount: 500000,
  currentAmount: 100000,
  status: 'active',
  createdAt: '2025-01-01T00:00:00.000Z',
}

// ─── localStorage persistence ─────────────────────────────────────────────────

describe('loadData / saveData / clearData', () => {
  it('returns default data when localStorage is empty', () => {
    const data = loadData()
    expect(data.salary).toEqual([])
    expect(data.settings.defaultRemittanceJPY).toBe(50000)
    expect(data.meta.version).toBe(1)
  })

  it('persists and reloads data correctly', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    saveData(data)

    const reloaded = loadData()
    expect(reloaded.salary[0].amountJPY).toBe(300000)
  })

  it('clears all data', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    saveData(data)
    clearData()
    const reloaded = loadData()
    expect(reloaded.salary).toEqual([])
  })

  it('returns default data when localStorage contains malformed JSON', () => {
    localStorage.setItem('finance-tracker-data', '{ bad json }}}')
    const data = loadData()
    expect(data.salary).toEqual([])
  })
})

// ─── Salary ───────────────────────────────────────────────────────────────────

describe('upsertSalary', () => {
  it('adds a new salary record', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    expect(data.salary).toHaveLength(1)
    expect(data.salary[0].amountJPY).toBe(300000)
  })

  it('updates an existing salary record for the same month', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertSalary(data, { month: '2025-01', amountJPY: 320000 })
    expect(data.salary).toHaveLength(1)
    expect(data.salary[0].amountJPY).toBe(320000)
  })

  it('keeps separate records for different months', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertSalary(data, { month: '2025-02', amountJPY: 310000 })
    expect(data.salary).toHaveLength(2)
  })
})

describe('getSalaryForMonth', () => {
  it('returns the record for the given month', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-03', amountJPY: 305000 })
    const rec = getSalaryForMonth(data, '2025-03')
    expect(rec?.amountJPY).toBe(305000)
  })

  it('returns undefined when no record exists', () => {
    expect(getSalaryForMonth(makeData(), '2025-03')).toBeUndefined()
  })
})

// ─── Remittance ───────────────────────────────────────────────────────────────

describe('upsertRemittance', () => {
  it('adds a remittance record', () => {
    let data = makeData()
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    expect(data.remittances).toHaveLength(1)
  })

  it('updates an existing remittance for the same month', () => {
    let data = makeData()
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 55000, receivedINR: 35000 })
    expect(data.remittances).toHaveLength(1)
    expect(data.remittances[0].sentJPY).toBe(55000)
    expect(data.remittances[0].receivedINR).toBe(35000)
  })
})

describe('getRemittanceForMonth', () => {
  it('returns undefined when no record exists', () => {
    expect(getRemittanceForMonth(makeData(), '2025-01')).toBeUndefined()
  })

  it('returns the record for the given month', () => {
    let data = makeData()
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    expect(getRemittanceForMonth(data, '2025-01')?.sentJPY).toBe(50000)
  })
})

// ─── Commitments ──────────────────────────────────────────────────────────────

describe('addCommitment', () => {
  it('adds a commitment', () => {
    const data = addCommitment(makeData(), COMMITMENT)
    expect(data.commitments).toHaveLength(1)
    expect(data.commitments[0].name).toBe('Netflix')
  })
})

describe('updateCommitment', () => {
  it('updates an existing commitment', () => {
    let data = addCommitment(makeData(), COMMITMENT)
    data = updateCommitment(data, { ...COMMITMENT, defaultAmount: 2200 })
    expect(data.commitments[0].defaultAmount).toBe(2200)
  })

  it('does not affect other commitments', () => {
    const c2: Commitment = { ...COMMITMENT, id: 'c2', name: 'Gym' }
    let data = addCommitment(makeData(), COMMITMENT)
    data = addCommitment(data, c2)
    data = updateCommitment(data, { ...COMMITMENT, defaultAmount: 2200 })
    expect(data.commitments.find((c) => c.id === 'c2')?.name).toBe('Gym')
  })
})

describe('deleteCommitment', () => {
  it('removes a commitment by id', () => {
    let data = addCommitment(makeData(), COMMITMENT)
    data = deleteCommitment(data, 'c1')
    expect(data.commitments).toHaveLength(0)
  })
})

describe('upsertCommitmentRecord', () => {
  it('adds a new commitment record', () => {
    let data = addCommitment(makeData(), COMMITMENT)
    data = upsertCommitmentRecord(data, {
      month: '2025-01',
      commitmentId: 'c1',
      amount: 1980,
      paid: true,
    })
    expect(data.commitmentRecords).toHaveLength(1)
  })

  it('updates an existing commitment record for same month+id', () => {
    let data = addCommitment(makeData(), COMMITMENT)
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 1980, paid: true })
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 2000, paid: false })
    expect(data.commitmentRecords).toHaveLength(1)
    expect(data.commitmentRecords[0].amount).toBe(2000)
    expect(data.commitmentRecords[0].paid).toBe(false)
  })
})

describe('getCommitmentRecordsForMonth', () => {
  it('returns only records for the given month', () => {
    let data = addCommitment(makeData(), COMMITMENT)
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 1980, paid: true })
    data = upsertCommitmentRecord(data, { month: '2025-02', commitmentId: 'c1', amount: 1980, paid: true })
    const records = getCommitmentRecordsForMonth(data, '2025-01')
    expect(records).toHaveLength(1)
  })
})

// ─── Debts ────────────────────────────────────────────────────────────────────

describe('addDebt', () => {
  it('adds a debt', () => {
    const data = addDebt(makeData(), DEBT)
    expect(data.debts).toHaveLength(1)
  })
})

describe('updateDebt', () => {
  it('updates a debt by id', () => {
    let data = addDebt(makeData(), DEBT)
    data = updateDebt(data, { ...DEBT, currentBalance: 30000 })
    expect(data.debts[0].currentBalance).toBe(30000)
  })
})

describe('addDebtRepayment', () => {
  it('adds a repayment and updates current balance on the debt', () => {
    let data = addDebt(makeData(), DEBT)
    data = addDebtRepayment(data, {
      month: '2025-01',
      debtId: 'd1',
      amountPaid: 10000,
      balanceAfter: 30000,
    })
    expect(data.debtRepayments).toHaveLength(1)
    expect(data.debts[0].currentBalance).toBe(30000)
  })
})

describe('getDebtRepaymentsForMonth', () => {
  it('returns repayments for the given month only', () => {
    let data = addDebt(makeData(), DEBT)
    data = addDebtRepayment(data, { month: '2025-01', debtId: 'd1', amountPaid: 10000, balanceAfter: 30000 })
    data = addDebtRepayment(data, { month: '2025-02', debtId: 'd1', amountPaid: 10000, balanceAfter: 20000 })
    expect(getDebtRepaymentsForMonth(data, '2025-01')).toHaveLength(1)
    expect(getDebtRepaymentsForMonth(data, '2025-02')).toHaveLength(1)
    expect(getDebtRepaymentsForMonth(data, '2025-03')).toHaveLength(0)
  })
})

// ─── Monthly Spend ────────────────────────────────────────────────────────────

describe('upsertMonthlySpend', () => {
  it('adds a spend record', () => {
    const data = upsertMonthlySpend(makeData(), { month: '2025-01', spendJPY: 80000, spendINR: 15000 })
    expect(data.monthlySpend).toHaveLength(1)
  })

  it('updates an existing spend record for same month', () => {
    let data = upsertMonthlySpend(makeData(), { month: '2025-01', spendJPY: 80000, spendINR: 15000 })
    data = upsertMonthlySpend(data, { month: '2025-01', spendJPY: 90000, spendINR: 20000 })
    expect(data.monthlySpend).toHaveLength(1)
    expect(data.monthlySpend[0].spendJPY).toBe(90000)
  })
})

describe('getMonthlySpendForMonth', () => {
  it('returns undefined when no record exists', () => {
    expect(getMonthlySpendForMonth(makeData(), '2025-01')).toBeUndefined()
  })

  it('returns the record for the given month', () => {
    const data = upsertMonthlySpend(makeData(), { month: '2025-01', spendJPY: 80000, spendINR: 15000 })
    expect(getMonthlySpendForMonth(data, '2025-01')?.spendJPY).toBe(80000)
  })
})

// ─── Goals ────────────────────────────────────────────────────────────────────

describe('addGoal', () => {
  it('adds a goal', () => {
    const data = addGoal(makeData(), GOAL)
    expect(data.goals).toHaveLength(1)
    expect(data.goals[0].name).toBe('Emergency Fund')
  })
})

describe('updateGoal', () => {
  it('updates a goal by id', () => {
    let data = addGoal(makeData(), GOAL)
    data = updateGoal(data, { ...GOAL, status: 'achieved' })
    expect(data.goals[0].status).toBe('achieved')
  })
})

describe('addGoalDeposit', () => {
  it('adds a deposit and increases currentAmount on the goal', () => {
    let data = addGoal(makeData(), GOAL)
    data = addGoalDeposit(data, { month: '2025-01', goalId: 'g1', amount: 20000 })
    expect(data.goalDeposits).toHaveLength(1)
    expect(data.goals[0].currentAmount).toBe(120000)
  })

  it('accumulates multiple deposits', () => {
    let data = addGoal(makeData(), GOAL)
    data = addGoalDeposit(data, { month: '2025-01', goalId: 'g1', amount: 20000 })
    data = addGoalDeposit(data, { month: '2025-02', goalId: 'g1', amount: 30000 })
    expect(data.goals[0].currentAmount).toBe(150000)
  })
})

describe('getGoalDepositsForGoal', () => {
  it('returns deposits for the given goal only', () => {
    const g2: Goal = { ...GOAL, id: 'g2', name: 'Laptop' }
    let data = addGoal(addGoal(makeData(), GOAL), g2)
    data = addGoalDeposit(data, { month: '2025-01', goalId: 'g1', amount: 20000 })
    data = addGoalDeposit(data, { month: '2025-01', goalId: 'g2', amount: 5000 })
    expect(getGoalDepositsForGoal(data, 'g1')).toHaveLength(1)
    expect(getGoalDepositsForGoal(data, 'g2')).toHaveLength(1)
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('updateSettings', () => {
  it('updates default remittance', () => {
    let data = makeData()
    data = updateSettings(data, { defaultRemittanceJPY: 60000 })
    expect(data.settings.defaultRemittanceJPY).toBe(60000)
  })
})

// ─── Import ───────────────────────────────────────────────────────────────────

describe('importData', () => {
  it('parses valid JSON and returns AppData', () => {
    const original = makeData()
    const json = JSON.stringify(original)
    const imported = importData(json)
    expect(imported.meta.version).toBe(1)
  })

  it('throws on invalid JSON', () => {
    expect(() => importData('{ bad json }')).toThrow()
  })

  it('throws when required fields are missing', () => {
    expect(() => importData(JSON.stringify({ salary: [] }))).toThrow('Invalid backup file')
  })
})

// ─── getMonthSummary ──────────────────────────────────────────────────────────

describe('getMonthSummary', () => {
  it('computes zero summary for empty data', () => {
    const s = getMonthSummary(makeData(), '2025-01')
    expect(s.jpyIncome).toBe(0)
    expect(s.jpyRemaining).toBe(0)
    expect(s.inrInflow).toBe(0)
    expect(s.inrRemaining).toBe(0)
  })

  it('computes correct JPY remaining', () => {
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = upsertMonthlySpend(data, { month: '2025-01', spendJPY: 80000, spendINR: 10000 })
    data = addCommitment(data, COMMITMENT)
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 1980, paid: true })

    const s = getMonthSummary(data, '2025-01')
    // 300000 - 1980 - 0 (no JPY debt) - 50000 - 80000 = 168020
    expect(s.jpyRemaining).toBe(168020)
  })

  it('computes correct INR remaining', () => {
    let data = makeData()
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = upsertMonthlySpend(data, { month: '2025-01', spendJPY: 0, spendINR: 10000 })

    const s = getMonthSummary(data, '2025-01')
    // 32000 - 0 - 0 - 10000 = 22000
    expect(s.inrRemaining).toBe(22000)
  })

  it('separates JPY and INR commitments correctly', () => {
    const inrCommitment: Commitment = { ...COMMITMENT, id: 'c2', currency: 'INR', defaultAmount: 500 }
    let data = makeData()
    data = upsertSalary(data, { month: '2025-01', amountJPY: 300000 })
    data = upsertRemittance(data, { month: '2025-01', sentJPY: 50000, receivedINR: 32000 })
    data = addCommitment(data, COMMITMENT)       // JPY
    data = addCommitment(data, inrCommitment)    // INR
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 1980, paid: true })
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c2', amount: 500, paid: true })

    const s = getMonthSummary(data, '2025-01')
    expect(s.jpyCommitmentTotal).toBe(1980)
    expect(s.inrCommitmentTotal).toBe(500)
  })

  it('excludes unpaid commitment records from totals', () => {
    let data = makeData()
    data = addCommitment(data, COMMITMENT)
    data = upsertCommitmentRecord(data, { month: '2025-01', commitmentId: 'c1', amount: 1980, paid: false })
    const s = getMonthSummary(data, '2025-01')
    expect(s.jpyCommitmentTotal).toBe(0)
  })
})

// ─── computeDebtMetrics ───────────────────────────────────────────────────────

describe('computeDebtMetrics', () => {
  it('calculates percent paid and months to clear', () => {
    const m = computeDebtMetrics(DEBT)
    expect(m.paidOff).toBe(40000)
    expect(m.percentPaid).toBeCloseTo(50)
    expect(m.monthsToClear).toBe(4) // 40000 / 10000
  })

  it('returns null monthsToClear when repayment is 0', () => {
    const debt = { ...DEBT, monthlyRepayment: 0 }
    const m = computeDebtMetrics(debt)
    expect(m.monthsToClear).toBeNull()
  })

  it('returns 0 percentPaid when originalAmount is 0', () => {
    const debt = { ...DEBT, originalAmount: 0, currentBalance: 0 }
    const m = computeDebtMetrics(debt)
    expect(m.percentPaid).toBe(0)
  })
})

// ─── computeGoalMetrics ───────────────────────────────────────────────────────

describe('computeGoalMetrics', () => {
  it('calculates percent complete and estimated months', () => {
    const m = computeGoalMetrics(GOAL, 20000)
    expect(m.remaining).toBe(400000)
    expect(m.percentComplete).toBeCloseTo(20)
    expect(m.estimatedMonths).toBe(20) // 400000 / 20000
  })

  it('returns null estimatedMonths when avg is 0', () => {
    const m = computeGoalMetrics(GOAL, 0)
    expect(m.estimatedMonths).toBeNull()
  })

  it('returns 0 percentComplete when targetAmount is 0', () => {
    const goal = { ...GOAL, targetAmount: 0, currentAmount: 0 }
    const m = computeGoalMetrics(goal, 0)
    expect(m.percentComplete).toBe(0)
  })
})

// ─── getLast3MonthsAvgDeposit ─────────────────────────────────────────────────

describe('getLast3MonthsAvgDeposit', () => {
  it('returns 0 when no deposits', () => {
    const data = addGoal(makeData(), GOAL)
    expect(getLast3MonthsAvgDeposit(data, 'g1', '2025-04')).toBe(0)
  })

  it('averages the last 3 months before the current month', () => {
    let data = addGoal(makeData(), GOAL)
    data = addGoalDeposit(data, { month: '2025-01', goalId: 'g1', amount: 20000 })
    data = addGoalDeposit(data, { month: '2025-02', goalId: 'g1', amount: 30000 })
    data = addGoalDeposit(data, { month: '2025-03', goalId: 'g1', amount: 10000 })
    // current is '2025-04', so all 3 are included
    const avg = getLast3MonthsAvgDeposit(data, 'g1', '2025-04')
    expect(avg).toBeCloseTo(20000) // (20000+30000+10000)/3
  })

  it('excludes the current month from the average', () => {
    let data = addGoal(makeData(), GOAL)
    data = addGoalDeposit(data, { month: '2025-03', goalId: 'g1', amount: 30000 })
    data = addGoalDeposit(data, { month: '2025-04', goalId: 'g1', amount: 99999 }) // current
    const avg = getLast3MonthsAvgDeposit(data, 'g1', '2025-04')
    expect(avg).toBe(30000)
  })
})

// ─── Utility helpers ──────────────────────────────────────────────────────────

describe('currentMonth', () => {
  it('returns a string matching YYYY-MM', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('formatMonth', () => {
  it('formats 2025-01 to a human-readable string', () => {
    const result = formatMonth('2025-01')
    expect(result).toContain('2025')
  })
})
