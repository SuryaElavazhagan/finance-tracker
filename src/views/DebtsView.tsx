import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePrivacy } from '../hooks/usePrivacy'
import { computeDebtMetrics } from '../store/storage'
import { fmtPrivate, Card, ProgressBar, Badge, Button, LabeledInput, LabeledSelect, SectionTitle } from '../components/ui'
import { v4 } from '../utils/uuid'
import { addDebt, updateDebt, deleteDebt, upsertDebtRepayment } from '../store/storage'
import type { Debt, DebtType, Currency } from '../types'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

export function DebtsView() {
  const { data, update } = useAppData()
  const { hidden } = usePrivacy()
  const [showForm, setShowForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [repayMonths, setRepayMonths] = useState<Record<string, string>>({})
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const activeDebts = data.debts.filter((d) => d.status === 'active')
  const clearedDebts = data.debts.filter((d) => d.status === 'cleared')

  const totalJPY = activeDebts
    .filter((d) => d.currency === 'JPY')
    .reduce((s, d) => s + d.currentBalance, 0)
  const totalINR = activeDebts
    .filter((d) => d.currency === 'INR')
    .reduce((s, d) => s + d.currentBalance, 0)

  const p = (amount: number, currency: 'JPY' | 'INR') => fmtPrivate(amount, currency, hidden)

  function handleAddRepayment(debt: Debt) {
    const amount = Number(repayAmounts[debt.id]) || 0
    const month = repayMonths[debt.id] || new Date().toISOString().slice(0, 7)
    if (amount <= 0) return
    const balanceAfter = Math.max(0, debt.currentBalance - amount)
    let next = upsertDebtRepayment(data, { month, debtId: debt.id, amountPaid: amount, balanceAfter })
    if (balanceAfter === 0) {
      next = updateDebt(next, { ...debt, currentBalance: 0, status: 'cleared' })
    }
    update(next)
    setRepayAmounts((a) => ({ ...a, [debt.id]: '' }))
  }

  function handleDelete(id: string) {
    update(deleteDebt(data, id))
    setConfirmDelete(null)
    setExpanded(null)
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-100">Debts</h1>
        <Button variant="secondary" onClick={() => { setShowForm((v) => !v); setEditingDebt(null) }}>
          <Plus size={14} className="inline mr-1" />
          Add Debt
        </Button>
      </div>

      {showForm && !editingDebt && (
        <DebtForm
          onSave={(debt) => {
            update(addDebt(data, debt))
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingDebt && (
        <DebtForm
          initial={editingDebt}
          onSave={(debt) => {
            update(updateDebt(data, debt))
            setEditingDebt(null)
          }}
          onCancel={() => setEditingDebt(null)}
        />
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total JPY outstanding</p>
          <p className="text-base font-semibold text-slate-100">{p(totalJPY, 'JPY')}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-slate-500 mb-1">Total INR outstanding</p>
          <p className="text-base font-semibold text-slate-100">{p(totalINR, 'INR')}</p>
        </Card>
      </div>

      {activeDebts.length === 0 && !showForm && !editingDebt && (
        <p className="text-slate-500 text-sm text-center py-8">No active debts. Great!</p>
      )}

      {activeDebts.map((debt) => {
        const m = computeDebtMetrics(debt)
        const isExpanded = expanded === debt.id
        const history = data.debtRepayments.filter((r) => r.debtId === debt.id)
        const isConfirming = confirmDelete === debt.id
        return (
          <Card key={debt.id}>
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : debt.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-medium text-slate-200">{debt.name}</span>
                  <Badge variant="muted">{debt.type.replace('_', ' ')}</Badge>
                  <Badge>{debt.currency}</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {p(debt.currentBalance, debt.currency)} remaining
                  {' · '}
                  {p(m.paidOff, debt.currency)} paid
                  {' of '}
                  {p(debt.originalAmount, debt.currency)}
                </p>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-slate-500 mt-1 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 mt-1 shrink-0" />}
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
                {/* Edit / Delete actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={(e) => { e.stopPropagation(); setEditingDebt(debt); setShowForm(false); setExpanded(null) }}
                  >
                    <Pencil size={13} />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(debt.id) }}
                  >
                    <Trash2 size={13} />
                    Delete
                  </Button>
                </div>

                {/* Delete confirmation */}
                {isConfirming && (
                  <div className="bg-slate-700/60 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-slate-300">
                      Delete <span className="font-medium text-slate-100">{debt.name}</span> and all its repayment history?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" className="flex-1" onClick={() => handleDelete(debt.id)}>
                        Yes, delete
                      </Button>
                    </div>
                  </div>
                )}

                {/* Record repayment */}
                <div className="space-y-2">
                  <LabeledInput
                    label="Month"
                    type="month"
                    value={repayMonths[debt.id] ?? new Date().toISOString().slice(0, 7)}
                    onChange={(e) => setRepayMonths((m) => ({ ...m, [debt.id]: e.target.value }))}
                  />
                  <LabeledInput
                    label={`Amount paid (${debt.currency === 'JPY' ? '¥' : '₹'})`}
                    type="number"
                    value={repayAmounts[debt.id] ?? ''}
                    onChange={(e) => setRepayAmounts((a) => ({ ...a, [debt.id]: e.target.value }))}
                    placeholder={String(debt.monthlyRepayment)}
                  />
                  <Button onClick={() => handleAddRepayment(debt)} className="w-full">
                    Record repayment
                  </Button>
                </div>

                {/* Repayment history */}
                {history.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Repayment history</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {[...history].sort((a, b) => b.month.localeCompare(a.month)).map((r, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-400">
                          <span>{r.month}</span>
                          <span>{p(r.amountPaid, debt.currency)}</span>
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
          {clearedDebts.map((debt) => {
            const isConfirming = confirmDelete === debt.id
            return (
              <Card key={debt.id} className="opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-400">{debt.name}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Original: {p(debt.originalAmount, debt.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Cleared</Badge>
                    <button
                      onClick={() => setConfirmDelete(debt.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      aria-label={`Delete ${debt.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isConfirming && (
                  <div className="mt-2 bg-slate-700/60 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-slate-300">
                      Delete <span className="font-medium text-slate-100">{debt.name}</span> and all its repayment history?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
                        Cancel
                      </Button>
                      <Button variant="danger" className="flex-1" onClick={() => handleDelete(debt.id)}>
                        Yes, delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DebtForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Debt
  onSave: (d: Debt) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<DebtType>(initial?.type ?? 'emi')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'INR')
  const [original, setOriginal] = useState(String(initial?.originalAmount ?? ''))
  const [balance, setBalance] = useState(String(initial?.currentBalance ?? ''))
  const [repayment, setRepayment] = useState(String(initial?.monthlyRepayment ?? ''))

  function submit() {
    if (!name || !original) return
    onSave({
      id: initial?.id ?? v4(),
      name,
      type,
      currency,
      originalAmount: Number(original),
      currentBalance: Number(balance || original),
      monthlyRepayment: Number(repayment) || 0,
      startDate: initial?.startDate ?? new Date().toISOString().slice(0, 7),
      status: initial?.status ?? 'active',
    })
  }

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">{initial ? 'Edit Debt' : 'New Debt'}</h3>
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
        <Button onClick={submit}>{initial ? 'Save changes' : 'Add Debt'}</Button>
      </div>
    </Card>
  )
}
