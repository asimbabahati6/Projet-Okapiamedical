import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Custom plugin to handle problematic locked files in public/
const skipProblematicFiles = () => ({
  name: 'skip-problematic-files',
  buildStart() {
    const problematic = [
      path.resolve(__dirname, 'public/image copy copy.png'),
      path.resolve(__dirname, 'public/image copy.png'),
    ];
    for (const f of problematic) {
      try {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
          console.log(`Removed problematic file: ${path.basename(f)}`);
        }
      } catch {
        // File is locked at OS level — skip it silently
      }
    }
  },
  closeBundle() {
    // Safe-copy public dir to dist, skipping any locked files
    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    const skip = new Set(['image copy.png', 'image copy copy.png', 'image-copy.png']);
    try {
      const entries = fs.readdirSync(publicDir);
      for (const entry of entries) {
        if (skip.has(entry)) continue;
        const src = path.join(publicDir, entry);
        const dest = path.join(distDir, entry);
        try {
          const stat = fs.statSync(src);
          if (stat.isFile() && !fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        } catch {
          // skip locked/inaccessible files
        }
      }
    } catch {
      // ignore
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [skipProblematicFiles(), react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'd3',
      'd3-array',
      'd3-axis',
      'd3-scale',
      'd3-selection',
      'd3-shape',
      'd3-time',
      'd3-time-format',
      'd3-transition',
      'd3-interpolate',
      'd3-color',
      'd3-format',
      'd3-ease',
      'docx'
    ],
  },
});
