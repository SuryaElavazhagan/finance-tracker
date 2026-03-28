import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePrivacy } from '../hooks/usePrivacy'
import { computeGoalMetrics, getLast3MonthsAvgDeposit, currentMonth } from '../store/storage'
import { fmtPrivate, Card, ProgressBar, MilestoneDots, Badge, Button, LabeledInput, LabeledSelect, SectionTitle } from '../components/ui'
import { addGoal, updateGoal, addGoalDeposit } from '../store/storage'
import { v4 } from '../utils/uuid'
import type { Goal, Currency, GoalStatus } from '../types'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

export function GoalsView() {
  const { data, update } = useAppData()
  const { hidden } = usePrivacy()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({})
  const [depositMonths, setDepositMonths] = useState<Record<string, string>>({})
  const month = currentMonth()

  const activeGoals = data.goals.filter((g) => g.status === 'active')
  const otherGoals = data.goals.filter((g) => g.status !== 'active')

  const totalJPY = activeGoals
    .filter((g) => g.currency === 'JPY')
    .reduce((s, g) => s + g.currentAmount, 0)
  const totalINR = activeGoals
    .filter((g) => g.currency === 'INR')
    .reduce((s, g) => s + g.currentAmount, 0)

  const p = (amount: number, currency: 'JPY' | 'INR') => fmtPrivate(amount, currency, hidden)

  function handleDeposit(goal: Goal) {
    const amount = Number(depositAmounts[goal.id]) || 0
    const depMonth = depositMonths[goal.id] || month
    if (amount <= 0) return
    let next = addGoalDeposit(data, { month: depMonth, goalId: goal.id, amount })
    if (next.goals.find((g) => g.id === goal.id)!.currentAmount >= goal.targetAmount) {
      next = updateGoal(next, {
        ...next.goals.find((g) => g.id === goal.id)!,
        status: 'achieved',
      })
    }
    update(next)
    setDepositAmounts((a) => ({ ...a, [goal.id]: '' }))
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-100">Savings Goals</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} className="inline mr-1" />
          Add Goal
        </Button>
      </div>

      {showForm && (
        <AddGoalForm
          onAdd={(goal) => {
            update(addGoal(data, goal))
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total JPY saved</p>
          <p className="text-base font-semibold text-slate-100">{p(totalJPY, 'JPY')}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total INR saved</p>
          <p className="text-base font-semibold text-slate-100">{p(totalINR, 'INR')}</p>
        </Card>
      </div>

      {activeGoals.length === 0 && !showForm && (
        <p className="text-slate-500 text-sm text-center py-8">No active goals. Add one to get started.</p>
      )}

      {activeGoals.map((goal) => {
        const avg = getLast3MonthsAvgDeposit(data, goal.id, month)
        const m = computeGoalMetrics(goal, avg)
        const isExpanded = expanded === goal.id
        const history = data.goalDeposits.filter((d) => d.goalId === goal.id)

        return (
          <Card key={goal.id}>
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : goal.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200">{goal.name}</span>
                  <Badge>{goal.currency}</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {p(goal.currentAmount, goal.currency)} of {p(goal.targetAmount, goal.currency)}
                </p>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-slate-500 mt-1" /> : <ChevronDown size={16} className="text-slate-500 mt-1" />}
            </div>

            <ProgressBar percent={m.percentComplete} className="mt-2" />
            <MilestoneDots percent={m.percentComplete} />

            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{Math.round(m.percentComplete)}% complete</span>
              {m.estimatedMonths !== null && (
                <span>~{m.estimatedMonths} months to target (estimate)</span>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 border-t border-slate-700 pt-3 space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <LabeledInput
                      label="Month (YYYY-MM)"
                      type="month"
                      value={depositMonths[goal.id] ?? month}
                      onChange={(e) => setDepositMonths((m) => ({ ...m, [goal.id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <LabeledInput
                      label={`Added (${goal.currency === 'JPY' ? '¥' : '₹'})`}
                      type="number"
                      value={depositAmounts[goal.id] ?? ''}
                      onChange={(e) => setDepositAmounts((a) => ({ ...a, [goal.id]: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={() => handleDeposit(goal)}>Add</Button>
                </div>

                {history.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Deposit history</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {[...history].sort((a, b) => b.month.localeCompare(a.month)).map((d, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-400">
                          <span>{d.month}</span>
                          <span>+{p(d.amount, goal.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}

      {otherGoals.length > 0 && (
        <div>
          <SectionTitle>Achieved / Paused</SectionTitle>
          {otherGoals.map((goal) => (
            <Card key={goal.id} className="opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{goal.name}</span>
                <Badge variant={goal.status === 'achieved' ? 'success' : 'muted'}>
                  {goal.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AddGoalForm({
  onAdd,
  onCancel,
}: {
  onAdd: (g: Goal) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('JPY')
  const [target, setTarget] = useState('')

  function submit() {
    if (!name || !target) return
    onAdd({
      id: v4(),
      name,
      currency,
      targetAmount: Number(target),
      currentAmount: 0,
      status: 'active' as GoalStatus,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">New Goal</h3>
      <LabeledInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" />
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          options={[
            { value: 'JPY', label: '¥ JPY' },
            { value: 'INR', label: '₹ INR' },
          ]}
        />
        <LabeledInput label="Target amount" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 500000" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>Add Goal</Button>
      </div>
    </Card>
  )
}
