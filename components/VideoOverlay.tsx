import React, { useEffect, useRef } from 'react';

interface VideoOverlayProps {
  videoUrl: string;
  onClose: () => void;
  isVisible: boolean;
}

export const VideoOverlay: React.FC<VideoOverlayProps> = ({ videoUrl, onClose, isVisible }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      // Auto-play when video becomes visible
      videoRef.current.play().catch(err => {
        console.error('Error auto-playing video:', err);
      });
    }
  }, [isVisible]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      {/* Close Button - Larger and More Prominent */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-40 w-16 h-16 rounded-full bg-red-500/80 hover:bg-red-600 flex flex-col items-center justify-center transition-all duration-200 shadow-lg hover:scale-110 group"
        title="Close video (ESC)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-xs text-white font-medium mt-1">Close</span>
      </button>

      {/* Instruction Badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20">
        <p className="text-sm text-white/80">Press <span className="font-semibold text-white">ESC</span> or click outside to close</p>
      </div>

      {/* Video Container - Prevent click-through */}
      <div
        className="relative w-full max-w-5xl mx-8 rounded-2xl overflow-hidden shadow-2xl bg-black cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Player */}
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-auto"
          style={{ maxHeight: '80vh' }}
          onEnded={() => {
            console.log('[VIDEO] Playback ended');
          }}
          onError={(e) => {
            console.error('[VIDEO] Error playing video:', e);
          }}
        >
          Your browser does not support the video tag.
        </video>

        {/* Video Title Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <h3 className="text-white text-lg font-semibold drop-shadow-lg">
              Educational Video Explanation
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};
