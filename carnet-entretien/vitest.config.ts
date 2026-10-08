import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

const alias = {
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
  '@client': fileURLToPath(new URL('./src/client', import.meta.url)),
  '@server': fileURLToPath(new URL('./src/server', import.meta.url)),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        resolve: { alias },
        test: { name: 'api', include: ['tests/api/**/*.test.ts'], environment: 'node' },
      },
    ],
  },
});
