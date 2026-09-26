import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathBlockProps {
  math: string;
  display?: boolean;
  className?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({
  math,
  display = true,
  className = '',
}) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return math;
    }
  }, [math, display]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
