import { describe, expect, it } from 'vitest'
import { case001, case002, case003, case004, case005, case006, case007, case008, case009, case010, case011, case012, case013, cases, nodes, relationships } from './data/evidence'
import { InvestigationGraph, graph } from './graph'
import type { Continuity, InvestigationNode, NodeType, RelationshipVisualType, VisualVariant } from './types'

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
    expect(graph.getNode(case006.primaryNodeId)).toBeDefined()
    expect(case006.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case006.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case007.primaryNodeId)).toBeDefined()
    expect(case007.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case007.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case008.primaryNodeId)).toBeDefined()
    expect(case008.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case008.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case009.primaryNodeId)).toBeDefined()
    expect(case009.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case009.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case010.primaryNodeId)).toBeDefined()
    expect(case010.relatedNodeIds.every((id) => graph.getNode(id))).toBe(true)
    expect(case010.keyRelationshipIds.every((id) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case011.primaryNodeId)).toBeDefined()
    expect(case011.relatedNodeIds.every((id: string) => graph.getNode(id))).toBe(true)
    expect(case011.keyRelationshipIds.every((id: string) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case012.primaryNodeId)).toBeDefined()
    expect(case012.relatedNodeIds.every((id: string) => graph.getNode(id))).toBe(true)
    expect(case012.keyRelationshipIds.every((id: string) => graph.getRelationship(id))).toBe(true)
    expect(graph.getNode(case013.primaryNodeId)).toBeDefined()
    expect(case013.relatedNodeIds.every((id: string) => graph.getNode(id))).toBe(true)
    expect(case013.keyRelationshipIds.every((id: string) => graph.getRelationship(id))).toBe(true)
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

  it('tracks mutantkind evidence and keeps comparisons investigative', () => {
    expect(graph.getNodesByCase('case-006').map((node) => node.id)).toEqual(expect.arrayContaining(['x-men', 'professor-x', 'magneto', 'xaviers-school', 'mutant', 'x-gene', 'x-men-1', 'giant-size-x-men-1', 'wolverine', 'storm', 'nightcrawler', 'colossus']))
    expect(graph.getNode('x-men-1')?.continuity).toBe('EARTH-616')
    expect(graph.getRelationship('mutant-xgene')).toMatchObject({ type: 'mutant_biology', visualType: 'hypothesis' })
    expect(graph.getRelationship('mutant-external-comparison')).toMatchObject({ type: 'comparison', visualType: 'hypothesis' })
    expect(graph.getRelationship('magneto-xmen-conflict')?.type).toBe('ideological_conflict')
  })

  it('connects mutantkind to existing regions without overstating canon', () => {
    expect(graph.findShortestPath('peter-parker', 'x-men')).not.toBeNull()
    expect(graph.findShortestPath('x-men', 'avengers')).not.toBeNull()
    expect(graph.findShortestPath('magneto', 'fantastic-four')).not.toBeNull()
    expect(graph.getRelationship('spider-xmen-bridge')?.visualType).toBe('hypothesis')
  })

  it('tracks the magic region and keeps its external routes unresolved', () => {
    expect(graph.getNodesByCase('case-007').map((node) => node.id)).toEqual(expect.arrayContaining(['doctor-strange', 'ancient-one', 'wong', 'baron-mordo', 'dormammu', 'sanctum-sanctorum', 'dark-dimension', 'magic', 'strange-tales-early']))
    expect(graph.getNode('doctor-strange')?.continuity).toBe('EARTH-616')
    expect(graph.getNode('strange-tales-early')?.type).toBe('comic_issue')
    expect(graph.getRelationship('ancient-one-strange-training')?.type).toBe('mystical_training')
    expect(graph.getRelationship('dormammu-dark-dimension')?.type).toBe('ruler')
    expect(graph.getRelationship('doom-magic-bridge')?.visualType).toBe('hypothesis')
    expect(graph.getRelationship('spider-strange-magic')?.visualType).toBe('hypothesis')
  })

  it('connects magic through multiple existing Marvel regions', () => {
    expect(graph.findShortestPath('avengers', 'doctor-strange')).not.toBeNull()
    expect(graph.findShortestPath('fantastic-four', 'doctor-strange')).not.toBeNull()
    expect(graph.findShortestPath('peter-parker', 'doctor-strange')).not.toBeNull()
    expect(graph.findShortestPath('doctor-strange', 'dark-dimension')).not.toBeNull()
  })

  it('reuses Thor and Loki and maps the Asgard investigation', () => {
    expect(graph.getNode('thor')?.caseIds).toEqual(expect.arrayContaining(['case-005', 'case-008']))
    expect(graph.getNode('loki')?.caseIds).toEqual(expect.arrayContaining(['case-005', 'case-007', 'case-008']))
    expect(graph.getNodesByCase('case-008').map((node) => node.id)).toEqual(expect.arrayContaining(['thor', 'loki', 'asgard', 'odin', 'mjolnir', 'donald-blake', 'journey-mystery-83']))
    expect(graph.getNode('journey-mystery-83')?.continuity).toBe('EARTH-616')
    expect(graph.getRelationship('thor-asgard-home')?.type).toBe('origin_home')
    expect(graph.getRelationship('thor-galactus-godhood')?.visualType).toBe('hypothesis')
    expect(graph.getRelationship('asgard-magic-boundary')?.visualType).toBe('hypothesis')
  })

  it('connects Avengers, Loki, Asgard, and the magic region', () => {
    expect(graph.findShortestPath('avengers', 'asgard')).not.toBeNull()
    expect(graph.findShortestPath('loki', 'asgard')).not.toBeNull()
    expect(graph.findShortestPath('asgard', 'magic')).not.toBeNull()
    expect(graph.findShortestPath('avengers', 'asgard')).toEqual(expect.arrayContaining(['avengers', 'loki', 'asgard']))
  })

  it('tracks the street investigation through verified Spider-Man bridges', () => {
    expect(graph.getNodesByCase('case-009').map((node) => node.id)).toEqual(expect.arrayContaining(['daredevil', 'kingpin', 'punisher', 'luke-cage', 'hells-kitchen', 'street-level', 'daredevil-1', 'asm-50', 'asm-129']))
    expect(graph.getNode('daredevil-1')?.continuity).toBe('EARTH-616')
    expect(graph.getRelationship('peter-kingpin-origin')?.type).toBe('crime_origin')
    expect(graph.getRelationship('peter-punisher-origin')?.type).toBe('crime_origin')
    expect(graph.getRelationship('punisher-street-level')?.visualType).toBe('hypothesis')
  })

  it('connects Peter, Kingpin, Daredevil, and Punisher without a fake friendship claim', () => {
    expect(graph.findShortestPath('peter-parker', 'kingpin')).not.toBeNull()
    expect(graph.findShortestPath('kingpin', 'daredevil')).not.toBeNull()
    expect(graph.findShortestPath('peter-parker', 'punisher')).not.toBeNull()
    expect(graph.getRelationship('kingpin-daredevil')?.type).toBe('adversary')
    expect(graph.getRelationship('peter-kingpin-origin')?.visualType).toBe('major')
  })

  it('tracks Wakanda through the reused Black Panther and Namor leads', () => {
    expect(graph.getNode('black-panther')?.caseIds).toEqual(expect.arrayContaining(['case-002', 'case-010']))
    expect(graph.getNode('namor')?.caseIds).toEqual(expect.arrayContaining(['case-002', 'case-010']))
    expect(graph.getNodesByCase('case-010').map((node) => node.id)).toEqual(expect.arrayContaining(['black-panther', 'wakanda', 'vibranium', 'wakandan-technology', 'klaw', 'fantastic-four-52']))
    expect(graph.getNode('fantastic-four-52')?.continuity).toBe('EARTH-616')
    expect(graph.getRelationship('ff52-wakanda')?.type).toBe('origin_evidence')
    expect(graph.getRelationship('black-panther-avengers-later')?.visualType).toBe('hypothesis')
  })

  it('connects Fantastic Four and Avengers to Wakanda without overstating later history', () => {
    expect(graph.findShortestPath('fantastic-four', 'wakanda')).not.toBeNull()
    expect(graph.findShortestPath('avengers', 'wakanda')).not.toBeNull()
    expect(graph.findShortestPath('wakanda', 'namor')).not.toBeNull()
    expect(graph.findShortestPath('wakanda', 'doctor-doom')).not.toBeNull()
  })

  it('tracks CASE 011 integrity and reuses Namor/Sue', () => {
    expect(graph.getNode('namor')?.caseIds).toEqual(expect.arrayContaining(['case-002', 'case-010', 'case-011']))
    expect(graph.getNodesByCase('case-011').map(n => n.id)).toEqual(expect.arrayContaining(['atlantis', 'namor', 'surface-world', 'fantastic-four-4']))
    expect(graph.getNode('fantastic-four-4')?.continuity).toBe('EARTH-616')
    expect(graph.getRelationship('namor-atlantis')?.type).toBe('sovereignty')
    expect(graph.getRelationship('sue-namor')?.visualType).toBe('hypothesis')
  })

  it('connects Atlantis through Namor to Wakanda and Fantastic Four', () => {
    expect(graph.findShortestPath('fantastic-four', 'namor')).not.toBeNull()
    expect(graph.findShortestPath('namor', 'atlantis')).not.toBeNull()
    expect(graph.findShortestPath('atlantis', 'wakanda')).not.toBeNull()
    expect(graph.findShortestPath('peter-parker', 'atlantis')).not.toBeNull()
  })

  it('tracks CASE 012 integrity and reuses Hank Pym/Avengers', () => {
    expect(graph.getNode('hank-pym')?.caseIds).toEqual(expect.arrayContaining(['case-005', 'case-012']))
    expect(graph.getNode('ultron')?.type).toBe('character')
    expect(graph.getNodesByCase('case-012').map(n => n.id)).toEqual(expect.arrayContaining(['ultron', 'hank-pym', 'vision', 'avengers-54', 'creator-guilt']))
    expect(graph.getRelationship('pym-ultron')?.type).toBe('creation')
    expect(graph.getRelationship('ultron-avengers')?.visualType).toBe('major')
  })

  it('connects Ultron to Avengers network without drifting into empty space', () => {
    expect(graph.findShortestPath('hank-pym', 'ultron')).not.toBeNull()
    expect(graph.findShortestPath('ultron', 'avengers')).not.toBeNull()
    expect(graph.findShortestPath('ultron', 'vision')).not.toBeNull()
    expect(graph.findShortestPath('vision', 'avengers')).not.toBeNull()
  })

  it('tracks CASE 013 integrity and reuses Jean Grey, Cyclops, and Galactus without duplicates', () => {
    expect(graph.getNode('jean-grey')?.caseIds).toEqual(expect.arrayContaining(['case-006', 'case-013']))
    expect(graph.getNode('cyclops')?.caseIds).toEqual(expect.arrayContaining(['case-006', 'case-013']))
    expect(graph.getNode('galactus')?.caseIds).toEqual(expect.arrayContaining(['case-003', 'case-013']))
    expect(graph.getNode('phoenix-force')?.type).toBe('concept')
    expect(graph.getNode('phoenix-lead')).toBeUndefined()
    expect(nodes.filter(n => n.id === 'jean-grey').length).toBe(1)
    expect(nodes.filter(n => n.id.includes('phoenix-lead')).length).toBe(0)
    expect(graph.getNodesByCase('case-013').map(n => n.id)).toEqual(
      expect.arrayContaining([
        'jean-grey', 'phoenix-force', 'dark-phoenix', 'cyclops',
        'uncanny-x-men-101', 'uncanny-x-men-135', 'uncanny-x-men-137',
        'fantastic-four-286', 'phoenix-retcon-note', 'cosmic-force-comparison'
      ])
    )
  })

  it('models the retcon distinction between original publication and later continuity', () => {
    const retconNote = graph.getNode('phoenix-retcon-note')
    expect(retconNote).toBeDefined()
    expect(retconNote?.continuity).toBe('META')
    expect(retconNote?.visualVariant).toBe('note')

    const originalTransformation = graph.getRelationship('jean-phoenix')
    expect(originalTransformation?.type).toBe('transformation')
    expect(originalTransformation?.visualType).toBe('major')
    expect(originalTransformation?.evidenceNodeIds).toContain('uncanny-x-men-101')

    const retconEvidence = graph.getRelationship('ff286-jean')
    expect(retconEvidence?.type).toBe('retcon_evidence')
    expect(retconEvidence?.visualType).toBe('major')

    const retconReframing = graph.getRelationship('ff286-phoenix')
    expect(retconReframing?.type).toBe('retcon_reframing')
    expect(retconReframing?.visualType).toBe('major')

    const noteToFF = graph.getRelationship('retcon-note-ff286')
    expect(noteToFF?.visualType).toBe('evidentiary')
  })

  it('folds Mutantkind and Cosmic Marvel towards each other through Phoenix and investigator comparison', () => {
    expect(graph.findShortestPath('x-men', 'jean-grey')).not.toBeNull()
    expect(graph.findShortestPath('jean-grey', 'phoenix-force')).not.toBeNull()
    expect(graph.findShortestPath('phoenix-force', 'dark-phoenix')).not.toBeNull()
    expect(graph.findShortestPath('phoenix-force', 'cosmic-force-comparison')).not.toBeNull()
    expect(graph.findShortestPath('galactus', 'cosmic-force-comparison')).not.toBeNull()
    expect(graph.findShortestPath('x-men', 'galactus')).not.toBeNull()

    const compRelPhoenix = graph.getRelationship('phoenix-cosmic-compare')
    expect(compRelPhoenix?.visualType).toBe('hypothesis')
    const compRelGalactus = graph.getRelationship('galactus-cosmic-compare')
    expect(compRelGalactus?.visualType).toBe('hypothesis')
  })
})

