// @ts-check
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import { baseRules } from './base.mjs';

/**
 * @param {string} appRootDir Absolute path to the Next.js app root.
 */
export function createNextConfig(appRootDir) {
  const compat = new FlatCompat({
    baseDirectory: appRootDir,
  });

  return tseslint.config(
    {
      ignores: [
        'node_modules/**',
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
      ],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    ...baseRules,
  );
}
