import React from 'react';
import { VideoAvatar } from './VideoAvatar';
import { ControlButton } from './ControlButton';

interface AssistantPanelProps {
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean; // New prop to track if AI is speaking
  onStartSession: () => void;
  onStopSession: () => void;
  onToggleMute: () => void;
  isStarting?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  isConnected,
  isMuted,
  isSpeaking,
  onStartSession,
  onStopSession,
  onToggleMute,
  isStarting,
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg border border-purple-500/30 shadow-xl p-6 flex flex-col items-center gap-6">
      {/* Video Avatar */}
      <VideoAvatar isConnected={isConnected} isSpeaking={isSpeaking} />

      {/* Controls */}
      <div className="w-full space-y-3">
        {!isConnected ? (
          <button
            onClick={onStartSession}
            disabled={isStarting}
            className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              background: 'linear-gradient(135deg, #4A154B, #611f69)',
            }}
          >
            {isStarting ? 'Starting...' : 'Start Session'}
          </button>
        ) : (
          <>
            <button
              onClick={onStopSession}
              className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
              }}
            >
              End Session
            </button>
            <button
              onClick={onToggleMute}
              className="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 border-2"
              style={{
                borderColor: isMuted ? '#9CA3AF' : '#4A154B',
                background: isMuted ? '#374151' : 'transparent',
                color: isMuted ? '#D1D5DB' : '#FFFFFF',
              }}
            >
              {isMuted ? (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14zM10 5a3 3 0 00-3 3v.293l6 6V8a3 3 0 00-3-3zm-6 6a1 1 0 011-1h.586l2 2H5a1 1 0 01-1-1v-1zm6 9a7.001 7.001 0 01-6-6.93V15a1 1 0 102 0v-2.07A5 5 0 0015 8v1a1 1 0 102 0V8a7.001 7.001 0 01-6 6.93V17h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Unmute
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Mute
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Session Info */}
      {isConnected && (
        <div className="w-full pt-3 border-t border-purple-500/20">
          <div className="text-xs text-gray-400 text-center">
            <p className="mb-1">Session Active</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>AI Assistant Ready</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};