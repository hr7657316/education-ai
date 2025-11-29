import React from 'react';

interface SessionEndDialogProps {
  isOpen: boolean;
  onGoBack: () => void;
  onStartNew: () => void;
  onClose: () => void;
}

export const SessionEndDialog: React.FC<SessionEndDialogProps> = ({
  isOpen,
  onGoBack,
  onStartNew,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-gradient-to-br from-purple-900 to-purple-950 rounded-2xl shadow-2xl border border-purple-500/50 p-8 max-w-md w-full mx-4 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Session Ended
        </h2>

        {/* Description */}
        <p className="text-gray-300 text-center mb-8">
          Would you like to go back to the home screen or start a new coding session?
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStartNew}
            className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #4A154B, #611f69)',
            }}
          >
            Start New Session
          </button>

          <button
            onClick={onGoBack}
            className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 border-2 border-purple-500/50 hover:bg-purple-600/20"
          >
            Go Back Home
          </button>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-lg font-medium text-gray-400 hover:text-white transition-colors duration-200"
          >
            Stay Here
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
