import { Project } from '../../../../data/openDataSources';

export const spidermanProjects: Project[] = [
  {
    id: 'supplier-risk-web',
    title: 'Supplier risk web',
    domain: 'Supply-chain Analytics',
    description:
      'A graph of vendors, ports, and SKUs. Betweenness highlights the one delayed container that starves three hospitals.',
    longDescription: `Built on a public trade / analog supplier graph. Node size is volume; color is delay risk; the featured view is “cut this edge and watch the flood.”

The Weaver’s briefing: procurement does not need 169k nodes. They need the three hops that matter this week.`,
    dataset: 'Open supply-network analog + ogbn-style citation structure for stress tests',
    datasetUrl: 'https://ogb.stanford.edu/',
    metrics: { Nodes: '4.2k', 'Critical edges': 17, 'Delay recall': 0.78, 'Brief time': '8 min' },
    architecture: 'NetworkX / PyG metrics + risk score + WebGL walkthrough',
    techStack: ['NetworkX', 'PyG', 'Kepler.gl', 'Python'],
    visualizations: ['graph-viz', 'attention-web', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/supplier-risk-web',
    tags: ['Graph', 'Supply Chain', 'Risk'],
    difficulty: 'advanced',
    character: 'spiderman',
    panelIndex: 1,
  },
  {
    id: 'collab-map',
    title: 'Faculty collaboration map',
    domain: 'Research Analytics',
    description:
      'Who actually writes with whom? A campus collaboration graph from open author lists — useful for a school that wants to see its isolated labs.',
    longDescription: `Co-authorship from a public sample, community detection, and a simple “bridge” list: people who connect otherwise separate groups.

Feature this as a polite spidey-sense for research strategy, not surveillance.`,
    dataset: 'ArXiv metadata sample (authors, categories)',
    datasetUrl: 'https://arxiv.org/',
    metrics: { Authors: '6.1k', Communities: 14, Bridges: 39, Modularity: 0.46 },
    architecture: 'Bipartite projection + Leiden + bridge ranking',
    techStack: ['Python', 'igraph', 'Plotly', 'Pandas'],
    visualizations: ['graph-viz', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/collab-map',
    tags: ['Networks', 'Higher Ed', 'Communities'],
    difficulty: 'intermediate',
    character: 'spiderman',
    panelIndex: 2,
  },
  {
    id: 'fraud-ring',
    title: 'Fraud ring, explained',
    domain: 'Fraud Analytics',
    description:
      'Shared devices, shared addresses, shared velocity. A community that looks like a family until the edges say otherwise.',
    longDescription: `A small, explainable graph model on a public fraud-adjacent table (Elliptic / PaySim analog). The featured output is a case pack: six nodes, the edges that bind them, and a sentence a reviewer can argue with.

Great power is a path, not a black-box score.`,
    dataset: 'PaySim / Elliptic-style transaction graph (public research)',
    datasetUrl: 'https://www.kaggle.com/datasets/ellipticco/elliptic-data-set',
    metrics: { 'PR-AUC': 0.64, 'Cases packed': 22, 'Review time': '−31%', 'False family': 3 },
    architecture: 'Graph features + GNN/baseline + case-pack renderer',
    techStack: ['PyG', 'scikit-learn', 'NetworkX', 'Streamlit'],
    visualizations: ['graph-viz', 'attention-web', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/fraud-ring',
    tags: ['Fraud', 'Graphs', 'Explainability'],
    difficulty: 'advanced',
    character: 'spiderman',
    panelIndex: 3,
  },
];
