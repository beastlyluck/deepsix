export interface Project {
  id: string;
  title: string;
  domain: string;
  description: string;
  longDescription: string;
  dataset: string;
  datasetUrl: string;
  metrics: Record<string, string | number>;
  architecture: string;
  techStack: string[];
  visualizations: VisualizationType[];
  github: string;
  demo?: string;
  paper?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  character: CharacterKey;
  panelIndex: number;
}

export type VisualizationType =
  | 'interactive-chart'
  | '3d-tensor'
  | 'attention-map'
  | 'architecture-diagram'
  | 'training-curve'
  | 'confusion-matrix'
  | 'latent-walk'
  | 'inference-video'
  | 'onnx-graph'
  | 'keypoint-heatmap'
  | 'segmentation-overlay'
  | 'graph-viz'
  | 'attention-web'
  | 'particle-field'
  | 'shader-playground';

export type CharacterKey = 'zoro' | 'goku' | 'itachi' | 'optimus' | 'vegeta' | 'spiderman';

export const openDataSources = {
  coco: { name: 'COCO 2017', url: 'https://cocodataset.org/', citation: 'Lin et al., 2014' },
  eurosat: { name: 'EuroSAT', url: 'https://github.com/phelber/eurosat', citation: 'Helber et al., 2019' },
  imagenet_c: { name: 'ImageNet-C', url: 'https://github.com/hendrycks/robustness', citation: 'Hendrycks & Dietterich, 2019' },
  openwebtext: { name: 'OpenWebText', url: 'https://github.com/jcpeterson/openwebtext', citation: 'Gokaslan & Cohen, 2019' },
  c4: { name: 'C4 (Colossal Clean Crawled Corpus)', url: 'https://github.com/allenai/c4', citation: 'Raffel et al., 2020' },
  wikitext: { name: 'WikiText-103', url: 'https://blog.einstein.ai/the-wikitext-long-term-dependency-language-modeling-dataset/', citation: 'Merity et al., 2016' },
  laion_aesthetics: { name: 'LAION-Aesthetics', url: 'https://laion.ai/blog/laion-aesthetics/', citation: 'Schuhmann et al., 2022' },
  coco_canny: { name: 'COCO + Canny Edges', url: 'https://cocodataset.org/', citation: 'Lin et al., 2014' },
  ffhq: { name: 'FFHQ', url: 'https://github.com/NVlabs/ffhq-dataset', citation: 'Karras et al., 2019' },
  california_housing: { name: 'California Housing', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.datasets.fetch_california_housing.html', citation: 'Pace & Barry, 1997' },
  ogbn_arxiv: { name: 'ogbn-arxiv', url: 'https://ogb.stanford.edu/', citation: 'Hu et al., 2020' },
  fb15k: { name: 'FB15k-237', url: 'https://github.com/kristina-todorova/FB15k-237', citation: 'Toutanova et al., 2015' },
  movielens: { name: 'MovieLens 25M', url: 'https://grouplens.org/datasets/movielens/', citation: 'Harper & Konstan, 2015' },
  mujoco: { name: 'MuJoCo Benchmarks', url: 'https://github.com/deepmind/mujoco', citation: 'Todorov et al., 2012' },
  chess: { name: 'Chess Positions (CCRL)', url: 'https://ccrl.chessdom.com/', citation: 'CCRL' },
};
