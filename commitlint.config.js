/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['web', 'api', 'db', 'shared', 'ui', 'config']],
    'scope-empty': [0],
  },
};
