import { Project } from '../../../../data/openDataSources';

export const zoroProjects: Project[] = [
  {
    id: 'land-use-change',
    title: 'Land-use change, one tile at a time',
    domain: 'Geospatial Analytics',
    description:
      'EuroSAT tiles classified, then differenced year-over-year so a planner sees what became urban — and the model’s doubt.',
    longDescription: `U-Net / EfficientNet labelling with a simple change map: last year vs this year, plus a confidence mask. The featured artifact is a one-page brief: hectares, class transition matrix, and three tiles the model is unsure about.

The Swordsman does not hide the unsure tiles in the average.`,
    dataset: 'EuroSAT 27,000 Sentinel-2 patches',
    datasetUrl: 'https://github.com/phelber/eurosat',
    metrics: { Accuracy: '97.4%', mIoU: 0.94, 'Unsure tiles': '3.1%', Classes: 10 },
    architecture: 'EfficientNet-B0 encoder + change differencing + confidence mask',
    techStack: ['PyTorch', 'Rasterio', 'GeoPandas', 'Folium'],
    visualizations: ['segmentation-overlay', 'confusion-matrix', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/land-use-change',
    tags: ['Geospatial', 'Remote Sensing', 'Reporting'],
    difficulty: 'advanced',
    character: 'zoro',
    panelIndex: 1,
  },
  {
    id: 'inspection-kpi',
    title: 'Inspection KPI board',
    domain: 'Quality Analytics',
    description:
      'Defect rates, repeat offenders, and a stop-the-line rule. Vision is upstream; the featured page is the KPI.',
    longDescription: `A YOLOv8 detector is only the sensor. The product is a daily board: PPM, Pareto of defect types, and a rule — if the same station fails twice in a shift, the twin freezes that station’s “all-clear.”

Feature this for manufacturing conversations. Three blades: detect, count, refuse.`,
    dataset: 'MVTec AD analog + synthetic station logs',
    datasetUrl: 'https://www.mvtec.com/company/research/datasets/mvtec-ad',
    metrics: { 'mAP@0.5': 0.69, 'PPM (−)': '18%', Stations: 8, 'False stop': '1/mo' },
    architecture: 'YOLOv8 + station ledger + stop rule + Power BI',
    techStack: ['Ultralytics', 'Pandas', 'Power BI', 'SQLite'],
    visualizations: ['keypoint-heatmap', 'interactive-chart', 'architecture-diagram'],
    github: 'https://github.com/beastlyluck/inspection-kpi',
    tags: ['Quality', 'Computer Vision', 'KPI'],
    difficulty: 'intermediate',
    character: 'zoro',
    panelIndex: 2,
  },
  {
    id: 'vision-robustness-audit',
    title: 'Vision robustness audit',
    domain: 'Model Risk',
    description:
      'Fog, glare, and compression — a one-week audit that tells a stakeholder when the camera twin is guessing.',
    longDescription: `ImageNet-C style corruptions on a small production-like set. The deliverable is a traffic-light table, not a paper. ConvNeXt vs ResNet, three severities, and a sentence: “Do not update inventory from this camera under rain severity ≥3.”

That sentence is the slash.`,
    dataset: 'ImageNet-C subset (15 corruptions × 3 severities)',
    datasetUrl: 'https://github.com/hendrycks/robustness',
    metrics: { 'mCE (best)': 61.4, 'Rain fail sev.': 3, Backbones: 4, 'Pages': 6 },
    architecture: 'Corruption suite + certified-radius note + stakeholder table',
    techStack: ['PyTorch', 'timm', 'Pandas', 'Quarto'],
    visualizations: ['confusion-matrix', 'interactive-chart'],
    github: 'https://github.com/beastlyluck/vision-robustness-audit',
    tags: ['Robustness', 'Audit', 'Risk'],
    difficulty: 'advanced',
    character: 'zoro',
    panelIndex: 3,
  },
];
