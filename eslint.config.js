const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    // eslint-import-resolver-typescript fails to load under this exact
    // dependency combination (ESLint 9 flat config + the resolver versions
    // eslint-config-expo currently pulls in) — a known upstream friction
    // point, not something in this app's code. TypeScript's own compiler
    // (`npm run typecheck`) already does full cross-module resolution, so
    // disabling only the resolver-dependent import/* rules here loses
    // little real signal. Everything else in the Expo config — including
    // react-hooks correctness rules — stays active.
    rules: {
      'import/namespace': 'off',
      'import/no-unresolved': 'off',
      'import/default': 'off',
      'import/named': 'off',
      'import/no-cycle': 'off',
    },
  },
];
