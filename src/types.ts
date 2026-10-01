export type EvidenceKind = 'dossier' | 'issue' | 'concept' | 'question' | 'note'
export type ThreadType = 'major' | 'contextual' | 'important' | 'hypothesis'

export interface Evidence {
  id: string
  kind: EvidenceKind
  title: string
  subtitle?: string
  body?: string
  meta?: string[]
  x: number
  y: number
  width: number
  height: number
  rotation: number
  tone?: 'paper' | 'cream' | 'blue' | 'red' | 'yellow'
  movable?: boolean
}

export interface Relationship {
  source: string
  target: string
  type: ThreadType
  label: string
  significance?: string
  investigatorNote?: string
}