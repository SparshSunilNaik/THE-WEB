import type { Evidence, Relationship } from '../types'

interface ConnectionLayerProps {
  items: Evidence[]
  relationships: Relationship[]
  focusedId: string | null
}

export function ConnectionLayer({ items, relationships, focusedId }: ConnectionLayerProps) {
  const byId = new Map(items.map((item) => [item.id, item]))
  return (
    <svg className="connections" width="2400" height="1450" viewBox="0 0 2400 1450" aria-hidden="true">
      {relationships.map((relationship) => {
        const source = byId.get(relationship.source)
        const target = byId.get(relationship.target)
        if (!source || !target) return null
        const x1 = source.x + source.width / 2
        const y1 = source.y + source.height / 2
        const x2 = target.x + target.width / 2
        const y2 = target.y + target.height / 2
        const curve = Math.max(35, Math.abs(x2 - x1) * 0.16)
        const path = `M ${x1} ${y1} C ${x1 + curve} ${y1 - curve * 0.18}, ${x2 - curve} ${y2 + curve * 0.18}, ${x2} ${y2}`
        const connectedToFocus = focusedId !== null && (relationship.source === focusedId || relationship.target === focusedId)
        return <g key={`${relationship.source}-${relationship.target}`} className={`connection connection--${relationship.type} ${focusedId && !connectedToFocus ? 'is-muted' : ''} ${connectedToFocus ? 'is-active' : ''}`}><path d={path} /><text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7}>{relationship.label}</text></g>
      })}
    </svg>
  )
}