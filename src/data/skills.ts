export interface Skill {
  name: string;
  category: SkillCategory;
  proficiency: number; // 0-100
  monashUnit?: string;
  description?: string;
  icon?: string;
}

export type SkillCategory =
  | 'programming'
  | 'data-science'
  | 'machine-learning'
  | 'deep-learning'
  | 'mlops'
  | 'visualization'
  | 'tools'
  | 'soft-skills'
  | 'creative';

/**
 * Skills are grounded in the Monash Master of Data Science handbook (unit codes in `monashUnit`),
 * the résumé, and the 18 case projects in `projects/`.
 */
export const skills: Skill[] = [
  // Programming
  { name: 'Python', category: 'programming', proficiency: 90, monashUnit: 'FIT9131', description: 'NumPy, Pandas, scikit-learn, Jupyter, OOP' },
  { name: 'SQL', category: 'programming', proficiency: 84, monashUnit: 'FIT9132', description: 'PostgreSQL, window functions, data modelling, dbt-style layering' },
  { name: 'R', category: 'programming', proficiency: 72, monashUnit: 'FIT5147', description: 'tidyverse, ggplot2, fixest, Synth' },
  { name: 'Java', category: 'programming', proficiency: 74, description: 'OOP, collections, testing' },
  { name: 'C++', category: 'programming', proficiency: 78, description: 'Unreal Engine 5, gameplay systems' },
  { name: 'JavaScript / TypeScript', category: 'programming', proficiency: 84, description: 'React, Three.js, Vite' },
  { name: 'PySpark', category: 'programming', proficiency: 68, monashUnit: 'FIT5202', description: 'DataFrames, MLlib pipelines, streaming' },

  // Data science core
  { name: 'Data wrangling', category: 'data-science', proficiency: 88, monashUnit: 'FIT5196', description: 'PDF/XML/JSON extraction, cleansing, integration' },
  { name: 'Exploratory analysis', category: 'data-science', proficiency: 88, monashUnit: 'FIT5145', description: 'Distributions, outliers, hypothesis tests' },
  { name: 'Statistical modelling', category: 'data-science', proficiency: 82, monashUnit: 'FIT5197', description: 'GLMs, Bayesian inference, model selection' },
  { name: 'Causal inference', category: 'data-science', proficiency: 78, description: 'DiD, synthetic control, uplift, placebo tests' },
  { name: 'Forecasting', category: 'data-science', proficiency: 80, monashUnit: 'FIT5201', description: 'Rolling-origin eval, hierarchical reconciliation (MinT)' },
  { name: 'Simulation / digital twins', category: 'data-science', proficiency: 76, description: 'Discrete-event (SimPy), scenario design' },
  { name: 'Feature engineering', category: 'data-science', proficiency: 84, monashUnit: 'FIT5201', description: 'Selection, encoding, leakage control' },
  { name: 'Model evaluation', category: 'data-science', proficiency: 86, monashUnit: 'FIT5201', description: 'Cross-validation, calibration, Qini / AUUC' },

  // Machine learning
  { name: 'Supervised learning', category: 'machine-learning', proficiency: 88, monashUnit: 'FIT5201', description: 'Regression, classification, XGBoost, LightGBM' },
  { name: 'Unsupervised learning', category: 'machine-learning', proficiency: 80, monashUnit: 'FIT5201', description: 'Clustering, PCA, anomaly detection' },
  { name: 'Text analytics', category: 'machine-learning', proficiency: 76, monashUnit: 'FIT5212', description: 'TF-IDF, embeddings, information extraction' },
  { name: 'Graph analytics', category: 'machine-learning', proficiency: 78, monashUnit: 'FIT5212', description: 'Centrality, community detection, GNN baselines' },
  { name: 'Explainability', category: 'machine-learning', proficiency: 80, description: 'SHAP reason codes, calibration, audit tables' },
  { name: 'Big-data processing', category: 'machine-learning', proficiency: 70, monashUnit: 'FIT5202', description: 'Spark, partitioning, distributed training' },

  // Deep learning
  { name: 'Computer vision', category: 'deep-learning', proficiency: 82, monashUnit: 'FIT5215', description: 'YOLOv8, EfficientNet, segmentation, robustness audits' },
  { name: 'Sequence models', category: 'deep-learning', proficiency: 76, monashUnit: 'FIT5215', description: 'LSTM residual forecasters, attention' },
  { name: 'NLP & transformers', category: 'deep-learning', proficiency: 78, monashUnit: 'FIT5215', description: 'Fine-tuning, layout-aware extraction' },
  { name: 'Generative & synthetic data', category: 'deep-learning', proficiency: 78, description: 'Calibrated synthetic cohorts, privacy budgets' },

  // MLOps & analytics engineering
  { name: 'Analytics engineering', category: 'mlops', proficiency: 82, description: 'dbt-style models, Great Expectations, semantic layers' },
  { name: 'Model serving', category: 'mlops', proficiency: 78, description: 'FastAPI, Docker, canary / rollback' },
  { name: 'Monitoring & drift', category: 'mlops', proficiency: 80, description: 'PSI, Evidently, champion/challenger gates' },
  { name: 'Cloud platforms', category: 'mlops', proficiency: 70, monashUnit: 'FIT5225', description: 'AWS, Kubernetes, serverless' },
  { name: 'CI / GitHub Actions', category: 'mlops', proficiency: 82, description: 'Tests, scheduled jobs, environments' },

  // Visualisation
  { name: 'Tableau', category: 'visualization', proficiency: 82, monashUnit: 'FIT5147', description: 'Dashboards, LOD, executive KPI pages' },
  { name: 'Power BI / Looker', category: 'visualization', proficiency: 74, description: 'Metrics layer, band alerts' },
  { name: 'Plotly / Dash', category: 'visualization', proficiency: 82, description: 'Interactive scenario boards' },
  { name: 'ggplot2 / Matplotlib', category: 'visualization', proficiency: 88, monashUnit: 'FIT5147', description: 'Publication-quality statistical plots' },
  { name: 'D3.js / Three.js', category: 'visualization', proficiency: 84, monashUnit: 'FIT5147', description: 'Custom, WebGL and 3D data visualisation' },
  { name: 'Geospatial', category: 'visualization', proficiency: 74, description: 'GeoPandas, sf, Mapbox, Rasterio' },

  // Tools & creative
  { name: 'Git / GitHub', category: 'tools', proficiency: 90, description: 'Branching, review, releases' },
  { name: 'Linux / shell', category: 'tools', proficiency: 80, description: 'Bash, automation, cron' },
  { name: 'Blender 3D', category: 'creative', proficiency: 80, description: 'Modelling, animation, geometry nodes' },
  { name: 'Unreal Engine 5', category: 'creative', proficiency: 78, description: 'C++, Blueprints, virtual environments' },
  { name: 'Video editing', category: 'creative', proficiency: 85, description: 'Premiere Pro, Final Cut Pro' },

  // Soft skills (from the résumé)
  { name: 'Analytical thinking', category: 'soft-skills', proficiency: 92, description: 'Decomposition, root-cause analysis' },
  { name: 'Project management', category: 'soft-skills', proficiency: 86, monashUnit: 'FIT5057', description: 'Scope, risk, stakeholders, agile delivery' },
  { name: 'Research methods', category: 'data-science', proficiency: 80, monashUnit: 'FIT5125', description: 'Study design, literature review, research ethics' },
  { name: 'Communication', category: 'soft-skills', proficiency: 88, monashUnit: 'FIT5122', description: 'Briefs, stakeholder presentations' },
  { name: 'Teamwork', category: 'soft-skills', proficiency: 90, monashUnit: 'FIT5120', description: 'Cross-functional, agile, code review' },
  { name: 'Adaptability', category: 'soft-skills', proficiency: 94, description: 'Rapid learning, tech-stack switching' },
  { name: 'Leadership', category: 'soft-skills', proficiency: 84, description: 'Project management, mentoring' },
  { name: 'Critical thinking', category: 'soft-skills', proficiency: 92, description: 'Evidence over anecdote' },
];

export const skillCategories: { key: SkillCategory; label: string; color: string; icon: string }[] = [
  { key: 'programming', label: 'Programming', color: 'goku', icon: 'code' },
  { key: 'data-science', label: 'Data Science', color: 'zoro', icon: 'database' },
  { key: 'machine-learning', label: 'ML', color: 'vegeta', icon: 'brain' },
  { key: 'deep-learning', label: 'Deep Learning', color: 'itachi', icon: 'network' },
  { key: 'mlops', label: 'MLOps', color: 'optimus', icon: 'server' },
  { key: 'visualization', label: 'Visualization', color: 'spiderman', icon: 'chart' },
  { key: 'tools', label: 'Tools', color: 'paper-muted', icon: 'tool' },
  { key: 'creative', label: 'Creative', color: 'gold', icon: 'palette' },
  { key: 'soft-skills', label: 'Soft Skills', color: 'cyan', icon: 'users' },
];
