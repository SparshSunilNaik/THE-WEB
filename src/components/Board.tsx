import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { case001, cases, nodes as initialNodes, relationships } from '../data/evidence'
import { graph } from '../graph'
import type { InvestigationCase, InvestigationNode } from '../types'
import { ConnectionLayer } from './ConnectionLayer'
import { EvidenceCard } from './EvidenceCard'

const BOARD_WIDTH = 9600
const BOARD_HEIGHT = 3000
const CASES_BY_ID = new Map(cases.map((caseItem) => [caseItem.id, caseItem]))

function getHashState() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const evidenceId = params.get('evidence')
  const caseId = params.get('case')
  const node = evidenceId && graph.getNode(evidenceId) ? graph.getNode(evidenceId) : null
  return {
    caseId: caseId && CASES_BY_ID.has(caseId) ? caseId : node?.caseIds?.find((value) => CASES_BY_ID.has(value)) ?? case001.id,
    evidenceId: node ? node.id : null,
  }
}

export function Board() {
  const [items, setItems] = useState(initialNodes)
  const [activeCaseId, setActiveCaseId] = useState<string>(() => getHashState().caseId)
  const [focusedId, setFocusedId] = useState<string | null>(() => getHashState().evidenceId)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const [camera, setCamera] = useState(() => (CASES_BY_ID.get(getHashState().caseId) ?? case001).initialCamera)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ mode: 'pan' | 'item'; id?: string; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  const updateHash = (evidenceId: string | null, caseId = activeCaseId) => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    if (caseId && caseId !== case001.id) params.set('case', caseId)
    else params.delete('case')
    if (evidenceId) params.set('evidence', evidenceId)
    else params.delete('evidence')
    const nextHash = params.toString()
    const url = new URL(window.location.href)
    url.hash = nextHash ? `#${nextHash}` : ''
    window.history.replaceState(null, '', url)
  }

  const centerOnNode = (node: InvestigationNode) => {
    const bounds = boardRef.current?.getBoundingClientRect()
    if (!bounds) return
    const centerX = node.position.x + node.position.width / 2
    const centerY = node.position.y + node.position.height / 2
    setCamera((current) => ({ ...current, x: bounds.width / 2 - centerX * current.scale, y: bounds.height / 2 - centerY * current.scale }))
  }

  const switchCase = (caseId: string) => {
    const nextCase = CASES_BY_ID.get(caseId)
    if (!nextCase) return
    const focusNodeId = graph.getNode(nextCase.primaryNodeId)?.id ?? null
    setActiveCaseId(caseId)
    setCamera(nextCase.initialCamera)
    setSelectedRelationshipId(null)
    setFocusedId(focusNodeId)
    updateHash(focusNodeId, caseId)
  }

  const focusNode = (id: string) => {
    const node = graph.getNode(id)
    if (!node) return
    const nextCaseId = node.caseIds?.find((caseId) => CASES_BY_ID.has(caseId)) ?? activeCaseId
    if (nextCaseId !== activeCaseId) setActiveCaseId(nextCaseId)
    const connected = focusedId !== null && graph.getNeighborNodes(focusedId).some((neighbor) => neighbor.id === id)
    setFocusedId(id)
    setSelectedRelationshipId(null)
    updateHash(id, nextCaseId)
    if (connected) centerOnNode(items.find((item) => item.id === id) ?? node)
  }

  const clearInspection = () => {
    setFocusedId(null)
    setSelectedRelationshipId(null)
    updateHash(null, activeCaseId)
  }

  const returnToCase = () => switchCase(case001.id)

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
    if (!target.closest('.evidence, .connection, .case-return, .relationship-slip, .case-tab')) clearInspection()
  }

  useEffect(() => {
    const onHashChange = () => {
      const { caseId, evidenceId } = getHashState()
      if (caseId && CASES_BY_ID.has(caseId)) {
        setActiveCaseId(caseId)
        setCamera((CASES_BY_ID.get(caseId) ?? case001).initialCamera)
      }
      setFocusedId(evidenceId)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') clearInspection() }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('hashchange', onHashChange); window.removeEventListener('keydown', escape) }
  }, [])

  const caseInfo = (CASES_BY_ID.get(activeCaseId) ?? case001) as InvestigationCase
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
      </div>
      <div className="case-panel" aria-label="Active case panel">
        <span className="case-label">CASE {caseInfo.id.replace('case-', '')}<br /><strong>{caseInfo.title}</strong><br /><small>STATUS: {caseInfo.status}</small></span>
        <div className="case-tabs" aria-label="Investigation case tabs">
          {cases.map((caseItem) => (
            <button key={caseItem.id} className={`case-tab ${caseItem.id === activeCaseId ? 'is-active' : ''}`} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => switchCase(caseItem.id)}>{caseItem.id.toUpperCase()}</button>
          ))}
        </div>
      </div>
      <button className="case-return" type="button" title={`Return to the initial ${case001.title} viewpoint`} onPointerDown={(event) => event.stopPropagation()} onClick={returnToCase}>PIN // RETURN TO CASE 001</button>
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