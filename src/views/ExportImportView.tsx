import { useRef, useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { exportData, importData } from '../store/storage'
import { Card, Button, SectionTitle } from '../components/ui'
import { Download, Upload, AlertTriangle } from 'lucide-react'

export function ExportImportView() {
  const { data, update } = useAppData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  function handleExport() {
    exportData(data)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = importData(ev.target?.result as string)
        update(parsed)
        setImportSuccess(true)
      } catch {
        setImportError('Invalid backup file. Please select a valid finance-backup JSON file.')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-lg font-semibold text-slate-100">Backup & Restore</h1>

      <Card className="space-y-3">
        <SectionTitle>Export to iCloud</SectionTitle>
        <p className="text-sm text-slate-400">
          Download a JSON backup of all your data. Save it to iCloud Drive manually.
        </p>
        <Button onClick={handleExport} className="w-full flex items-center justify-center gap-2">
          <Download size={16} />
          Export backup
        </Button>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Import from backup</SectionTitle>
        <p className="text-sm text-slate-400">
          Restore your data from a previously exported JSON file. This will overwrite all current data.
        </p>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400">
            Importing will replace all existing data with the backup file contents.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload size={16} />
          Select backup file
        </Button>

        {importError && (
          <p className="text-sm text-red-400">{importError}</p>
        )}
        {importSuccess && (
          <p className="text-sm text-emerald-400">Data restored successfully.</p>
        )}
      </Card>

      <Card>
        <SectionTitle>Data summary</SectionTitle>
        <div className="space-y-1 text-sm text-slate-400">
          <Row label="Salary records" value={data.salary.length} />
          <Row label="Remittances" value={data.remittances.length} />
          <Row label="Commitments" value={data.commitments.length} />
          <Row label="Debts" value={data.debts.length} />
          <Row label="Goals" value={data.goals.length} />
          <Row label="Schema version" value={data.meta.version} />
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="text-slate-300">{value}</span>
    </div>
  )
}
