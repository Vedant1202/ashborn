import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  // makes the built file directly executable as the `ashborn` bin
  banner: { js: '#!/usr/bin/env node' },
});
