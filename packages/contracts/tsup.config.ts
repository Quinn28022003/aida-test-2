import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/authz/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
});
