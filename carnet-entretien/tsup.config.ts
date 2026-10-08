import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/server/index.ts' },
  outDir: 'dist/server',
  format: 'esm',
  platform: 'node',
  target: 'node22',
  tsconfig: 'tsconfig.server.json',
  clean: true,
  sourcemap: true,
});
