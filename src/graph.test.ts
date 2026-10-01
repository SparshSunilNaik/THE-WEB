import { describe, expect, it } from 'vitest'
import { case001, case002, nodes, relationships } from './data/evidence'
import { InvestigationGraph, graph } from './graph'

describe('InvestigationGraph', () => {
  it('looks up nodes and relationships by stable ID', () => {
    expect(graph.getNode('peter-parker')?.title).toBe('PETER PARKER')
    expect(graph.getRelationship('peter-johnny')?.type).toBe('friendship')
  })

  it('traverses neighbors and directly connected evidence', () => {
    expect(graph.getNeighborNodes('peter-parker').map((node) => node.id)).toContain('johnny-storm')
    expect(graph.getDirectlyConnectedEvidence('gwen-stacy').map((node) => node.id)).toEqual(expect.arrayContaining(['peter-parker', 'asm-121', 'norman-osborn']))
  })

  it('filters nodes by type and continuity', () => {
    expect(graph.getNodesByType('comic_issue').map((node) => node.id)).toEqual(expect.arrayContaining(['amazing-fantasy-15', 'asm-121', 'asm-122']))
    expect(graph.getNodesByContinuity('EARTH-616').length).toBeGreaterThan(10)
  })

  it('resolves evidence attached to a relationship', () => {
    expect(graph.getEvidenceSupportingRelationship('norman-gwen').map((node) => node.id)).toEqual(['asm-121', 'asm-122'])
  })

  it('validates the production graph and case references', () => {
    expect(graph.validate()).toEqual({ valid: true, errors: [] })
    expect(graph.getNode(case001.primaryNodeId)).toBeDefined()
    expect(case001.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case001.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case002.primaryNodeId)).toBeDefined()
    expect(case002.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case002.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
  })

  it('tracks case membership and finds a traversal from Peter to the Fantastic Four region', () => {
    expect(graph.getNodesByCase('case-002').map((node) => node.id)).toEqual(expect.arrayContaining(['fantastic-four', 'reed-richards', 'sue-storm', 'ben-grimm', 'baxter-building', 'future-foundation', 'doctor-doom']))
    expect(graph.getNode('johnny-storm')?.caseIds).toEqual(expect.arrayContaining(['case-001', 'case-002']))
    expect(graph.getNeighborNodes('peter-parker').map((node) => node.id)).toEqual(expect.arrayContaining(['johnny-storm', 'fantastic-four']))
    const path = graph.findShortestPath('peter-parker', 'reed-richards')
    expect(path).not.toBeNull()
    expect(path).toEqual(expect.arrayContaining(['peter-parker', 'fantastic-four', 'reed-richards']))
  })

  it('detects duplicate and dangling graph references', () => {
    const invalid = new InvestigationGraph([...nodes, nodes[0]], [...relationships, { ...relationships[0], id: 'bad', targetNodeId: 'missing', evidenceNodeIds: ['also-missing'] }])
    expect(invalid.validate().errors).toEqual(expect.arrayContaining(['Duplicate node ID: peter-parker', 'Relationship bad references missing target: missing', 'Relationship bad references missing evidence: also-missing']))
  })
})