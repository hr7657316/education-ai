/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { historyService, ProblemThumbnail } from '../services/historyService';

interface ProblemThumbnailGridProps {
  onSelectProblem?: (thumbnail: ProblemThumbnail) => void;
  maxItems?: number;
  showHistory?: boolean;
}

export const ProblemThumbnailGrid: React.FC<ProblemThumbnailGridProps> = ({
  onSelectProblem,
  maxItems = 8,
  showHistory = false
}) => {
  const [thumbnails, setThumbnails] = useState<ProblemThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadThumbnails();
  }, []);

  const loadThumbnails = async () => {
    setLoading(true);
    try {
      const data = await historyService.loadThumbnails();
      setThumbnails(data);
    } catch (error) {
      console.error('Failed to load thumbnails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailClick = (thumbnail: ProblemThumbnail) => {
    historyService.addToHistory(thumbnail);
    onSelectProblem?.(thumbnail);
  };

  const filteredThumbnails = selectedCategory === 'all'
    ? thumbnails
    : historyService.getThumbnailsByCategory(selectedCategory);

  const displayThumbnails = showHistory
    ? historyService.getRecentProblems(maxItems)
    : filteredThumbnails.slice(0, maxItems);

  const categories = ['all', ...new Set(thumbnails.map(t => t.category))];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50';
      case 'hard': return 'bg-red-500/20 border-red-500/50';
      default: return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading educational topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Category Filter */}
      {!showHistory && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category === 'all' ? 'All Problems' : String(category).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayThumbnails.map((thumbnail) => (
          <div
            key={thumbnail.id}
            onClick={() => handleThumbnailClick(thumbnail)}
            className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 border border-gray-200 hover:border-purple-400"
          >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              {thumbnail.imageDataUrl ? (
                <img
                  src={thumbnail.imageDataUrl}
                  alt={thumbnail.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-xs text-gray-500">{thumbnail.artStyle}</p>
                  </div>
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Difficulty Badge */}
              <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${getDifficultyBadgeColor(thumbnail.difficulty)}`}>
                {thumbnail.difficulty.toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-gray-900 font-semibold text-sm mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
                {historyService.truncateTitle(thumbnail.title, 35)}
              </h3>
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {thumbnail.description}
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 capitalize">
                  {thumbnail.category.replace(/-/g, ' ')}
                </span>
                <span className="text-gray-400 font-medium">
                  {thumbnail.artStyle.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 border-2 border-purple-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayThumbnails.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {showHistory ? 'No History Yet' : 'No Problems Found'}
          </h3>
          <p className="text-gray-600">
            {showHistory 
              ? 'Start solving problems to see your history here'
              : 'Try selecting a different category'
            }
          </p>
        </div>
      )}
    </div>
  );
};
