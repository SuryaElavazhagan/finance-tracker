import { useAppData } from '../hooks/useAppData'
import { formatMonth, getMonthSummary } from '../store/storage'
import { Card } from '../components/ui'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

export function TrendsView() {
  const { data } = useAppData()

  const allMonths = Array.from(
    new Set([
      ...data.salary.map((s) => s.month),
      ...data.remittances.map((r) => r.month),
      ...data.monthlySpend.map((s) => s.month),
    ]),
  ).sort((a, b) => a.localeCompare(b))

  const trendData = allMonths.map((month) => {
    const summary = getMonthSummary(data, month)
    const totalJPYDebt = data.debts
      .filter((d) => d.currency === 'JPY')
      .reduce((s, d) => {
        // Outstanding at end of month = currentBalance (approx)
        return s + d.currentBalance
      }, 0)
    const totalINRDebt = data.debts
      .filter((d) => d.currency === 'INR')
      .reduce((s, d) => s + d.currentBalance, 0)

    return {
      month: formatMonth(month),
      'JPY Savings': Math.max(0, summary.jpyRemaining),
      'INR Savings': Math.max(0, summary.inrRemaining),
      'JPY Spend': summary.jpySpend,
      'INR Spend': summary.inrSpend,
      Remittance: summary.remittanceSent,
      'JPY Debt': totalJPYDebt,
      'INR Debt': totalINRDebt,
    }
  })

  if (trendData.length < 2) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-lg font-semibold text-slate-100 mb-4">Trends</h1>
        <p className="text-slate-500 text-sm text-center py-12">
          Complete at least 2 months of check-ins to see trends.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h1 className="text-lg font-semibold text-slate-100">Trends</h1>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Savings per month</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="JPY Savings" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="INR Savings" stroke="#a78bfa" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Overall spend per month</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="JPY Spend" stroke="#fb923c" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="INR Spend" stroke="#f472b6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Remittance sent (¥)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line type="monotone" dataKey="Remittance" stroke="#34d399" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Debt outstanding</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="JPY Debt" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="INR Debt" stroke="#a78bfa" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
