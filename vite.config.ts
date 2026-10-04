import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  // Relative paths so the build works at any URL, including /pianist/ on GitHub Pages.
  base: './',
  plugins: [solid()],
})
