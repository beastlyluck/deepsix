import { Project } from '../../../../data/openDataSources';

export const gokuProjects: Project[] = [
  {
    id: 'campus-load-forecast',
    title: 'Campus Load Forecast',
    domain: 'Energy Analytics',
    description:
      '24-hour electricity demand for a university campus, with weather, timetable, and a monitor that kills the model when summer arrives early.',
    longDescription: `A featured operations piece: hourly kWh, rolling origin evaluation, and a simple residual-vs-temperature plot that facilities can read. Gradient boosting for the baseline, a small LSTM for the last 72 hours, and a champion/challenger swap when MAE on the last 14 days exceeds the winter band.

This is the Singularity without the myth — a forecast that knows when it is no longer Super Saiyan.`,
    dataset: 'ASHRAE great-energy-predictor analog + Bureau of Meteorology weather',
    datasetUrl: 'https://www.kaggle.com/c/ashrae-energy-prediction',
    metrics: { '24h MAPE': '6.8%', 'Pinball 0.9': 0.041, Buildings: 12, 'Retrain': 'weekly' },
    architecture: 'LightGBM + 72h LSTM residual + PSI drift gate',
    techStack: ['Python', 'LightGBM', 'PyTorch', 'Prophet', 'Power BI'],
    visualizations: ['training-curve', 'interactive-chart', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/campus-load-forecast',
    tags: ['Forecasting', 'Energy', 'Monitoring', 'Campus'],
    difficulty: 'advanced',
    character: 'goku',
    panelIndex: 1,
  },
  {
    id: 'sku-hierarchy',
    title: 'SKU Hierarchy Reconciliation',
    domain: 'Retail Forecasting',
    description:
      'Store × SKU forecasts that still add up to the chain total. MinT reconciliation so finance and ops share one number.',
    longDescription: `Independent models at store and SKU level never sum. This case implements MinT-style reconciliation on a public retail hierarchy (M5-shaped), then a dashboard: “this SKU is loud, this store is quiet, here is the coherent plan.”

The featured insight is not a leaderboard score. It is a meeting where two teams stop arguing about whose forecast is the real one.`,
    dataset: 'M5 Forecasting (Walmart) hierarchy sample',
    datasetUrl: 'https://www.kaggle.com/c/m5-forecasting-accuracy',
    metrics: { 'WRMSSE': 0.62, Levels: 5, 'Coherence error': '0', 'SKU coverage': '12k' },
    architecture: 'LightGBM base + MinT reconciliation + hierarchy dashboard',
    techStack: ['Python', 'scikit-hts', 'LightGBM', 'Plotly'],
    visualizations: ['interactive-chart', 'architecture-diagram', 'training-curve'],
    github: 'https://github.com/beastlyluck/sku-hierarchy',
    tags: ['Hierarchical TS', 'Retail', 'Reconciliation'],
    difficulty: 'advanced',
    character: 'goku',
    panelIndex: 2,
  },
  {
    id: 'model-watch-desk',
    title: 'Model Watch Desk',
    domain: 'ML Observability',
    description:
      'A one-page watch for data drift, performance, and “who approved this champion.” Built so a non-ML manager can still say stop.',
    longDescription: `Evidently reports, a PSI traffic light, and a signed champion table. The project is deliberately small: three models, fourteen days of windows, and a Slack-style digest.

Feature this when someone asks how you prevent a silent winter model from running in a Melbourne heatwave.`,
    dataset: 'Synthetic production logs + UCI adult shift analog',
    datasetUrl: 'https://archive.ics.uci.edu/dataset/2/adult',
    metrics: { 'Detect delay': '1 day', Windows: 14, 'False pages': '2/qtr', Models: 3 },
    architecture: 'Evidently + PSI + champion ledger + scheduled digest',
    techStack: ['Evidently', 'Pandas', 'FastAPI', 'GitHub Actions'],
    visualizations: ['interactive-chart', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/model-watch-desk',
    tags: ['MLOps', 'Drift', 'Governance'],
    difficulty: 'intermediate',
    character: 'goku',
    panelIndex: 3,
  },
];
