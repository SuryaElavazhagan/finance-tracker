import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePrivacy } from '../hooks/usePrivacy'
import {
  addCommitment,
  updateCommitment,
  deleteCommitment,
  updateSettings,
} from '../store/storage'
import {
  fmtPrivate,
  Card,
  Badge,
  Button,
  LabeledInput,
  LabeledSelect,
  SectionTitle,
} from '../components/ui'
import { v4 } from '../utils/uuid'
import type { Commitment, CommitmentCategory, Currency } from '../types'
import { Plus, Trash2, Pencil } from 'lucide-react'

export function SettingsView() {
  const { data, update } = useAppData()
  const { hidden } = usePrivacy()
  const [showCommitmentForm, setShowCommitmentForm] = useState(false)
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null)
  const [defaultRemittance, setDefaultRemittance] = useState(
    String(data.settings.defaultRemittanceJPY),
  )
  const [openingJPY, setOpeningJPY] = useState(
    String(data.settings.openingBalanceJPY),
  )
  const [openingINR, setOpeningINR] = useState(
    String(data.settings.openingBalanceINR),
  )

  function saveDefaultRemittance() {
    const val = Number(defaultRemittance)
    if (!isNaN(val) && val >= 0) {
      update(updateSettings(data, { ...data.settings, defaultRemittanceJPY: val }))
    }
  }

  function saveOpeningBalances() {
    const jpy = Number(openingJPY)
    const inr = Number(openingINR)
    if (!isNaN(jpy) && !isNaN(inr) && jpy >= 0 && inr >= 0) {
      update(updateSettings(data, { ...data.settings, openingBalanceJPY: jpy, openingBalanceINR: inr }))
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-lg font-semibold text-slate-100">Settings</h1>

      {/* Opening balances */}
      <Card className="space-y-3">
        <SectionTitle>Opening Bank Balance</SectionTitle>
        <p className="text-xs text-slate-500">
          Your bank balance when you started tracking. Used as the starting point in summaries.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <LabeledInput
            label="JPY balance (¥)"
            type="number"
            value={openingJPY}
            onChange={(e) => setOpeningJPY(e.target.value)}
            placeholder="e.g. 500000"
          />
          <LabeledInput
            label="INR balance (₹)"
            type="number"
            value={openingINR}
            onChange={(e) => setOpeningINR(e.target.value)}
            placeholder="e.g. 100000"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Current: {fmtPrivate(data.settings.openingBalanceJPY, 'JPY', hidden)} · {fmtPrivate(data.settings.openingBalanceINR, 'INR', hidden)}
          </p>
          <Button onClick={saveOpeningBalances}>Save</Button>
        </div>
      </Card>

      {/* Default remittance */}
      <Card className="space-y-3">
        <SectionTitle>Default Remittance</SectionTitle>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <LabeledInput
              label="Default monthly remittance (¥)"
              type="number"
              value={defaultRemittance}
              onChange={(e) => setDefaultRemittance(e.target.value)}
            />
          </div>
          <Button onClick={saveDefaultRemittance}>Save</Button>
        </div>
        <p className="text-xs text-slate-500">
          Current: {fmtPrivate(data.settings.defaultRemittanceJPY, 'JPY', hidden)} — pre-filled each check-in.
        </p>
      </Card>

      {/* Commitments */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Recurring Commitments</SectionTitle>
          <Button variant="secondary" onClick={() => { setShowCommitmentForm(true); setEditingCommitment(null) }}>
            <Plus size={14} className="inline mr-1" />
            Add
          </Button>
        </div>

        {(showCommitmentForm || editingCommitment) && (
          <CommitmentForm
            initial={editingCommitment ?? undefined}
            onSave={(c) => {
              if (editingCommitment) {
                update(updateCommitment(data, c))
              } else {
                update(addCommitment(data, c))
              }
              setShowCommitmentForm(false)
              setEditingCommitment(null)
            }}
            onCancel={() => { setShowCommitmentForm(false); setEditingCommitment(null) }}
          />
        )}

        {data.commitments.length === 0 && !showCommitmentForm && (
          <p className="text-slate-500 text-sm">No commitments yet.</p>
        )}

        <div className="space-y-2 mt-2">
          {data.commitments.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">{c.name}</span>
                  <Badge>{c.currency}</Badge>
                  <Badge variant="muted">{c.category}</Badge>
                  {!c.active && <Badge variant="muted">paused</Badge>}
                </div>
                <p className="text-xs text-slate-500">{fmtPrivate(c.defaultAmount, c.currency, hidden)} / month</p>
              </div>
              <button
                onClick={() => setEditingCommitment(c)}
                className="p-1 text-slate-500 hover:text-slate-300"
                aria-label={`Edit ${c.name}`}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => update(deleteCommitment(data, c.id))}
                className="p-1 text-slate-500 hover:text-red-400"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CommitmentForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Commitment
  onSave: (c: Commitment) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'JPY')
  const [amount, setAmount] = useState(String(initial?.defaultAmount ?? ''))
  const [category, setCategory] = useState<CommitmentCategory>(initial?.category ?? 'subscription')
  const [active, setActive] = useState(initial?.active ?? true)

  function submit() {
    if (!name || !amount) return
    onSave({
      id: initial?.id ?? v4(),
      name,
      currency,
      defaultAmount: Number(amount),
      category,
      active,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <Card className="space-y-3 mb-3">
      <h3 className="text-sm font-medium text-slate-300">New Commitment</h3>
      <LabeledInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" />
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
        <LabeledSelect
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CommitmentCategory)}
          options={[
            { value: 'subscription', label: 'Subscription' },
            { value: 'utility', label: 'Utility' },
            { value: 'insurance', label: 'Insurance' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </div>
      <LabeledInput label="Default amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-sky-500 w-4 h-4"
        />
        Active
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>{initial ? 'Update' : 'Add'}</Button>
      </div>
    </Card>
  )
}
