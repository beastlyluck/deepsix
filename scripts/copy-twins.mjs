import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = ['aerotwin', 'gridpulse', 'biosync', 'oceanicos', 'forgex', 'terratwin'];

export function copyTwins(destRoot = path.join(root, 'public', 'boards')) {
  fs.mkdirSync(destRoot, { recursive: true });
  for (const id of ids) {
    const siteSrc = path.join(root, 'projects', id, 'site');
    const docsSrc = path.join(root, 'projects', id, 'docs');
    const siteDest = path.join(destRoot, id);
    if (!fs.existsSync(siteSrc)) continue;
    fs.cpSync(siteSrc, siteDest, { recursive: true });
    if (fs.existsSync(docsSrc)) {
      fs.cpSync(docsSrc, path.join(siteDest, 'docs'), { recursive: true });
    }
  }
}

copyTwins();
