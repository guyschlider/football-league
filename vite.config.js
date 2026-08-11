import { defineConfig } from 'vite'

// Relative assets work locally and when the app is published under a GitHub Pages repository path.
export default defineConfig({ base: './' })
