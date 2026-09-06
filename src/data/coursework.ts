/**
 * Monash University — Master of Data Science (C6004), Clayton.
 * Structure follows the Monash Handbook: Part A foundations, Part B core master's study,
 * Part C advanced practice. Unit codes/titles per handbook.monash.edu (2026).
 */
export interface CourseUnit {
  code: string;
  title: string;
  part: 'A' | 'B' | 'C';
  points: number;
  status: 'completed' | 'in-progress' | 'planned';
  skills: string[];
  summary: string;
}

export const courseParts: Record<CourseUnit['part'], { label: string; blurb: string }> = {
  A: { label: 'Part A · Foundations', blurb: 'Programming, databases and the mathematics that data science stands on.' },
  B: { label: 'Part B · Core master’s study', blurb: 'Wrangling, modelling, machine learning, big-data processing and visualisation.' },
  C: { label: 'Part C · Advanced practice', blurb: 'Project management and IT research methods, then professional practice and an industry studio project.' },
};

export const coursework: CourseUnit[] = [
  {
    code: 'FIT9131',
    title: 'Programming foundations in Python',
    part: 'A',
    points: 6,
    status: 'completed',
    skills: ['Python', 'OOP', 'Testing'],
    summary: 'Object-oriented design in Python, collections, exceptions and unit testing.',
  },
  {
    code: 'FIT9132',
    title: 'Introduction to databases',
    part: 'A',
    points: 6,
    status: 'completed',
    skills: ['SQL', 'Relational modelling', 'Normalisation'],
    summary: 'ER modelling, normalisation, SQL DDL/DML and transactions on Oracle/PostgreSQL.',
  },
  {
    code: 'FIT5145',
    title: 'Foundations of data science',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Data science process', 'Python', 'R', 'Ethics & governance', 'Storytelling'],
    summary: 'The data science lifecycle, exploratory analysis, communication and the ethical/legal frame around data.',
  },
  {
    code: 'FIT5196',
    title: 'Data wrangling',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Pandas', 'Regex', 'Parsing semi-structured data', 'Data quality', 'Integration'],
    summary: 'Extraction from PDF/XML/JSON, cleansing, outlier handling, reshaping and integration at scale.',
  },
  {
    code: 'FIT5197',
    title: 'Statistical data modelling',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Probability', 'Bayesian inference', 'Regression', 'Model selection', 'Hypothesis testing'],
    summary: 'Probability, estimation, linear and generalised linear models, information criteria and Bayesian thinking.',
  },
  {
    code: 'FIT5201',
    title: 'Machine learning',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Supervised learning', 'Unsupervised learning', 'Bias–variance', 'Kernel methods', 'Neural networks'],
    summary: 'Statistical learning theory, model complexity, ensembles, clustering and dimensionality reduction.',
  },
  {
    code: 'FIT5202',
    title: 'Data processing for big data',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Apache Spark', 'PySpark', 'Streaming', 'Distributed ML', 'Parallel algorithms'],
    summary: 'Spark DataFrames, MLlib pipelines, Kafka streaming and the cost model of distributed computation.',
  },
  {
    code: 'FIT5147',
    title: 'Data exploration and visualisation',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Tableau', 'R / ggplot2', 'D3.js', 'Visual perception', 'Narrative visualisation'],
    summary: 'Exploratory and explanatory visualisation, perceptual principles and an interactive narrative project.',
  },
  {
    code: 'FIT5149',
    title: 'Applied data analysis',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['R', 'Regularisation', 'Trees & boosting', 'Text analytics', 'Resampling'],
    summary: 'Applied statistical learning in R: regularised regression, tree ensembles and text classification.',
  },
  {
    code: 'FIT5212',
    title: 'Data analysis for semi-structured data',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['Text mining', 'Recommender systems', 'Network analysis', 'Graph algorithms'],
    summary: 'Text, networks and recommendation: TF-IDF to embeddings, centrality and community detection.',
  },
  {
    code: 'FIT5215',
    title: 'Deep learning',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['PyTorch', 'CNNs', 'RNNs / Transformers', 'Generative models', 'Regularisation'],
    summary: 'Optimisation for deep networks, convolutional and sequence models, attention and generative modelling.',
  },
  {
    code: 'FIT5225',
    title: 'Cloud computing and security',
    part: 'B',
    points: 6,
    status: 'completed',
    skills: ['AWS', 'Kubernetes', 'Docker', 'IAM & security', 'Serverless'],
    summary: 'Cloud architecture, containers, orchestration and the security model of a data platform.',
  },
  {
    code: 'FIT5057',
    title: 'Project management',
    part: 'C',
    points: 6,
    status: 'completed',
    skills: ['Scope & schedule', 'Risk', 'Stakeholders', 'Agile'],
    summary: 'Planning, risk, stakeholder communication and delivery frameworks for IT and data projects.',
  },
  {
    code: 'FIT5125',
    title: 'IT research methods',
    part: 'C',
    points: 6,
    status: 'completed',
    skills: ['Research design', 'Literature review', 'Ethics', 'Qualitative & quantitative methods'],
    summary: 'Research philosophies, study design, ethics and methods for investigating IT and data-science questions.',
  },
  {
    code: 'FIT5122',
    title: 'Professional practice',
    part: 'C',
    points: 6,
    status: 'in-progress',
    skills: ['Stakeholder communication', 'Ethics', 'Project scoping', 'Teamwork'],
    summary: 'Professional, ethical and communication practice for delivering data projects with clients.',
  },
  {
    code: 'FIT5120',
    title: 'Industry experience studio project',
    part: 'C',
    points: 12,
    status: 'in-progress',
    skills: ['Agile delivery', 'Product analytics', 'Deployment', 'Client presentation'],
    summary: 'A semester-long team build for an external client: scoping, iteration, deployment and handover.',
  },
];

export const certifications = [
  {
    name: 'Learning Python for Data Analysis and Visualization',
    issuer: 'Udemy',
    date: 'June 2022',
    skills: ['Jupyter', 'NumPy', 'Pandas', 'Matplotlib'],
  },
  {
    name: 'Complete Blender Creator: 3D Modelling for Beginners',
    issuer: 'Udemy',
    date: 'February 2024',
    skills: ['Blender', 'Modelling', 'Animation'],
  },
  {
    name: 'Unreal Engine 5 C++ Developer',
    issuer: 'Udemy',
    date: 'February 2024',
    skills: ['C++', 'OOP', 'AI behaviour', 'Gameplay framework'],
  },
];

export const languages = ['English', 'Hindi', 'Marathi'];
