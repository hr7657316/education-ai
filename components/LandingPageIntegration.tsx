/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Integration example showing how to add the thumbnail system to your existing app
 */
import React, { useState } from 'react';
import { ProblemThumbnailGrid } from './ProblemThumbnailGrid';
import { ProblemThumbnail } from '../services/historyService';
import { GooeyText } from './ui/gooey-text-morphing';

interface LandingPageIntegrationProps {
  onStartLearning: (problem?: ProblemThumbnail) => void;
}

export const LandingPageIntegration: React.FC<LandingPageIntegrationProps> = ({
  onStartLearning
}) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleProblemSelect = (problem: ProblemThumbnail) => {
    console.log('Selected problem:', problem);
    onStartLearning(problem);
  };

  return (
    <div className="w-full bg-white">
      {/* Problems Section - Add this to your existing landing page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            From algorithms to physics, chemistry to calculus - explore diverse educational topics with photorealistic imagery and AI-powered guidance
          </p>

          {/* Toggle History/All */}
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${!showHistory
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All Problems
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${showHistory
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Recent History
            </button>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <ProblemThumbnailGrid
          onSelectProblem={handleProblemSelect}
          maxItems={8}
          showHistory={showHistory}
        />
      </div>
    </div>
  );
};
