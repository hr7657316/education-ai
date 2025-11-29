import React from 'react';

interface AvatarProps {
  isConnected: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ isConnected }) => {
  const baseClasses = "h-20 w-20 rounded-full bg-gray-800 flex items-center justify-center border-4 transition-colors duration-500";
  const connectedClasses = "border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]";
  const disconnectedClasses = "border-gray-600";
  
  const pulseClass = isConnected ? "animate-pulse" : "";

  return (
    <div className={`${baseClasses} ${isConnected ? connectedClasses : disconnectedClasses}`}>
       <div className={`h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center ${pulseClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};