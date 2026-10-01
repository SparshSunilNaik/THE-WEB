import type { Evidence, Relationship } from '../types'

export const evidence: Evidence[] = [
  { id: 'peter', kind: 'dossier', title: 'PETER PARKER', subtitle: 'SPIDER-MAN', body: 'The person beneath the mask keeps turning up at the centre of the question.', meta: ['EARTH-616', 'STATUS: ACTIVE', 'CASE SUBJECT'], x: 760, y: 390, width: 330, height: 270, rotation: -1.2, tone: 'cream', movable: true },
  { id: 'ben', kind: 'dossier', title: 'BEN PARKER', subtitle: 'UNCLE / FORMATIVE INFLUENCE', body: 'A lesson with a long shadow.', meta: ['EARTH-616', 'DECEASED'], x: 310, y: 420, width: 245, height: 190, rotation: 2.8, tone: 'paper', movable: true },
  { id: 'may', kind: 'dossier', title: 'AUNT MAY', subtitle: 'ANCHOR', body: 'The home Peter returns to, even when he cannot return as himself.', meta: ['EARTH-616', 'STATUS: ACTIVE'], x: 440, y: 790, width: 245, height: 180, rotation: -2, tone: 'paper', movable: true },
  { id: 'mj', kind: 'dossier', title: 'MARY JANE WATSON', subtitle: '"FACE IT, TIGER..."', body: 'A witness to the person, not only the performance.', meta: ['EARTH-616', 'STATUS: ACTIVE'], x: 1190, y: 250, width: 270, height: 195, rotation: 1.6, tone: 'red', movable: true },
  { id: 'gwen', kind: 'dossier', title: 'GWEN STACY', subtitle: 'THE ONE WHO KNEW', body: 'The evidence here is not clean. It is numbered.', meta: ['EARTH-616', 'DECEASED'], x: 1320, y: 640, width: 260, height: 195, rotation: -2.4, tone: 'blue', movable: true },
  { id: 'norman', kind: 'dossier', title: 'NORMAN OSBORN', subtitle: 'GREEN GOBLIN', body: 'Enemy, father, architect of a wound.', meta: ['EARTH-616', 'STATUS: ACTIVE'], x: 1660, y: 360, width: 275, height: 205, rotation: 2.2, tone: 'red', movable: true },
  { id: 'johnny', kind: 'dossier', title: 'JOHNNY STORM', subtitle: 'HUMAN TORCH', body: 'A friendship that keeps the web from being a closed system.', meta: ['FANTASTIC FOUR', 'EARTH-616'], x: 1710, y: 830, width: 265, height: 190, rotation: -1.4, tone: 'yellow', movable: true },
  { id: 'af15', kind: 'issue', title: 'AMAZING FANTASY', subtitle: '#15', body: 'An origin is also a choice made under pressure.', meta: ['AUG 1962', 'ORIGIN EVIDENCE'], x: 650, y: 80, width: 230, height: 170, rotation: -3.1, tone: 'yellow', movable: true },
  { id: 'asm121', kind: 'issue', title: 'THE AMAZING SPIDER-MAN', subtitle: '#121', body: 'Observation: the bridge is where a life changes shape.', meta: ['JUN 1973', 'EVIDENCE REF. 121'], x: 1120, y: 930, width: 250, height: 175, rotation: 1.8, tone: 'blue', movable: true },
  { id: 'asm122', kind: 'issue', title: 'THE AMAZING SPIDER-MAN', subtitle: '#122', body: 'Observation: grief does not end when the page turns.', meta: ['JUL 1973', 'EVIDENCE REF. 122'], x: 1460, y: 1060, width: 250, height: 175, rotation: -2.6, tone: 'cream', movable: true },
  { id: 'responsibility', kind: 'concept', title: 'RESPONSIBILITY', body: 'With great power comes great responsibility.', meta: ['CENTRAL PRINCIPLE'], x: 290, y: 1020, width: 265, height: 175, rotation: -1.2, tone: 'cream', movable: true },
  { id: 'power', kind: 'concept', title: 'POWER', body: 'The gift is physical. The cost keeps changing.', meta: ['CAPABILITY / BURDEN'], x: 980, y: 115, width: 230, height: 165, rotation: 2.4, tone: 'yellow', movable: true },
  { id: 'guilt', kind: 'concept', title: 'GUILT', body: 'A recurring engine, not a complete explanation.', meta: ['MOTIVATION?'], x: 1540, y: 100, width: 220, height: 165, rotation: -2.8, tone: 'red', movable: true },
  { id: 'question', kind: 'question', title: 'UNANSWERED', body: 'Does responsibility define Spider-Man more than his powers?', meta: ['INVESTIGATOR QUESTION'], x: 1840, y: 670, width: 315, height: 175, rotation: 3, tone: 'paper', movable: true },
  { id: 'note', kind: 'note', title: 'Marvel editorial cannot be trusted with Peter Parker.', meta: ['MARGIN NOTE / S.N.'], x: 520, y: 180, width: 245, height: 105, rotation: -5, tone: 'yellow', movable: true },
]

export const relationships: Relationship[] = [
  { source: 'ben', target: 'peter', type: 'major', label: 'responsibility', significance: 'formative influence' },
  { source: 'af15', target: 'ben', type: 'important', label: 'key evidence' },
  { source: 'af15', target: 'peter', type: 'major', label: 'origin' },
  { source: 'peter', target: 'responsibility', type: 'important', label: 'central principle' },
  { source: 'peter', target: 'power', type: 'contextual', label: 'ability' },
  { source: 'power', target: 'responsibility', type: 'hypothesis', label: 'thematic relationship' },
  { source: 'peter', target: 'guilt', type: 'major', label: 'recurring motivation' },
  { source: 'peter', target: 'gwen', type: 'contextual', label: 'relationship' },
  { source: 'gwen', target: 'asm121', type: 'important', label: 'key evidence' },
  { source: 'asm121', target: 'asm122', type: 'major', label: 'continuation' },
  { source: 'norman', target: 'gwen', type: 'major', label: 'cause / consequence' },
  { source: 'norman', target: 'peter', type: 'major', label: 'nemesis' },
  { source: 'peter', target: 'johnny', type: 'contextual', label: 'friendship' },
  { source: 'peter', target: 'question', type: 'hypothesis', label: 'open question' },
]