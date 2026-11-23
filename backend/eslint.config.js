const globals = Object.fromEntries(
  Object.getOwnPropertyNames(globalThis).map((name) => [name, 'readonly']),
);

Object.assign(globals, {
  __dirname: 'readonly',
  __filename: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  jest: 'readonly',
  test: 'readonly',
});

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals,
    },
    rules: {
      'eqeqeq': 'error',
      'no-constant-binary-expression': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
