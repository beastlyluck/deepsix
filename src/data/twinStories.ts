export interface TwinBeat {
  id: string;
  kind: 'narration' | 'speech' | 'sfx';
  speaker?: string;
  text: string;
}

export interface TwinDoc {
  title: string;
  body: string;
}

export interface TwinStory {
  kanji: string;
  volume: string;
  pageStart: number;
  art: string;
  hook: string;
  premise: string;
  climax: string;
  sfx: string;
  quote: { speaker: string; text: string };
  beats: TwinBeat[];
  problem: string;
  approach: string;
  result: string;
  lesson: string;
  asset: string;
  bottleneck: string;
  honesty: string;
  topology: string;
  docs: TwinDoc[];
  metrics: Record<string, string>;
  stackParts: string[];
}

export const twinsPrologue = {
  volume: 'VOL. 02 · THE WORK',
  kanji: '双子',
  title: 'Six twins. Six figures. Six stacks.',
  guide:
    'These six projects are the main work. Each one is a digital twin: a computer copy of a real system (drones, a power grid, a body, a port, a factory cell, a farm). Click a card to open the story. Scroll for the problem, the method, and the live board. The small line under each card is the technical stack.',
  opening: `Volume Two is the work.

Thor holds the swarm. Batman watches the grid. The suit keeps the body honest. Luffy runs the yard. Kratos will not reset the cell. Naruto walks the farm.

Atharva does not flatten them onto one framework. Each twin keeps the runtime the industry actually uses.

If you are hiring, you are not scrolling cards.
You are reading how he refuses a pretty lie.`,
};

