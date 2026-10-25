// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');

/**
 * Layer boundaries: features → shared/core (and layout widgets like ThemeToggle), layout →
 * shared/core, shared → nothing app-specific (third-party libs such as Transloco are fine).
 * Enforced with no-restricted-imports so architecture drift fails CI.
 */
const restrict = (...layers) => ({
  patterns: layers.map((layer) => ({
    // Our alias (@core/…) or a relative path into src/app/<layer>/ — but not packages
    // like @angular/core, which a glob such as **/core/* would wrongly match.
    regex: `^(@${layer}/|(\\.{1,2}/)+(app/)?${layer}/)`,
    message: `This layer must not import from "${layer}". See README → Conventions.`,
  })),
});

module.exports = defineConfig([
  globalIgnores(['dist/', 'coverage/', '.angular/', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        // Root-level config files aren't in any tsconfig; lint them with default settings.
        projectService: { allowDefaultProject: ['playwright.config.ts'] },
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', restrict('features', 'layout')] },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', restrict('core', 'features', 'layout')] },
  },
  {
    files: ['src/app/layout/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', restrict('features')] },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
  prettier,
]);
