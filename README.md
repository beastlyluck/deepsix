# www.DEEPSIX.com

Live site: [https://deepsix-pi.vercel.app](https://deepsix-pi.vercel.app)

**Atharva Jitendra Khaire** · Master of Data Science, Monash University · Melbourne.

DEEPSIX is a data-science volume you can walk through. Career, coursework and six digital twins are told as figures, comic pages and live boards. Volume Two is the main work. Volume One is how the career is told. Every case has runnable source in `projects/` and its own public repo.

Coursework for the Master of Data Science is complete. Professional practice (FIT5122) and the industry studio (FIT5120) are in progress.

> The world is no longer a dataset. It is a twin that breathes.

## Volume Two

| Figure | Twin | Repo |
|---|---|---|
| Thor | AeroTwin — 400 Hz edge policy, held-out S2R gap | [aerotwin](https://github.com/beastlyluck/aerotwin) |
| Batman | GridPulse — dispatch LP vs physics-informed rating | [gridpulse](https://github.com/beastlyluck/gridpulse) |
| Iron Man | BioSync — RK4 wearable replica, DP cohort | [biosync](https://github.com/beastlyluck/biosync) |
| Luffy | OceanicOS — assignment matrix for a live yard | [oceanicos](https://github.com/beastlyluck/oceanicos) |
| Kratos | ForgeX — fusion score and a HOLD that will not self-reset | [forgex](https://github.com/beastlyluck/forgex) |
| Naruto | TerraTwin — closed-loop climate, FQI vs PID | [terratwin](https://github.com/beastlyluck/terratwin) |

Stacks are not shared across twins on purpose.

## Volume One

Six chapters (Illusionist through Weaver) and four Victorian field desks: occupancy twins, night-economy DiD, campus load, SKU hierarchy, uplift, synthetic control, land-use change, inspection KPIs, nightly warehouses, score APIs, supplier graphs, fraud rings.

## What is in the book

| Route | Page | What it is |
|-------|------|------------|
| `/` | Cover & Contents | 3D DEEPSIX mark, prologue, table of contents |
| `/itachi` | Ch. 01 · The Illusionist | Synthetic & counterfactual analytics — ward twin, night-economy DiD, manuscript intel |
| `/goku` | Ch. 02 · The Singularity | Forecasting & monitoring — campus load, MinT SKU hierarchy, model watch desk |
| `/vegeta` | Ch. 03 · The Prince | Causal inference & simulation — retention uplift / Qini, fare synthetic control, warehouse twin |
| `/zoro` | Ch. 04 · The Swordsman | Vision, geospatial & quality — EuroSAT land-use change, inspection KPIs, robustness audit |
| `/optimus` | Ch. 05 · The Prime | Analytics engineering & serving — nightly dbt fabric, score API with reason codes, exec KPI twin |
| `/spiderman` | Ch. 06 · The Weaver | Graph analytics — supplier-risk graph, collaboration map, explainable fraud-ring pack |
| `/figures` | Figure Vault | The 3D mark unfolds into six orbitable, selectable figures |
| `/resume` | Character Sheet | Résumé (PDF + comic-page layout), Monash MDS coursework, skills |
| `/contact` | Afterword | Contact |

Tabs turn like book pages (`PageTransition`). Each chapter page is a splash (3D figure), an opening comic page, and one comic page per project: **Problem → Approach → Live demo → Result → Lesson → Files**. Click any panel to enlarge it for reading.

## Projects folder

`projects/<id>/` holds a `README.md` and a self-contained `main.py` for each case (synthetic stand-ins for the public datasets so everything runs offline). See `projects/README.md` for the index. The React demos in `src/demos/` mirror the same methods in the browser.

## Tech

React 18 · TypeScript · Vite · Tailwind · React Three Fiber + drei + postprocessing · GSAP · React Router. All 3D is procedural (no licensed models): figures are original silhouettes that echo the chapter art in `public/manga/`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run preview
npm run typecheck
```

## Structure

```
src/
  components/
    comic/        ComicPanel, PanelLightbox, ProjectSpread (comic-page layout)
    manga/        ChapterManuscript (chapter page)
    three/        Logo3D, ChapterFigure, ChapterScene, VaultScene, SceneBackdrop
    ui/           Navigation, Hero, SkillsRadar, ...
    layout/       PageTransition (book flip), ScrollProgress, SiteFooter
  demos/          Interactive demos, one per project id (registry.ts)
  data/           profile, story, projectStories, coursework, skills, experience
  pages/          Home, FigureVault, Resume, Contact
  systems/manga/  Halftone, SFX, speech bubbles, reader context
projects/         Runnable Python for all 18 cases
public/manga/     Chapter splash art · public/resume/ résumé PDF
```

## License

MIT.
