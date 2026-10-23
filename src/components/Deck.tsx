import { useCallback, useEffect, useRef } from 'react'
import type { Decision, Job } from '../types'
import { SwipeCard, type SwipeCardHandle } from './SwipeCard'
import { IconCheck, IconStar, IconUndo, IconX } from './Icons'

interface Props {
  jobs: Job[]
  hint: boolean
  canUndo: boolean
  passedCount: number
  noMatches: boolean
  onDecide: (job: Job, d: Decision) => void
  onUndo: () => void
  onRevisitPassed: () => void
  onResetFilters: () => void
  onOpenList: () => void
}

export function Deck({
  jobs,
  hint,
  canUndo,
  passedCount,
  noMatches,
  onDecide,
  onUndo,
  onRevisitPassed,
  onResetFilters,
  onOpenList,
}: Props) {
  const top = useRef<SwipeCardHandle>(null)
  const stack = useRef<HTMLDivElement>(null)
  const visible = jobs.slice(0, 3)
  const topHue = jobs[0]?.hue

  // Set on the element directly so a drag doesn't re-render the whole deck.
  const onDragProgress = useCallback((p: number) => {
    stack.current?.style.setProperty('--p', String(p))
  }, [])

  // The page takes on the colour of the job you're looking at.
  useEffect(() => {
    if (topHue !== undefined) document.documentElement.style.setProperty('--h', String(topHue))
  }, [topHue])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea, [contenteditable]')) return
      const onButton = !!el.closest('button')
      switch (e.key) {
        case 'ArrowLeft':
          top.current?.swipe('pass')
          break
        case 'ArrowRight':
          top.current?.swipe('apply')
          break
        case 'ArrowUp':
          top.current?.swipe('save')
          break
        case 'Backspace':
        case 'z':
          if (canUndo) onUndo()
          break
        case ' ':
        case 'Enter':
          if (onButton) return
          top.current?.toggleDetails()
          break
        default:
          return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canUndo, onUndo])

  if (jobs.length === 0) {
    return (
      <section className="empty">
        {noMatches ? (
          <>
            <h2>Niciun job nu se potrivește filtrelor.</h2>
            <p>Încearcă alt oraș sau un salariu minim mai mic.</p>
            <button className="pill-btn pill-btn--primary" onClick={onResetFilters}>
              Resetează filtrele
            </button>
          </>
        ) : (
          <>
            <h2>Ai trecut prin toate joburile.</h2>
            <p>Joburile la care ai aplicat și cele salvate te așteaptă în listă.</p>
            <button className="pill-btn pill-btn--primary" onClick={onOpenList}>
              Vezi lista mea
            </button>
            {passedCount > 0 && (
              <button className="pill-btn" onClick={onRevisitPassed}>
                Revezi joburile refuzate ({passedCount})
              </button>
            )}
          </>
        )}
        {canUndo && (
          <button className="text-btn" onClick={onUndo}>
            Anulează ultima alegere
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="deck" aria-label="Joburi de ales">
      <div className="stack" ref={stack}>
        {visible
          .map((job, i) => (
            <SwipeCard
              key={job.id}
              ref={i === 0 ? top : undefined}
              job={job}
              depth={i}
              hint={hint}
              onDecide={(d) => onDecide(job, d)}
              onDragProgress={i === 0 ? onDragProgress : undefined}
            />
          ))
          .reverse()}
      </div>

      <div className="controls">
        <button className="round round--pass" onClick={() => top.current?.swipe('pass')} aria-label="Pas">
          <IconX />
        </button>
        <button className="round round--undo" onClick={onUndo} disabled={!canUndo} aria-label="Anulează ultima alegere">
          <IconUndo />
        </button>
        <button className="round round--save" onClick={() => top.current?.swipe('save')} aria-label="Salvează pentru mai târziu">
          <IconStar />
        </button>
        <button className="round round--apply" onClick={() => top.current?.swipe('apply')} aria-label="Aplică">
          <IconCheck />
        </button>
      </div>

      <p className="how">
        Trage cardul la dreapta ca să aplici, la stânga ca să treci mai departe, în sus ca să-l salvezi. Merg și săgețile
        de pe tastatură.
      </p>
    </section>
  )
}
