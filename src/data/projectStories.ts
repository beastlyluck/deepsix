/**
 * Comic-page copy for each project. One spread per project:
 * problem → approach → live demo → result → lesson.
 * Keyed by Project.id. Source code for every project lives in `projects/<id>/`.
 */
export interface ProjectStory {
  problem: string;
  approach: string;
  demoCaption: string;
  result: string;
  lesson: string;
  quote: { speaker: string; text: string };
}

export const REPO_URL = 'https://github.com/beastlyluck/deepsix';

export function projectFolder(id: string) {
  return `projects/${id}`;
}

export function projectFolderUrl(id: string) {
  return `https://github.com/beastlyluck/${id}`;
}

export const projectStories: Record<string, ProjectStory> = {
  // ─── Chapter 01 · Illusionist ────────────────────────────────────────────
  'ward-twin-synthetic': {
    problem:
      'A 280-bed ward wants hourly occupancy forecasts, but analysts cannot see identifiable admission records. The data that would answer the question is the data nobody is allowed to open.',
    approach:
      'Fit a negative-binomial occupancy model to de-identified hourly patterns, then sample a synthetic cohort that reproduces arrivals, length of stay and weekday shape. Every synthetic row is replayable from a seed so an auditor can ask why it exists. Real midnight census is the only true signal that flows back in.',
    demoCaption:
      'Move the arrival multiplier. Watch the 80% interval and the real census. Two nights outside the band in a row and the drift gate opens.',
    result:
      'MAE 4.2 beds at the hourly grain, 83% empirical coverage on an 80% interval, and re-identification risk held at k ≥ 10 for every published cell. Six wards, one nightly table that Tableau can read.',
    lesson:
      'Synthetic data is not a shortcut around privacy. It is a model with a privacy budget, and it must be corrected by the one real number you are allowed to see.',
    quote: { speaker: 'The Illusionist', text: 'Do not invent a patient. Invent the distribution, then let the ward correct you.' },
  },
  'night-economy-counterfactual': {
    problem:
      'A council is considering fewer trams after 11pm. What happens to late-night spend in a precinct if service frequency drops? There is no experiment, only history.',
    approach:
      'Difference-in-differences on open pedestrian-sensor counts and spend proxies, with a matched control strip that shares weather and calendar but not the service change. A small simulator then lets planners move trams-per-hour and see spend and incident proxies respond together.',
    demoCaption:
      'Drag the service level. Treated and control move together before the change; the gap after it is the effect.',
    result:
      'Estimated −11% late-night spend for the cut scenario, control fit R² 0.71, four precincts and 28 sensors. Residual blocks the model cannot explain stay red on the map instead of being smoothed away.',
    lesson:
      'A counterfactual is a claim about a city that never happened. Show the parallel trend before you show the effect, or nobody should believe you.',
    quote: { speaker: 'Narrator', text: 'The sharingan, in this volume, is a residual plot.' },
  },
  'manuscript-intel': {
    problem:
      'A semester reading list is 400 PDFs. Which papers report a confidence interval? Which release code? Which dataset appears most often? Nobody can hold that in their head.',
    approach:
      'Layout-aware extraction pulls claims, methods and dataset mentions, a rules layer catches "we use dataset X", and everything lands in a SQLite ledger queried from Streamlit.',
    demoCaption:
      'Filter the ledger. Toggle "reports CI" and "code released" and watch the method mix change.',
    result:
      'Claim F1 0.81 and dataset recall 0.74 on a hand-labelled subset, 420 papers indexed, 120 ms median query.',
    lesson:
      'Literature review is a data problem. Treat it like one and the team stops rereading.',
    quote: { speaker: 'The Illusionist', text: 'I read so the team does not reread.' },
  },

  // ─── Chapter 02 · Singularity ────────────────────────────────────────────
  'campus-load-forecast': {
    problem:
      'Facilities needs tomorrow’s hourly electricity demand for 12 buildings. The winter champion model quietly fails when summer arrives early, and nobody notices until the bill.',
    approach:
      'LightGBM baseline on weather, timetable and calendar, a small LSTM on the last 72 hours for residual shape, and rolling-origin evaluation. A drift gate compares the last 14 days of MAE to the winter band and swaps champion for challenger when it breaks.',
    demoCaption:
      'Raise the temperature. The residual grows with heat until the challenger takes over.',
    result:
      '24-hour MAPE 6.8%, pinball loss 0.041 at the 0.9 quantile, weekly retraining. The alert fires before the outage, not after.',
    lesson:
      'A forecast is only as good as the monitor that knows when to stop trusting it.',
    quote: { speaker: 'The Singularity', text: 'I need a smaller model that still tells me when the weather changes the story.' },
  },
  'sku-hierarchy': {
    problem:
      'Store-level forecasts and SKU-level forecasts never add up to the chain total. Finance and operations each defend their own number.',
    approach:
      'Independent LightGBM base forecasts at every level of an M5-shaped hierarchy, then MinT reconciliation using the in-sample residual covariance so the adjusted forecasts are coherent by construction.',
    demoCaption:
      'Toggle reconciliation. Watch the leaves sum exactly to the parent while accuracy improves.',
    result:
      'WRMSSE 0.62 across five levels, coherence error exactly zero, 12k SKUs covered.',
    lesson:
      'The win is not a leaderboard score. It is two teams arguing about the plan instead of the number.',
    quote: { speaker: 'The Singularity', text: 'Myth is the aura. The work is the table.' },
  },
  'model-watch-desk': {
    problem:
      'Three models in production, a non-ML manager on call, and a silent winter model running into a Melbourne heatwave.',
    approach:
      'Evidently reports and a Population Stability Index traffic light over 14-day windows, a signed champion table, and a scheduled digest. Deliberately small so a manager can say stop.',
    demoCaption: 'Increase drift. Windows turn amber, then red, and the digest names the model.',
    result: 'One-day detection delay, two false pages a quarter, three models, one page.',
    lesson: 'Observability is a product for humans. If the manager cannot read it, it does not exist.',
    quote: { speaker: 'The Singularity', text: 'The aura was just instrumentation.' },
  },

  // ─── Chapter 03 · Prince ─────────────────────────────────────────────────
  'retention-uplift': {
    problem:
      'Marketing wants to send a win-back offer to every at-risk customer. Most of them would have stayed anyway. That is budget spent on pride.',
    approach:
      'Two-model (T-learner) and class-transformation uplift on a telco-style churn table with simulated offer assignment. Rank customers by predicted incremental save and read the Qini curve, not the AUC.',
    demoCaption:
      'Slide the targeting fraction. The Qini curve shows incremental saves; the budget bar shows what you did not spend.',
    result:
      'Qini at 20% of 0.19, AUUC 0.11, 34% budget saved at equal retention on 7,043 customers.',
    lesson: 'Messaging everyone is a decision to not have a control group.',
    quote: { speaker: 'The Prince', text: 'Correlation is a spectator. I want the treatment effect, or I want silence.' },
  },
  'fare-synthetic-control': {
    problem:
      'A fare reform happened once, in one city. Did ridership move because of it, or because of weather and a long weekend? A before/after slide will not survive a room.',
    approach:
      'Abadie-style synthetic control: weights over a donor pool of comparable routes chosen to match the pre-period, weather covariates, and placebo-in-space tests that run the same method on cities that never changed anything.',
    demoCaption:
      'Move the event month. The dashed line is the synthetic city; the gap after the event is the ATT. Placebos stay flat.',
    result: 'ATT −6.4% boardings, pre-fit RMSPE 0.041, 18 donors, placebo p ≈ 0.08.',
    lesson: 'The dashed line is a city that never existed, until the weights said it did.',
    quote: { speaker: 'The Prince', text: 'Show me the placebo or do not show me the effect.' },
  },
  'warehouse-twin-sim': {
    problem:
      'A 2× promo week is coming. Should the pick-face hire another packer or run two hours of overtime? Guessing wrong costs late orders.',
    approach:
      'A discrete-event twin: arrivals, pick times, pack stations and a KPI strip for wait, utilization and late orders. A factorial design runs 48 scenarios in nine seconds.',
    demoCaption: 'Add packers or arrivals. The night runs in silicon and the KPI strip updates live.',
    result: 'One extra packer beat two hours of overtime: late orders down 22%, pack utilization 81%.',
    lesson: 'Run the night before you live it.',
    quote: { speaker: 'The Prince', text: 'Pride is running the night in silicon first.' },
  },

  // ─── Chapter 04 · Swordsman ──────────────────────────────────────────────
  'land-use-change': {
    problem:
      'A planner wants to know what became urban this year, in hectares, and where the model is guessing. A single accuracy number hides both.',
    approach:
      'EfficientNet-B0 on EuroSAT tiles, year-over-year differencing to build a class transition matrix, and a confidence mask that surfaces the unsure tiles instead of averaging them away.',
    demoCaption: 'Tighten the confidence threshold. Unsure tiles are marked; the transition matrix updates.',
    result: 'Accuracy 97.4%, mIoU 0.94, 3.1% of tiles flagged unsure and reported, ten classes.',
    lesson: 'The unsure tiles are the deliverable. Hiding them in the average is how maps lie.',
    quote: { speaker: 'The Swordsman', text: 'A dashboard that hides disagreement is a dull sword.' },
  },
  'inspection-kpi': {
    problem:
      'A vision model spots defects on the line. Nobody reads its mAP. The plant manager reads PPM, the Pareto of defect types, and whether a station should stop.',
    approach:
      'YOLOv8 is the sensor. The product is a daily board: PPM, a Pareto chart, and a rule — if the same station fails twice in a shift, its all-clear freezes until a human clears it.',
    demoCaption: 'Raise the defect rate at a station. Watch the rule freeze the all-clear.',
    result: 'mAP@0.5 0.69, PPM down 18%, eight stations, one false stop a month.',
    lesson: 'Detect, count, refuse. The third blade is the one people remember.',
    quote: { speaker: 'The Swordsman', text: 'Three blades. Detect, count, refuse.' },
  },
  'vision-robustness-audit': {
    problem:
      'The inventory camera works in the demo. Does it work in rain, glare and JPEG compression? A stakeholder needs one sentence, not a paper.',
    approach:
      'ImageNet-C style corruptions at three severities on a production-like set, ConvNeXt versus ResNet, and a traffic-light table with a plain-English rule per row.',
    demoCaption: 'Set the acceptable error. Cells turn red where the camera should not be trusted.',
    result: 'Best mCE 61.4, rain failure at severity 3, four backbones, a six-page audit.',
    lesson: '“Do not update inventory under rain severity ≥ 3” is the slash. Everything else is setup.',
    quote: { speaker: 'The Swordsman', text: 'That sentence is the cut.' },
  },

  // ─── Chapter 05 · Prime ──────────────────────────────────────────────────
  'nightly-analytics-fabric': {
    problem:
      'A beautiful notebook answers the question once. The business needs the answer every morning, and needs yesterday’s number to stay up when tonight’s run breaks.',
    approach:
      'Staged → marts with dbt-style models, Great Expectations contracts as gates, and a thin semantic layer for “active students / late invoices / energy intensity”. A failed test blocks publish; the previous snapshot stays live.',
    demoCaption: 'Run the nightly. Break a contract. The statue does not replace the city.',
    result: 'Nightly SLA 18 minutes, 42 tests, 27 models, one failed publish in a quarter.',
    lesson: 'Owning a number means owning its refresh.',
    quote: { speaker: 'The Prime', text: 'Leadership is a green nightly run nobody has to hero.' },
  },
  'score-api': {
    problem:
      'Product wants a credit-style score they can call. Risk wants to know why. Ops wants to roll back before lunch if it misbehaves.',
    approach:
      'A 12-feature XGBoost score behind FastAPI. Every response carries the model SHA and the top-3 SHAP reason codes. A canary compares the new champion to the old one on live traffic.',
    demoCaption: 'Move the applicant’s features. The JSON updates with score, reasons and model version.',
    result: 'AUC 0.86, p95 latency 11 ms, canary delta under 0.01 AUC, 12 features.',
    lesson: 'Not a black box. A JSON payload someone can argue with.',
    quote: { speaker: 'The Prime', text: 'Freedom is rollback.' },
  },
  'exec-kpi-twin': {
    problem: 'Fifty charts and a director who opens none of them.',
    approach:
      'Five KPIs with a definition, an owner and a sparkline. Each carries an expected band from the metrics layer; the residual is the twin. When actuals leave the band the page turns red before the meeting.',
    demoCaption: 'Add noise. The page turns red exactly where it should, and nowhere else.',
    result: 'Five KPIs, versioned definitions, hourly refresh, surprise rate down.',
    lesson: 'Taste is subtraction.',
    quote: { speaker: 'The Prime', text: 'Five honest charts.' },
  },

  // ─── Chapter 06 · Weaver ─────────────────────────────────────────────────
  'supplier-risk-web': {
    problem:
      'One delayed container in one port. Three hospitals short of gloves two cities later. Procurement is staring at the wrong node.',
    approach:
      'A graph of vendors, ports and SKUs. Betweenness centrality for structural risk, a delay-risk score on edges, and a “cut this edge and watch the flood” view rendered in WebGL.',
    demoCaption: 'Click an edge to cut it. Reachability recomputes and the starved nodes light up.',
    result: '4.2k nodes, 17 critical edges, 0.78 delay recall, an eight-minute briefing.',
    lesson: 'They do not need 169k nodes. They need the three hops that matter this week.',
    quote: { speaker: 'The Weaver', text: 'Great power is the one edge you would cut last.' },
  },
  'collab-map': {
    problem: 'A school wants to see its isolated labs without surveilling anyone.',
    approach:
      'Co-authorship from open author lists, a bipartite projection, Leiden communities, and a ranked list of bridges — people who connect otherwise separate groups.',
    demoCaption: 'Hover a community. Bridges glow where two groups touch.',
    result: '6.1k authors, 14 communities, 39 bridges, modularity 0.46.',
    lesson: 'Research strategy is a network question asked politely.',
    quote: { speaker: 'The Weaver', text: 'A polite spidey-sense.' },
  },
  'fraud-ring': {
    problem:
      'Shared devices, shared addresses, shared velocity. A community that looks like a family until the edges say otherwise. The reviewer needs a case, not a score.',
    approach:
      'Graph features plus a small GNN baseline on a PaySim/Elliptic-style transaction graph, and a case-pack renderer: six nodes, the edges that bind them, and one sentence a reviewer can argue with.',
    demoCaption: 'Select a suspicious node. The case pack shows the path that binds the ring.',
    result: 'PR-AUC 0.64, 22 cases packed, review time down 31%, three false families caught.',
    lesson: 'Great power is a path, not a black-box score.',
    quote: { speaker: 'The Weaver', text: 'Show the edges, not the number.' },
  },

  'vic-ed-flow': {
    problem:
      'Ramping and four-hour waits show up in a weekly PDF. A night supervisor needs to know which campus will miss the target before the morning huddle.',
    approach:
      'Fifteen-minute arrivals through a Poisson GLM, an occupancy queue with a length-of-stay draw, and a residual against last winter’s midnight census. Austin gets a flu week on purpose.',
    demoCaption: 'Push Austin’s arrival load. Watch ramping and the risk list move before the other three campuses do.',
    result: 'Arrival MAE ~1.0 per slot. Austin last-day wait ~94 min, 77 ramped, flu flag on.',
    lesson: 'The board is the product. The GLM is only there so a flu week has a residual, not a vibe.',
    quote: { speaker: 'Field note', text: 'Open the campus that is already full.' },
  },
  'rent-pressure-atlas': {
    problem:
      'Councils argue about affordability with two series and no shared rule. Which SA2s are already over thirty percent of household income?',
    approach:
      'Hedonic log-rent on bedrooms, rail distance and ring. Stress = weekly rent × 52 / (0.3 × income). Spatial lag of the residual says precinct or one-off.',
    demoCaption: 'Sort by stress. Footscray, Dandenong and St Kilda should sit above the hedonic.',
    result: 'Share stressed ~0.40. Hottest: Dandenong, Footscray, then the outer cheap-income SA2s.',
    lesson: 'Stress is a definition. The leftover rent is the only model in the room.',
    quote: { speaker: 'Field note', text: 'If vacancy is not high, it is not empty. It is tight.' },
  },
  'vic-grid-peak': {
    problem:
      'A price spike that weather already explained does not need a name. The unit trip does.',
    approach:
      '0.9 quantile demand on hour, dow, CDD and lags. Log-price residual vs demand and heat. Top three intervals become the event log.',
    demoCaption: 'Find day 18 around 17:30. That is the trip. The heat days sit next to it, cheaper.',
    result: 'q90 pinball ~48 MW, spike rate ~3%, event log names the day-18 trip.',
    lesson: 'Name three intervals. Do not paint the whole month red.',
    quote: { speaker: 'Field note', text: 'If the weather bought the spike, leave it off the standup.' },
  },
  'invoice-leak-desk': {
    problem:
      'Unique invoice numbers miss the duplicate payment id and the split that lands two days later.',
    approach:
      'Block on vendor, rounded amount and a five-day window. Score remittance overlap and recency. The queue is hold or release, written to a file.',
    demoCaption: 'The first rows should be the D* clones. Splits sit lower because the amount bins differ.',
    result: '434 invoices, ~140 blocked pairs, precision@20 around 0.4, queue head is duplicates.',
    lesson: 'A dirty first screen means nobody opens the desk again.',
    quote: { speaker: 'Field note', text: 'Hold the second payment. Argue later.' },
  },
};
