import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@typescript-eslint': typescriptEslint,
    },
    settings: {
      react: {version: '18.3'},
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    },
  },
  {
    // Aturan UI: panel mengikuti tema host, kontrol HTML native hanya dipakai
    // sebagai jalan terakhir dan harus punya alasan di komentar.
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'react/forbid-elements': [
        'warn',
        {
          forbid: [
            {
              element: 'select',
              message: 'Pakai SelectField dari @/components/ui/select-field (lihat docs/rules/react-ui.md).',
            },
            {
              element: 'table',
              message: 'Panel ini tidak memakai tabel; susun dengan list atau grid (lihat docs/rules/react-ui.md).',
            },
          ],
        },
      ],
    },
  },
  prettier,
  {
    ignores: ['lib/**', 'node_modules/**', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'],
  },
];
