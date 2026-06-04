import pluginJs from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFileGlob = '**/*.{ts,tsx,js,jsx}';
const testFileGlob = '**/{test,tests,__tests__}/**/*.{test,spec}.{ts,tsx,js,jsx}';

const restrictedBackendImports = [
  '@aida/auth',
  '@aida/permissions',
  '@aida/storage',
  '@aida/conversations',
  '@aida/agents',
  '@aida/rag',
  '@aida/tools',
  '@aida/tasks',
  '@aida/events',
  '@aida/observability',
  '@aida/profiles',
  '@aida/config',
  '@aida/config/server',
  '@aida/config/worker',
];

const restrictedFrontendSupabaseImports = [
  {
    name: '@supabase/server',
    message: 'Use src/lib/supabase/supabaseClient.ts in frontend apps. @supabase/server is backend-only.',
  },
  {
    name: '@supabase/server/adapters/hono',
    message: 'Use src/lib/supabase/supabaseClient.ts in frontend apps. @supabase/server is backend-only.',
  },
];

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'apps/**/.next/**',
      'apps/**/coverage/**',
      'packages/**/coverage/**',
      'coverage/**',
      '.turbo/**',
      'out/**',
      'build/**',
      'dist/**',
      'apps/**/dist/**',
      'packages/**/dist/**',
      'packages/api-client/src/generated/**',
      '**/next-env.d.ts',
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [sourceFileGlob],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@next/next': pluginNext,
    },
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs['jsx-runtime'].rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
      '@next/next/no-html-link-for-pages': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          functions: true,
          classes: true,
          variables: true,
          typedefs: false,
        },
      ],
    },
  },
  {
    files: [testFileGlob],
    plugins: {
      react: pluginReact,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-empty': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: [
      'apps/chat/**/*.{ts,tsx,js,jsx}',
      'apps/vault/**/*.{ts,tsx,js,jsx}',
      'apps/identity/**/*.{ts,tsx,js,jsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [...restrictedBackendImports, ...restrictedFrontendSupabaseImports] },
      ],
    },
  },
];
