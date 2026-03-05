import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Custom plugin to handle problematic files
const skipProblematicFiles = () => ({
  name: 'skip-problematic-files',
  buildStart() {
    const problematicFile = path.resolve(__dirname, 'public/image copy copy.png');
    try {
      if (fs.existsSync(problematicFile)) {
        fs.unlinkSync(problematicFile);
        console.log('Removed problematic file: image copy copy.png');
      }
    } catch (err) {
      console.warn('Could not remove problematic file:', err);
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
    copyPublicDir: true,
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
