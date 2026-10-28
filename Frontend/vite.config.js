
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pwaConfig } from './config/pwa.config';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pwaConfig(),
  ],
});
