import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { adaptCamera, BOARD_HEIGHT, BOARD_WIDTH, cameraTransform, constrainCamera, normalizeWheelDelta, zoomCameraAt } from '../camera'
import { case001, cases, nodes as initialNodes, relationships } from '../data/evidence'
import { graph } from '../graph'
import type { CameraState, InvestigationCase, InvestigationNode } from '../types'
import { ConnectionLayer } from './ConnectionLayer'
import { EvidenceCard } from './EvidenceCard'

const CASES_BY_ID = new Map(cases.map((caseItem) => [caseItem.id, caseItem]))

type DragState = {
  mode: 'pan' | 'item'
  pointerId: number
  id?: string
  startX: number
  startY: number
  originX: number
  originY: number
  scale: number
  width?: number
  height?: number
}

type PinchState = { distance: number; camera: CameraState; midX: number; midY: number }

export function resolveHashState(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const evidenceId = params.get('evidence')
  const caseId = params.get('case')
  const node = evidenceId && graph.getNode(evidenceId) ? graph.getNode(evidenceId) : null
  return {
    caseId: caseId && CASES_BY_ID.has(caseId) ? caseId : node?.caseIds?.find((value) => CASES_BY_ID.has(value)) ?? case001.id,
    evidenceId: node ? node.id : null,
  }
}

function initialHashState() {
  return resolveHashState(typeof window === 'undefined' ? '' : window.location.hash)
}

function initialCameraFor(caseId: string) {
  const base = (CASES_BY_ID.get(caseId) ?? case001).initialCamera
  if (typeof window === 'undefined') return base
  return adaptCamera(base, window.innerWidth, window.innerHeight)
}

