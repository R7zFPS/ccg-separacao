import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // PWA para instalação no celular sem loja de apps
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'CCG Separação — Casa das Correntes',
        short_name: 'CCG Separação',
        description: 'Sistema de separação de estoque e logística da Casa das Correntes Guanabara.',
        theme_color: '#092D56',
        background_color: '#051D3A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Nova Solicitação',
            url: '/solicitacoes/nova',
            description: 'Criar uma nova solicitação de separação',
          },
          {
            name: 'Fila de Separação',
            url: '/fila',
            description: 'Ver a fila de pedidos para separar',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Aumenta o limite do aviso para 600kb (bundles modernos com React são maiores)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa React e bibliotecas principais em vendor chunk (cacheável)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Ícones Lucide separados (biblioteca grande)
          'vendor-lucide': ['lucide-react'],
          // Axios separado
          'vendor-axios': ['axios'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,   // expõe na rede local (celulares no mesmo WiFi)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,   // habilita proxy de WebSocket
      },
    },
  },
});
