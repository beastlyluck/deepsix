export function getPerformanceTier(): 'low' | 'medium' | 'high' {
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection;

  if (memory >= 16 && cores >= 8) return 'high';
  if (memory >= 8 && cores >= 4) return 'medium';
  return 'low';
}

export function getOptimalParticleCount(tier: 'low' | 'medium' | 'high', baseCount: number): number {
  const multipliers = { low: 0.25, medium: 0.5, high: 1.0 };
  return Math.floor(baseCount * multipliers[tier]);
}

export function getOptimalShadowMapSize(tier: 'low' | 'medium' | 'high'): number {
  const sizes = { low: 512, medium: 1024, high: 2048 };
  return sizes[tier];
}

export function shouldUseWebGPU(): boolean {
  return 'gpu' in navigator && getPerformanceTier() !== 'low';
}

export function shouldUseComputeShaders(): boolean {
  return shouldUseWebGPU() && getPerformanceTier() === 'high';
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export class PerformanceMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private callback: (fps: number, frameTime: number) => void;

  constructor(callback: (fps: number, frameTime: number) => void) {
    this.callback = callback;
  }

  tick() {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    this.frames.push(frameTime);
    if (this.frames.length > 60) this.frames.shift();
    this.lastTime = now;

    const avgFrameTime = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    const fps = 1000 / avgFrameTime;
    this.callback(fps, avgFrameTime);
  }

  getFPS(): number {
    if (this.frames.length === 0) return 60;
    const avgFrameTime = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    return 1000 / avgFrameTime;
  }

  getFrameTime(): number {
    if (this.frames.length === 0) return 16.67;
    return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }
}
