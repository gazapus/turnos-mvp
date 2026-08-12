// @ts-check
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseRules } from './base.mjs';

/** @param {string} tsconfigRootDir */
export function createNestJsConfig(tsconfigRootDir) {
  return tseslint.config(
    {
      ignores: ['eslint.config.mjs', 'dist/**'],
    },
    ...baseRules,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: 'commonjs',
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    {
      rules: {
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
      },
    },
  );
}
