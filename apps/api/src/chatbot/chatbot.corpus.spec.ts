import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadChatbotCorpus } from './chatbot.corpus';

describe('loadChatbotCorpus', () => {
  it('concatena markdown ordenado por nombre', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'chatbot-corpus-'));
    writeFileSync(path.join(dir, 'b.md'), 'beta');
    writeFileSync(path.join(dir, 'a.md'), 'alfa');

    const corpus = loadChatbotCorpus(dir);

    expect(corpus.indexOf('alfa')).toBeLessThan(corpus.indexOf('beta'));
    expect(corpus).toContain('# a.md');
    expect(corpus).toContain('# b.md');
  });

  it('incluye el glosario de conceptos de docs/ayuda', () => {
    const corpus = loadChatbotCorpus();

    expect(corpus).toContain('# conceptos.md');
    expect(corpus.toLowerCase()).toContain('primer turno');
    expect(corpus.toLowerCase()).toContain('especialidad');
    expect(corpus).toMatch(/Programado/);
    expect(corpus).toMatch(/Confirmado/);
    expect(corpus).not.toMatch(/cómo gestionar pacientes/i);
  });
});
