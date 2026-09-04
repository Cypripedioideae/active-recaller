import React from "react";

interface NotationTextProps {
  text: string;
  className?: string;
}

/**
 * A component that parses custom notation for subscripts, superscripts, bold, and italics.
 * - `**text**` -> bold
 * - `*text*` -> italic
 * - `_` followed by a single char or `(...)` -> subscript
 * - `^` followed by a single char or `(...)` -> superscript
 */
export const NotationText: React.FC<NotationTextProps> = ({ text, className }) => {
  if (!text) return null;

  const parseNotation = (str: string, depth = 0): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentString = "";
    let i = 0;

    const flush = () => {
      if (currentString) {
        elements.push(<React.Fragment key={`text-${depth}-${i}`}>{currentString}</React.Fragment>);
        currentString = "";
      }
    };

    while (i < str.length) {
      if (str.startsWith('**', i)) {
        const end = str.indexOf('**', i + 2);
        if (end !== -1) {
          flush();
          const inner = str.slice(i + 2, end);
          elements.push(<strong key={`b-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</strong>);
          i = end + 2;
          continue;
        }
      }
      if (str.startsWith('*', i)) {
        const end = str.indexOf('*', i + 1);
        if (end !== -1) {
          flush();
          const inner = str.slice(i + 1, end);
          elements.push(<em key={`i-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</em>);
          i = end + 1;
          continue;
        }
      }
      if (str[i] === '_' || str[i] === '^') {
        const isSuper = str[i] === '^';
        flush();
        i++; // skip ^ or _
        if (i < str.length) {
          if (str[i] === '(') {
            const end = str.indexOf(')', i);
            if (end !== -1) {
              const inner = str.slice(i + 1, end);
              elements.push(
                isSuper 
                  ? <sup key={`sup-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</sup> 
                  : <sub key={`sub-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</sub>
              );
              i = end + 1;
              continue;
            }
          }
          const inner = str[i];
          elements.push(
            isSuper 
              ? <sup key={`sup-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</sup> 
              : <sub key={`sub-${depth}-${i}`}>{parseNotation(inner, depth + 1)}</sub>
          );
          i++;
          continue;
        }
      }
      currentString += str[i];
      i++;
    }
    flush();
    return elements;
  };

  return <span className={className}>{parseNotation(text)}</span>;
};
