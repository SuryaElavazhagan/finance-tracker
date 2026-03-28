import type {
  AppData,
  SalaryRecord,
  RemittanceRecord,
  Commitment,
  CommitmentRecord,
  Debt,
  DebtRepayment,
  MonthlySpend,
  Goal,
  GoalDeposit,
  Settings,
} from '../types'

const STORAGE_KEY = 'finance-tracker-data'
const SCHEMA_VERSION = 1

export function getDefaultData(): AppData {
  return {
    salary: [],
    remittances: [],
    commitments: [],
    commitmentRecords: [],
    debts: [],
    debtRepayments: [],
    monthlySpend: [],
    goals: [],
    goalDeposits: [],
    settings: {
      defaultRemittanceJPY: 50000,
      openingBalanceJPY: 0,
      openingBalanceINR: 0,
    },
    meta: {
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
    },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    const parsed = JSON.parse(raw) as AppData
    // Migrate settings fields added after initial release
    const settings: Settings = {
      defaultRemittanceJPY: 50000,
      openingBalanceJPY: 0,
      openingBalanceINR: 0,
      ...(parsed.settings as Partial<Settings>),
    }
    return { ...parsed, settings }
  } catch {
    return getDefaultData()
  }
}

export function saveData(data: AppData): void {
  const updated: AppData = {
    ...data,
    meta: { ...data.meta, exportedAt: new Date().toISOString() },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Salary ──────────────────────────────────────────────────────────────────

export function upsertSalary(data: AppData, record: SalaryRecord): AppData {
  const existing = data.salary.findIndex((s) => s.month === record.month)
  const salary =
    existing >= 0
      ? data.salary.map((s, i) => (i === existing ? record : s))
      : [...data.salary, record]
  return { ...data, salary }
}

export function getSalaryForMonth(data: AppData, month: string): SalaryRecord | undefined {
  return data.salary.find((s) => s.month === month)
}

// ─── Remittance ───────────────────────────────────────────────────────────────

export function upsertRemittance(data: AppData, record: RemittanceRecord): AppData {
  const existing = data.remittances.findIndex((r) => r.month === record.month)
  const remittances =
    existing >= 0
      ? data.remittances.map((r, i) => (i === existing ? record : r))
      : [...data.remittances, record]
  return { ...data, remittances }
}

export function getRemittanceForMonth(
  data: AppData,
  month: string,
): RemittanceRecord | undefined {
  return data.remittances.find((r) => r.month === month)
}

// ─── Commitments ──────────────────────────────────────────────────────────────

export function addCommitment(data: AppData, commitment: Commitment): AppData {
  return { ...data, commitments: [...data.commitments, commitment] }
}

export function updateCommitment(data: AppData, commitment: Commitment): AppData {
  return {
    ...data,
    commitments: data.commitments.map((c) => (c.id === commitment.id ? commitment : c)),
  }
}

export function deleteCommitment(data: AppData, id: string): AppData {
  return { ...data, commitments: data.commitments.filter((c) => c.id !== id) }
}

export function upsertCommitmentRecord(data: AppData, record: CommitmentRecord): AppData {
  const existing = data.commitmentRecords.findIndex(
    (r) => r.month === record.month && r.commitmentId === record.commitmentId,
  )
  const commitmentRecords =
    existing >= 0
      ? data.commitmentRecords.map((r, i) => (i === existing ? record : r))
      : [...data.commitmentRecords, record]
  return { ...data, commitmentRecords }
}

export function getCommitmentRecordsForMonth(
  data: AppData,
  month: string,
): CommitmentRecord[] {
  return data.commitmentRecords.filter((r) => r.month === month)
}

// ─── Debts ────────────────────────────────────────────────────────────────────

export function addDebt(data: AppData, debt: Debt): AppData {
  return { ...data, debts: [...data.debts, debt] }
}

export function updateDebt(data: AppData, debt: Debt): AppData {
  return {
    ...data,
    debts: data.debts.map((d) => (d.id === debt.id ? debt : d)),
  }
}

export function addDebtRepayment(data: AppData, repayment: DebtRepayment): AppData {
  // Also update current balance on the debt
  const debts = data.debts.map((d) =>
    d.id === repayment.debtId
      ? { ...d, currentBalance: repayment.balanceAfter }
      : d,
  )
  return { ...data, debts, debtRepayments: [...data.debtRepayments, repayment] }
}

export function getDebtRepaymentsForMonth(
  data: AppData,
  month: string,
): DebtRepayment[] {
  return data.debtRepayments.filter((r) => r.month === month)
}

// ─── Monthly Spend ────────────────────────────────────────────────────────────

export function upsertMonthlySpend(data: AppData, record: MonthlySpend): AppData {
  const existing = data.monthlySpend.findIndex((s) => s.month === record.month)
  const monthlySpend =
    existing >= 0
      ? data.monthlySpend.map((s, i) => (i === existing ? record : s))
      : [...data.monthlySpend, record]
  return { ...data, monthlySpend }
}

export function getMonthlySpendForMonth(
  data: AppData,
  month: string,
): MonthlySpend | undefined {
  return data.monthlySpend.find((s) => s.month === month)
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function addGoal(data: AppData, goal: Goal): AppData {
  return { ...data, goals: [...data.goals, goal] }
}

export function updateGoal(data: AppData, goal: Goal): AppData {
  return {
    ...data,
    goals: data.goals.map((g) => (g.id === goal.id ? goal : g)),
  }
}

export function addGoalDeposit(data: AppData, deposit: GoalDeposit): AppData {
  // Also update currentAmount on the goal
  const goals = data.goals.map((g) =>
    g.id === deposit.goalId
      ? { ...g, currentAmount: g.currentAmount + deposit.amount }
      : g,
  )
  return { ...data, goals, goalDeposits: [...data.goalDeposits, deposit] }
}

export function getGoalDepositsForGoal(data: AppData, goalId: string): GoalDeposit[] {
  return data.goalDeposits.filter((d) => d.goalId === goalId)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function updateSettings(data: AppData, settings: Settings): AppData {
  return { ...data, settings }
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export function exportData(data: AppData): void {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString) as AppData
  if (!parsed.meta || !parsed.settings) {
    throw new Error('Invalid backup file')
  }
  return parsed
}

// ─── Metrics helpers ──────────────────────────────────────────────────────────

export function getMonthSummary(data: AppData, month: string) {
  const salary = getSalaryForMonth(data, month)
  const remittance = getRemittanceForMonth(data, month)
  const spend = getMonthlySpendForMonth(data, month)
  const commitmentRecords = getCommitmentRecordsForMonth(data, month)
  const debtRepayments = getDebtRepaymentsForMonth(data, month)

  const jpyCommitmentTotal = commitmentRecords
    .filter((r) => {
      const c = data.commitments.find((c) => c.id === r.commitmentId)
      return c?.currency === 'JPY' && r.paid
    })
    .reduce((sum, r) => sum + r.amount, 0)

  const inrCommitmentTotal = commitmentRecords
    .filter((r) => {
      const c = data.commitments.find((c) => c.id === r.commitmentId)
      return c?.currency === 'INR' && r.paid
    })
    .reduce((sum, r) => sum + r.amount, 0)

  const jpyDebtTotal = debtRepayments
    .filter((r) => {
      const d = data.debts.find((d) => d.id === r.debtId)
      return d?.currency === 'JPY'
    })
    .reduce((sum, r) => sum + r.amountPaid, 0)

  const inrDebtTotal = debtRepayments
    .filter((r) => {
      const d = data.debts.find((d) => d.id === r.debtId)
      return d?.currency === 'INR'
    })
    .reduce((sum, r) => sum + r.amountPaid, 0)

  const jpyIncome = salary?.amountJPY ?? 0
  const jpySpend = spend?.spendJPY ?? 0
  const remittanceSent = remittance?.sentJPY ?? 0
  const jpyRemaining =
    jpyIncome - jpyCommitmentTotal - jpyDebtTotal - remittanceSent - jpySpend

  const inrInflow = remittance?.receivedINR ?? 0
  const inrSpend = spend?.spendINR ?? 0
  const inrRemaining = inrInflow - inrCommitmentTotal - inrDebtTotal - inrSpend

  return {
    jpyIncome,
    jpyCommitmentTotal,
    jpyDebtTotal,
    remittanceSent,
    jpySpend,
    jpyRemaining,
    inrInflow,
    inrCommitmentTotal,
    inrDebtTotal,
    inrSpend,
    inrRemaining,
  }
}

export function computeDebtMetrics(debt: Debt) {
  const paidOff = debt.originalAmount - debt.currentBalance
  const percentPaid =
    debt.originalAmount > 0 ? (paidOff / debt.originalAmount) * 100 : 0
  const monthsToClear =
    debt.monthlyRepayment > 0
      ? Math.ceil(debt.currentBalance / debt.monthlyRepayment)
      : null
  return { paidOff, percentPaid, monthsToClear }
}

export function computeGoalMetrics(goal: Goal, last3MonthsAvg: number) {
  const remaining = goal.targetAmount - goal.currentAmount
  const percentComplete =
    goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const estimatedMonths =
    last3MonthsAvg > 0 ? Math.ceil(remaining / last3MonthsAvg) : null
  return { remaining, percentComplete, estimatedMonths }
}

export function getLast3MonthsAvgDeposit(
  data: AppData,
  goalId: string,
  currentMonth: string,
): number {
  const allMonths = data.goalDeposits
    .filter((d) => d.goalId === goalId && d.month < currentMonth)
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 3)
  if (allMonths.length === 0) return 0
  return allMonths.reduce((s, d) => s + d.amount, 0) / allMonths.length
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-')
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleString('default', { month: 'short', year: 'numeric' })
}
