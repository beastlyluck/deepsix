import { Project } from '../../../../data/openDataSources';

export const optimusProjects: Project[] = [
  {
    id: 'nightly-analytics-fabric',
    title: 'Nightly analytics fabric',
    domain: 'Analytics Engineering',
    description:
      'A warehouse that rebuilds every night with tests. If a contract fails, yesterday’s numbers stay up — the statue does not replace the city.',
    longDescription: `A featured platform story: ingest, dbt-style models, Great Expectations, and a thin semantic layer for “active students / late invoices / energy intensity.” The transformation is the point — notebook to job.

Show this when someone asks whether you can own a number after you graduate.`,
    dataset: 'Synthetic university ops (enrolment, facilities, finance) + California housing analog',
    datasetUrl: 'https://scikit-learn.org/stable/modules/generated/sklearn.datasets.fetch_california_housing.html',
    metrics: { 'Nightly SLA': '18 min', Tests: 42, 'Failed days / qtr': 1, Models: 27 },
    architecture: 'Ingest → staged → marts → GE tests → BI',
    techStack: ['SQL', 'dbt', 'Great Expectations', 'BigQuery', 'Looker Studio'],
    visualizations: ['architecture-diagram', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/nightly-analytics-fabric',
    tags: ['dbt', 'Data Quality', 'Warehouse'],
    difficulty: 'advanced',
    character: 'optimus',
    panelIndex: 1,
  },
  {
    id: 'score-api',
    title: 'Score API with a lineage card',
    domain: 'Decision Services',
    description:
      'A credit-style score behind FastAPI. Every response carries model version, features used, and a reason code.',
    longDescription: `Not a black box. A 12-feature logistic / XGBoost score, reason codes from SHAP top-3, and a canary that compares the last champion.

The featured artifact is the JSON payload: score, reasons, and model_sha. Leadership is being able to roll back before lunch.`,
    dataset: 'Give Me Some Credit (public Kaggle)',
    datasetUrl: 'https://www.kaggle.com/c/GiveMeSomeCredit',
    metrics: { AUC: 0.86, 'p95 latency': '11ms', 'Canary delta': '<0.01 AUC', Features: 12 },
    architecture: 'XGBoost + SHAP reasons + FastAPI + canary',
    techStack: ['scikit-learn', 'XGBoost', 'SHAP', 'FastAPI', 'Docker'],
    visualizations: ['architecture-diagram', 'interactive-chart', 'onnx-graph'],
    github: 'https://github.com/beastlyluck/score-api',
    tags: ['Scoring', 'Explainability', 'API'],
    difficulty: 'intermediate',
    character: 'optimus',
    panelIndex: 2,
  },
  {
    id: 'exec-kpi-twin',
    title: 'Executive KPI twin',
    domain: 'BI / Product Analytics',
    description:
      'Five numbers a director will actually open: growth, quality, risk, cost, and a “do not surprise me” residual.',
    longDescription: `A small semantic layer and a single page. Each KPI has a definition, an owner, and a sparkline. The twin is the residual — when actuals leave the band, the page turns red before the meeting.

Feature this as taste. Not fifty charts. Five honest ones.`,
    dataset: 'Synthetic SaaS / campus ops weekly grain',
    datasetUrl: 'https://github.com/beastlyluck/exec-kpi-twin',
    metrics: { KPIs: 5, 'Defs versioned': 'yes', 'Refresh': 'hourly', 'Surprise rate': '↓' },
    architecture: 'Metrics layer + band alerts + one-page BI',
    techStack: ['dbt metrics', 'Lightdash / Metabase', 'SQL'],
    visualizations: ['interactive-chart', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/exec-kpi-twin',
    tags: ['BI', 'Metrics', 'Exec'],
    difficulty: 'beginner',
    character: 'optimus',
    panelIndex: 3,
  },
];
