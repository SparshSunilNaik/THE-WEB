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
  getNodesByCase(caseId: string) { return this.nodes.filter((node) => node.caseIds?.includes(caseId)) }
  getEvidenceSupportingRelationship(relationshipId: string) {
    const relationship = this.getRelationship(relationshipId)
    return relationship?.evidenceNodeIds?.map((id) => this.getNode(id)).filter((node): node is InvestigationNode => Boolean(node)) ?? []
  }
  findShortestPath(startNodeId: string, endNodeId: string) {
    if (!this.getNode(startNodeId) || !this.getNode(endNodeId)) return null
    if (startNodeId === endNodeId) return [startNodeId]

    const queue: string[] = [startNodeId]
    const previous = new Map<string, string | null>([[startNodeId, null]])

    while (queue.length > 0) {
      const currentId = queue.shift()
      if (!currentId) continue
      if (currentId === endNodeId) break

      for (const neighbor of this.getNeighborNodes(currentId)) {
        if (previous.has(neighbor.id)) continue
        previous.set(neighbor.id, currentId)
        queue.push(neighbor.id)
      }
    }

    if (!previous.has(endNodeId)) return null

    const path: string[] = []
    let currentId: string | null = endNodeId
    while (currentId) {
      path.unshift(currentId)
      currentId = previous.get(currentId) ?? null
    }
    return path
  }
  validate(): GraphValidationResult {
    const errors: string[] = []
    const nodeIds = new Set<string>()
    for (const node of this.nodes) {
      if (nodeIds.has(node.id)) errors.push(`Duplicate node ID: ${node.id}`)
      nodeIds.add(node.id)
      for (const caseId of node.caseIds ?? []) {
        if (caseId.trim().length === 0) errors.push(`Node ${node.id} contains an empty case ID`)
      }
    }
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