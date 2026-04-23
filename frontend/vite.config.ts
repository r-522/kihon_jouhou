import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // ローカル開発時: Rustバックエンド(port 8080)へAPIリクエストをプロキシ
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
