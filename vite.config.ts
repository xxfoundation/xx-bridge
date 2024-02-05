import fs from 'fs'
import path from 'path'

import type { TsconfigRaw } from 'esbuild'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tsconfigContents = await fs.promises.readFile(
    path.resolve(__dirname, 'tsconfig.json'),
    'utf-8'
  )
  // Read the tsconfig.json file
  const tsconfig = JSON.parse(tsconfigContents) as TsconfigRaw

  // Extract the paths from tsconfig and convert them to Vite format
  const vitePaths: Record<string, string> = {}
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
    Object.keys(tsconfig.compilerOptions.paths).forEach(key => {
      const value =
        tsconfig?.compilerOptions?.paths &&
        tsconfig?.compilerOptions?.paths[key][0].replace(/\/\*$/, '')
      vitePaths[key.replace(/\/\*$/, '')] = path.resolve(__dirname, value || '')
    })
  }

  console.log(vitePaths)

  return {
    plugins: [
      nodePolyfills({
        include: ['assert'],
        globals: {
          Buffer: true,
          global: true,
          process: true
        }
      }),
      react()
    ],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        ...vitePaths,
        // Polyfills
        assert: 'vite-plugin-node-polyfills/polyfills/assert'
      }
    }
  }
})
