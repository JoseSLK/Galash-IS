// @ts-check
// Default angular-eslint + typescript-eslint recommended rules (6.3).
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  { ignores: ['dist/', '.angular/', 'node_modules/', 'e2e/', 'src/app/shared/components/scroll-stack/ScrollStack.js'] },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // `const { omitted, ...rest } = obj` is the codebase idiom for dropping fields before a request.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // autofocus is used only inside <dialog>, where HTML recommends it to set the initial focus.
      '@angular-eslint/template/no-autofocus': 'off',
    },
  },
);
