/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { ProblemThumbnailGrid } from './ProblemThumbnailGrid';
import { ProblemThumbnail } from '../services/historyService';

interface LandingPageProps {
  onStartLearning?: (problem?: ProblemThumbnail) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning }) => {
  const [showHistory, setShowHistory] = useState(false);

  const handleProblemSelect = (problem: ProblemThumbnail) => {
    console.log('Selected problem:', problem);
    onStartLearning?.(problem);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-purple-900/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Learn
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Master Coding with AI
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Practice solving problems with a live AI assistant that guides you through every step.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onStartLearning?.()}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105"
              >
                Start Learning Now
              </button>

              <button
                onClick={() => {
                  const element = document.getElementById('problems-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-purple-500/50"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Floating Thumbnails Preview */}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 animate-float"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${3 + (i % 3)}s`
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
                    {['💻', '🌳', '🔢', '🗺️', '📝', '🔄', '🧠', '🎨'][i - 1]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problems Section */}
      <div id="problems-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Explore Coding Challenges
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Each problem comes with beautiful watercolor artwork and AI-powered guidance
          </p>

          {/* Toggle History/All */}
          <div className="inline-flex rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${!showHistory
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              All Problems
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${showHistory
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
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

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Beautiful Watercolor Art
            </h3>
            <p className="text-gray-400">
              Each problem features unique AI-generated watercolor artwork in different artistic styles
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              AI-Powered Guidance
            </h3>
            <p className="text-gray-400">
              Get real-time help and explanations as you work through coding challenges
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Track Your Progress
            </h3>
            <p className="text-gray-400">
              View your problem-solving history and see how much you've learned
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-purple-500/30">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Join thousands of learners mastering coding with AI assistance
          </p>
          <button
            onClick={() => onStartLearning?.()}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105"
          >
            Start Learning Now
          </button>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
