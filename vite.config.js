import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  /* `vite build` writes into dist/ inside the project root, and the dev
   * server watches the root — without this, every production build kicks the
   * running page into a storm of full reloads. */
  server: { open: true, watch: { ignored: ['**/dist/**'] } },
})
