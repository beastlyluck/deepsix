import { Project } from '../../../../data/openDataSources';

export const itachiProjects: Project[] = [
  {
    id: 'ward-twin-synthetic',
    title: 'Ward Twin: Privacy-preserving hospital analytics',
    domain: 'Healthcare Analytics',
    description:
      'A synthetic patient-flow twin for a 280-bed ward. Analysts get hourly occupancy forecasts without seeing identifiable records.',
    longDescription: `Hospitals cannot share raw ADT logs. This project builds a calibrated synthetic twin: a Bayesian occupancy model on public MIMIC-style time patterns, plus a residual check against aggregated nightly census.

The featured output is a Tableau-ready table (hour × ward × predicted occupancy + 80% interval) and a drift report when the real ward’s midnight census leaves the interval two nights in a row. That is the Illusionist’s rule — generate, then let the ward correct you.`,
    dataset: 'MIMIC-IV derived hourly occupancy patterns (de-identified public research set)',
    datasetUrl: 'https://physionet.org/content/mimiciv/',
    metrics: { 'MAE (beds)': 4.2, 'Coverage 80%': '83%', 'Re-ident. risk': 'k≥10', Wards: 6 },
    architecture: 'Negative-binomial GLM + synthetic cohort sampler + census residual gate',
    techStack: ['Python', 'PyMC', 'Pandas', 'Great Expectations', 'Tableau'],
    visualizations: ['interactive-chart', 'training-curve', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/ward-twin-synthetic',
    tags: ['Healthcare', 'Synthetic Data', 'Forecasting', 'Privacy'],
    difficulty: 'advanced',
    character: 'itachi',
    panelIndex: 1,
  },
  {
    id: 'night-economy-counterfactual',
    title: 'Night Economy Counterfactual',
    domain: 'Urban Analytics',
    description:
      'What happens to late-night spend if tram frequency drops after 11pm? A counterfactual dashboard for a Melbourne precinct.',
    longDescription: `Using open Victorian mobility and spend proxies, this case estimates the effect of a service cut on a night precinct. Difference-in-differences with a matched control strip, then a simple simulator so planners can move a slider (trams / hour) and see spend and incidents move together.

The story panel is the residual map: blocks the model cannot explain stay red. No invented nightlife — only intervals.`,
    dataset: 'PTV timetable + City of Melbourne pedestrian sensors (open data)',
    datasetUrl: 'https://data.melbourne.vic.gov.au/',
    metrics: { 'DiD spend': '−11%', 'R² (control)': 0.71, Precincts: 4, 'Sensors used': 28 },
    architecture: 'DiD + matching + precinct simulator + Mapbox residual layer',
    techStack: ['R', 'fixest', 'sf', 'Python', 'Mapbox'],
    visualizations: ['interactive-chart', 'segmentation-overlay', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/night-economy-counterfactual',
    tags: ['Causal Inference', 'Open Data', 'Melbourne', 'Policy'],
    difficulty: 'advanced',
    character: 'itachi',
    panelIndex: 2,
  },
  {
    id: 'manuscript-intel',
    title: 'Manuscript Intel',
    domain: 'NLP Analytics',
    description:
      'A reading desk for research PDFs: claims, methods, and dataset names extracted into a graph you can filter by unit code.',
    longDescription: `Built for a Master of Data Science reading list. LayoutLM-style extraction plus a rules layer for “we use dataset X.” The output is a searchable ledger: paper → method → metric → whether code was released.

Useful in a briefing: “show every paper this semester that reports a confidence interval.” The Illusionist reads so the team does not reread.`,
    dataset: 'ArXiv cs.LG / stat.ML abstracts + open PDF subset',
    datasetUrl: 'https://arxiv.org/',
    metrics: { 'Claim F1': 0.81, Papers: 420, 'Dataset recall': 0.74, 'Query latency': '120ms' },
    architecture: 'Layout-aware encoder + regex/ontology layer + SQLite ledger',
    techStack: ['Python', 'spaCy', 'Hugging Face', 'SQLite', 'Streamlit'],
    visualizations: ['graph-viz', 'architecture-diagram', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/manuscript-intel',
    tags: ['NLP', 'Literature Review', 'Knowledge Base'],
    difficulty: 'intermediate',
    character: 'itachi',
    panelIndex: 3,
  },
];
