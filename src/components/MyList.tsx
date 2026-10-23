import { useState } from 'react'
import type { Decision, Job } from '../types'
import { MODE_LABEL, formatSalary, initials } from '../format'

interface Props {
  jobs: Job[]
  decisions: Record<string, Decision>
  onApply: (id: string) => void
  onRemove: (id: string) => void
  onBack: () => void
}

type Tab = 'apply' | 'save'

export function MyList({ jobs, decisions, onApply, onRemove, onBack }: Props) {
  const applied = jobs.filter((j) => decisions[j.id] === 'apply')
  const saved = jobs.filter((j) => decisions[j.id] === 'save')
  const [tab, setTab] = useState<Tab>(applied.length === 0 && saved.length > 0 ? 'save' : 'apply')
  const items = tab === 'apply' ? applied : saved

  return (
    <section className="mylist">
      <div className="seg" role="tablist" aria-label="Lista mea">
        <button role="tab" aria-selected={tab === 'apply'} onClick={() => setTab('apply')}>
          Aplicate <span className="count">{applied.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'save'} onClick={() => setTab('save')}>
          Salvate <span className="count">{saved.length}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty empty--list">
          <h2>{tab === 'apply' ? 'Nu ai aplicat încă la niciun job.' : 'Nu ai salvat încă niciun job.'}</h2>
          <p>{tab === 'apply' ? 'Trage un card la dreapta ca să aplici.' : 'Trage un card în sus ca să-l păstrezi pentru mai târziu.'}</p>
          <button className="pill-btn pill-btn--primary" onClick={onBack}>
            Descoperă joburi
          </button>
        </div>
      ) : (
        <ul className="rows">
          {items.map((job) => (
            <li key={job.id} className="row" style={{ ['--hue' as string]: job.hue }}>
              <span className="logo" aria-hidden>
                {initials(job.company)}
              </span>
              <div className="row-text">
                <strong>{job.title}</strong>
                <span>
                  {job.company}, {job.city}
                </span>
                <span className="row-salary">
                  {formatSalary(job)} lei <small>{MODE_LABEL[job.mode]}</small>
                </span>
              </div>
              <div className="row-actions">
                {tab === 'save' && (
                  <button className="pill-btn pill-btn--primary pill-btn--sm" onClick={() => onApply(job.id)}>
                    Aplică
                  </button>
                )}
                <button className="text-btn" onClick={() => onRemove(job.id)}>
                  {tab === 'apply' ? 'Retrage' : 'Scoate'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
