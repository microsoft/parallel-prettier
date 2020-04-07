module.exports = {
  ignorePatterns: ['**/*.d.ts', '**/*.test.ts', '**/*.js'],
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended'],
  plugins: ['header'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/interface-name-prefix': ['error', { prefixWithI: 'always' }],
    'header/header': [
      'error',
      'block',
      '---------------------------------------------------------\n * Copyright (C) Microsoft Corporation. All rights reserved.\n *--------------------------------------------------------',
    ],
  },
};
