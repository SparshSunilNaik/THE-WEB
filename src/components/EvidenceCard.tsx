import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { InvestigationNode } from '../types'

interface EvidenceCardProps {
  item: InvestigationNode
  focused: boolean
  dimmed: boolean
  onFocus: (id: string) => void
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, item: InvestigationNode) => void
}

export function EvidenceCard({ item, focused, dimmed, onFocus, onPointerDown }: EvidenceCardProps) {
  const style = { '--rotation': `${item.position.rotation}deg`, width: item.position.width, height: item.position.height, left: item.position.x, top: item.position.y } as CSSProperties

  return (
    <div className={`evidence evidence--${item.visualVariant} tone--${item.tone ?? 'paper'} ${focused ? 'is-focused' : ''} ${dimmed ? 'is-dimmed' : ''}`} style={style} tabIndex={0} role="button" aria-label={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`} onClick={() => onFocus(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onFocus(item.id) } }} onPointerDown={(event) => { event.stopPropagation(); onPointerDown(event, item) }}>
      {item.visualVariant === 'dossier' && <div className="dossier-photo" aria-hidden="true"><span>{item.title.slice(0, 2)}</span></div>}
      <div className="evidence-pin" aria-hidden="true" />
      <div className="evidence-content">
        <span className="evidence-kind">{item.type === 'character' ? 'PERSON / DOSSIER' : item.type === 'comic_issue' ? 'COMIC EVIDENCE' : item.type === 'concept' ? 'CONCEPT / INDEX' : 'FIELD NOTE'}</span>
        <h2>{item.title}</h2>
        {item.subtitle && <p className="evidence-subtitle">{item.subtitle}</p>}
        {item.summary && <p className="evidence-body">{item.summary}</p>}
        {item.meta && <div className="evidence-meta">{item.meta.map((entry) => <span key={entry}>{entry}</span>)}</div>}
      </div>
    </div>
  )
}