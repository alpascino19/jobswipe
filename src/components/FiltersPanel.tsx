import type { Filters, WorkMode } from '../types'
import { CITIES } from '../data/jobs'
import { MODE_LABEL, formatLei } from '../format'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
}

const MODES: Array<'toate' | WorkMode> = ['toate', 'remote', 'hibrid', 'la sediu']

export function FiltersPanel({ filters, onChange, onClose }: Props) {
  return (
    <div className="filters" id="filters-panel">
      <fieldset>
        <legend>Mod de lucru</legend>
        <div className="chips">
          {MODES.map((m) => (
            <button
              key={m}
              className="chip"
              aria-pressed={filters.mode === m}
              onClick={() => onChange({ ...filters, mode: m })}
            >
              {m === 'toate' ? 'Oricare' : MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Oraș</span>
        <select value={filters.city} onChange={(e) => onChange({ ...filters, city: e.target.value })}>
          <option value="toate">Toate orașele</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Salariu minim: <strong>{filters.minSalary === 0 ? 'oricât' : `${formatLei(filters.minSalary)} lei`}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={16000}
          step={500}
          value={filters.minSalary}
          onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
        />
      </label>

      <button className="pill-btn pill-btn--primary" onClick={onClose}>
        Gata
      </button>
    </div>
  )
}
