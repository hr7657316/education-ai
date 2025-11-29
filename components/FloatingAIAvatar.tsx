import React, { useRef, useEffect, useState } from 'react';

interface FloatingAIAvatarProps {
  isConnected: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isLoading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
}

export const FloatingAIAvatar: React.FC<FloatingAIAvatarProps> = ({
  isConnected,
  isSpeaking,
  isMuted,
  isLoading = false,
  onConnect,
  onDisconnect,
  onToggleMute,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isConnected && isSpeaking) {
      video.play().catch(err => console.error('Video play error:', err));
    } else {
      video.pause();
    }
  }, [isConnected, isSpeaking]);

  return (
    <div className="fixed top-6 right-6 z-[150]">
      {/* Loading Animation Styles */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.5);
          }
        }

        @keyframes spin-ring {
          to { transform: rotate(360deg); }
        }

        .loading-avatar {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .spinner-ring {
          animation: spin-ring 1.5s linear infinite;
        }
      `}</style>

      {/* Avatar Circle with Control Buttons */}
      <div className="relative inline-block">
        {/* Loading Spinner Ring */}
        {isLoading && (
          <div className="absolute inset-0 spinner-ring">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgb(139, 92, 246)"
                strokeWidth="3"
                strokeDasharray="70 200"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        <div
          className={`w-20 h-20 rounded-full overflow-hidden transition-all duration-300 ${
            isLoading
              ? 'loading-avatar border-4 border-purple-400'
              : isConnected
              ? isSpeaking
                ? 'border-4 border-green-400 shadow-2xl shadow-green-500/50'
                : 'shadow-2xl shadow-blue-500/50'
              : 'cursor-pointer hover:scale-105'
          }`}
          onClick={() => !isConnected && onConnect()}
        >
          {!isConnected ? (
            /* Agent Icon when not connected */
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <img 
                src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/gemini-color.png"
                alt="AI Agent"
                className="w-12 h-12"
              />
            </div>
          ) : (
            /* Video when connected */
            <video
              ref={videoRef}
              src="https://cdn.dribbble.com/userupload/14445441/file/original-d0be9b18a8fb20f07da1babe3c7f8d58.mp4"
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{
                transform: 'scale(2)',
                transformOrigin: 'center center'
              }}
            />
          )}
        </div>


        {/* Status Text */}
        {isLoading ? (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <p className="text-sm font-medium text-purple-600 animate-pulse">✨ Generating...</p>
          </div>
        ) : !isConnected ? (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
            {/* <p className="text-sm font-medium text-gray-700">Start</p> */}
          </div>
        ) : null}
      </div>

      {/* Control Buttons Below Avatar */}
      {isConnected && (
        <div className="flex items-center justify-center gap-3 mt-3">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center bg-white hover:scale-110 ${
              isMuted ? 'border-2 border-gray-600' : 'border-2 border-blue-600'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isMuted ? 'text-gray-600' : 'text-blue-600'}`} viewBox="0 0 20 20" fill="currentColor">
              {isMuted ? (
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              )}
            </svg>
          </button>

          {/* End Call Button */}
          <button
            onClick={onDisconnect}
            className="w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center bg-white border-2 border-red-600 hover:scale-110"
            title="End Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
