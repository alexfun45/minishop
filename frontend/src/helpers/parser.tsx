import React from 'react'

export function renderFormattedText(rawText: string) {
  // На случай, если LLM склеила пункты списка и заголовок в одну строку без \n
  const normalizedText = rawText
    .replace(/\s+(\d+\.\s)/g, '\n$1')
    .replace(/\s+(\*\*Итого:)/g, '\n\n$1');

  return normalizedText.split('\n').map((line, lineIdx) => {
    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    // Разбиваем строку по паттерну **жирный текст**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    return (
      <div key={lineIdx} className="leading-relaxed">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        })}
      </div>
    );
  });
}