import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThemeProvider } from './components/ui/ThemeProvider';
import { Navigation } from './components/ui/Navigation';
import { ScrollProgress } from './components/layout/ScrollProgress';
import { PageTransition } from './components/layout/PageTransition';
import { MangaManuscriptProvider } from './systems/manga/MangaManuscript';
import { SoundscapeProvider } from './audio/Soundscape';

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const ZoroPage = lazy(() => import('./components/characters/zoro/ZoroPage').then((m) => ({ default: m.ZoroPage })));
const GokuPage = lazy(() => import('./components/characters/goku/GokuPage').then((m) => ({ default: m.GokuPage })));
const ItachiPage = lazy(() => import('./components/characters/itachi/ItachiPage').then((m) => ({ default: m.ItachiPage })));
const OptimusPage = lazy(() => import('./components/characters/optimus/OptimusPage').then((m) => ({ default: m.OptimusPage })));
const VegetaPage = lazy(() => import('./components/characters/vegeta/VegetaPage').then((m) => ({ default: m.VegetaPage })));
const SpiderManPage = lazy(() =>
  import('./components/characters/spiderman/SpiderManPage').then((m) => ({ default: m.SpiderManPage }))
);
const ContactPage = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const FigureVaultPage = lazy(() => import('./pages/FigureVault').then((m) => ({ default: m.FigureVault })));
const ResumePage = lazy(() => import('./pages/Resume').then((m) => ({ default: m.Resume })));
const TwinsPage = lazy(() => import('./pages/Twins').then((m) => ({ default: m.Twins })));
const TwinDeskPage = lazy(() => import('./pages/TwinDesk').then((m) => ({ default: m.TwinDesk })));
const TwinFigurePage = lazy(() => import('./pages/TwinFigurePage').then((m) => ({ default: m.TwinFigurePage })));

const LoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink">
    <div className="text-center">
      <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <p className="font-ui text-paper/60">Loading manuscript...</p>
    </div>
  </div>
);

function MainLayout() {
  return (
    <>
      <Navigation />
      <ScrollProgress />
      <PageTransition />
      <main className="relative z-10 min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.config({ nullTargetWarn: false });
  }, []);

  return (
    <ThemeProvider>
      <SoundscapeProvider>
      <MangaManuscriptProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/twins" element={<TwinsPage />} />
            <Route path="/twins/:id" element={<TwinDeskPage />} />
            <Route path="/thor" element={<TwinFigurePage />} />
            <Route path="/batman" element={<TwinFigurePage />} />
            <Route path="/ironman" element={<TwinFigurePage />} />
            <Route path="/luffy" element={<TwinFigurePage />} />
            <Route path="/kratos" element={<TwinFigurePage />} />
            <Route path="/naruto" element={<TwinFigurePage />} />
            <Route path="/zoro" element={<ZoroPage />} />
            <Route path="/goku" element={<GokuPage />} />
            <Route path="/itachi" element={<ItachiPage />} />
            <Route path="/optimus" element={<OptimusPage />} />
            <Route path="/vegeta" element={<VegetaPage />} />
            <Route path="/spiderman" element={<SpiderManPage />} />
            <Route path="/figures" element={<FigureVaultPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </MangaManuscriptProvider>
      </SoundscapeProvider>
    </ThemeProvider>
  );
}
