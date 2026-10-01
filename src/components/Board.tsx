import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { evidence as initialEvidence, relationships } from '../data/evidence'
import type { Evidence } from '../types'
import { ConnectionLayer } from './ConnectionLayer'
import { EvidenceCard } from './EvidenceCard'

const BOARD_WIDTH = 2400
const BOARD_HEIGHT = 1450

export function Board() {
  const [items, setItems] = useState(initialEvidence)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [camera, setCamera] = useState({ x: -340, y: -140, scale: 0.92 })
  const dragRef = useRef<{ mode: 'pan' | 'item'; id?: string; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, item?: Evidence) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    if (item?.movable) {
      setFocusedId(item.id)
      dragRef.current = { mode: 'item', id: item.id, startX: event.clientX, startY: event.clientY, originX: item.x, originY: item.y }
    } else {
      dragRef.current = { mode: 'pan', startX: event.clientX, startY: event.clientY, originX: camera.x, originY: camera.y }
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (drag.mode === 'pan') setCamera((current) => ({ ...current, x: drag.originX + dx, y: drag.originY + dy }))
    else if (drag.id) setItems((current) => current.map((item) => item.id === drag.id ? { ...item, x: drag.originX + dx / camera.scale, y: drag.originY + dy / camera.scale } : item))
  }

  const onPointerUp = () => { dragRef.current = null }

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const bounds = boardRef.current?.getBoundingClientRect()
    if (!bounds) return
    const nextScale = Math.min(1.25, Math.max(0.45, camera.scale * (event.deltaY > 0 ? 0.92 : 1.08)))
    const pointerX = event.clientX - bounds.left
    const pointerY = event.clientY - bounds.top
    const boardX = (pointerX - camera.x) / camera.scale
    const boardY = (pointerY - camera.y) / camera.scale
    setCamera({ scale: nextScale, x: pointerX - boardX * nextScale, y: pointerY - boardY * nextScale })
  }

  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocusedId(null) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`
  return (
    <main className="wall-shell" ref={boardRef} onPointerDown={(event) => onPointerDown(event)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} onClick={(event) => { if (event.target === event.currentTarget) setFocusedId(null) }}>
      <div className="wall-toolbar" aria-label="Investigation details">
        <span className="stamp">THE WEB<br /><b>MARVEL INVESTIGATION // S. NAIK</b><br /><b>STATUS: ONGOING</b></span>
        <span className="case-label">CASE 001<br /><strong>WHAT MAKES PETER PARKER<br />SPIDER-MAN?</strong></span>
      </div>
      <div className="board-space" style={{ transform }}>
        <div className="board-surface" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
          <ConnectionLayer items={items} relationships={relationships} focusedId={focusedId} />
          {items.map((item) => <EvidenceCard key={item.id} item={item} focused={focusedId === item.id} dimmed={focusedId !== null && focusedId !== item.id && !relationships.some((link) => (link.source === focusedId && link.target === item.id) || (link.target === focusedId && link.source === item.id))} onFocus={setFocusedId} onPointerDown={onPointerDown} />)}
        </div>
      </div>
      <div className="wall-legend" aria-label="Connection key"><span><i className="legend-thread legend-thread--major" /> MAJOR</span><span><i className="legend-thread legend-thread--contextual" /> CONTEXT</span><span><i className="legend-thread legend-thread--important" /> EVIDENCE</span><span><i className="legend-thread legend-thread--hypothesis" /> HYPOTHESIS</span></div>
    </main>
  )
}