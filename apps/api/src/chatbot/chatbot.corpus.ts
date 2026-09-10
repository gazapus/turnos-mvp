import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Resuelve el directorio del corpus markdown de ayuda.
 *
 * @returns Ruta absoluta a `docs/ayuda` o `CHATBOT_DOCS_DIR`.
 */
export function resolveChatbotDocsDir(): string {
  const override = process.env.CHATBOT_DOCS_DIR?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.resolve(process.cwd(), '../../docs/ayuda');
}

/**
 * Lee y concatena los `.md` del corpus, ordenados por nombre.
 *
 * @param docsDir - Directorio a leer. Por defecto `resolveChatbotDocsDir()`.
 * @returns Texto concatenado.
 */
export function loadChatbotCorpus(
  docsDir: string = resolveChatbotDocsDir(),
): string {
  if (!existsSync(docsDir)) {
    throw new Error(`Corpus de ayuda no encontrado: ${docsDir}`);
  }

  const files = readdirSync(docsDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`Corpus de ayuda vacío: ${docsDir}`);
  }

  return files
    .map((name) => {
      const contents = readFileSync(path.join(docsDir, name), 'utf8');
      return `# ${name}\n\n${contents}`;
    })
    .join('\n\n---\n\n');
}
