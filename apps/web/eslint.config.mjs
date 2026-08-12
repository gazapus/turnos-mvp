import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createNextConfig } from '@turnos/config/eslint/next';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default createNextConfig(__dirname);
