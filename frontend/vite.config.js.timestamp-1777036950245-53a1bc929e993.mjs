// vite.config.js
import { defineConfig } from "file:///sessions/laughing-stoic-curie/mnt/Documents/projeto-separacao/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/laughing-stoic-curie/mnt/Documents/projeto-separacao/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/laughing-stoic-curie/mnt/Documents/projeto-separacao/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/sessions/laughing-stoic-curie/mnt/Documents/projeto-separacao/frontend";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // PWA para instalação no celular sem loja de apps
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/icon.svg"],
      manifest: {
        name: "Separa\xE7\xE3o de Estoque \u2014 Casa das Correntes Guanabara",
        short_name: "CCG Separa\xE7\xE3o",
        description: "Sistema de gest\xE3o de separa\xE7\xE3o de estoque",
        theme_color: "#1e3a5f",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "pt-BR",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["business", "productivity"],
        shortcuts: [
          {
            name: "Nova Solicita\xE7\xE3o",
            url: "/solicitacoes/nova",
            description: "Criar uma nova solicita\xE7\xE3o de separa\xE7\xE3o"
          },
          {
            name: "Fila de Separa\xE7\xE3o",
            url: "/fila",
            description: "Ver a fila de pedidos para separar"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Aumenta o limite do aviso para 600kb (bundles modernos com React são maiores)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa React e bibliotecas principais em vendor chunk (cacheável)
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Ícones Lucide separados (biblioteca grande)
          "vendor-lucide": ["lucide-react"],
          // Axios separado
          "vendor-axios": ["axios"]
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvbGF1Z2hpbmctc3RvaWMtY3VyaWUvbW50L0RvY3VtZW50cy9wcm9qZXRvLXNlcGFyYWNhby9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2xhdWdoaW5nLXN0b2ljLWN1cmllL21udC9Eb2N1bWVudHMvcHJvamV0by1zZXBhcmFjYW8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2xhdWdoaW5nLXN0b2ljLWN1cmllL21udC9Eb2N1bWVudHMvcHJvamV0by1zZXBhcmFjYW8vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBQV0EgcGFyYSBpbnN0YWxhXHUwMEU3XHUwMEUzbyBubyBjZWx1bGFyIHNlbSBsb2phIGRlIGFwcHNcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdhcHBsZS10b3VjaC1pY29uLnBuZycsICdpY29ucy9pY29uLnN2ZyddLFxuICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogJ1NlcGFyYVx1MDBFN1x1MDBFM28gZGUgRXN0b3F1ZSBcdTIwMTQgQ2FzYSBkYXMgQ29ycmVudGVzIEd1YW5hYmFyYScsXG4gICAgICAgIHNob3J0X25hbWU6ICdDQ0cgU2VwYXJhXHUwMEU3XHUwMEUzbycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2lzdGVtYSBkZSBnZXN0XHUwMEUzbyBkZSBzZXBhcmFcdTAwRTdcdTAwRTNvIGRlIGVzdG9xdWUnLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyMxZTNhNWYnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2Y4ZmFmYycsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgb3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBsYW5nOiAncHQtQlInLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9pY29ucy9pY29uLnN2ZycsXG4gICAgICAgICAgICBzaXplczogJ2FueScsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9wd2EtMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvcHdhLTUxMng1MTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGNhdGVnb3JpZXM6IFsnYnVzaW5lc3MnLCAncHJvZHVjdGl2aXR5J10sXG4gICAgICAgIHNob3J0Y3V0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdOb3ZhIFNvbGljaXRhXHUwMEU3XHUwMEUzbycsXG4gICAgICAgICAgICB1cmw6ICcvc29saWNpdGFjb2VzL25vdmEnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDcmlhciB1bWEgbm92YSBzb2xpY2l0YVx1MDBFN1x1MDBFM28gZGUgc2VwYXJhXHUwMEU3XHUwMEUzbycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnRmlsYSBkZSBTZXBhcmFcdTAwRTdcdTAwRTNvJyxcbiAgICAgICAgICAgIHVybDogJy9maWxhJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmVyIGEgZmlsYSBkZSBwZWRpZG9zIHBhcmEgc2VwYXJhcicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIEF1bWVudGEgbyBsaW1pdGUgZG8gYXZpc28gcGFyYSA2MDBrYiAoYnVuZGxlcyBtb2Rlcm5vcyBjb20gUmVhY3Qgc1x1MDBFM28gbWFpb3JlcylcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDYwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gU2VwYXJhIFJlYWN0IGUgYmlibGlvdGVjYXMgcHJpbmNpcGFpcyBlbSB2ZW5kb3IgY2h1bmsgKGNhY2hlXHUwMEUxdmVsKVxuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgLy8gXHUwMENEY29uZXMgTHVjaWRlIHNlcGFyYWRvcyAoYmlibGlvdGVjYSBncmFuZGUpXG4gICAgICAgICAgJ3ZlbmRvci1sdWNpZGUnOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICAgICAgICAgIC8vIEF4aW9zIHNlcGFyYWRvXG4gICAgICAgICAgJ3ZlbmRvci1heGlvcyc6IFsnYXhpb3MnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAnL3VwbG9hZHMnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1WSxTQUFTLG9CQUFvQjtBQUNwYSxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGVBQWUsQ0FBQyxlQUFlLHdCQUF3QixnQkFBZ0I7QUFBQSxNQUN2RSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixPQUFPO0FBQUEsVUFDTDtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYO0FBQUEsUUFDRjtBQUFBLFFBQ0EsWUFBWSxDQUFDLFlBQVksY0FBYztBQUFBLFFBQ3ZDLFdBQVc7QUFBQSxVQUNUO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixLQUFLO0FBQUEsWUFDTCxhQUFhO0FBQUEsVUFDZjtBQUFBLFVBQ0E7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLEtBQUs7QUFBQSxZQUNMLGFBQWE7QUFBQSxVQUNmO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsVUFFekQsaUJBQWlCLENBQUMsY0FBYztBQUFBO0FBQUEsVUFFaEMsZ0JBQWdCLENBQUMsT0FBTztBQUFBLFFBQzFCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
