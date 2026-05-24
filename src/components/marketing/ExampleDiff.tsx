import { TrendingDown, AlertTriangle } from 'lucide-react'

/**
 * Stylized in-page demo of the Pay Ledger diff. Static markup that
 * mirrors the real /nurse/ledger/[id]/diff page so visitors see what
 * the product actually outputs. Values are illustrative.
 */
export default function ExampleDiff() {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-md)] lg:p-7"
      style={{
      }}
    >
      <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-1.5" style={{ color: 'var(--tang)' }}>
            Quote vs signed · live diff
          </div>
          <div className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
            ICU · Phoenix, AZ · 13 weeks
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase"
          style={{ background: 'var(--tang)', color: 'white' }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Bait & switch detected
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-7">
        <Stat label="Worse fields" value="3" tone="tang" />
        <Stat label="Better fields" value="0" tone="default" />
        <Stat label="Dates shifted" value="0" tone="default" />
      </div>

      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--g100)' }}>
            <th className="text-left pb-3 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Field</th>
            <th className="text-right pb-3 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Quoted</th>
            <th className="text-right pb-3 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Signed</th>
            <th className="text-right pb-3 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Weekly housing" quoted="$1,800" signed="$1,400" delta="-$400" worse />
          <Row label="Sign-on bonus" quoted="$1,000" signed="$500" delta="-$500" worse />
          <Row label="Cancellation" quoted="7-day notice" signed="48h notice" delta="material" worse />
          <Row label="Taxable hourly" quoted="$32" signed="$32" delta="—" />
          <Row label="Weekly meals" quoted="$364" signed="$364" delta="—" />
        </tbody>
      </table>

      <div
        className="mt-7 flex items-start gap-3 rounded-lg p-5"
        style={{ background: 'var(--tang-50)', border: '1px solid var(--tang-100)' }}
      >
        <TrendingDown className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--tang-mid)' }} />
        <div className="text-sm" style={{ color: 'var(--tang-deep)' }}>
          Net pay cut of <strong>~$900 over the 13-week contract</strong>, plus a shorter cancellation notice that lets the facility drop you with two days warning. Catch this before you sign.
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'tang' | 'default' }) {
  const styles = tone === 'tang'
    ? { bg: 'var(--tang)', color: 'white', subColor: 'rgba(255,255,255,0.8)' }
    : { bg: 'var(--cream-mid)', color: 'var(--ink)', subColor: 'var(--g600)' }
  return (
    <div className="rounded-lg p-4" style={{ background: styles.bg }}>
      <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: styles.subColor }}>{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color: styles.color, fontFamily: 'var(--font-sora)' }}>{value}</div>
    </div>
  )
}

function Row({ label, quoted, signed, delta, worse }: { label: string; quoted: string; signed: string; delta: string; worse?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3 text-sm" style={{ color: 'var(--ink)' }}>{label}</td>
      <td className="py-3 text-sm text-right font-mono" style={{ color: 'var(--g600)' }}>{quoted}</td>
      <td className="py-3 text-sm text-right font-mono" style={{ color: worse ? 'var(--tang-mid)' : 'var(--ink)' }}>{signed}</td>
      <td className="py-3 text-right">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{
            background: worse ? 'var(--tang-50)' : 'var(--g100)',
            color: worse ? 'var(--tang-mid)' : 'var(--g400)',
          }}
        >
          {delta}
        </span>
      </td>
    </tr>
  )
}
