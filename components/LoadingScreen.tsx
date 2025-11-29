import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

const loadingMessages = [
  "Generating your personalized problem...",
  "Crafting the perfect challenge...",
  "Preparing your learning experience...",
  "Setting up the canvas...",
  "Almost ready..."
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center animate-fadeIn"
      style={{
        background: 'linear-gradient(135deg, #1F0A24 0%, #4A154B 50%, #611f69 100%)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Animated Logo */}
      <div className="mb-12 animate-pulse">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-2xl opacity-50 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%)'
            }}
          />

          {/* Logo */}
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-2xl border-4 border-amber-600 animate-bounce-slow">
            {/* Slate texture overlay */}
            <div className="absolute inset-0 opacity-20 rounded-2xl" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 0%, rgba(255,255,255,0.1) 100%)'
            }}></div>

            {/* Chalk icon with rotation */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white relative z-10 animate-wiggle"
            >
              <path
                d="M3 8L8 3L21 16L16 21L3 8Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M19 18L20 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center space-y-6 max-w-md px-6">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg animate-fadeIn">
          VEDA<span className="text-purple-900"> AI</span>
        </h2>

        <p className="text-xl text-white/90 font-medium animate-pulse" key={messageIndex}>
          {loadingMessages[messageIndex]}
        </p>

        {/* Animated progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-progress"
            style={{
              animation: 'progress 3s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% { opacity: 0.5; }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.8;
          }
          90% { opacity: 0.5; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-progress {
          animation: progress 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
