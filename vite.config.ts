import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // three.js 本体が大きいので警告のしきい値だけ上げる
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
  },
})