export const twinStories: Record<string, TwinStory> = {
  aerotwin: {
    kanji: '群',
    volume: 'VOL. 02 · CH. 01',
    pageStart: 3,
    art: '/manga/chapter-thor.png',
    hook: 'Six airframes, one policy — and a gap that is allowed to stay ugly.',
    premise:
      'AeroTwin exists to answer one question before every flight: how far will the trained controller drift when it leaves the simulator? The “real” world here is a held-out parameter set the training loop never sees. Domain randomisation is scored against that set, not assumed to have worked.',
    climax: 'The gust hits. The residual plot opens its eye.',
    sfx: 'WHOOSH',
    quote: {
      speaker: 'The Operator',
      text: 'Do not tell me the policy transferred. Show me the gap on the world it never trained in.',
    },
    beats: [
      { id: 'a1', kind: 'narration', text: 'Six dots on a black field. Wind is a coloured process, not a random number. Downwash is the term the training world refuses to model.' },
      { id: 'a2', kind: 'speech', speaker: 'The Operator', text: 'If the domain-randomised policy does not shrink the spread, randomisation is theatre.' },
      { id: 'a3', kind: 'narration', text: 'TorchScript leaves the notebook. A C++ loop is supposed to hold 400 Hz. No toolchain on this desk — the binary is source plus an eager-vs-script check.' },
      { id: 'a4', kind: 'sfx', text: 'WHOOSH' },
    ],
    problem:
      'A swarm policy that only looks good in the world it was trained in is a pretty lie. The bottleneck is the sim-to-real gap under turbulence, plus retrieval over manuals and checklists when a human has to take the stick.',
    approach:
      'Differentiable quadrotor, analytic policy gradient, a second policy trained with per-episode domain randomisation, then both flown in a held-out “real” world. Edge export is TorchScript. The dashboard is raw WebGL, not a scene graph.',
    result:
      'Gap is reported as mean ± std across seeds. The board shows every seed. The residual of the DR policy is mostly the cost of unmodelled downwash, not of parameter mismatch. That is a stand-in for a flight-test rig, not a claim about a named airframe.',
    lesson:
      'Transfer is a number you publish with the world you hid. If you cannot name the held-out set, you do not have a twin. You have a render.',
    asset: '6 commercial-class quadrotors, 400 Hz companion-computer loop',
    bottleneck: 'Sim-to-real gap under turbulence; multi-modal retrieval over manuals and CAD',
    honesty:
      'The “real” world is a held-out parameter set, not logged flight data. No C++ toolchain was available on this machine; the edge loop is source plus a TorchScript-versus-eager check.',
    topology:
      'sim/quadrotor.py → rl/policy.py → rl/s2r.py → edge/export.py → policy.pt\nswarm/api.py + raw WebGL board ← telemetry.jsonl',
    docs: [
      {
        title: 'Simulator',
        body: 'Reduced quadrotor: position, velocity, first-order attitude lag. Wind is Dryden-style per axis plus a slow shared gust. Drag is quadratic in relative airspeed. Downwash is off in training and on in the held-out world.',
      },
      {
        title: 'Gap',
        body: 'RMSE in sim versus RMSE in the held-out world. Gap = real − sim. A DR policy should shrink both the mean and the spread. If the spread grows, randomisation added noise without transferring.',
      },
      {
        title: 'Edge',
        body: 'TorchScript policy plus a libtorch C++ loop written for 400 Hz. stdin observations, stdout acceleration. gRPC/REST swarm surface sits beside it, not inside it.',
      },
      {
        title: 'Boundary',
        body: 'Commands clipped to |a| ≤ 6 m/s². With τ_a = 0.14 s and a 1.6 m/s gust step, tracking error has a lag floor around 0.22 m. A real-world RMSE below that would mean leakage.',
      },
    ],
    metrics: { Airframes: '6', Loop: '400 Hz', Worlds: 'nominal / DR / held-out', Board: 'raw WebGL' },
    stackParts: ['PyTorch sim', 'TorchScript', 'C++ / libtorch', 'gRPC', 'raw WebGL'],
  },
  gridpulse: {
    kanji: '脈',
    volume: 'VOL. 02 · CH. 02',
    pageStart: 11,
    art: '/manga/chapter-batman.png',
    hook: 'Nameplate is a wish. The rating that matters is the one the conductor can still carry this evening.',
    premise:
      'GridPulse is a 48-bus regional microgrid: wind on the ridge, solar on the plain, three batteries, a grid tie. The morning question is which lines can actually run at their nameplate today, and what the N-2 we fear most does to the evening peak under that schedule.',
    climax: 'The corridor heats. The LP does not shrug.',
    sfx: 'ZZZT',
    quote: {
      speaker: 'The Dispatcher',
      text: 'If the PINN rating and the nameplate disagree, I dispatch against the colder number. Pride is how cascades start.',
    },
    beats: [
      { id: 'g1', kind: 'narration', text: 'Forty-eight buses. One weak corridor. The evening peak is already walking toward it.' },
      { id: 'g2', kind: 'speech', speaker: 'The Dispatcher', text: 'N-2 is not a slide. It is a score on every bus after the second line opens.' },
      { id: 'g3', kind: 'narration', text: 'HiGHS writes the schedule. A simple graph convolution only reads the topology. The SVG board is the control room, not a chart library.' },
      { id: 'g4', kind: 'sfx', text: 'ZZZT' },
    ],
    problem:
      'Thermal limits move with weather and loading. A static rating plus a pretty cascade animation is not an operations twin. The bottleneck is a physics-informed line rating that the dispatcher is allowed to lose to.',
    approach:
      'SciPy sparse DC power flow and PTDF. A PINN on the conductor thermal PDE, bisection for sustainable current. HiGHS LP against that derated limit. A shallow graph model scores cascade risk on N-1 / N-2 draws.',
    result:
      'Two schedules: nameplate versus PINN-derated. The board overlays both on the same topology and keeps the alert drawer honest about which buses trip first. Kafka/Avro and Flink SQL are the stream contract; DuckDB is the fallback store.',
    lesson:
      'A digital twin of a grid that cannot lose to physics is a screensaver. The LP has to eat the colder rating.',
    asset: 'Decentralised microgrid, 48 buses, 112 lines, 1 Hz SCADA stand-in',
    bottleneck: 'Physics-informed thermal limits; graph-structured cascade prediction',
    honesty:
      'The network is synthetic. The PINN is a thermal stand-in, not a utility-validated conductor model. Claims are about the method under a controlled peak, not about a named feeder.',
    topology:
      'grid/topology.py → powerflow.py → pinn/thermal.py → dispatch/lp.py\ngnn/sgc.py → cascade score → SVG board + alert drawer',
    docs: [
      {
        title: 'Power flow',
        body: 'DC power flow on a sparse susceptance matrix. PTDF for line outages. Cascade is successive overload after an N-1 or N-2 draw, not a full AC dynamic.',
      },
      {
        title: 'PINN rating',
        body: 'Temperature as a function of position, time and current. Sustainable current I* is a bisection against a temperature ceiling. Dispatch sees I*, not the nameplate, when they disagree.',
      },
      {
        title: 'Dispatch',
        body: 'HiGHS linear program: meet load, honour battery and tie limits, minimise cost plus overload slack. Two runs — static rating and derated — on the same evening peak.',
      },
      {
        title: 'Stream',
        body: 'Avro bus telemetry, Flink SQL feature window, DuckDB/SQLite fallback. The board replays the feature store. It does not pretend to be a live ISO feed.',
      },
    ],
    metrics: { Buses: '48', Lines: '112', Rating: 'PINN vs nameplate', Solver: 'HiGHS' },
    stackParts: ['SciPy DC flow', 'PINN', 'HiGHS', 'Avro / Flink SQL', 'SVG'],
  },
  biosync: {
    kanji: '脈動',
    volume: 'VOL. 02 · CH. 03',
    pageStart: 19,
    art: '/manga/chapter-ironman.png',
    hook: 'The sensors go quiet. The twin that was defined in continuous time has to keep breathing.',
    premise:
      'BioSync is a patient-specific replica of glucose, insulin action and heart rate, trained on what a CGM and a wrist wearable actually deliver: irregular samples, warm-up gaps, charging gaps, Bluetooth dropouts. Gaps are the product, not a footnote.',
    climax: 'The trace breaks. The ODE does not invent a patient.',
    sfx: 'PULSE',
    quote: {
      speaker: 'The Clinician',
      text: 'If the model fills a charging gap with a pretty curve, it has already failed the person who owns the phone.',
    },
    beats: [
      { id: 'b1', kind: 'narration', text: 'A five-minute grid. A six-hour window. Half the points are a mask, not a value.' },
      { id: 'b2', kind: 'speech', speaker: 'The Clinician', text: 'Continuous time is not romance. It is the only honest way to step over a hole.' },
      { id: 'b3', kind: 'narration', text: 'Reverse mode through RK4 is handwritten in NumPy. The cohort release wears a DP budget. The phone is the compute node.' },
      { id: 'b4', kind: 'sfx', text: 'PULSE' },
    ],
    problem:
      'Discrete recurrent models rot when the wearable drops. A clinical twin that cannot say “I do not know” during a gap is a liability. The other bottleneck is releasing a cohort without releasing a person.',
    approach:
      'Physiology stand-in, Neural ODE versus a recurrent baseline, imputation under a mask, reverse-mode RK4 in NumPy, ONNX graph plus an RK4 runtime for the phone, DP on the cohort export.',
    result:
      'The question is whether the continuous-time model degrades more gracefully when sensors go quiet, and whether it is small enough to run on-device. The static board is a JS replica of that RK4 engine, not a screenshot of Streamlit.',
    lesson:
      'A wearable twin that only looks good on complete traces is a lab toy. Missingness is the environment.',
    asset: 'Person + CGM (5 min) + wrist wearable (1 min), phone as the node',
    bottleneck: 'Continuous-time modelling under dropout; privacy-preserving cohort release',
    honesty:
      'The physiology is a stand-in, not a de-identified ICU extract. No real patient is in this volume. DP is a release layer, not a claim that the twin is a medical device.',
    topology:
      'wearable → Parquet lake → windows + masks\nnode.py (RK4 + reverse mode) vs recurrent → ONNX + JS replica',
    docs: [
      {
        title: 'Dynamics',
        body: 'Glucose, insulin action, heart rate as a continuous state. RK4 on a five-minute step. Reverse mode is handwritten so the adjoint does not disappear into a framework.',
      },
      {
        title: 'Gaps',
        body: 'Windows carry a mask. Imputation is scored against held-out dropouts, not against a fully observed fantasy. The board paints the mask as a first-class series.',
      },
      {
        title: 'Edge',
        body: 'ONNX dynamics graph plus RK4 runtime. The docs quote ~22 µs per five-minute step on a laptop CPU. Per-patient embedding stays on the device.',
      },
      {
        title: 'Privacy',
        body: 'HMAC device id to a pseudonym. Cohort aggregates go through a DP layer before they leave the lake. The dashboard never shows a raw identifiable trace.',
      },
    ],
    metrics: { Step: '~22 µs', Grid: '5 min', Window: '6 h', Release: 'DP cohort' },
    stackParts: ['NumPy ODE', 'Parquet', 'ONNX', 'Streamlit', 'JS RK4 replica'],
  },
  oceanicos: {
    kanji: '港',
    volume: 'VOL. 02 · CH. 04',
    pageStart: 27,
    art: '/manga/chapter-luffy.png',
    hook: 'Same schedule. Two policies. A yard that is allowed to jam.',
    premise:
      'OceanicOS is an automated container terminal: two berths, six ship-to-shore cranes, 32 yard blocks, 16 AGVs, one gate. The twin runs the terminal forward as a discrete-event world. The product is the assignment matrix that lives inside it.',
    climax: 'The second vessel lands. The Hungarian still has a lane.',
    sfx: 'HORN',
    quote: {
      speaker: 'The Yard',
      text: 'If your forecast does not add up from service to line to terminal, I will stack boxes in the aisle and call it a model.',
    },
    beats: [
      { id: 'o1', kind: 'narration', text: 'A heap of events. Cranes, AGVs, a gate. The clock is simulated time, not a slider.' },
      { id: 'o2', kind: 'speech', speaker: 'The Yard', text: 'Pair the box to the AGV. Pair the AGV to a block that is not already drowning.' },
      { id: 'o3', kind: 'narration', text: 'A spatio-temporal readout on the road graph. Holt-Winters plus MinT so the hierarchy does not leak. Canvas, not a map product.' },
      { id: 'o4', kind: 'sfx', text: 'HORN' },
    ],
    problem:
      'A terminal twin that only animates cranes is a toy. The jam is in the assignment: AGVs to boxes, boxes to blocks, under a traffic forecast that has to reconcile across levels.',
    approach:
      'Stdlib heap DES, NetworkX road graph, Hungarian pairing, a GBM/spatio-temporal readout for lane density, hierarchical volume plus MinT, dwell shrinkage, FastAPI with a WebSocket replay.',
    result:
      'Forty-eight simulated hours under two policies on the same vessel schedule. The board is the assignment matrix and the yard, not a KPI poster. Everything is synthetic — the claim is the method under controlled comparison.',
    lesson:
      'If the two policies never share a seed, you are not racing dispatchers. You are filming two different ports.',
    asset: '2 berths × 3 STS cranes, 4×8 yard blocks, 16 AGVs, one truck gate',
    bottleneck: 'Spatio-temporal lane density; hierarchical volume that must add up',
    honesty:
      'Vessel schedule, dwell distributions and layout are invented. Runtime is about a minute on a laptop CPU for the 48 h pair. Not a claim about a named port.',
    topology:
      'layout graph → heap DES → assign/hungarian.py\nST readout + Holt-Winters/MinT → FastAPI WS → canvas board',
    docs: [
      {
        title: 'DES',
        body: 'Priority heap of crane, AGV, yard and gate events. State is the yard fill and the jobs in flight. There is no commercial DES engine in this twin on purpose.',
      },
      {
        title: 'Assignment',
        body: 'Hungarian pairing of AGVs to jobs, then a block score that punishes fill, travel and predicted lane density. The matrix is the product.',
      },
      {
        title: 'Hierarchy',
        body: 'Volumes at terminal, line and service must add. MinT reconciliation sits on Holt-Winters so a pretty line forecast cannot invent boxes the gate never saw.',
      },
      {
        title: 'API',
        body: 'REST plan endpoints and a WebSocket replay of the event log. The dashboard is a consumer, not the source of truth.',
      },
    ],
    metrics: { Berths: '2', AGVs: '16', Horizon: '48 h', Pairing: 'Hungarian' },
    stackParts: ['heap DES', 'NetworkX', 'Hungarian', 'Holt-Winters / MinT', 'FastAPI WS'],
  },
  forgex: {
    kanji: '鍛',
    volume: 'VOL. 02 · CH. 05',
    pageStart: 35,
    art: '/manga/chapter-kratos.png',
    hook: 'Acoustics catch the bearing. Vision catches the leak. The model does not restart the cell.',
    premise:
      'ForgeX is a six-axis cell twin. Late fusion: acoustics, current, a camera. The interlock is not part of the model. HOLD will not self-reset. ESTOP latches. The desk scores a later shift, not the labelled fit set — otherwise the latch stays down for the whole comic page.',
    climax: 'HOLD. The arm freezes. Nobody in the room calls it a false positive.',
    sfx: 'CLANG',
    quote: {
      speaker: 'The Cell',
      text: 'You may score me. You do not get to start me. A human turns the key.',
    },
    beats: [
      { id: 'f1', kind: 'narration', text: 'A cycle ends. Nine acoustic bands, four current features, nine vision features. The mesh sings at 400–440 Hz.' },
      { id: 'f2', kind: 'speech', speaker: 'The Cell', text: 'If vision AUC collapses when you pull leaks out of the labels, the camera is doing its job and only its job.' },
      { id: 'f3', kind: 'narration', text: 'The friction/thermal residual is a second input to the FSM, not a fourth logit. Mixing it in hides a cooling-duct fault as “just another score.”' },
      { id: 'f4', kind: 'sfx', text: 'CLANG' },
    ],
    problem:
      'A cell twin that lets the model restart motion is a safety cartoon. Fusion is easy to fake if you train and score the same shift. The bottleneck is late fusion that stays inspectable, plus an interlock the logit cannot talk down.',
    approach:
      'OpenCV vision block, scipy STFT to hand bands, IsolationForest as an unsupervised trip, logistic on the same stack with leave-one-block-out AUC, a HOLD/ESTOP FSM, Three.js arm on the board.',
    result:
      'Published scores live on a later shift. Acoustic AUC stays high; vision AUC is allowed to be lower — that is the leak detector, not a failed ensemble. HOLD at 0.65 or 8 K residual. Two HOLDs or a stall flag become ESTOP.',
    lesson:
      'The model proposes. The interlock disposes. If those are one function, you do not have a cell twin.',
    asset: 'Six-axis arm, drive current, 16 kHz mic, overhead camera',
    bottleneck: 'Inspectable late fusion; a safety FSM the logit cannot reset',
    honesty:
      'Cycles are synthetic. The FSM is scored on a later shift than the fit set so ESTOP does not latch the whole page. No claim that this replaces a certified safety PLC.',
    topology:
      'cycle → STFT bands + current + vision → IsolationForest + logit\nresidual ─► FSM (NORMAL / WATCH / HOLD / ESTOP) → Three.js board',
    docs: [
      {
        title: 'STFT',
        body: '16 kHz, 0.25 s, nperseg 256. Band means at 80–160 through 1600–4000 Hz plus crest factor. The 400–440 Hz bin is the mesh. Wear lives next door. No spectrogram image model in the cabinet.',
      },
      {
        title: 'Fusion',
        body: 'Unsupervised forest for the trip light. Logistic for the published score. Leave-one-block-out AUC says which modality is carrying which fault. Residual stays outside the logit.',
      },
      {
        title: 'FSM',
        body: 'score < 0.35 and residual < 4 K → NORMAL. ≥ 0.35 or 4 K → WATCH. ≥ 0.65 or 8 K → HOLD. Stall or two HOLDs in five cycles → ESTOP. HOLD does not self-reset.',
      },
      {
        title: 'Board',
        body: 'Three.js arm plus FFT strip. JSON logit is the artefact. The desk is allowed to look slow. It is not allowed to look unlocked.',
      },
    ],
    metrics: { Bands: '9 + crest', FSM: 'HOLD / ESTOP', Score: 'later shift', Arm: 'Three.js' },
    stackParts: ['OpenCV', 'scipy STFT', 'IsolationForest', 'logit + FSM', 'Three.js'],
  },
  terratwin: {
    kanji: '畑',
    volume: 'VOL. 02 · CH. 06',
    pageStart: 43,
    art: '/manga/chapter-naruto.png',
    hook: 'Eight towers. A disease that walks. The toml is the truth file — the learner is allowed to lose.',
    premise:
      'TerraTwin is closed-loop climate for a vertical farm. Fitted Q-iteration on facility-wide features. Infection is a spatial SIR that walks to face-adjacent trays. FQI is raced against a setpoint PID on the same seed. On the last quick run, FQI lost. That stays on the page.',
    climax: 'The neighbour tray goes white. The reward already knew.',
    sfx: 'DRIP',
    quote: {
      speaker: 'The Grower',
      text: 'If your policy beats PID only after you hide the seed, it is not a controller. It is a paragraph.',
    },
    beats: [
      { id: 't1', kind: 'narration', text: 'Fifteen-minute steps. Floor trays run warmer. That bias lives in the climate step, not as a stored column the learner can treat as a knob.' },
      { id: 't2', kind: 'speech', speaker: 'The Grower', text: 'Disease is not something you cure on a fifteen-minute action. It is a tax on letting RH sit high next to an infected neighbour.' },
      { id: 't3', kind: 'narration', text: 'One replica in the cluster. Kubernetes only restarts it. Weights come from outputs/q_weights.npy after python main.py.' },
      { id: 't4', kind: 'sfx', text: 'DRIP' },
    ],
    problem:
      'A farm twin that only paints a pretty rack is a greenhouse brochure. The work is a climate loop whose reward a grower can retune without rewriting the feature code — and a learner that can lose to a boring PID.',
    approach:
      'facility.toml as the truth file, numpy FQI on facility means and tails, spatial SIR on face-adjacent trays, a Holt yield stand-in, SVG rack board, k8s/systemd for a single replica.',
    result:
      'FQI and PID share a seed. Yield, energy and infection are published together. Last quick run: FQI yield 0.583 versus PID 0.605. The board does not swap the labels.',
    lesson:
      'Closed loop means the controller can be worse. If you only ship the winner, you are writing marketing.',
    asset: 'Eight towers, layered trays, 15-minute climate step',
    bottleneck: 'Facility-wide FQI versus PID; spatial infection as a tax, not a cure',
    honesty:
      'Last quick run, FQI lost to PID on yield (0.583 vs 0.605). The forecast module is forecast/holt.py — yield is a reserved word in Python and is not an import path. Not a claim about a named glasshouse.',
    topology:
      'config/facility.toml → climate + spatial SIR → FQI vs PID\noutputs/q_weights.npy → k8s/systemd loop → SVG board',
    docs: [
      {
        title: 'Reward',
        body: 'w_y · yield(PPFD, T, EC) − w_e · kWh · tariff − w_d · mean infection − w_ℓ · trays outside limits. Weights live in the toml so a grower can retune without a retrain of the feature code.',
      },
      {
        title: 'Sensors',
        body: 'One row per tray per 15 minutes: tower, layer, slot, temp, RH, EC, PPFD, infected. Neighbours are face-adjacent. Stack bias is applied in the climate step, never persisted as a controllable.',
      },
      {
        title: 'Learner',
        body: 'FQI on facility means, 90th percentile temp/RH, mean infection. Per-tray actions are out of scope. The PID baseline uses the same setpoint bands on the same seed.',
      },
      {
        title: 'Deploy',
        body: 'One replica. docker build + kubectl apply, or systemd enable. The cluster restarts the loop. It does not train it.',
      },
    ],
    metrics: { Towers: '8', Step: '15 min', Race: 'FQI vs PID', Truth: 'facility.toml' },
    stackParts: ['TOML', 'numpy FQI', 'spatial SIR', 'k8s / systemd', 'SVG'],
  },
};

export function storyByTwin(id: string) {
  return twinStories[id];
}
