import { describe, expect, it } from 'vitest'
import { case001, case002, case003, case004, case005, nodes, relationships } from './data/evidence'
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
    expect(graph.getNode(case003.primaryNodeId)).toBeDefined()
    expect(case003.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case003.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case004.primaryNodeId)).toBeDefined()
    expect(case004.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case004.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case005.primaryNodeId)).toBeDefined()
    expect(case005.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case005.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
  })

  it('tracks case membership and finds cosmic traversals', () => {
    expect(graph.getNodesByCase('case-002').map((node) => node.id)).toEqual(expect.arrayContaining(['fantastic-four', 'reed-richards', 'sue-storm', 'ben-grimm', 'baxter-building', 'future-foundation', 'doctor-doom']))
    expect(graph.getNodesByCase('case-003').map((node) => node.id)).toEqual(expect.arrayContaining(['galactus', 'silver-surfer', 'uatu', 'alicia-masters', 'ultimate-nullifier', 'ff-48', 'ff-49', 'ff-50']))
    expect(graph.getNode('johnny-storm')?.caseIds).toEqual(expect.arrayContaining(['case-001', 'case-002', 'case-003']))
    expect(graph.getNeighborNodes('peter-parker').map((node) => node.id)).toEqual(expect.arrayContaining(['johnny-storm', 'fantastic-four']))
    const peterToGalactus = graph.findShortestPath('peter-parker', 'galactus')
    expect(peterToGalactus).not.toBeNull()
    expect(peterToGalactus).toEqual(expect.arrayContaining(['peter-parker', 'johnny-storm', 'galactus']))
    const peterToSilver = graph.findShortestPath('peter-parker', 'silver-surfer')
    expect(peterToSilver).not.toBeNull()
    expect(peterToSilver).toEqual(expect.arrayContaining(['peter-parker', 'silver-surfer']))
    const aliciaToGalactus = graph.findShortestPath('alicia-masters', 'galactus')
    expect(aliciaToGalactus).not.toBeNull()
    expect(aliciaToGalactus).toEqual(expect.arrayContaining(['alicia-masters', 'silver-surfer', 'galactus']))
    const uatuToNullifier = graph.findShortestPath('uatu', 'ultimate-nullifier')
    expect(uatuToNullifier).not.toBeNull()
    expect(uatuToNullifier).toEqual(expect.arrayContaining(['uatu', 'ultimate-nullifier']))
  })

  it('detects duplicate and dangling graph references', () => {
    const invalid = new InvestigationGraph([...nodes, nodes[0]], [...relationships, { ...relationships[0], id: 'bad', targetNodeId: 'missing', evidenceNodeIds: ['also-missing'] }])
    expect(invalid.validate().errors).toEqual(expect.arrayContaining(['Duplicate node ID: peter-parker', 'Relationship bad references missing target: missing', 'Relationship bad references missing evidence: also-missing']))
  })

  it('reuses Uatu and maps the Watcher doctrine without turning inference into canon', () => {
    expect(graph.getNode('uatu')?.caseIds).toEqual(expect.arrayContaining(['case-003', 'case-004']))
    expect(graph.getNode('watchers')?.continuity).toBe('EARTH-616')
    expect(graph.getNode('pros-ilicus')?.caseIds).toContain('case-004')
    expect(graph.getNode('non-interference')?.type).toBe('concept')
    expect(graph.getNode('fantastic-four-13')?.type).toBe('comic_issue')
    expect(graph.getNode('captain-marvel-39')?.type).toBe('comic_issue')
    expect(graph.getRelationship('responsibility-non-interference')).toMatchObject({ type: 'hypothesis', visualType: 'hypothesis' })
    expect(graph.getRelationship('uatu-watchers')?.type).toBe('member')
  })

  it('connects the investigation across the Watcher region', () => {
    expect(graph.findShortestPath('peter-parker', 'uatu')).not.toBeNull()
    expect(graph.findShortestPath('peter-parker', 'watchers')).not.toBeNull()
    expect(graph.findShortestPath('galactus', 'pros-ilicus')).not.toBeNull()
    expect(graph.findShortestPath('responsibility', 'non-interference')).toEqual(['responsibility', 'non-interference'])
    expect(graph.findShortestPath('fantastic-four', 'watchers')).not.toBeNull()
  })

  it('tracks Avengers formation evidence and cautious future bridges', () => {
    expect(graph.getNodesByCase('case-005').map((node) => node.id)).toEqual(expect.arrayContaining(['avengers', 'iron-man', 'thor', 'hulk', 'hank-pym', 'janet-van-dyne', 'loki', 'captain-america', 'avengers-1', 'avengers-4']))
    expect(graph.getNodesByContinuity('EARTH-616').map((node) => node.id)).toContain('avengers')
    expect(graph.getRelationship('avengers-1-formation')?.type).toBe('formation_evidence')
    expect(graph.getRelationship('captain-avengers-membership')?.type).toBe('membership')
    expect(graph.getRelationship('peter-avengers-lead')?.visualType).toBe('hypothesis')
    expect(graph.getRelationship('avengers-fantastic-four-network')?.visualType).toBe('hypothesis')
  })

  it('connects the Earth team investigation without inventing Spider-Man membership', () => {
    expect(graph.findShortestPath('peter-parker', 'avengers')).not.toBeNull()
    expect(graph.findShortestPath('avengers', 'fantastic-four')).not.toBeNull()
    expect(graph.findShortestPath('avengers', 'galactus')).not.toBeNull()
    expect(graph.getRelationship('peter-avengers-lead')?.type).toBe('unresolved_lead')
    expect(graph.getRelationship('peter-avengers-lead')?.visualType).toBe('hypothesis')
  })
})