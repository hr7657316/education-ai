import React, { useRef, useEffect } from 'react';

interface VideoAvatarProps {
  isConnected: boolean;
  isSpeaking: boolean; // true when AI is speaking, false when listening
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({ isConnected, isSpeaking }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isConnected && isSpeaking) {
      // AI is speaking - play the video
      video.play().catch(err => console.error('Video play error:', err));
    } else {
      // AI is listening or disconnected - pause the video
      video.pause();
    }
  }, [isConnected, isSpeaking]);

  const containerClasses = `relative h-32 w-32 rounded-full overflow-hidden border-4 transition-all duration-500 ${
    isConnected
      ? isSpeaking
        ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6)]' // Speaking - green glow
        : 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]' // Listening - blue glow
      : 'border-gray-600 opacity-50' // Disconnected
  }`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={containerClasses}>
        <video
          ref={videoRef}
          src="https://cdn.dribbble.com/userupload/14445441/file/original-d0be9b18a8fb20f07da1babe3c7f8d58.mp4"
          loop
          muted
          playsInline
          className={`transition-all duration-500 ${
            isConnected ? '' : 'grayscale'
          }`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            transform: 'scale(2)', // Zoom in to fill the entire circle
            transformOrigin: 'center center'
          }}
        />

        {/* Status indicator overlay */}
        {isConnected && (
          <div className="absolute bottom-0 right-0 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              isSpeaking ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {isSpeaking ? (
                // Speaking icon - sound waves
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              ) : (
                // Listening icon - microphone
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mode label */}
      <div className="text-center">
        {isConnected ? (
          <span className={`text-sm font-semibold ${
            isSpeaking ? 'text-green-400' : 'text-blue-400'
          }`}>
            {isSpeaking ? '🎙️ Speaking...' : '👂 Listening...'}
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-500">Disconnected</span>
        )}
      </div>
    </div>
  );
};
