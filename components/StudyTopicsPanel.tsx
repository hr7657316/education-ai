import React from 'react';
import { SubjectCategory, Problem } from '../types';

interface StudyTopicsPanelProps {
  subject: SubjectCategory;
  topic: string;
  problem: Problem | null;
  onClose: () => void;
}

export const StudyTopicsPanel: React.FC<StudyTopicsPanelProps> = ({
  subject,
  topic,
  problem,
  onClose,
}) => {
  const getSubjectLabel = () => {
    switch (subject) {
      case 'algorithms':
        return 'Algorithms & Coding';
      case 'math':
        return 'Mathematics';
      case 'science':
        return 'Science';
      case 'other':
        return 'Imported Problem';
      default:
        return 'Learning';
    }
  };

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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Study Topics</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Current Subject */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Current Subject
          </h3>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
                <span className="text-4xl">{getSubjectIcon()}</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">{getSubjectLabel()}</h4>
                <p className="text-sm text-gray-600">Active learning session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Topic */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Current Topic
          </h3>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-lg font-semibold text-blue-900">{topic}</p>
          </div>
        </div>

        {/* Problem Info */}
        {problem && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Current Problem
            </h3>
            <div className={`rounded-xl p-4 border ${subject === 'other' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <h4 className={`text-lg font-semibold mb-2 ${subject === 'other' ? 'text-orange-900' : 'text-green-900'}`}>
                {problem.title}
              </h4>
              {subject === 'other' && problem.constraints && problem.constraints.length > 0 && (
                <div className={`mt-3 pt-3 border-t ${subject === 'other' ? 'border-orange-200' : 'border-green-200'}`}>
                  <p className="text-sm text-orange-700 font-medium mb-2">Source Info:</p>
                  <ul className="space-y-1">
                    {problem.constraints
                      .filter(c => c.includes('Detected Subject') || c.includes('Source:'))
                      .map((constraint, idx) => (
                        <li key={idx} className="text-sm text-orange-600">
                          • {constraint}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {problem.examples && problem.examples.length > 0 && subject !== 'other' && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-2">Examples:</p>
                  <ul className="space-y-1">
                    {problem.examples.slice(0, 2).map((example, idx) => (
                      <li key={idx} className="text-sm text-green-600">
                        • {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learning Progress Placeholder */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Session Info
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subject Type</span>
                <span className="text-sm font-semibold text-gray-900">{getSubjectLabel()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mode</span>
                <span className="text-sm font-semibold text-gray-900">Practice</span>
              </div>
              {problem?.testCases && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Test Cases</span>
                  <span className="text-sm font-semibold text-gray-900">{problem.testCases.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Tips
          </h3>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <ul className="space-y-2 text-sm text-amber-900">
              {subject === 'algorithms' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Click "Hint" for AI assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Run tests to check your solution</span>
                  </li>
                </>
              )}
              {(subject === 'math' || subject === 'science') && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Use the canvas to write your solution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Ask AI to explain with images</span>
                  </li>
                </>
              )}
              {subject === 'other' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Imported problem - AI will help you solve it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Ask for hints if you need guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>Use canvas to work through the problem</span>
                  </li>
                </>
              )}
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>Use voice to interact with AI tutor</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
