import React, { useState } from 'react';
import { SubjectCategory } from '../types';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: string, subject: SubjectCategory) => void;
  isGenerating: boolean;
  initialTopic?: string;
  initialSubject?: SubjectCategory;
}

export const TopicModal: React.FC<TopicModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isGenerating,
  initialTopic = 'Basic JavaScript Arrays',
  initialSubject = 'algorithms'
}) => {
  const [subject, setSubject] = useState<SubjectCategory>(initialSubject);
  const [topic, setTopic] = useState(initialTopic);
  
  // Update state when initial values change
  React.useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject);
      setTopic(initialTopic);
    }
  }, [isOpen, initialTopic, initialSubject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[TopicModal] Form submitted - subject:', subject, 'topic:', topic);
    if (subject === 'other') {
      console.log('[TopicModal] Subject is "other" - calling onSubmit');
      onSubmit(topic, subject);
    } else if (topic.trim()) {
      console.log('[TopicModal] Regular subject - calling onSubmit');
      onSubmit(topic, subject);
    }
  };

  // Default topic per subject for quick prefilling
  const defaultTopicBySubject: Record<SubjectCategory, string> = {
    algorithms: 'Basic JavaScript Arrays',
    math: 'Pythagorean theorem',
    science: 'Boyle’s Law',
    other: ''
  };

  const subjectOptions: { value: SubjectCategory; label: string; icon: string; description: string; bgColor: string; iconBg: string; ringColor: string }[] = [
    { value: 'algorithms', label: 'Algorithms', icon: '💻', description: 'Code & problem solving', bgColor: 'bg-blue-50', iconBg: 'bg-blue-100 text-blue-600', ringColor: 'ring-blue-500' },
    { value: 'math', label: 'Mathematics', icon: '🔢', description: 'Formulas & equations', bgColor: 'bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', ringColor: 'ring-purple-500' },
    { value: 'science', label: 'Science', icon: '🧪', description: 'Physics & chemistry', bgColor: 'bg-green-50', iconBg: 'bg-green-100 text-green-600', ringColor: 'ring-green-500' },
    { value: 'other', label: 'Other', icon: '📷', description: 'Screen capture', bgColor: 'bg-orange-50', iconBg: 'bg-orange-100 text-orange-600', ringColor: 'ring-orange-500' }
  ];

  const getPlaceholderText = () => {
    switch (subject) {
      case 'algorithms':
        return 'e.g., Binary Search, Array Manipulation...';
      case 'math':
        return 'e.g., Pythagorean Theorem, Quadratic Equations...';
      case 'science':
        return 'e.g., Newton\'s Laws, Chemical Bonding...';
      case 'other':
        return 'You will capture the problem in the next step';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl rounded-3xl shadow-2xl animate-scale-in bg-white"
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Topic</h2>
          <p className="text-gray-600 mb-6">What would you like to practice today?</p>

          <form onSubmit={handleSubmit}>
            {/* Subject Category Selection */}
            <div className="mb-6">
              <label className="text-gray-700 text-sm font-semibold mb-3 block">
                Select Subject
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {subjectOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSubject(option.value);
                      setTopic(defaultTopicBySubject[option.value]);
                    }}
                    disabled={isGenerating}
                    className={`p-4 rounded-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${option.bgColor} ${
                      subject === option.value
                        ? `ring-2 ${option.ringColor} shadow-lg`
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${option.iconBg}`}>
                        <span className="text-2xl">{option.icon}</span>
                      </div>
                    </div>
                    <div className="text-gray-900 font-semibold text-sm">{option.label}</div>
                    <div className="text-gray-600 text-xs mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input - Hidden for 'Other' */}
            {subject !== 'other' ? (
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={getPlaceholderText()}
                className="w-full px-4 py-3 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all mb-6 bg-gray-100 border border-gray-200"
                disabled={isGenerating}
                autoFocus
              />
            ) : (
              <div className="mb-6 p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">📷 Screen Capture Mode:</span> Share your screen to capture any problem. AI will extract the problem and generate test cases automatically.
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="flex-1 px-6 py-3 rounded-2xl text-gray-700 font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 border border-gray-200 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || (subject !== 'other' && !topic.trim())}
                className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 shadow-lg"
              >
                {isGenerating ? 'Generating...' : subject === 'other' ? '📸 Start Screen Capture' : 'Start Learning'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
