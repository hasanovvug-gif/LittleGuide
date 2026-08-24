import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const cleanEnv = (value?: string) => value?.trim() ?? '';
    const geminiApiKey = cleanEnv(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
    const paidApiKey = cleanEnv(env.PAID_API_KEY || env.VITE_API_KEY || geminiApiKey);
    const viteGeminiApiKey = cleanEnv(env.VITE_GEMINI_API_KEY || geminiApiKey);
    const viteApiKey = cleanEnv(env.VITE_API_KEY || paidApiKey);

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.PAID_API_KEY': JSON.stringify(paidApiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(viteGeminiApiKey),
        'process.env.VITE_API_KEY': JSON.stringify(viteApiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
