import { nodes, relationships } from './data/evidence'
import type { Continuity, GraphValidationResult, InvestigationNode, InvestigationRelationship, NodeType } from './types'

export class InvestigationGraph {
  readonly nodesById: ReadonlyMap<string, InvestigationNode>
  readonly relationshipsById: ReadonlyMap<string, InvestigationRelationship>
  private readonly relationshipsByNodeId = new Map<string, InvestigationRelationship[]>()

  constructor(readonly nodes: InvestigationNode[], readonly relationships: InvestigationRelationship[]) {
    this.nodesById = new Map(nodes.map((node) => [node.id, node]))
    this.relationshipsById = new Map(relationships.map((relationship) => [relationship.id, relationship]))
    for (const node of nodes) this.relationshipsByNodeId.set(node.id, [])
    for (const relationship of relationships) {
      this.relationshipsByNodeId.get(relationship.sourceNodeId)?.push(relationship)
      this.relationshipsByNodeId.get(relationship.targetNodeId)?.push(relationship)
    }
  }

  getNode(id: string) { return this.nodesById.get(id) }
  getRelationship(id: string) { return this.relationshipsById.get(id) }
  getRelationshipsForNode(nodeId: string) { return this.relationshipsByNodeId.get(nodeId) ?? [] }
  getNeighborNodes(nodeId: string) { return this.getRelationshipsForNode(nodeId).map((relationship) => this.getNode(relationship.sourceNodeId === nodeId ? relationship.targetNodeId : relationship.sourceNodeId)).filter((node): node is InvestigationNode => Boolean(node)) }
  getDirectlyConnectedEvidence(nodeId: string) { return this.getNeighborNodes(nodeId) }
  getNodesByType(type: NodeType) { return this.nodes.filter((node) => node.type === type) }
  getNodesByContinuity(continuity: Continuity) { return this.nodes.filter((node) => node.continuity === continuity) }
  getEvidenceSupportingRelationship(relationshipId: string) {
    const relationship = this.getRelationship(relationshipId)
    return relationship?.evidenceNodeIds?.map((id) => this.getNode(id)).filter((node): node is InvestigationNode => Boolean(node)) ?? []
  }
  validate(): GraphValidationResult {
    const errors: string[] = []
    const nodeIds = new Set<string>()
    for (const node of this.nodes) { if (nodeIds.has(node.id)) errors.push(`Duplicate node ID: ${node.id}`); nodeIds.add(node.id) }
    const relationshipIds = new Set<string>()
    for (const relationship of this.relationships) {
      if (relationshipIds.has(relationship.id)) errors.push(`Duplicate relationship ID: ${relationship.id}`)
      relationshipIds.add(relationship.id)
      if (!nodeIds.has(relationship.sourceNodeId)) errors.push(`Relationship ${relationship.id} references missing source: ${relationship.sourceNodeId}`)
      if (!nodeIds.has(relationship.targetNodeId)) errors.push(`Relationship ${relationship.id} references missing target: ${relationship.targetNodeId}`)
      if (relationship.sourceNodeId === relationship.targetNodeId) errors.push(`Self relationship is not allowed: ${relationship.id}`)
      for (const evidenceId of relationship.evidenceNodeIds ?? []) if (!nodeIds.has(evidenceId)) errors.push(`Relationship ${relationship.id} references missing evidence: ${evidenceId}`)
    }
    return { valid: errors.length === 0, errors }
  }
}

export const graph = new InvestigationGraph(nodes, relationships)