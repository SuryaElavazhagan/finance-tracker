// ─── Core domain types ────────────────────────────────────────────────────────

export type Currency = 'JPY' | 'INR'
export type Month = string // 'YYYY-MM'

export interface SalaryRecord {
  month: Month
  amountJPY: number
}

export interface RemittanceRecord {
  month: Month
  sentJPY: number
  receivedINR: number
}

export type CommitmentCategory = 'subscription' | 'utility' | 'insurance' | 'other'

export interface Commitment {
  id: string
  name: string
  currency: Currency
  defaultAmount: number
  category: CommitmentCategory
  active: boolean
  createdAt: string
}

export interface CommitmentRecord {
  month: Month
  commitmentId: string
  amount: number
  paid: boolean
}

export type DebtType = 'personal_loan' | 'emi' | 'credit_card'
export type DebtStatus = 'active' | 'cleared'

export interface Debt {
  id: string
  name: string
  type: DebtType
  currency: Currency
  originalAmount: number
  currentBalance: number
  monthlyRepayment: number
  startDate: Month
  status: DebtStatus
}

export interface DebtRepayment {
  month: Month
  debtId: string
  amountPaid: number
  balanceAfter: number
}

export interface MonthlySpend {
  month: Month
  spendJPY: number
  spendINR: number
}

export type GoalStatus = 'active' | 'achieved' | 'paused'

export interface Goal {
  id: string
  name: string
  currency: Currency
  targetAmount: number
  currentAmount: number
  status: GoalStatus
  createdAt: string
}

export interface GoalDeposit {
  month: Month
  goalId: string
  amount: number
}

export interface Settings {
  defaultRemittanceJPY: number
}

export interface Meta {
  version: number
  exportedAt: string
}

export interface AppData {
  salary: SalaryRecord[]
  remittances: RemittanceRecord[]
  commitments: Commitment[]
  commitmentRecords: CommitmentRecord[]
  debts: Debt[]
  debtRepayments: DebtRepayment[]
  monthlySpend: MonthlySpend[]
  goals: Goal[]
  goalDeposits: GoalDeposit[]
  settings: Settings
  meta: Meta
}
