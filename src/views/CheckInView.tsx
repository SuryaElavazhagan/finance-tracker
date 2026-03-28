import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePrivacy } from '../hooks/usePrivacy'
import {
  upsertSalary,
  upsertRemittance,
  upsertCommitmentRecord,
  addDebtRepayment,
  upsertMonthlySpend,
  addGoalDeposit,
  getMonthSummary,
  currentMonth,
  formatMonth,
} from '../store/storage'
import { fmtPrivate, LabeledInput, Button, Card, ProgressBar } from '../components/ui'
import type { CommitmentRecord, DebtRepayment, GoalDeposit } from '../types'

const STEPS = [
  'Salary',
  'Recurring Bills',
  'Debt Repayments',
  'Remittance',
  'Overall Spend',
  'Savings Goals',
  'Summary',
]

export function CheckInView() {
  const { data, update } = useAppData()
  const { hidden } = usePrivacy()
  const month = currentMonth()
  const [step, setStep] = useState(0)

  const p = (amount: number, currency: 'JPY' | 'INR') => fmtPrivate(amount, currency, hidden)

  // Step state
  const [salaryJPY, setSalaryJPY] = useState(
    String(data.salary.find((s) => s.month === month)?.amountJPY ?? ''),
  )

  const activeCommitments = data.commitments.filter((c) => c.active)
  const existingCRs = data.commitmentRecords.filter((r) => r.month === month)
  const [commitmentAmounts, setCommitmentAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      activeCommitments.map((c) => {
        const existing = existingCRs.find((r) => r.commitmentId === c.id)
        return [c.id, String(existing?.amount ?? c.defaultAmount)]
      }),
    ),
  )
  const [commitmentPaid, setCommitmentPaid] = useState<Record<string, boolean>>(
    Object.fromEntries(
      activeCommitments.map((c) => {
        const existing = existingCRs.find((r) => r.commitmentId === c.id)
        return [c.id, existing?.paid ?? true]
      }),
    ),
  )

  const activeDebts = data.debts.filter((d) => d.status === 'active')
  const existingDRs = data.debtRepayments.filter((r) => r.month === month)
  const [debtAmounts, setDebtAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      activeDebts.map((d) => {
        const existing = existingDRs.find((r) => r.debtId === d.id)
        return [d.id, String(existing?.amountPaid ?? d.monthlyRepayment)]
      }),
    ),
  )

  const [remittanceJPY, setRemittanceJPY] = useState(
    String(
      data.remittances.find((r) => r.month === month)?.sentJPY ??
        data.settings.defaultRemittanceJPY,
    ),
  )
  const [remittanceINR, setRemittanceINR] = useState(
    String(data.remittances.find((r) => r.month === month)?.receivedINR ?? ''),
  )

  const existingSpend = data.monthlySpend.find((s) => s.month === month)
  const [spendJPY, setSpendJPY] = useState(String(existingSpend?.spendJPY ?? ''))
  const [spendINR, setSpendINR] = useState(String(existingSpend?.spendINR ?? ''))

  const activeGoals = data.goals.filter((g) => g.status === 'active')
  const [goalDeposits, setGoalDeposits] = useState<Record<string, string>>(
    Object.fromEntries(activeGoals.map((g) => [g.id, ''])),
  )

  function saveStep() {
    let next = data

    if (step === 0) {
      if (salaryJPY) {
        next = upsertSalary(next, { month, amountJPY: Number(salaryJPY) })
      }
    } else if (step === 1) {
      activeCommitments.forEach((c) => {
        const record: CommitmentRecord = {
          month,
          commitmentId: c.id,
          amount: Number(commitmentAmounts[c.id]) || c.defaultAmount,
          paid: commitmentPaid[c.id] ?? true,
        }
        next = upsertCommitmentRecord(next, record)
      })
    } else if (step === 2) {
      activeDebts.forEach((d) => {
        const amount = Number(debtAmounts[d.id]) || 0
        if (amount > 0) {
          const balanceAfter = Math.max(0, d.currentBalance - amount)
          const repayment: DebtRepayment = {
            month,
            debtId: d.id,
            amountPaid: amount,
            balanceAfter,
          }
          next = addDebtRepayment(next, repayment)
        }
      })
    } else if (step === 3) {
      if (remittanceJPY || remittanceINR) {
        next = upsertRemittance(next, {
          month,
          sentJPY: Number(remittanceJPY) || 0,
          receivedINR: Number(remittanceINR) || 0,
        })
      }
    } else if (step === 4) {
      if (spendJPY || spendINR) {
        next = upsertMonthlySpend(next, {
          month,
          spendJPY: Number(spendJPY) || 0,
          spendINR: Number(spendINR) || 0,
        })
      }
    } else if (step === 5) {
      activeGoals.forEach((g) => {
        const amount = Number(goalDeposits[g.id]) || 0
        if (amount > 0) {
          const deposit: GoalDeposit = {
            month,
            goalId: g.id,
            amount,
          }
          next = addGoalDeposit(next, deposit)
        }
      })
    }

    update(next)
    setStep((s) => s + 1)
  }

  const summary = getMonthSummary(data, month)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-lg font-semibold text-slate-100">Monthly Check-in</h1>
        <span className="text-sm text-slate-400">{formatMonth(month)}</span>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-sky-500' : i === step ? 'bg-sky-400' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {/* Step content */}
      {step === 0 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">JPY Take-home Salary</h3>
          <LabeledInput
            label="Net salary this month (¥)"
            type="number"
            value={salaryJPY}
            onChange={(e) => setSalaryJPY(e.target.value)}
            placeholder="e.g. 300000"
          />
        </Card>
      )}

      {step === 1 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Recurring Bills</h3>
          {activeCommitments.length === 0 ? (
            <p className="text-slate-500 text-sm">No active commitments. Add some in Settings.</p>
          ) : (
            <div className="space-y-3">
              {activeCommitments.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={commitmentPaid[c.id] ?? true}
                    onChange={(e) =>
                      setCommitmentPaid((p) => ({ ...p, [c.id]: e.target.checked }))
                    }
                    className="accent-sky-500 w-4 h-4"
                    aria-label={`Mark ${c.name} as paid`}
                  />
                  <span className="flex-1 text-sm text-slate-300">{c.name}</span>
                  <span className="text-xs text-slate-500">{c.currency === 'JPY' ? '¥' : '₹'}</span>
                  <input
                    type="number"
                    value={commitmentAmounts[c.id]}
                    onChange={(e) =>
                      setCommitmentAmounts((a) => ({ ...a, [c.id]: e.target.value }))
                    }
                    className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-right"
                    aria-label={`Amount for ${c.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Debt Repayments</h3>
          {activeDebts.length === 0 ? (
            <p className="text-slate-500 text-sm">No active debts. Add some in Settings.</p>
          ) : (
            <div className="space-y-3">
              {activeDebts.map((d) => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-slate-300">{d.name}</span>
                  <span className="text-xs text-slate-500">{d.currency === 'JPY' ? '¥' : '₹'}</span>
                  <input
                    type="number"
                    value={debtAmounts[d.id]}
                    onChange={(e) =>
                      setDebtAmounts((a) => ({ ...a, [d.id]: e.target.value }))
                    }
                    className="w-24 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-right"
                    aria-label={`Repayment for ${d.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Remittance to India</h3>
          <div className="space-y-3">
            <LabeledInput
              label="Sent (¥)"
              type="number"
              value={remittanceJPY}
              onChange={(e) => setRemittanceJPY(e.target.value)}
              placeholder="e.g. 50000"
            />
            <LabeledInput
              label="Received (₹)"
              type="number"
              value={remittanceINR}
              onChange={(e) => setRemittanceINR(e.target.value)}
              placeholder="e.g. 32000"
            />
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Overall Spend Estimate</h3>
          <p className="text-xs text-slate-500 mb-3">
            Everything else: food, transport, leisure, misc.
          </p>
          <div className="space-y-3">
            <LabeledInput
              label="JPY spend this month (¥)"
              type="number"
              value={spendJPY}
              onChange={(e) => setSpendJPY(e.target.value)}
              placeholder="e.g. 80000"
            />
            <LabeledInput
              label="INR spend this month (₹)"
              type="number"
              value={spendINR}
              onChange={(e) => setSpendINR(e.target.value)}
              placeholder="e.g. 15000"
            />
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <h3 className="text-sm font-medium text-slate-300 mb-3">Update Savings Goals</h3>
          {activeGoals.length === 0 ? (
            <p className="text-slate-500 text-sm">No active goals. Add some in Settings.</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{g.name}</span>
                    <span className="text-slate-500 text-xs">{g.currency === 'JPY' ? '¥' : '₹'}</span>
                  </div>
                  <ProgressBar
                    percent={(g.currentAmount / g.targetAmount) * 100}
                  />
                  <LabeledInput
                    label={`Amount added this month (${g.currency === 'JPY' ? '¥' : '₹'})`}
                    type="number"
                    value={goalDeposits[g.id]}
                    onChange={(e) =>
                      setGoalDeposits((d) => ({ ...d, [g.id]: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {step === 6 && (
        <div className="space-y-3">
          <Card>
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              JPY — {formatMonth(month)}
            </h3>
            <SummaryRow label="Income" value={p(summary.jpyIncome, 'JPY')} />
            <SummaryRow label="Recurring bills" value={`− ${p(summary.jpyCommitmentTotal, 'JPY')}`} indent />
            <SummaryRow label="Debt repayments" value={`− ${p(summary.jpyDebtTotal, 'JPY')}`} indent />
            <SummaryRow label="Remittance sent" value={`− ${p(summary.remittanceSent, 'JPY')}`} indent />
            <SummaryRow label="Overall spend" value={`− ${p(summary.jpySpend, 'JPY')}`} indent />
            <div className="border-t border-slate-700 my-2" />
            <SummaryRow
              label="Remaining (saved)"
              value={p(Math.max(0, summary.jpyRemaining), 'JPY')}
              highlight
            />
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-slate-400 mb-3">
              INR — {formatMonth(month)}
            </h3>
            <SummaryRow label="Inflow (remittance)" value={p(summary.inrInflow, 'INR')} />
            <SummaryRow label="Recurring bills" value={`− ${p(summary.inrCommitmentTotal, 'INR')}`} indent />
            <SummaryRow label="Debt repayments" value={`− ${p(summary.inrDebtTotal, 'INR')}`} indent />
            <SummaryRow label="Overall spend" value={`− ${p(summary.inrSpend, 'INR')}`} indent />
            <div className="border-t border-slate-700 my-2" />
            <SummaryRow
              label="Remaining (saved)"
              value={p(Math.max(0, summary.inrRemaining), 'INR')}
              highlight
            />
          </Card>
          <p className="text-xs text-slate-500 text-center">Check-in complete for {formatMonth(month)}.</p>
        </div>
      )}

      {step < 6 && (
        <div className="flex gap-2 justify-end pt-2">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button onClick={saveStep}>
            {step === 5 ? 'Finish & View Summary' : 'Save & Continue'}
          </Button>
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  indent = false,
  highlight = false,
}: {
  label: string
  value: string
  indent?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={`flex justify-between text-sm py-0.5 ${
        indent ? 'pl-3 text-slate-400' : ''
      } ${highlight ? 'text-emerald-400 font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
