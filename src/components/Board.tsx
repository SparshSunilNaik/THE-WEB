import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { case001, nodes as initialNodes, relationships } from '../data/evidence'
import { graph } from '../graph'
import type { InvestigationNode } from '../types'
import { ConnectionLayer } from './ConnectionLayer'
import { EvidenceCard } from './EvidenceCard'

const BOARD_WIDTH = 2800
const BOARD_HEIGHT = 1450
const INITIAL_CAMERA = { x: -340, y: -140, scale: 0.92 }

function getHashNodeId() {
  const value = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('evidence')
  return value && graph.getNode(value) ? value : null
}

export function Board() {
  const [items, setItems] = useState(initialNodes)
  const [focusedId, setFocusedId] = useState<string | null>(() => getHashNodeId())
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const [camera, setCamera] = useState(INITIAL_CAMERA)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ mode: 'pan' | 'item'; id?: string; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const updateHash = (id: string | null) => {
    const url = new URL(window.location.href)
    if (id) url.hash = `evidence=${id}`
    else url.hash = ''
    window.history.replaceState(null, '', url)
  }

  const centerOnNode = (node: InvestigationNode) => {
    const bounds = boardRef.current?.getBoundingClientRect()
    if (!bounds) return
    const centerX = node.position.x + node.position.width / 2
    const centerY = node.position.y + node.position.height / 2
    setCamera((current) => ({ ...current, x: bounds.width / 2 - centerX * current.scale, y: bounds.height / 2 - centerY * current.scale }))
  }

  const focusNode = (id: string) => {
    const node = graph.getNode(id)
    if (!node) return
    const connected = focusedId !== null && graph.getNeighborNodes(focusedId).some((neighbor) => neighbor.id === id)
    setFocusedId(id)
    setSelectedRelationshipId(null)
    updateHash(id)
    if (connected) centerOnNode(items.find((item) => item.id === id) ?? node)
  }

  const clearInspection = () => { setFocusedId(null); setSelectedRelationshipId(null); updateHash(null) }
  const returnToCase = () => { setCamera(INITIAL_CAMERA); clearInspection() }

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, item?: InvestigationNode) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    if (item?.movable) {
      focusNode(item.id)
      dragRef.current = { mode: 'item', id: item.id, startX: event.clientX, startY: event.clientY, originX: item.position.x, originY: item.position.y }
    } else dragRef.current = { mode: 'pan', startX: event.clientX, startY: event.clientY, originX: camera.x, originY: camera.y }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (drag.mode === 'pan') setCamera((current) => ({ ...current, x: drag.originX + dx, y: drag.originY + dy }))
    else if (drag.id) setItems((current) => current.map((item) => item.id === drag.id ? { ...item, position: { ...item.position, x: drag.originX + dx / camera.scale, y: drag.originY + dy / camera.scale } } : item))
  }

  const onPointerUp = () => { dragRef.current = null; setIsDragging(false) }

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

  const onBoardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (!target.closest('.evidence, .connection, .case-return, .relationship-slip')) clearInspection()
  }

  useEffect(() => {
    const onHashChange = () => setFocusedId(getHashNodeId())
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') clearInspection() }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('keydown', escape) }
  })

  const selectedRelationship = selectedRelationshipId ? graph.getRelationship(selectedRelationshipId) : undefined
  const selectedSource = selectedRelationship ? items.find((item) => item.id === selectedRelationship.sourceNodeId) : undefined
  const selectedTarget = selectedRelationship ? items.find((item) => item.id === selectedRelationship.targetNodeId) : undefined
  const selectedEvidence = selectedRelationship ? graph.getEvidenceSupportingRelationship(selectedRelationship.id) : []
  const slipStyle = selectedSource && selectedTarget ? { left: (selectedSource.position.x + selectedTarget.position.x) / 2, top: (selectedSource.position.y + selectedTarget.position.y) / 2 } : undefined
  const connectedIds = focusedId ? new Set(graph.getNeighborNodes(focusedId).map((node) => node.id)) : new Set<string>()
  const transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`

  return (
    <main className="wall-shell" ref={boardRef} onPointerDown={(event) => onPointerDown(event)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} onClick={onBoardClick}>
      <div className="wall-toolbar" aria-label="Investigation details">
        <span className="stamp">THE WEB<br /><b>MARVEL INVESTIGATION // S. NAIK</b><br /><b>STATUS: ONGOING</b></span>
        <span className="case-label">CASE 001<br /><strong>{case001.title}</strong><br /><small>STATUS: {case001.status}</small></span>
      </div>
      <button className="case-return" type="button" title="Return to the initial CASE 001 viewpoint" onPointerDown={(event) => event.stopPropagation()} onClick={returnToCase}>PIN // RETURN TO CASE 001</button>
      <div className={`board-space ${isDragging ? 'is-dragging' : ''}`} style={{ transform }}>
        <div className="board-surface" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
          <ConnectionLayer items={items} relationships={relationships} focusedId={focusedId} selectedRelationshipId={selectedRelationshipId} onSelectRelationship={setSelectedRelationshipId} />
          {items.map((item) => <EvidenceCard key={item.id} item={item} focused={focusedId === item.id} dimmed={focusedId !== null && focusedId !== item.id && !connectedIds.has(item.id)} onFocus={focusNode} onPointerDown={onPointerDown} />)}
          {selectedRelationship && selectedSource && selectedTarget && <aside className="relationship-slip" style={slipStyle} aria-label="Relationship annotation" onPointerDown={(event) => event.stopPropagation()}>
            <button type="button" className="slip-close" aria-label="Close relationship annotation" onClick={() => setSelectedRelationshipId(null)}>×</button>
            <span>{selectedSource.title}</span><b>↓<br />{selectedRelationship.label}<br />↓</b><span>{selectedTarget.title}</span>
            {selectedRelationship.significance && <p>{selectedRelationship.significance}</p>}
            {selectedEvidence.length > 0 && <small>EVIDENCE: {selectedEvidence.map((item) => item.title).join(' / ')}</small>}
            {selectedRelationship.investigatorNote && <em>{selectedRelationship.investigatorNote}</em>}
          </aside>}
        </div>
      </div>
      <div className="wall-legend" aria-label="Connection key"><span><i className="legend-thread legend-thread--major" /> MAJOR</span><span><i className="legend-thread legend-thread--contextual" /> CONTEXT</span><span><i className="legend-thread legend-thread--important" /> EVIDENCE</span><span><i className="legend-thread legend-thread--hypothesis" /> HYPOTHESIS</span></div>
    </main>
  )
}