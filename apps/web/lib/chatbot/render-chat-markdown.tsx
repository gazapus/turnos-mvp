import { Fragment, type ReactNode } from 'react';

/**
 * Convierte markdown liviano (**negrita**) en nodos React.
 *
 * @param text - Texto del asistente.
 * @returns Contenido con negritas y saltos de línea.
 */
export function renderChatMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 ? <br /> : null}
      {renderInlineMarkdown(line, lineIndex)}
    </Fragment>
  ));
}

/**
 * Aplica **negrita** dentro de una línea.
 *
 * @param line - Línea plana.
 * @param lineIndex - Índice para keys.
 * @returns Nodos inline.
 */
function renderInlineMarkdown(line: string, lineIndex: number): ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, partIndex) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <strong key={`${lineIndex}-${partIndex}`} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    return (
      <Fragment key={`${lineIndex}-${partIndex}`}>{part}</Fragment>
    );
  });
}