export function Board() {
  const hashState = useRef(initialHashState()).current
  const startingCamera = useRef(initialCameraFor(hashState.caseId)).current
  const [items, setItems] = useState(initialNodes)
  const [activeCaseId, setActiveCaseId] = useState(hashState.caseId)
  const [focusedId, setFocusedId] = useState<string | null>(hashState.evidenceId)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const boardSpaceRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)
  const activeCaseRef = useRef(activeCaseId)
  const cameraRef = useRef(startingCamera)
  const cameraFrameRef = useRef<number | null>(null)
  const itemFrameRef = useRef<number | null>(null)
  const interactionTimerRef = useRef<number | null>(null)
  const animationTimerRef = useRef<number | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pinchRef = useRef<PinchState | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pendingItemPositionRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const viewportRef = useRef({ left: 0, top: 0, width: typeof window === 'undefined' ? 1920 : window.innerWidth, height: typeof window === 'undefined' ? 1080 : window.innerHeight })

  const refreshViewport = useCallback(() => {
    const bounds = boardRef.current?.getBoundingClientRect()
    if (bounds) viewportRef.current = { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }
    return viewportRef.current
  }, [])

  const scheduleCamera = useCallback((requested: CameraState, animate = false) => {
    const viewport = viewportRef.current
    cameraRef.current = constrainCamera(requested, viewport.width, viewport.height)
    const boardSpace = boardSpaceRef.current
    if (animate && boardSpace) {
      boardSpace.classList.add('is-animating')
      if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current)
      animationTimerRef.current = window.setTimeout(() => boardSpace.classList.remove('is-animating'), 700)
    }
    if (cameraFrameRef.current !== null) return
    cameraFrameRef.current = window.requestAnimationFrame(() => {
      cameraFrameRef.current = null
      if (boardSpaceRef.current) boardSpaceRef.current.style.transform = cameraTransform(cameraRef.current)
    })
  }, [])

  const markInteracting = useCallback(() => {
    const boardSpace = boardSpaceRef.current
    if (!boardSpace) return
    boardSpace.classList.remove('is-animating')
    boardSpace.classList.add('is-interacting')
    if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current)
    interactionTimerRef.current = window.setTimeout(() => boardSpace.classList.remove('is-interacting'), 140)
  }, [])

  const flushItemPosition = useCallback(() => {
    const pending = pendingItemPositionRef.current
    pendingItemPositionRef.current = null
    itemFrameRef.current = null
    if (!pending) return
    setItems((current) => {
      const next = current.map((item) => item.id === pending.id ? { ...item, position: { ...item.position, x: pending.x, y: pending.y } } : item)
      itemsRef.current = next
      return next
    })
  }, [])

  const queueItemPosition = useCallback((id: string, x: number, y: number) => {
    pendingItemPositionRef.current = { id, x, y }
    if (itemFrameRef.current === null) itemFrameRef.current = window.requestAnimationFrame(flushItemPosition)
  }, [flushItemPosition])

  const navigateHash = useCallback((evidenceId: string | null, caseId: string) => {
    const params = new URLSearchParams()
    if (caseId !== case001.id) params.set('case', caseId)
    if (evidenceId) params.set('evidence', evidenceId)
    const url = new URL(window.location.href)
    url.hash = params.toString()
    if (url.href !== window.location.href) window.history.pushState(null, '', url)
  }, [])

  const centeredCamera = useCallback((node: InvestigationNode, baseCamera = cameraRef.current) => {
    const viewport = viewportRef.current
    const centerX = node.position.x + node.position.width / 2
    const centerY = node.position.y + node.position.height / 2
    return constrainCamera({ ...baseCamera, x: viewport.width / 2 - centerX * baseCamera.scale, y: viewport.height / 2 - centerY * baseCamera.scale }, viewport.width, viewport.height)
  }, [])

  const switchCase = useCallback((caseId: string) => {
    const nextCase = CASES_BY_ID.get(caseId)
    if (!nextCase) return
    const focusNodeId = graph.getNode(nextCase.primaryNodeId)?.id ?? null
    const viewport = refreshViewport()
    activeCaseRef.current = caseId
    setActiveCaseId(caseId)
    setSelectedRelationshipId(null)
    setFocusedId(focusNodeId)
    scheduleCamera(adaptCamera(nextCase.initialCamera, viewport.width, viewport.height), true)
    navigateHash(focusNodeId, caseId)
  }, [navigateHash, refreshViewport, scheduleCamera])

  const focusNode = useCallback((id: string) => {
    const node = itemsRef.current.find((item) => item.id === id) ?? graph.getNode(id)
    if (!node) return
    const currentCaseId = activeCaseRef.current
    const nextCaseId = node.caseIds?.find((caseId) => CASES_BY_ID.has(caseId)) ?? currentCaseId
    const connected = focusedId !== null && graph.getRelationshipsForNode(focusedId).some((relationship) => relationship.sourceNodeId === id || relationship.targetNodeId === id)
    if (nextCaseId !== currentCaseId) {
      activeCaseRef.current = nextCaseId
      setActiveCaseId(nextCaseId)
    }
    setFocusedId(id)
    setSelectedRelationshipId(null)
    navigateHash(id, nextCaseId)
    if (connected || nextCaseId !== currentCaseId) scheduleCamera(centeredCamera(node), true)
  }, [centeredCamera, focusedId, navigateHash, scheduleCamera])

  const clearInspection = useCallback(() => {
    setFocusedId(null)
    setSelectedRelationshipId(null)
    navigateHash(null, activeCaseRef.current)
  }, [navigateHash])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>, item?: InvestigationNode) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    try { boardRef.current?.setPointerCapture(event.pointerId) } catch { /* Unsupported pointer capture */ }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    markInteracting()
    boardSpaceRef.current?.classList.add('is-dragging')

    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()]
      const viewport = viewportRef.current
      pinchRef.current = {
        distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
        camera: cameraRef.current,
        midX: (first.x + second.x) / 2 - viewport.left,
        midY: (first.y + second.y) / 2 - viewport.top,
      }
      dragRef.current = null
      return
    }

    if (item?.movable) {
      focusNode(item.id)
      dragRef.current = { mode: 'item', pointerId: event.pointerId, id: item.id, startX: event.clientX, startY: event.clientY, originX: item.position.x, originY: item.position.y, scale: cameraRef.current.scale, width: item.position.width, height: item.position.height }
    } else {
      const camera = cameraRef.current
      dragRef.current = { mode: 'pan', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: camera.x, originY: camera.y, scale: camera.scale }
    }
  }, [focusNode, markInteracting])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    markInteracting()

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const [first, second] = [...pointersRef.current.values()]
      const pinch = pinchRef.current
      const viewport = viewportRef.current
      const midX = (first.x + second.x) / 2 - viewport.left
      const midY = (first.y + second.y) / 2 - viewport.top
      const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y))
      const zoomed = zoomCameraAt(pinch.camera, pinch.midX, pinch.midY, pinch.camera.scale * distance / pinch.distance)
      scheduleCamera({ ...zoomed, x: zoomed.x + midX - pinch.midX, y: zoomed.y + midY - pinch.midY })
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (drag.mode === 'pan') {
      scheduleCamera({ scale: drag.scale, x: drag.originX + dx, y: drag.originY + dy })
    } else if (drag.id) {
      const x = Math.min(BOARD_WIDTH - (drag.width ?? 0), Math.max(0, drag.originX + dx / drag.scale))
      const y = Math.min(BOARD_HEIGHT - (drag.height ?? 0), Math.max(0, drag.originY + dy / drag.scale))
      queueItemPosition(drag.id, x, y)
    }
  }, [markInteracting, queueItemPosition, scheduleCamera])

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    pointersRef.current.delete(event.pointerId)
    try { boardRef.current?.releasePointerCapture(event.pointerId) } catch { /* Capture may already be released */ }
    if (pendingItemPositionRef.current) {
      if (itemFrameRef.current !== null) window.cancelAnimationFrame(itemFrameRef.current)
      flushItemPosition()
    }
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 1) {
      const [remaining] = [...pointersRef.current.entries()]
      const camera = cameraRef.current
      dragRef.current = { mode: 'pan', pointerId: remaining[0], startX: remaining[1].x, startY: remaining[1].y, originX: camera.x, originY: camera.y, scale: camera.scale }
      return
    }
    dragRef.current = null
    boardSpaceRef.current?.classList.remove('is-dragging')
  }, [flushItemPosition])

  const onBoardClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (!target.closest('.evidence, .connection-hit-button, .case-return, .relationship-slip, .case-tab')) clearInspection()
  }, [clearInspection])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const initializeFrame = window.requestAnimationFrame(() => {
      const viewport = refreshViewport()
      const initialCase = CASES_BY_ID.get(hashState.caseId) ?? case001
      const initialNode = hashState.evidenceId ? itemsRef.current.find((item) => item.id === hashState.evidenceId) : undefined
      const mountedCamera = adaptCamera(initialCase.initialCamera, viewport.width, viewport.height)
      scheduleCamera(initialNode ? centeredCamera(initialNode, mountedCamera) : mountedCamera)
    })
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return
      event.preventDefault()
      const viewport = viewportRef.current
      const pointerX = event.clientX - viewport.left
      const pointerY = event.clientY - viewport.top
      const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, viewport.height)
      if (delta === 0) return
      markInteracting()
      const camera = cameraRef.current
      scheduleCamera(zoomCameraAt(camera, pointerX, pointerY, camera.scale * Math.exp(-delta * 0.0012)))
    }
    board.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.cancelAnimationFrame(initializeFrame)
      board.removeEventListener('wheel', onWheel)
    }
  }, [centeredCamera, hashState.caseId, hashState.evidenceId, markInteracting, refreshViewport, scheduleCamera])

  useEffect(() => {
    const applyLocation = () => {
      const { caseId, evidenceId } = resolveHashState(window.location.hash)
      const nextCase = CASES_BY_ID.get(caseId) ?? case001
      const viewport = refreshViewport()
      const baseCamera = adaptCamera(nextCase.initialCamera, viewport.width, viewport.height)
      activeCaseRef.current = caseId
      setActiveCaseId(caseId)
      setFocusedId(evidenceId)
      setSelectedRelationshipId(null)
      const node = evidenceId ? itemsRef.current.find((item) => item.id === evidenceId) : undefined
      scheduleCamera(node ? centeredCamera(node, baseCamera) : baseCamera, true)
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') clearInspection() }
    const onResize = () => {
      refreshViewport()
      scheduleCamera(cameraRef.current)
    }
    window.addEventListener('popstate', applyLocation)
    window.addEventListener('hashchange', applyLocation)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('popstate', applyLocation)
      window.removeEventListener('hashchange', applyLocation)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [centeredCamera, clearInspection, refreshViewport, scheduleCamera])

  useEffect(() => () => {
    if (cameraFrameRef.current !== null) window.cancelAnimationFrame(cameraFrameRef.current)
    if (itemFrameRef.current !== null) window.cancelAnimationFrame(itemFrameRef.current)
    if (interactionTimerRef.current !== null) window.clearTimeout(interactionTimerRef.current)
    if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current)
    cameraFrameRef.current = null
    itemFrameRef.current = null
    interactionTimerRef.current = null
    animationTimerRef.current = null
  }, [])

  const caseInfo = (CASES_BY_ID.get(activeCaseId) ?? case001) as InvestigationCase
  const selectedRelationship = selectedRelationshipId ? graph.getRelationship(selectedRelationshipId) : undefined
  const selectedSource = selectedRelationship ? items.find((item) => item.id === selectedRelationship.sourceNodeId) : undefined
  const selectedTarget = selectedRelationship ? items.find((item) => item.id === selectedRelationship.targetNodeId) : undefined
  const selectedEvidence = selectedRelationship ? graph.getEvidenceSupportingRelationship(selectedRelationship.id) : []
  const slipStyle = selectedSource && selectedTarget ? { left: (selectedSource.position.x + selectedTarget.position.x) / 2, top: (selectedSource.position.y + selectedTarget.position.y) / 2 } : undefined
  const connectedIds = useMemo(() => focusedId ? new Set(graph.getNeighborNodes(focusedId).map((node) => node.id)) : new Set<string>(), [focusedId])

  return (
    <main className="wall-shell" ref={boardRef} onPointerDown={(event) => onPointerDown(event)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClick={onBoardClick}>
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
      <button className="case-return" type="button" title={`Return to the initial ${case001.title} viewpoint`} onPointerDown={(event) => event.stopPropagation()} onClick={() => switchCase(case001.id)}>PIN // RETURN TO CASE 001</button>
      <div className="board-space" ref={boardSpaceRef} style={{ transform: cameraTransform(startingCamera) }}>
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
