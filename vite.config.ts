import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This allows the code to continue using process.env.API_KEY
      // even though Vite usually uses import.meta.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})