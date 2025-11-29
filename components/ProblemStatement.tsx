import React, { useState, useMemo } from 'react';

interface ProblemStatementProps {
  title: string;
  text: string;
}

const renderMarkdown = (text: string): React.ReactNode => {
  // Split text by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Check if it's a code block
    if (part.startsWith('```')) {
      const codeContent = part.replace(/```(\w+)?\n?/g, '').replace(/```$/g, '');
      return (
        <pre key={index} className="bg-gray-900 rounded-lg p-3 my-3 overflow-x-auto border border-gray-700">
          <code className="text-green-400 text-sm font-mono">{codeContent}</code>
        </pre>
      );
    }

    // Regular text - handle inline code, bold, and line breaks
    const formattedText = part
      .split('\n')
      .map((line, lineIndex) => {
        // First handle inline code with `code`
        const codeParts = line.split(/(`.*?`)/g);
        const formatted = codeParts.map((segment, segIndex) => {
          // Check for inline code
          if (segment.startsWith('`') && segment.endsWith('`')) {
            return (
              <code key={`code-${segIndex}`} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono text-sm">
                {segment.slice(1, -1)}
              </code>
            );
          }

          // Handle bold text with **text**
          const boldParts = segment.split(/(\*\*.*?\*\*)/g);
          return boldParts.map((boldSegment, boldIndex) => {
            if (boldSegment.startsWith('**') && boldSegment.endsWith('**')) {
              return <strong key={`bold-${segIndex}-${boldIndex}`} className="font-bold text-gray-900">{boldSegment.slice(2, -2)}</strong>;
            }
            return <span key={`text-${segIndex}-${boldIndex}`}>{boldSegment}</span>;
          });
        });

        return <span key={lineIndex}>{formatted}{lineIndex < part.split('\n').length - 1 && <br />}</span>;
      });

    return <div key={index} className="text-gray-700 leading-relaxed">{formattedText}</div>;
  });
};

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ title, text }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const renderedContent = useMemo(() => renderMarkdown(text), [text]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 border-b border-gray-200" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {isExpanded && (
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto bg-white">
          {renderedContent}
        </div>
      )}
    </div>
  );
};