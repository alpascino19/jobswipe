import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Decision, Filters, Job } from './types'
import { JOBS } from './data/jobs'
import { Deck } from './components/Deck'
import { MyList } from './components/MyList'
import { FiltersPanel } from './components/FiltersPanel'
import { IconSliders } from './components/Icons'
import { MODE_LABEL, formatLei } from './format'

const STORAGE_KEY = 'jobswipe:v1'

interface Persisted {
  decisions: Record<string, Decision>
  history: string[]
  filters: Filters
}

const DEFAULT_FILTERS: Filters = { mode: 'toate', city: 'toate', minSalary: 0 }
const DEFAULTS: Persisted = { decisions: {}, history: [], filters: DEFAULT_FILTERS }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* storage unavailable */
  }
  return DEFAULTS
}

const matches = (f: Filters) => (j: Job) =>
  (f.mode === 'toate' || j.mode === f.mode) && (f.city === 'toate' || j.city === f.city) && j.salaryMax >= f.minSalary

function filterSummary(f: Filters) {
  const parts: string[] = []
  if (f.mode !== 'toate') parts.push(MODE_LABEL[f.mode])
  if (f.city !== 'toate') parts.push(f.city)
  if (f.minSalary > 0) parts.push(`de la ${formatLei(f.minSalary)} lei`)
  return parts.length ? parts.join(', ') : 'Toate joburile'
}

export default function App() {
  const [state, setState] = useState<Persisted>(load)
  const [view, setView] = useState<'deck' | 'list'>('deck')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [undoneId, setUndoneId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string; undoable: boolean } | null>(null)
  const { decisions, history, filters } = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable */
    }
  }, [state])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => JOBS.filter(matches(filters)), [filters])
  const remaining = useMemo(() => {
    const r = filtered.filter((j) => !decisions[j.id])
    const i = undoneId ? r.findIndex((j) => j.id === undoneId) : -1
    if (i > 0) r.unshift(...r.splice(i, 1))
    return r
  }, [filtered, decisions, undoneId])

  const counts = useMemo(() => {
    const v = Object.values(decisions)
    return {
      apply: v.filter((d) => d === 'apply').length,
      save: v.filter((d) => d === 'save').length,
      pass: filtered.filter((j) => decisions[j.id] === 'pass').length,
    }
  }, [decisions, filtered])

  const decide = useCallback((job: Job, d: Decision) => {
    setState((s) => ({ ...s, decisions: { ...s.decisions, [job.id]: d }, history: [...s.history, job.id] }))
    setUndoneId(null)
    if (d === 'pass') setToast(null)
    else setToast({ id: Date.now(), text: d === 'apply' ? `Ai aplicat: ${job.title}` : `Ai salvat: ${job.title}`, undoable: true })
  }, [])

  const undo = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    setState((s) => {
      const { [last]: _, ...rest } = s.decisions
      return { ...s, decisions: rest, history: s.history.slice(0, -1) }
    })
    setUndoneId(last)
    setToast(null)
    setView('deck')
  }, [history])

  const remove = (id: string) =>
    setState((s) => {
      const { [id]: _, ...rest } = s.decisions
      return { ...s, decisions: rest, history: s.history.filter((h) => h !== id) }
    })

  const applyFromSaved = (id: string) => {
    setState((s) => ({ ...s, decisions: { ...s.decisions, [id]: 'apply' } }))
    const job = JOBS.find((j) => j.id === id)
    if (job) setToast({ id: Date.now(), text: `Ai aplicat: ${job.title}`, undoable: false })
  }

  const revisitPassed = () =>
    setState((s) => {
      const decisions = Object.fromEntries(Object.entries(s.decisions).filter(([, d]) => d !== 'pass'))
      return { ...s, decisions, history: s.history.filter((h) => h in decisions) }
    })

  const setFilters = (f: Filters) => setState((s) => ({ ...s, filters: f }))
  const listCount = counts.apply + counts.save

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="wordmark">
          Job<span>Swipe</span>
        </h1>
        <nav className="nav" aria-label="Secțiuni">
          <button aria-pressed={view === 'deck'} onClick={() => setView('deck')}>
            Descoperă
          </button>
          <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
            Lista mea{listCount > 0 && <span className="badge">{listCount}</span>}
          </button>
        </nav>
      </header>

      {view === 'deck' && (
        <div className="filterbar">
          <button
            className="filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <IconSliders />
            {filterSummary(filters)}
          </button>
          <span className="left">
            {remaining.length === 1 ? 'un job rămas' : `${remaining.length} joburi rămase`}
          </span>
        </div>
      )}

      {view === 'deck' && filtersOpen && (
        <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setFiltersOpen(false)} />
      )}

      <main>
        {view === 'deck' ? (
          <Deck
            jobs={remaining}
            hint={history.length === 0}
            canUndo={history.length > 0}
            passedCount={counts.pass}
            noMatches={filtered.length === 0}
            onDecide={decide}
            onUndo={undo}
            onRevisitPassed={revisitPassed}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            onOpenList={() => setView('list')}
          />
        ) : (
          <MyList
            jobs={JOBS}
            decisions={decisions}
            onApply={applyFromSaved}
            onRemove={remove}
            onBack={() => setView('deck')}
          />
        )}
      </main>

      <div className="toast-slot" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.text}</span>
            {toast.undoable && (
              <button className="text-btn text-btn--light" onClick={undo}>
                Anulează
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
