import React from 'react';
import { TestCase } from '../types';

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  output?: any;
  error?: string;
}

interface TestResultsPanelProps {
  testCases: TestCase[];
  results: {
    passed: number;
    failed: number;
    results: TestResult[];
  } | null;
  onClose: () => void;
  onRunTests: () => void;
  isLoading?: boolean;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  testCases,
  results,
  onClose,
  onRunTests,
  isLoading = false
}) => {
  const hasResults = results !== null;
  const totalTests = testCases.length;
  const passPercentage = hasResults && totalTests > 0
    ? (results.passed / totalTests) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Test Results</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
            aria-label="Close test results"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        {/* Run Tests Button */}
        <button
          onClick={onRunTests}
          disabled={isLoading}
          className="w-full mb-4 py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isLoading
              ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
              : 'linear-gradient(135deg, #10b981, #14b8a6)',
          }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Tests...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Tests
            </>
          )}
        </button>

        {hasResults && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-green-600 font-bold text-sm">{results.passed} Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-red-600 font-bold text-sm">{results.failed} Failed</span>
                </div>
              </div>
              <span className="text-gray-600 text-sm">{totalTests} Total</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${passPercentage}%` }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-xs text-gray-600">{passPercentage.toFixed(0)}% Pass Rate</span>
            </div>
          </>
        )}

        {!hasResults && (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm">Click "Run Tests" to see your results</p>
            <p className="text-gray-400 text-xs mt-1">{totalTests} test case{totalTests !== 1 ? 's' : ''} ready</p>
          </div>
        )}
      </div>

      {/* Test case details */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-4 space-y-3 bg-white">
        {hasResults ? (
          // Show test results after running
          results.results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all ${
                result.passed
                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                  : 'bg-red-50 border-red-200 hover:bg-red-100'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className={`mt-0.5 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.passed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-800 font-medium block mb-1">
                      {result.testCase.description}
                    </span>
                    <div className="text-xs text-gray-600 space-y-1 font-mono">
                      <div className="flex items-start gap-1">
                        <span className="text-gray-500 min-w-[60px]">Input:</span>
                        <span className="text-purple-700">{JSON.stringify(result.testCase.input)}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-gray-500 min-w-[60px]">Expected:</span>
                        <span className="text-blue-700">{JSON.stringify(result.testCase.expected)}</span>
                      </div>
                      {!result.passed && (
                        <div className="flex items-start gap-1">
                          <span className="text-gray-500 min-w-[60px]">Got:</span>
                          <span className="text-red-700">{JSON.stringify(result.output)}</span>
                        </div>
                      )}
                      {result.error && (
                        <div className="flex items-start gap-1 mt-2 pt-2 border-t border-red-200">
                          <span className="text-red-600 min-w-[60px]">Error:</span>
                          <span className="text-red-600 break-all">{result.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))
        ) : (
          // Show test cases before running
          testCases.map((testCase, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2 flex-1">
                  <div className="mt-0.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-800 font-medium block mb-1">
                      {testCase.description}
                    </span>
                    <div className="text-xs text-gray-600 space-y-1 font-mono">
                      <div className="flex items-start gap-1">
                        <span className="text-gray-500 min-w-[60px]">Input:</span>
                        <span className="text-purple-700">{JSON.stringify(testCase.input)}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-gray-500 min-w-[60px]">Expected:</span>
                        <span className="text-blue-700">{JSON.stringify(testCase.expected)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-600">
                  NOT RUN
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
