import type { TwinFigureKey } from './twinFigures';

export interface DigitalTwin {
  id: string;
  figure: TwinFigureKey;
  name: string;
  industry: string;
  theme: string;
  stack: string;
  product: string;
  blurb: string;
  accent: string;
  ink: string;
  run: string;
  github: string;
}

export const digitalTwins: DigitalTwin[] = [
  {
    id: 'aerotwin',
    figure: 'thor',
    name: 'AeroTwin',
    industry: 'Aerospace & autonomous systems',
    theme: 'Cybernetic swarm · space-grey / neon blue',
    stack: 'PyTorch sim, TorchScript, C++/libtorch, gRPC, raw WebGL',
    product: '400 Hz edge policy with a measured sim-to-real gap',
    blurb: 'Six airframes, one policy, held-out gusts. Domain randomisation is scored, not assumed.',
    accent: '#3d9dff',
    ink: '#0a1018',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/aerotwin',
  },
  {
    id: 'gridpulse',
    figure: 'batman',
    name: 'GridPulse',
    industry: 'Smart infrastructure & renewable energy',
    theme: 'Industrial topology · matrix green / obsidian',
    stack: 'SciPy DC flow, PINN, HiGHS, Avro/Flink SQL, SVG',
    product: 'Dispatch LP against a physics-informed line rating',
    blurb: 'One weak corridor, an evening peak, a cascade score on every bus.',
    accent: '#3dff8a',
    ink: '#07090a',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/gridpulse',
  },
  {
    id: 'biosync',
    figure: 'ironman',
    name: 'BioSync',
    industry: 'Biomedical AI & wearables',
    theme: 'Clinical density · sanitary white / cyan',
    stack: 'NumPy reverse-mode ODE, Parquet, ONNX, Streamlit',
    product: 'On-device RK4 replica with a DP cohort release',
    blurb: 'Glucose and heart-rate as a continuous twin. Gaps are the product, not a footnote.',
    accent: '#1aa6b8',
    ink: '#f4f8f9',
    run: 'python main.py && streamlit run app.py',
    github: 'https://github.com/beastlyluck/biosync',
  },
  {
    id: 'oceanicos',
    figure: 'luffy',
    name: 'OceanicOS',
    industry: 'Maritime logistics & smart ports',
    theme: 'Nautical ops · navy / safety orange',
    stack: 'heap DES, NetworkX, Hungarian, GBM ST-GNN, FastAPI WS',
    product: 'Assignment matrix that keeps the yard from filling',
    blurb: 'Two berths, six cranes, 16 AGVs. Same schedule, two policies, a yard that does not jam.',
    accent: '#ff7a1a',
    ink: '#0b1624',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/oceanicos',
  },
  {
    id: 'forgex',
    figure: 'kratos',
    name: 'ForgeX',
    industry: 'Smart manufacturing & robotics',
    theme: 'Heavy cell · charcoal / molten orange',
    stack: 'OpenCV, scipy STFT, IsolationForest, Three.js',
    product: 'JSON logit plus a HOLD interlock that will not self-reset',
    blurb: 'Acoustics catch the bearing. Vision catches the leak. The model does not restart the cell.',
    accent: '#ff6a1a',
    ink: '#0b0a09',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/forgex',
  },
  {
    id: 'terratwin',
    figure: 'naruto',
    name: 'TerraTwin',
    industry: 'Precision agriculture',
    theme: 'Eco-industrial · forest green / earth',
    stack: 'TOML, numpy FQI, spatial SIR, k8s/systemd, SVG',
    product: 'Closed-loop climate. Facility.toml is the truth file.',
    blurb: 'Eight towers, a disease that walks. FQI is raced against a setpoint PID on the same seed.',
    accent: '#3dba6e',
    ink: '#0e1612',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/terratwin',
  },
];

export function twinById(id: string) {
  return digitalTwins.find((t) => t.id === id);
}

export function twinNeighbors(id: string) {
  const i = digitalTwins.findIndex((t) => t.id === id);
  if (i < 0) return { prev: digitalTwins[digitalTwins.length - 1], next: digitalTwins[0], index: 0 };
  return {
    prev: digitalTwins[(i - 1 + digitalTwins.length) % digitalTwins.length],
    next: digitalTwins[(i + 1) % digitalTwins.length],
    index: i,
  };
}
