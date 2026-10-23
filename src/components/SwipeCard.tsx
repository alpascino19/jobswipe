import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Decision, Job } from '../types'
import { MODE_LABEL, formatSalary, initials } from '../format'
import { IconCheck, IconHouse, IconPin, IconStar, IconX } from './Icons'

export interface SwipeCardHandle {
  swipe: (d: Decision) => void
  toggleDetails: () => void
}

interface Props {
  job: Job
  /** 0 = top card (interactive); 1, 2 = cards waiting underneath. */
  depth: number
  hint?: boolean
  onDecide: (d: Decision) => void
  /** 0–1: how close the top card is to being decided. Drives the cards underneath. */
  onDragProgress?: (p: number) => void
}

const THRESHOLD_X = 110
const THRESHOLD_Y = 120
const FLICK = 0.55 // px/ms
const DEAD_ZONE = 10
const FLY_MS = 300

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { job, depth, hint, onDecide, onDragProgress },
  ref,
) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState<Decision | null>(null)
  const [open, setOpen] = useState(false)
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const last = useRef({ x: 0, y: 0, t: 0, vx: 0, vy: 0 })
  const moved = useRef(false)
  const leavingRef = useRef(false)

  function fly(d: Decision, from = offset) {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(d)
    setDragging(false)
    if (reducedMotion()) {
      window.setTimeout(() => onDecide(d), 160)
      return
    }
    const w = window.innerWidth
    const h = window.innerHeight
    setOffset(
      d === 'apply' ? { x: w, y: from.y + 60 } : d === 'pass' ? { x: -w, y: from.y + 60 } : { x: from.x, y: -h },
    )
    window.setTimeout(() => onDecide(d), FLY_MS)
  }

  useImperativeHandle(ref, () => ({ swipe: (d) => fly(d), toggleDetails: () => setOpen((o) => !o) }))

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Ignore a second finger while a drag is in progress.
    if (depth !== 0 || leavingRef.current || e.button !== 0 || start.current) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* pointer already released */
    }
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    last.current = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 }
    moved.current = false
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current
    if (!s || e.pointerId !== s.id) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!moved.current && Math.hypot(dx, dy) < DEAD_ZONE) return
    moved.current = true
    const now = performance.now()
    const dt = Math.max(1, now - last.current.t)
    last.current = {
      x: e.clientX,
      y: e.clientY,
      t: now,
      vx: (e.clientX - last.current.x) / dt,
      vy: (e.clientY - last.current.y) / dt,
    }
    setDragging(true)
    // Dragging down has no meaning, so it meets growing resistance.
    setOffset({ x: dx, y: dy > 0 ? Math.sqrt(dy) * 4 : dy })
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current
    if (!s || e.pointerId !== s.id) return
    start.current = null
    if (!moved.current) {
      setOpen((o) => !o)
      return
    }
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    // A flick only counts if the finger was still moving when lifted.
    const fresh = performance.now() - last.current.t < 80
    const vx = fresh ? last.current.vx : 0
    const vy = fresh ? last.current.vy : 0
    setDragging(false)

    const vertical = Math.abs(dy) > Math.abs(dx)
    if (vertical && (dy < -THRESHOLD_Y || (vy < -FLICK && dy < -40))) fly('save', { x: dx, y: dy })
    else if (!vertical && (dx > THRESHOLD_X || (vx > FLICK && dx > 40))) fly('apply', { x: dx, y: dy })
    else if (!vertical && (dx < -THRESHOLD_X || (vx < -FLICK && dx < -40))) fly('pass', { x: dx, y: dy })
    else setOffset({ x: 0, y: 0 })
  }

  function onPointerCancel() {
    start.current = null
    setDragging(false)
    setOffset({ x: 0, y: 0 })
  }

  const vertical = Math.abs(offset.y) > Math.abs(offset.x)
  const stamp = {
    apply: leaving === 'apply' ? 1 : vertical ? 0 : clamp01(offset.x / THRESHOLD_X),
    pass: leaving === 'pass' ? 1 : vertical ? 0 : clamp01(-offset.x / THRESHOLD_X),
    save: leaving === 'save' ? 1 : vertical ? clamp01(-offset.y / THRESHOLD_Y) : 0,
  }
  const progress = leaving ? 1 : Math.max(stamp.apply, stamp.pass, stamp.save)

  useEffect(() => {
    if (depth === 0) onDragProgress?.(progress)
  }, [depth, progress, onDragProgress])

  // Cards underneath sit one slot down per depth and rise as the top card is dragged (--p on the stack).
  const transform =
    depth === 0
      ? `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${offset.x * 0.05}deg)`
      : `translate3d(0, calc((${depth} - var(--p, 0)) * 16px), 0) scale(calc(1 - (${depth} - var(--p, 0)) * 0.045))`

  const transition =
    depth !== 0
      ? 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)'
      : dragging
        ? 'none'
        : leaving
          ? `transform ${FLY_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`
          : 'transform 420ms cubic-bezier(0.2, 0.9, 0.25, 1.12)'

  const tint = stamp.apply > 0 ? 'var(--apply)' : stamp.pass > 0 ? 'var(--pass)' : 'var(--save)'

  return (
    <div
      className={`card${depth === 0 ? ' card--top' : ''}${dragging ? ' card--dragging' : ''}`}
      style={{ transform, transition, zIndex: 10 - depth, ['--hue' as string]: job.hue }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-hidden={depth !== 0}
      role={depth === 0 ? 'group' : undefined}
      aria-roledescription={depth === 0 ? 'card de job' : undefined}
      aria-label={depth === 0 ? `${job.title} la ${job.company}` : undefined}
    >
      <div className={`card-inner${hint && depth === 0 && !dragging && !leaving ? ' card-inner--hint' : ''}`}>
        <span className="monogram" aria-hidden>
          {initials(job.company)}
        </span>

        <header className="card-head">
          <span className="logo" aria-hidden>
            {initials(job.company)}
          </span>
          <span className="company">{job.company}</span>
          <span className="posted">{job.posted}</span>
        </header>

        <div className="card-body">
          <h2 className="title">{job.title}</h2>
          <p className="salary">
            <span className="salary-num">{formatSalary(job)}</span>
            <span className="salary-unit">lei net pe lună</span>
          </p>

          <ul className="meta">
            <li>
              <IconPin /> {job.city}
            </li>
            <li>
              <IconHouse /> {MODE_LABEL[job.mode]}
            </li>
            <li>{job.level}</li>
          </ul>

          {open ? (
            <div className="details">
              <h3>Ce primești</h3>
              <ul className="perks">
                {job.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="summary">{job.summary}</p>
          )}

          <ul className="tags">
            {job.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>

          <p className="card-foot">{open ? 'Atinge din nou pentru descriere' : 'Atinge cardul ca să vezi ce primești'}</p>
        </div>

        <span className="tint" style={{ background: tint, opacity: progress * 0.28 }} aria-hidden />

        <span className="stamp stamp--apply" style={{ opacity: stamp.apply, scale: `${0.8 + stamp.apply * 0.2}` }} aria-hidden>
          <IconCheck size={26} /> Aplic
        </span>
        <span className="stamp stamp--pass" style={{ opacity: stamp.pass, scale: `${0.8 + stamp.pass * 0.2}` }} aria-hidden>
          <IconX size={24} /> Pas
        </span>
        <span className="stamp stamp--save" style={{ opacity: stamp.save, scale: `${0.8 + stamp.save * 0.2}` }} aria-hidden>
          <IconStar size={24} /> Salvez
        </span>
      </div>
    </div>
  )
})
