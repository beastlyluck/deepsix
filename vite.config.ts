import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const twinIds = ['aerotwin', 'gridpulse', 'biosync', 'oceanicos', 'forgex', 'terratwin'];

function copyTwinBoards() {
  const destRoot = path.resolve(__dirname, 'public', 'boards');
  fs.mkdirSync(destRoot, { recursive: true });
  for (const id of twinIds) {
    const siteSrc = path.resolve(__dirname, 'projects', id, 'site');
    const docsSrc = path.resolve(__dirname, 'projects', id, 'docs');
    if (!fs.existsSync(siteSrc)) continue;
    const siteDest = path.join(destRoot, id);
    fs.cpSync(siteSrc, siteDest, { recursive: true });
    if (fs.existsSync(docsSrc)) {
      fs.cpSync(docsSrc, path.join(siteDest, 'docs'), { recursive: true });
    }
  }
}

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function sendTwinFile(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0] ?? '';
  const match = url.match(/^\/boards\/([a-z]+)(?:\/(.*))?$/);
  if (!match || !twinIds.includes(match[1])) return next();
  const id = match[1];
  const rest = match[2] || 'index.html';
  const rel = rest.startsWith('docs/')
    ? path.join('docs', rest.slice('docs/'.length) || 'index.html')
    : path.join('site', rest || 'index.html');
  const root = path.resolve(__dirname, 'projects', id);
  const file = path.resolve(root, rel);
  const escaped = path.relative(root, file);
  if (escaped.startsWith('..') || path.isAbsolute(escaped) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return next();
  }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}

function twinBoardsPlugin(): Plugin {
  return {
    name: 'twin-boards',
    buildStart() {
      copyTwinBoards();
    },
    configureServer(server) {
      copyTwinBoards();
      return () => {
        server.middlewares.use((req, res, next) => sendTwinFile(req, res, next));
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), twinBoardsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@data': path.resolve(__dirname, './src/data'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@shaders': path.resolve(__dirname, './shaders'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', 'three-stdlib'],
          'r3f-vendor': ['@react-three/fiber', '@react-three/drei', '@react-three/rapier', '@react-three/postprocessing'],
          'gsap-vendor': ['gsap', '@gsap/react'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
});