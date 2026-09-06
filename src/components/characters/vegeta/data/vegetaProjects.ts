import { Project } from '../../../../data/openDataSources';

export const vegetaProjects: Project[] = [
  {
    id: 'retention-uplift',
    title: 'Retention Uplift, not spray',
    domain: 'Causal Marketing Analytics',
    description:
      'Who should receive a win-back offer? An uplift model that saves budget by refusing customers who would have stayed anyway.',
    longDescription: `Two-model and class-transformation uplift on a telecom-style churn table. The featured chart is the Qini curve: the first 20% of scored customers capture most of the incremental saves.

The Prince’s line in the manuscript: messaging everyone is pride without a control group.`,
    dataset: 'IBM Telco churn (public) + simulated offer assignment',
    datasetUrl: 'https://www.kaggle.com/datasets/blastchar/telco-customer-churn',
    metrics: { 'Qini (20%)': 0.19, 'Budget save': '34%', AUUC: 0.11, N: 7043 },
    architecture: 'T-learner + class transformation + Qini / AUUC report',
    techStack: ['Python', 'scikit-learn', 'causalml', 'Plotly'],
    visualizations: ['interactive-chart', 'architecture-diagram', 'training-curve'],
    github: 'https://github.com/beastlyluck/retention-uplift',
    tags: ['Uplift', 'Churn', 'Experimentation'],
    difficulty: 'advanced',
    character: 'vegeta',
    panelIndex: 1,
  },
  {
    id: 'fare-synthetic-control',
    title: 'Fare Change Synthetic Control',
    domain: 'Policy Analytics',
    description:
      'Did a fare reform move ridership, or was it the weather and a long weekend? A synthetic control with a placebo city.',
    longDescription: `Public transit boardings around a known fare event, donor pool of comparable routes, and a placebo test that would embarrass a lazy before/after slide.

Feature this as a one-slide story: the black line is the city that changed the fare; the dashed line is the city that did not exist — until the weights said it did.`,
    dataset: 'Open mobility counts (route-day) + BOM weather',
    datasetUrl: 'https://www.ptv.vic.gov.au/',
    metrics: { 'ATT (boardings)': '−6.4%', 'Placebo p': 0.08, Donors: 18, 'Pre-fit': 'RMSPE 0.041' },
    architecture: 'Synthetic control (Abadie) + placebo in-space + weather covariates',
    techStack: ['R', 'Synth', 'ggplot2', 'sf'],
    visualizations: ['interactive-chart', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/fare-synthetic-control',
    tags: ['Synthetic Control', 'Transport', 'Causal'],
    difficulty: 'advanced',
    character: 'vegeta',
    panelIndex: 2,
  },
  {
    id: 'warehouse-twin-sim',
    title: 'Warehouse Twin (discrete event)',
    domain: 'Operations Analytics',
    description:
      'A SimPy twin of a pick-face. Stress it with a 2× promo week before you hire another picker.',
    longDescription: `Not a MuJoCo fantasy — a discrete-event twin: arrivals, pick times, pack stations, and a KPI strip (wait, utilization, late orders). The experiment is a factorial on “extra packer vs longer shift.”

The featured result: one extra packer beat two hours of overtime on late-order rate. Pride, here, is running the night in silicon first.`,
    dataset: 'Synthetic pick logs calibrated to public warehouse time-and-motion ranges',
    datasetUrl: 'https://simpy.readthedocs.io/',
    metrics: { 'Late orders −': '22%', Scenarios: 48, 'Util. pack': '81%', Runtime: '9s' },
    architecture: 'SimPy DES + factorial design + Plotly scenario board',
    techStack: ['Python', 'SimPy', 'NumPy', 'Plotly'],
    visualizations: ['interactive-chart', 'architecture-diagram', 'particle-field'],
    github: 'https://github.com/beastlyluck/warehouse-twin-sim',
    tags: ['Simulation', 'Operations', 'Digital Twin'],
    difficulty: 'intermediate',
    character: 'vegeta',
    panelIndex: 3,
  },
];
