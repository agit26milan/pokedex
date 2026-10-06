const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['android/**', 'ios/**', 'dist/**', 'design/**', 'node_modules/**'],
  },
  {
    // Pinned instead of 'detect': eslint-plugin-react's detector crashes on the
    // ESLint version resolved here, while the explicit version path does not.
    settings: { react: { version: '19.2.3' } },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Last so they win: build tooling and the Jest setup file run under Node/Jest.
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', require: 'readonly', module: 'writable', __dirname: 'readonly' },
    },
  },
]);
