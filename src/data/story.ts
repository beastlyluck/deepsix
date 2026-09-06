import type { CharacterKey } from './openDataSources';

export interface StoryBeat {
  id: string;
  kind: 'narration' | 'speech' | 'sfx' | 'splash';
  speaker?: string;
  text: string;
  sfx?: string;
}

export interface ChapterStory {
  key: CharacterKey;
  volume: string;
  pageStart: number;
  hook: string;
  premise: string;
  beats: StoryBeat[];
  climax: string;
  next: { path: string; label: string };
  prev: { path: string; label: string };
  art: string;
}

export const manuscriptPrologue = {
  volumeTitle: 'DEEPSIX',
  volumeNumber: 'VOL. 01',
  tagline: 'Six chapters. One manuscript. Analytics you can walk through.',
  opening: `Melbourne. A desk lamp. A blank page.

Atharva does not write a résumé. He writes a volume: six chapters, each a way of seeing a system until it becomes a twin you can question.

The first page is an illusion that must stay honest.
The last page is a web that must not snap.

If you are hiring, you are not flipping fan art.
You are reading how he thinks.`,
};

export const chapterStories: Record<CharacterKey, ChapterStory> = {
  itachi: {
    key: 'itachi',
    volume: 'CH. 01',
    pageStart: 7,
    hook: 'If the data is incomplete, the twin must say so — or it is only a pretty lie.',
    premise:
      'This chapter is about generative analytics: synthetic cohorts, counterfactual cities, and document intelligence. The Illusionist does not hide missingness. He draws the gap, then fills it under a constraint.',
    beats: [
      { id: 'i1', kind: 'narration', text: 'Panel one is red and quiet. A hospital corridor with half the cameras dark. The twin still has to answer: how many beds at 2am?' },
      { id: 'i2', kind: 'speech', speaker: 'The Illusionist', text: 'Do not invent a patient. Invent the distribution, then let the real ward correct you.' },
      { id: 'i3', kind: 'narration', text: 'Atharva’s first rule: a synthetic row is allowed only if an auditor can replay why it exists.' },
      { id: 'i4', kind: 'speech', speaker: 'Narrator', text: 'The sharingan, in this volume, is a residual plot. When the twin drifts, the eye opens.' },
      { id: 'i5', kind: 'sfx', text: 'WHOOSH', sfx: 'WHOOSH' },
    ],
    climax: 'The city blinks. The dashboard does not look away.',
    next: { path: '/goku', label: 'Turn to Chapter 02' },
    prev: { path: '/', label: 'Back to cover' },
    art: '/manga/chapter-illusionist.png',
  },
  goku: {
    key: 'goku',
    volume: 'CH. 02',
    pageStart: 21,
    hook: 'Forecasting is not power. Power is knowing when the forecast is about to fail.',
    premise:
      'This chapter is demand, hierarchy, and monitoring. The Singularity trains models that scale — then watches them like a sparring partner that can injure the business.',
    beats: [
      { id: 'g1', kind: 'narration', text: 'Gold gutters. A campus load curve climbs with the heat. The model that won last winter is already lying.' },
      { id: 'g2', kind: 'speech', speaker: 'The Singularity', text: 'I do not need a larger model. I need a smaller one that still tells me when the weather changes the story.' },
      { id: 'g3', kind: 'narration', text: 'SKU hierarchies, reconciliation, MAPE that operations will actually read. Myth is the aura. The work is the table.' },
      { id: 'g4', kind: 'sfx', text: 'KACHOW', sfx: 'KACHOW' },
    ],
    climax: 'The alert fires before the outage. The aura was just instrumentation.',
    next: { path: '/vegeta', label: 'Turn to Chapter 03' },
    prev: { path: '/itachi', label: 'Previous chapter' },
    art: '/manga/chapter-singularity.png',
  },
  vegeta: {
    key: 'vegeta',
    volume: 'CH. 03',
    pageStart: 35,
    hook: 'Pride is a prior. Experiments exist so the prior can lose.',
    premise:
      'Causal inference, uplift, and simulation. The Prince refuses to ship a campaign, a policy, or a reorder rule that has not been humiliated in a twin.',
    beats: [
      { id: 'v1', kind: 'narration', text: 'Blue panels, heavy ink. Two cities look alike until you subtract the one that never ran the trial.' },
      { id: 'v2', kind: 'speech', speaker: 'The Prince', text: 'Correlation is a spectator. I want the treatment effect, or I want silence.' },
      { id: 'v3', kind: 'narration', text: 'Synthetic control for a fare change. Uplift for a retention offer. A digital warehouse that breaks before the real one does.' },
      { id: 'v4', kind: 'sfx', text: 'BOOM', sfx: 'BOOM' },
    ],
    climax: 'The uplift model says: do not message these customers. Pride accepts the smaller win.',
    next: { path: '/zoro', label: 'Turn to Chapter 04' },
    prev: { path: '/goku', label: 'Previous chapter' },
    art: '/manga/chapter-pride.png',
  },
  zoro: {
    key: 'zoro',
    volume: 'CH. 04',
    pageStart: 49,
    hook: 'Three views. One number. If they disagree, you do not average — you stop.',
    premise:
      'Geospatial analytics, inspection KPIs, and robustness audits. The Swordsman treats every metric as a blade: dull ones are more dangerous than missing ones.',
    beats: [
      { id: 'z1', kind: 'narration', text: 'Green slashes divide the splash. Satellite, line-scan, and a human label. The twin is the agreement.' },
      { id: 'z2', kind: 'speech', speaker: 'The Swordsman', text: 'A dashboard that hides disagreement is a dull sword. I would rather see the cut.' },
      { id: 'z3', kind: 'narration', text: 'Land-use change. Defect rates with confidence. A vision model that must fail loud in fog.' },
      { id: 'z4', kind: 'sfx', text: 'SLASH', sfx: 'SLASH' },
    ],
    climax: 'The three blades lock. The map is finally a place you can point at.',
    next: { path: '/optimus', label: 'Turn to Chapter 05' },
    prev: { path: '/vegeta', label: 'Previous chapter' },
    art: '/manga/chapter-blades.png',
  },
  optimus: {
    key: 'optimus',
    volume: 'CH. 05',
    pageStart: 63,
    hook: 'A beautiful model that cannot refresh overnight is a statue in the lobby.',
    premise:
      'Analytics engineering: warehouses, tests, lineage, and executive KPIs. The Prime transforms a notebook into a service the business can wake up to.',
    beats: [
      { id: 'o1', kind: 'narration', text: 'Red and cobalt panels. The truck is the pipeline. The knight is the API. Same cargo.' },
      { id: 'o2', kind: 'speech', speaker: 'The Prime', text: 'Freedom is rollback. Leadership is a green nightly run that nobody has to hero.' },
      { id: 'o3', kind: 'narration', text: 'dbt-style models, contracts, and a score that product can call. The manuscript reprints itself at 2:13am.' },
      { id: 'o4', kind: 'sfx', text: 'TRANSFORM', sfx: 'TRANSFORM' },
    ],
    climax: 'The canary holds. The board sees yesterday, not last quarter.',
    next: { path: '/spiderman', label: 'Turn to Chapter 06' },
    prev: { path: '/zoro', label: 'Previous chapter' },
    art: '/manga/chapter-transform.png',
  },
  spiderman: {
    key: 'spiderman',
    volume: 'CH. 06',
    pageStart: 77,
    hook: 'The outage is never in the node you are staring at. It is three hops left.',
    premise:
      'Graph analytics for suppliers, scholars, and fraud. The Weaver’s job is to feel the tug before the strand snaps — and to explain the path.',
    beats: [
      { id: 's1', kind: 'narration', text: 'Orange filaments. A delayed container in one port. A hospital short of gloves two cities later.' },
      { id: 's2', kind: 'speech', speaker: 'The Weaver', text: 'Great power is not more nodes. It is the one edge you would cut last.' },
      { id: 's3', kind: 'narration', text: 'Betweenness for risk. Communities for collusion. A map a non-engineer can argue with.' },
      { id: 's4', kind: 'sfx', text: 'THWIP', sfx: 'THWIP' },
    ],
    climax: 'The web sings. Procurement changes the order before the news does.',
    next: { path: '/thor', label: 'Travel to Volume Two' },
    prev: { path: '/optimus', label: 'Previous chapter' },
    art: '/manga/chapter-web.png',
  },
};
