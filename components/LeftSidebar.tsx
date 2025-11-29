import React from 'react';
import { SubjectCategory } from '../types';

export type SidebarSection = 'question' | 'tests' | 'study' | null;

interface LeftSidebarProps {
  activeSection: SidebarSection;
  onSectionToggle: (section: 'question' | 'tests' | 'study') => void;
  hasTestResults: boolean;
  onAskForHint?: () => void;
  onRunTests?: () => void;
  onClearCanvas?: () => void;
  onExplainWithImages?: () => void; // New action for generating image explanations
  isLoading?: boolean;
  hasProblem?: boolean;
  hasTests?: boolean; // Whether test cases exist (separate from whether they've been run)
  subject?: SubjectCategory; // Current subject category
  topic?: string; // Current topic
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  onSectionToggle,
  hasTestResults,
  onAskForHint,
  onRunTests,
  onClearCanvas,
  onExplainWithImages,
  isLoading = false,
  hasProblem = false,
  hasTests = false,
  subject = 'algorithms',
  topic = '',
}) => {
  const iconButtonClass = (section: 'question' | 'tests' | 'study') =>
    `w-full py-4 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative group ${
      activeSection === section
        ? 'bg-white/10 border-r-4 border-white/30'
        : 'hover:bg-white/5 border-r-4 border-transparent'
    }`;

  const getSubjectIcon = () => {
    switch (subject) {
      case 'algorithms':
        return '💻';
      case 'math':
        return '🔢';
      case 'science':
        return '🧪';
      case 'other':
        return '📷';
      default:
        return '📚';
    }
  };

  return (
    <div className="w-20 flex flex-col shadow-2xl z-[100]" style={{ backgroundColor: '#2D0A1F' }}>
      {/* Logo/Home */}
      <div className="h-20 flex items-center justify-center border-b border-white/10 ">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg border-2 border-amber-600 relative overflow-hidden">
          {/* Slate texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 0%, rgba(255,255,255,0.1) 100%)'
          }}></div>
          {/* Chalk icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white relative z-10"
          >
            <path d="M3 8L8 3L21 16L16 21L3 8Z" fill="currentColor" opacity="0.9" />
            <path d="M19 18L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex-1 py-4">
        {/* Study Topics Section */}
        <div
          className={iconButtonClass('study')}
          onClick={() => onSectionToggle('study')}
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-1">
            <span className="text-2xl">{getSubjectIcon()}</span>
          </div>
          <span className="text-xs text-gray-100 font-semibold drop-shadow-md">Study</span>
        </div>

        {/* Question/Problem Section */}
        <div
          className={iconButtonClass('question')}
          onClick={() => onSectionToggle('question')}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-1">
            <img
              src="https://www.matilda.io/wp-content/uploads/2025/10/docs1.svg"
              alt="Question"
              className="w-7 h-7"
            />
          </div>
          <span className="text-xs text-gray-100 font-semibold drop-shadow-md">Question</span>
        </div>

        {/* Test Results Section */}
        {hasTests && (
          <div
            className={iconButtonClass('tests')}
            onClick={() => onSectionToggle('tests')}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-1">
                <img
                  src="https://www.matilda.io/wp-content/uploads/2023/07/Projects.svg"
                  alt="Tests"
                  className="w-7 h-7"
                />
              </div>
              {/* Badge for test results - show when tests exist or results are available */}
              {hasTestResults && (
                <div className="absolute top-0 right-6 w-2 h-2 rounded-full border border-purple-900 bg-teal-400 animate-pulse"></div>
              )}
            </div>
            <span className="text-xs text-gray-100 font-semibold drop-shadow-md">Tests</span>
          </div>
        )}
      </div>

      {/* Action Buttons at Bottom */}
      <div className="border-t border-white/10 py-3">
        {/* Hint Button */}
        {onAskForHint && (
          <div className="px-1 mb-2">
            <button
              onClick={onAskForHint}
              disabled={isLoading}
              className="w-full py-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ask for Hint"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-300 font-medium">Hint</span>
            </button>
          </div>
        )}

        {/* Explain with Images Button */}
        {onExplainWithImages && hasProblem && (
          <div className="px-1 mb-2">
            <button
              onClick={onExplainWithImages}
              disabled={isLoading}
              className="w-full py-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Explain with Images"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-purple-300 font-medium">Image</span>
            </button>
          </div>
        )}

        {/* Run Tests / Check Answer Button */}
        {onRunTests && hasProblem && (
          <div className="px-1 mb-2">
            <button
              onClick={onRunTests}
              disabled={isLoading}
              className="w-full py-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title={subject === 'algorithms' ? 'Run Tests' : 'Check Answer'}
            >
              {subject === 'algorithms' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-xs text-teal-300 font-medium">Run</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-teal-300 font-medium">Check</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Clear Canvas Button */}
        {onClearCanvas && (
          <div className="px-1">
            <button
              onClick={onClearCanvas}
              disabled={isLoading}
              className="w-full py-3 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear Canvas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-xs text-red-300 font-medium">Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
