import React, { useState, useRef, useEffect } from 'react';
import { Problem } from '../types';
import { startScreenShare, isScreenShareSupported } from '../utils/screenStreamCapture';
import { useGeminiLiveCapture } from '../hooks/useGeminiLiveCapture';

interface LiveCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemExtracted: (problem: Problem) => void;
}

type CaptureState = 'setup' | 'capturing' | 'processing';

export const LiveCaptureModal: React.FC<LiveCaptureModalProps> = ({
  isOpen,
  onClose,
  onProblemExtracted,
}) => {
  const [state, setState] = useState<CaptureState>('setup');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAttemptedStartRef = useRef(false);

  const {
    startCapture,
    stopCapture,
    finishCapture,
    isActive,
    aiMessage,
    isListening,
    isSpeaking,
    error: captureError,
  } = useGeminiLiveCapture({
    onProblemExtracted: (problem) => {
      setState('processing');
      setTimeout(() => {
        onProblemExtracted(problem);
      }, 1000);
    },
    onError: (error) => {
      setLocalError(error);
    },
  });

  // Start screen share and capture
  const handleStartCapture = async () => {
    console.log('[LiveCaptureModal] 🚀 Starting capture...');
    try {
      setLocalError(null);
      setState('setup');

      // Start screen share
      console.log('[LiveCaptureModal] Requesting screen share...');
      const stream = await startScreenShare();
      console.log('[LiveCaptureModal] ✓ Screen share granted, stream:', stream);
      setScreenStream(stream);

      // Attach to video element for preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[LiveCaptureModal] ✓ Attached stream to video element');
      }

      // Start Gemini Live capture session
      console.log('[LiveCaptureModal] Starting Gemini Live capture...');
      await startCapture(stream);
      console.log('[LiveCaptureModal] ✓ Gemini Live capture started');
      setState('capturing');

      // Handle screen share stop (user clicks browser's "Stop sharing" button)
      stream.getVideoTracks()[0].onended = () => {
        console.log('[LiveCaptureModal] Screen share ended by user');
        handleCancel();
      };

      console.log('[LiveCaptureModal] ✅ Capture started successfully!');
    } catch (err) {
      console.error('[LiveCaptureModal] ❌ Failed to start capture:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start screen share';
      setLocalError(errorMessage);
      setState('setup');
    }
  };

  const handleDone = () => {
    setState('processing');
    finishCapture();
  };

  const handleCancel = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    stopCapture();
    onClose();
  };

  // Auto-start capture when modal opens
  useEffect(() => {
    console.log('[LiveCaptureModal] useEffect triggered - isOpen:', isOpen, 'state:', state, 'isActive:', isActive, 'screenStream:', !!screenStream, 'hasAttempted:', hasAttemptedStartRef.current);

    if (isOpen && state === 'setup' && !isActive && !screenStream && !hasAttemptedStartRef.current) {
      console.log('[LiveCaptureModal] Auto-starting capture...');
      hasAttemptedStartRef.current = true;
      handleStartCapture();
    } else if (isOpen && !hasAttemptedStartRef.current) {
      console.log('[LiveCaptureModal] Not auto-starting - conditions not met');
    }
  }, [isOpen, state, isActive, screenStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenStream]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('[LiveCaptureModal] Modal closed - resetting state...');
      setState('setup');
      setScreenStream(null);
      setLocalError(null);
      hasAttemptedStartRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const error = localError || captureError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal */}
      <div className="relative w-full max-w-4xl rounded-3xl shadow-2xl animate-scale-in bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Live Problem Capture</h2>
            <p className="text-purple-200">
              {state === 'setup' && 'Starting screen share...'}
              {state === 'capturing' && 'Show and explain your problem to the AI'}
              {state === 'processing' && 'Extracting problem details...'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-xl">
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {/* Screen Preview */}
          {state !== 'setup' && (
            <div className="mb-6 relative">
              <div className="w-full aspect-video bg-black/50 rounded-2xl overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />

                {/* AI Status Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  {/* AI Avatar */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-full backdrop-blur-md ${
                    isSpeaking ? 'bg-purple-500/40' : 'bg-purple-900/40'
                  } border border-purple-400/30`}>
                    <div className={`w-3 h-3 rounded-full ${
                      isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-purple-400'
                    }`} />
                    <span className="text-sm font-medium">
                      {isSpeaking ? 'AI Speaking...' : isListening ? 'AI Listening...' : 'AI Ready'}
                    </span>
                  </div>

                  {/* Recording Indicator */}
                  {isActive && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                  )}
                </div>

                {/* AI Message */}
                {aiMessage && (
                  <div className="absolute bottom-4 left-4 right-4 px-6 py-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10">
                    <p className="text-white text-sm">{aiMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Setup/Loading State */}
          {state === 'setup' && !error && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-300" />
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Preparing screen capture...</p>
                <p className="text-purple-300 text-sm">Please select your screen when prompted</p>
              </div>
            </div>
          )}

          {/* Processing State */}
          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-300" />
              <p className="text-lg font-semibold">Extracting problem details...</p>
              <p className="text-purple-300 text-sm">This will just take a moment</p>
            </div>
          )}

          {/* Action Buttons */}
          {state === 'capturing' && (
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-red-500/20 border-2 border-red-400 hover:bg-red-500/30"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={!isActive}
                className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50"
              >
                Done - Extract Problem
              </button>
            </div>
          )}

          {/* Setup Error Retry */}
          {state === 'setup' && error && (
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleStartCapture}
                className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-purple-600 hover:bg-purple-700 shadow-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Instructions */}
          {state === 'capturing' && (
            <div className="mt-6 p-4 rounded-xl bg-purple-800/30 border border-purple-600/30">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>Tips for Best Results</span>
              </h3>
              <ul className="space-y-1 text-sm text-purple-200">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Show the complete problem on your screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Speak clearly and explain what you're showing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>The AI can ask clarifying questions - answer them</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Click "Done" when you've shown everything</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
