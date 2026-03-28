import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePrivacy } from '../hooks/usePrivacy'
import {
  getMonthSummary,
  formatMonth,
  computeDebtMetrics,
  computeGoalMetrics,
  getLast3MonthsAvgDeposit,
  currentMonth,
} from '../store/storage'
import { fmtPrivate, Card, ProgressBar, MilestoneDots } from '../components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function SummaryView() {
  const { data } = useAppData()
  const { hidden } = usePrivacy()
  const allMonths = Array.from(
    new Set([
      ...data.salary.map((s) => s.month),
      ...data.remittances.map((r) => r.month),
      ...data.monthlySpend.map((s) => s.month),
    ]),
  ).sort((a, b) => b.localeCompare(a))

  const currentM = new Date().toISOString().slice(0, 7)
  const months = allMonths.includes(currentM) ? allMonths : [currentM, ...allMonths]

  const [idx, setIdx] = useState(0)
  const month = months[idx] ?? currentM
  const summary = getMonthSummary(data, month)

  const activeDebts = data.debts.filter((d) => d.status === 'active')
  const activeGoals = data.goals.filter((g) => g.status === 'active')
  const now = currentMonth()

  const m = (amount: number, currency: 'JPY' | 'INR') => fmtPrivate(amount, currency, hidden)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIdx((i) => Math.min(i + 1, months.length - 1))}
          disabled={idx >= months.length - 1}
          className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-slate-100">{formatMonth(month)}</h2>
        <button
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={idx === 0}
          className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* JPY block */}
      <Card>
        <h3 className="text-sm font-semibold text-sky-400 mb-3">JPY</h3>
        <Row label="Income" value={m(summary.jpyIncome, 'JPY')} />
        <Row label="Recurring bills" value={`− ${m(summary.jpyCommitmentTotal, 'JPY')}`} sub />
        <Row label="Debt repayments" value={`− ${m(summary.jpyDebtTotal, 'JPY')}`} sub />
        <Row label="Remittance sent" value={`− ${m(summary.remittanceSent, 'JPY')}`} sub />
        <Row label="Overall spend" value={`− ${m(summary.jpySpend, 'JPY')}`} sub />
        <div className="border-t border-slate-700 my-2" />
        <Row
          label="Remaining"
          value={m(Math.max(0, summary.jpyRemaining), 'JPY')}
          highlight={summary.jpyRemaining >= 0}
        />
      </Card>

      {/* INR block */}
      <Card>
        <h3 className="text-sm font-semibold text-violet-400 mb-3">INR</h3>
        <Row label="Remittance received" value={m(summary.inrInflow, 'INR')} />
        <Row label="Recurring bills" value={`− ${m(summary.inrCommitmentTotal, 'INR')}`} sub />
        <Row label="Debt repayments" value={`− ${m(summary.inrDebtTotal, 'INR')}`} sub />
        <Row label="Overall spend" value={`− ${m(summary.inrSpend, 'INR')}`} sub />
        <div className="border-t border-slate-700 my-2" />
        <Row
          label="Remaining"
          value={m(Math.max(0, summary.inrRemaining), 'INR')}
          highlight={summary.inrRemaining >= 0}
        />
      </Card>

      {/* Debts outstanding */}
      {activeDebts.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-amber-400 mb-3">Debts outstanding</h3>
          <div className="space-y-3">
            {activeDebts.map((debt) => {
              const dm = computeDebtMetrics(debt)
              return (
                <div key={debt.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{debt.name}</span>
                    <span className="text-slate-400">{m(debt.currentBalance, debt.currency)}</span>
                  </div>
                  <ProgressBar percent={dm.percentPaid} />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{Math.round(dm.percentPaid)}% paid off</span>
                    {dm.monthsToClear !== null && (
                      <span>~{dm.monthsToClear} mo to clear (est.)</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Goals progress */}
      {activeGoals.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">Goals progress</h3>
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const avg = getLast3MonthsAvgDeposit(data, goal.id, now)
              const gm = computeGoalMetrics(goal, avg)
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{goal.name}</span>
                    <span className="text-slate-400">
                      {m(goal.currentAmount, goal.currency)} / {m(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                  <ProgressBar percent={gm.percentComplete} />
                  <MilestoneDots percent={gm.percentComplete} />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{Math.round(gm.percentComplete)}% complete</span>
                    {gm.estimatedMonths !== null && (
                      <span>~{gm.estimatedMonths} mo to target (est.)</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  sub = false,
  highlight = false,
}: {
  label: string
  value: string
  sub?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className={`flex justify-between text-sm py-0.5 ${sub ? 'pl-3 text-slate-400' : 'text-slate-300'} ${highlight ? 'text-emerald-400 font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
