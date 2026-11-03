import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const envDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, 'VITE_')
  if (!env.VITE_API_BASE_URL?.trim()) {
    throw new Error('Set VITE_API_BASE_URL in frontend/.env or the build environment before starting or building the frontend.')
  }

  return {
    envDir,
    plugins: [react()],
  }
})
