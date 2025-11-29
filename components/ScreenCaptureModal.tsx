import React, { useState, useRef } from 'react';
import { Problem } from '../types';

interface ScreenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemExtracted: (problem: Problem) => void;
}

type CaptureState = 'idle' | 'capturing' | 'processing' | 'error';

export const ScreenCaptureModal: React.FC<ScreenCaptureModalProps> = ({
  isOpen,
  onClose,
  onProblemExtracted,
}) => {
  const [state, setState] = useState<CaptureState>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  console.log('[ScreenCaptureModal] Render - isOpen:', isOpen, 'state:', state);

  if (!isOpen) {
    console.log('[ScreenCaptureModal] Not rendering - isOpen is false');
    return null;
  }

  console.log('[ScreenCaptureModal] ✅ Rendering modal');

  const handleStartCapture = async () => {
    try {
      setState('capturing');
      setError(null);

      console.log('[ScreenCapture] Requesting screen share...');

      // Request screen share
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
      });

      console.log('[ScreenCapture] Screen share granted');

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Wait a moment for video to render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture screenshot
        const canvas = canvasRef.current;
        if (canvas) {
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);
            console.log('[ScreenCapture] Screenshot captured');
          }
        }

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      }

      // Now process with AI
      await handleExtractProblem();

    } catch (err) {
      console.error('[ScreenCapture] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screen';
      setError(errorMessage);
      setState('error');
    }
  };

  const handleExtractProblem = async () => {
    if (!capturedImage) {
      setError('No image captured');
      setState('error');
      return;
    }

    try {
      setState('processing');
      console.log('[ScreenCapture] Extracting problem from image...');

      // Call Gemini API to extract problem
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.API_KEY || process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are analyzing a screenshot of an educational problem. Extract the complete problem details and return a JSON object with this structure:

{
  "subject": "algorithms" | "math" | "science",
  "title": "brief title of the problem",
  "text": "complete problem statement with all details",
  "examples": ["example 1", "example 2"],
  "constraints": ["constraint 1", "constraint 2"],
  "testCases": [
    {
      "input": "test input as string",
      "expectedOutput": "expected output as string",
      "explanation": "why this test case matters"
    }
  ]
}

For algorithm problems, include 3-5 comprehensive test cases. For math/science, leave testCases empty.
Extract ALL visible text, equations, code, and context. Be thorough and accurate.

Return ONLY the JSON object, nothing else.`
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: capturedImage.split(',')[1] // Remove data:image/png;base64, prefix
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ScreenCapture] API response:', data);

      // Extract text from response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response from AI');
      }

      // Parse JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const extracted = JSON.parse(jsonText);
      console.log('[ScreenCapture] Extracted problem:', extracted);

      // Map to Problem type
      const problem: Problem = {
        title: extracted.title,
        text: extracted.text,
        subject: extracted.subject || 'other',
        examples: extracted.examples || [],
        constraints: [
          ...(extracted.constraints || []),
          'Source: screen capture'
        ],
      };

      // Add test cases if present
      if (extracted.testCases && Array.isArray(extracted.testCases) && extracted.testCases.length > 0) {
        problem.testCases = extracted.testCases.map((tc: any) => ({
          input: [tc.input],
          expected: tc.expectedOutput,
          description: tc.explanation,
        }));
      }

      console.log('[ScreenCapture] Problem created:', problem);
      onProblemExtracted(problem);
      onClose();

    } catch (err) {
      console.error('[ScreenCapture] Extraction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract problem';
      setError(errorMessage);
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setError(null);
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Hidden video and canvas for capture */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl animate-scale-in bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Capture Problem from Screen</h2>
            <p className="text-blue-200">
              {state === 'idle' && 'Share your screen to capture the problem'}
              {state === 'capturing' && 'Capturing screenshot...'}
              {state === 'processing' && 'Extracting problem details with AI...'}
              {state === 'error' && 'Something went wrong'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-xl">
              <p className="text-red-100 text-sm">{error}</p>
            </div>
          )}

          {/* Preview captured image */}
          {capturedImage && state !== 'processing' && (
            <div className="mb-6">
              <img src={capturedImage} alt="Captured" className="w-full rounded-xl border-2 border-blue-400/30" />
            </div>
          )}

          {/* Loading states */}
          {(state === 'capturing' || state === 'processing') && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-300" />
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">
                  {state === 'capturing' ? 'Capturing your screen...' : 'Analyzing with AI...'}
                </p>
                <p className="text-blue-300 text-sm">
                  {state === 'capturing' ? 'Please select the window or screen' : 'Extracting problem details from the image'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            {state === 'idle' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartCapture}
                  className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50"
                >
                  📷 Capture Screen
                </button>
              </>
            )}

            {state === 'error' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105 bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  Try Again
                </button>
              </>
            )}
          </div>

          {/* Instructions */}
          {state === 'idle' && (
            <div className="mt-6 p-4 rounded-xl bg-blue-800/30 border border-blue-600/30">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>How it works</span>
              </h3>
              <ul className="space-y-1 text-sm text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">1.</span>
                  <span>Click "Capture Screen" and select the window with your problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">2.</span>
                  <span>We'll take a screenshot and automatically extract the problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">3.</span>
                  <span>AI will analyze and create a practice problem for you</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
