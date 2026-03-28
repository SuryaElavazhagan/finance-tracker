import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { computeDebtMetrics } from '../store/storage'
import { fmt, Card, ProgressBar, Badge, Button, LabeledInput, LabeledSelect, SectionTitle } from '../components/ui'
import { v4 } from '../utils/uuid'
import { addDebt, updateDebt, addDebtRepayment } from '../store/storage'
import type { Debt, DebtType, Currency } from '../types'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

export function DebtsView() {
  const { data, update } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [repayMonths, setRepayMonths] = useState<Record<string, string>>({})
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({})

  const activeDebts = data.debts.filter((d) => d.status === 'active')
  const clearedDebts = data.debts.filter((d) => d.status === 'cleared')

  const totalJPY = activeDebts
    .filter((d) => d.currency === 'JPY')
    .reduce((s, d) => s + d.currentBalance, 0)
  const totalINR = activeDebts
    .filter((d) => d.currency === 'INR')
    .reduce((s, d) => s + d.currentBalance, 0)

  function handleAddRepayment(debt: Debt) {
    const amount = Number(repayAmounts[debt.id]) || 0
    const month = repayMonths[debt.id] || new Date().toISOString().slice(0, 7)
    if (amount <= 0) return
    const balanceAfter = Math.max(0, debt.currentBalance - amount)
    let next = addDebtRepayment(data, { month, debtId: debt.id, amountPaid: amount, balanceAfter })
    if (balanceAfter === 0) {
      next = updateDebt(next, { ...debt, currentBalance: 0, status: 'cleared' })
    }
    update(next)
    setRepayAmounts((a) => ({ ...a, [debt.id]: '' }))
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-100">Debts</h1>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} className="inline mr-1" />
          Add Debt
        </Button>
      </div>

      {showForm && (
        <AddDebtForm
          onAdd={(debt) => {
            update(addDebt(data, debt))
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total JPY outstanding</p>
          <p className="text-base font-semibold text-slate-100">{fmt(totalJPY, 'JPY')}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total INR outstanding</p>
          <p className="text-base font-semibold text-slate-100">{fmt(totalINR, 'INR')}</p>
        </Card>
      </div>

      {activeDebts.length === 0 && !showForm && (
        <p className="text-slate-500 text-sm text-center py-8">No active debts. Great!</p>
      )}

      {activeDebts.map((debt) => {
        const m = computeDebtMetrics(debt)
        const isExpanded = expanded === debt.id
        const history = data.debtRepayments.filter((r) => r.debtId === debt.id)
        return (
          <Card key={debt.id}>
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : debt.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-200">{debt.name}</span>
                  <Badge variant="muted">{debt.type.replace('_', ' ')}</Badge>
                  <Badge>{debt.currency}</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {fmt(debt.currentBalance, debt.currency)} remaining of {fmt(debt.originalAmount, debt.currency)}
                </p>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-slate-500 mt-1" /> : <ChevronDown size={16} className="text-slate-500 mt-1" />}
            </div>

            <ProgressBar percent={m.percentPaid} className="mt-2" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{Math.round(m.percentPaid)}% paid off</span>
              {m.monthsToClear !== null && (
                <span>~{m.monthsToClear} months to clear (estimate)</span>
              )}
            </div>

            {isExpanded && (
              <div className="mt-3 space-y-3 border-t border-slate-700 pt-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <LabeledInput
                      label="Month (YYYY-MM)"
                      type="month"
                      value={repayMonths[debt.id] ?? new Date().toISOString().slice(0, 7)}
                      onChange={(e) => setRepayMonths((m) => ({ ...m, [debt.id]: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <LabeledInput
                      label={`Amount paid (${debt.currency === 'JPY' ? '¥' : '₹'})`}
                      type="number"
                      value={repayAmounts[debt.id] ?? ''}
                      onChange={(e) => setRepayAmounts((a) => ({ ...a, [debt.id]: e.target.value }))}
                      placeholder={String(debt.monthlyRepayment)}
                    />
                  </div>
                  <Button onClick={() => handleAddRepayment(debt)} className="mb-0">
                    Record
                  </Button>
                </div>

                {history.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Repayment history</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {[...history].sort((a, b) => b.month.localeCompare(a.month)).map((r, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-400">
                          <span>{r.month}</span>
                          <span>{fmt(r.amountPaid, debt.currency)}</span>
                          <span className="text-slate-600">bal: {fmt(r.balanceAfter, debt.currency)}</span>
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

      {clearedDebts.length > 0 && (
        <div>
          <SectionTitle>Cleared Debts</SectionTitle>
          {clearedDebts.map((debt) => (
            <Card key={debt.id} className="opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{debt.name}</span>
                <Badge variant="success">Cleared</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Original: {fmt(debt.originalAmount, debt.currency)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AddDebtForm({
  onAdd,
  onCancel,
}: {
  onAdd: (d: Debt) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DebtType>('emi')
  const [currency, setCurrency] = useState<Currency>('INR')
  const [original, setOriginal] = useState('')
  const [balance, setBalance] = useState('')
  const [repayment, setRepayment] = useState('')

  function submit() {
    if (!name || !original) return
    onAdd({
      id: v4(),
      name,
      type,
      currency,
      originalAmount: Number(original),
      currentBalance: Number(balance || original),
      monthlyRepayment: Number(repayment) || 0,
      startDate: new Date().toISOString().slice(0, 7),
      status: 'active',
    })
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">New Debt</h3>
      <LabeledInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Credit Card" />
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as DebtType)}
          options={[
            { value: 'emi', label: 'EMI' },
            { value: 'personal_loan', label: 'Personal Loan' },
            { value: 'credit_card', label: 'Credit Card' },
          ]}
        />
        <LabeledSelect
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          options={[
            { value: 'INR', label: '₹ INR' },
            { value: 'JPY', label: '¥ JPY' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Original amount" type="number" value={original} onChange={(e) => setOriginal(e.target.value)} />
        <LabeledInput label="Current balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Same as original" />
      </div>
      <LabeledInput label="Monthly repayment" type="number" value={repayment} onChange={(e) => setRepayment(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>Add Debt</Button>
      </div>
    </Card>
  )
}