describe('Frontend Rendering and Evidence Wall Regressions', () => {
  const BOARD_WIDTH = 19500
  const BOARD_HEIGHT = 4300
  const CASES_BY_ID = new Map(cases.map((c) => [c.id, c]))

  it('verifies that all 200 nodes have unique IDs and finite coordinates within board bounds', () => {
    expect(nodes.length).toBe(200)
    const uniqueIds = new Set(nodes.map((n) => n.id))
    expect(uniqueIds.size).toBe(200)

    for (const node of nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true)
      expect(Number.isFinite(node.position.y)).toBe(true)
      expect(Number.isFinite(node.position.width)).toBe(true)
      expect(Number.isFinite(node.position.height)).toBe(true)
      expect(Number.isFinite(node.position.rotation)).toBe(true)

      // Node bounding box must lie entirely within the physical board
      expect(node.position.x).toBeGreaterThanOrEqual(0)
      expect(node.position.y).toBeGreaterThanOrEqual(0)
      expect(node.position.x + node.position.width).toBeLessThanOrEqual(BOARD_WIDTH)
      expect(node.position.y + node.position.height).toBeLessThanOrEqual(BOARD_HEIGHT)
    }
  })

  it('verifies that all nodes use supported visual variants and types', () => {
    const validVariants: VisualVariant[] = ['dossier', 'issue', 'concept', 'question', 'note']
    const validTypes: NodeType[] = ['character', 'comic_issue', 'event', 'concept', 'question', 'note', 'organization', 'location', 'object']
    const validContinuities: Continuity[] = ['EARTH-616', 'MCU', 'EARTH-96283', 'EARTH-120703', 'MULTIVERSAL', 'META']

    for (const node of nodes) {
      expect(validVariants).toContain(node.visualVariant)
      expect(validTypes).toContain(node.type)
      if (node.continuity) {
        expect(validContinuities).toContain(node.continuity)
      }
    }
  })

  it('verifies that all relationships have valid endpoints and supported visual types', () => {
    expect(relationships.length).toBe(265)
    const validVisualTypes: RelationshipVisualType[] = ['major', 'contextual', 'evidentiary', 'hypothesis']

    for (const rel of relationships) {
      expect(validVisualTypes).toContain(rel.visualType)
      const source = graph.getNode(rel.sourceNodeId)
      const target = graph.getNode(rel.targetNodeId)
      expect(source, `Relationship ${rel.id} missing source node ${rel.sourceNodeId}`).toBeDefined()
      expect(target, `Relationship ${rel.id} missing target node ${rel.targetNodeId}`).toBeDefined()

      if (rel.evidenceNodeIds) {
        for (const evId of rel.evidenceNodeIds) {
          expect(graph.getNode(evId), `Relationship ${rel.id} references missing evidence ${evId}`).toBeDefined()
        }
      }

      // Verify connection anchor points are finite
      if (source && target) {
        const sourceAnchorX = source.position.x + source.position.width / 2
        const sourceAnchorY = source.position.y + source.position.height / 2
        const targetAnchorX = target.position.x + target.position.width / 2
        const targetAnchorY = target.position.y + target.position.height / 2
        expect(Number.isFinite(sourceAnchorX)).toBe(true)
        expect(Number.isFinite(sourceAnchorY)).toBe(true)
        expect(Number.isFinite(targetAnchorX)).toBe(true)
        expect(Number.isFinite(targetAnchorY)).toBe(true)
      }
    }
  })

  it('verifies that all 13 cases have calibrated initial cameras that frame their primary nodes', () => {
    expect(cases.length).toBe(13)

    for (const c of cases) {
      expect(c.initialCamera).toBeDefined()
      expect(c.initialCamera.scale).toBeGreaterThan(0)
      expect(Number.isFinite(c.initialCamera.x)).toBe(true)
      expect(Number.isFinite(c.initialCamera.y)).toBe(true)

      // Board coordinates targeted at center of standard 1920x1080 screen:
      // screenCenterX = 1920/2 = 960 => boardCenterX = (960 - camera.x) / camera.scale
      // screenCenterY = 1080/2 = 540 => boardCenterY = (540 - camera.y) / camera.scale
      const boardCenterX = (1920 / 2 - c.initialCamera.x) / c.initialCamera.scale
      const boardCenterY = (1080 / 2 - c.initialCamera.y) / c.initialCamera.scale

      // Must point strictly onto the board
      expect(boardCenterX).toBeGreaterThanOrEqual(0)
      expect(boardCenterX).toBeLessThanOrEqual(BOARD_WIDTH)
      expect(boardCenterY).toBeGreaterThanOrEqual(0)
      expect(boardCenterY).toBeLessThanOrEqual(BOARD_HEIGHT)

      // Camera must frame the case's focal evidence cluster on the board (< 1500px from at least one related node)
      const caseNodes = c.relatedNodeIds.map((id) => graph.getNode(id)).filter((n): n is InvestigationNode => n !== undefined)
      expect(caseNodes.length).toBeGreaterThan(0)
      const minDistanceToCluster = Math.min(
        ...caseNodes.map((node) => {
          const nodeCenterX = node.position.x + node.position.width / 2
          const nodeCenterY = node.position.y + node.position.height / 2
          return Math.hypot(boardCenterX - nodeCenterX, boardCenterY - nodeCenterY)
        })
      )
      expect(minDistanceToCluster, `Case ${c.id} camera is too far from its evidence cluster: ${minDistanceToCluster}`).toBeLessThan(1500)
    }
  })

  it('verifies deep-link hash state resolution behavior for valid and invalid inputs', () => {
    function resolveHash(hash: string) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const evidenceId = params.get('evidence')
      const caseId = params.get('case')
      const node = evidenceId && graph.getNode(evidenceId) ? graph.getNode(evidenceId) : null
      return {
        caseId: caseId && CASES_BY_ID.has(caseId) ? caseId : node?.caseIds?.find((value) => CASES_BY_ID.has(value)) ?? case001.id,
        evidenceId: node ? node.id : null,
      }
    }

    // Default/empty
    expect(resolveHash('')).toEqual({ caseId: 'case-001', evidenceId: null })

    // Valid case
    expect(resolveHash('#case=case-013')).toEqual({ caseId: 'case-013', evidenceId: null })

    // Valid case and evidence
    expect(resolveHash('#case=case-013&evidence=phoenix-force')).toEqual({
      caseId: 'case-013',
      evidenceId: 'phoenix-force',
    })

    // Unknown case falls back to default case-001
    expect(resolveHash('#case=case-999')).toEqual({ caseId: 'case-001', evidenceId: null })

    // Unknown evidence returns null
    expect(resolveHash('#case=case-001&evidence=batman')).toEqual({ caseId: 'case-001', evidenceId: null })

    // Known evidence without case resolves to evidence's parent case
    expect(resolveHash('#evidence=dark-phoenix')).toEqual({ caseId: 'case-013', evidenceId: 'dark-phoenix' })

    // Known evidence with invalid case resolves to evidence's parent case
    expect(resolveHash('#case=non-existent&evidence=dark-phoenix')).toEqual({ caseId: 'case-013', evidenceId: 'dark-phoenix' })
  })

  it('verifies that all 13 cases have complete and valid graph membership', () => {
    for (const c of cases) {
      expect(c.title).toBeTruthy()
      expect(c.questions.length).toBeGreaterThan(0)
      expect(c.status).toMatch(/^(OPEN|CLOSED|ONGOING)$/)
      expect(graph.getNode(c.primaryNodeId)).toBeDefined()
      for (const relNodeId of c.relatedNodeIds) {
        expect(graph.getNode(relNodeId), `Case ${c.id} related node ${relNodeId} not in graph`).toBeDefined()
      }
      for (const keyRelId of c.keyRelationshipIds) {
        expect(graph.getRelationship(keyRelId), `Case ${c.id} relationship ${keyRelId} not in graph`).toBeDefined()
      }
    }
  })
})