import { memo, useMemo } from 'react'
import type { InvestigationNode, InvestigationRelationship } from '../types'

interface ConnectionLayerProps {
  items: InvestigationNode[]
  relationships: InvestigationRelationship[]
  focusedId: string | null
  selectedRelationshipId: string | null
  onSelectRelationship: (relationshipId: string) => void
}

export const ConnectionLayer = memo(function ConnectionLayer({ items, relationships, focusedId, selectedRelationshipId, onSelectRelationship }: ConnectionLayerProps) {
  const geometry = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]))
    return relationships.flatMap((relationship) => {
      const source = byId.get(relationship.sourceNodeId)
      const target = byId.get(relationship.targetNodeId)
      if (!source || !target) return []
      const x1 = source.position.x + source.position.width / 2
      const y1 = source.position.y + source.position.height / 2
      const x2 = target.position.x + target.position.width / 2
      const y2 = target.position.y + target.position.height / 2
      const curve = Math.max(35, Math.abs(x2 - x1) * 0.16)
      return [{ relationship, source, target, x1, y1, x2, y2, path: `M ${x1} ${y1} C ${x1 + curve} ${y1 - curve * 0.18}, ${x2 - curve} ${y2 + curve * 0.18}, ${x2} ${y2}` }]
    })
  }, [items, relationships])
  return (
    <>
      <svg className="connections" width="19500" height="4300" viewBox="0 0 19500 4300" aria-label="Investigation relationships">
        {geometry.map(({ relationship, x1, y1, x2, y2, path }) => {
        const connectedToFocus = focusedId !== null && (relationship.sourceNodeId === focusedId || relationship.targetNodeId === focusedId)
        const muted = focusedId !== null && !connectedToFocus
        const selected = selectedRelationshipId === relationship.id
          return <g key={relationship.id} className={`connection connection--${relationship.visualType} ${muted ? 'is-muted' : ''} ${connectedToFocus ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`} aria-hidden="true"><path d={path} /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}>{relationship.label}</text></g>
        })}
      </svg>
      {geometry.map(({ relationship, source, target, x1, y1, x2, y2 }) => {
        const left = (x1 + x2) / 2
        const top = (y1 + y2) / 2
        const connectedToFocus = focusedId !== null && (relationship.sourceNodeId === focusedId || relationship.targetNodeId === focusedId)
        return <button key={`${relationship.id}-inspection`} className={`connection-hit-button ${focusedId !== null && !connectedToFocus ? 'is-muted' : ''}`} style={{ left, top }} type="button" aria-label={`${source.title} ${relationship.label} ${target.title}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelectRelationship(relationship.id) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectRelationship(relationship.id) } }} />
      })}
    </>
  )
})
