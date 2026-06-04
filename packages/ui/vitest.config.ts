import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [tailwindcss()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary'],
            reportsDirectory: './coverage',
            exclude: [
                '**/*.config.{js,ts,mjs,cjs}',
                '**/dist/**',
                '**/build/**',
                '**/coverage/**',
                '**/.next/**',
                '**/*.d.ts',
            ],
        },
    },
});
