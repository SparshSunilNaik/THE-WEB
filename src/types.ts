export type NodeType = 'character' | 'comic_issue' | 'event' | 'concept' | 'question' | 'note' | 'organization' | 'location' | 'object'
export type Continuity = 'EARTH-616' | 'MCU' | 'EARTH-96283' | 'EARTH-120703' | 'MULTIVERSAL' | 'META'
export type VisualVariant = 'dossier' | 'issue' | 'concept' | 'question' | 'note'
export type RelationshipVisualType = 'major' | 'contextual' | 'evidentiary' | 'hypothesis'
export type RelationshipType = 'family' | 'formative_influence' | 'origin_evidence' | 'central_principle' | 'ability' | 'thematic_relationship' | 'recurring_motivation' | 'romantic_relationship' | 'causal_event' | 'friendship' | 'continuation' | 'open_question' | 'organization_membership' | 'investigation_branch' | 'attempted_membership' | 'recurring_alliance' | 'founding_member' | 'base_home' | 'related_organization' | 'major_adversary' | 'membership' | 'trusted_ally' | 'legacy' | 'extended_family' | 'rivalry' | 'herald' | 'identified_for_consumption' | 'world_consumption_threat' | 'protective_intervention' | 'first_major_confrontation' | 'moral_influence' | 'developing_empathy' | 'rebellion' | 'resistance' | 'mission_intervention' | 'retrieval' | 'deterrent' | 'defender' | 'punishment' | 'watcher_thread' | 'wider_cosmic_lead' | 'observation' | 'member' | 'intervention_prohibition' | 'first_encounter' | 'debut_evidence' | 'technological_intervention' | 'gift_intervention' | 'weaponization' | 'formative_consequence' | 'doctrine_origin' | 'oath' | 'oath_violation' | 'warning' | 'direct_intervention' | 'judgment' | 'reaffirmed_oath' | 'continued_attachment' | 'hypothesis'

export interface BoardPosition { x: number; y: number; width: number; height: number; rotation: number }

export interface CameraState { x: number; y: number; scale: number }

export interface InvestigationNode {
  id: string
  type: NodeType
  title: string
  subtitle?: string
  continuity?: Continuity
  status?: string
  position: BoardPosition
  visualVariant: VisualVariant
  tone?: 'paper' | 'cream' | 'blue' | 'red' | 'yellow'
  tags?: string[]
  summary?: string
  investigatorNotes?: string
  evidenceReferences?: string[]
  meta?: string[]
  movable?: boolean
  caseIds?: string[]
}

export interface InvestigationRelationship {
  id: string
  sourceNodeId: string
  targetNodeId: string
  type: RelationshipType
  label: string
  visualType: RelationshipVisualType
  significance?: string
  investigatorNote?: string
  evidenceNodeIds?: string[]
}

export interface InvestigationCase {
  id: string
  title: string
  status: 'OPEN' | 'CLOSED' | 'ONGOING'
  primaryNodeId: string
  relatedNodeIds: string[]
  keyRelationshipIds: string[]
  questions: string[]
  investigatorConclusion?: string
  initialCamera: CameraState
}

export interface GraphValidationResult { valid: boolean; errors: string[] }