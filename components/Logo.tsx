import React from 'react';

interface LogoProps {
  isLoading?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ isLoading = false }) => {
  return (
    <div className="fixed top-6 left-6 z-50">
      <div className="flex items-center gap-3">
        {/* Slate Icon and Name */}
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg border-2 border-amber-600 relative overflow-hidden transition-all duration-300 ${isLoading ? 'animate-pulse scale-110' : ''}`}>
            {/* Slate texture overlay */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 0%, rgba(255,255,255,0.1) 100%)'
            }}></div>
            {/* Chalk marks */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white relative z-10"
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

          <div className="flex flex-col">
            <span className="text-3xl font-bold leading-none">
              <span className="text-purple-600">VEDA</span><span className="text-gray-900 dark:text-white"> AI</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Powered by</span>
              <img
                src="https://logos-world.net/wp-content/uploads/2025/02/Google-Gemini-Logo.png"
                alt="Google Gemini"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
