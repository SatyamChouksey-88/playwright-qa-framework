module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'playwright'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/recommended',
    'prettier',
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'playwright-report/',
    'blob-report/',
    'scripts/',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-console': 'off',
    // Probe/demo scripts may need fixed delays; never allow them in tests/pages.
    'playwright/no-wait-for-timeout': 'error',
    'playwright/no-networkidle': 'error',
    'playwright/prefer-web-first-assertions': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*.ts', 'src/**/*.ts'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
      },
    },
  ],
};
