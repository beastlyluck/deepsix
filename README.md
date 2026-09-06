# DEEPSIX — Atharva Khaire's data-science portfolio

A manga-manuscript portfolio built with React, TypeScript, Tailwind and React Three Fiber. Six chapters, each narrated by an original figure, present eighteen grounded analytics case studies as comic-book pages with live, in-browser demos. Every case has runnable source in `projects/`.

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
