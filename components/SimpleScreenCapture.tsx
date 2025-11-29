import React, { useState } from 'react';
import { Problem } from '../types';

interface SimpleScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemExtracted: (problem: Problem) => void;
}

export const SimpleScreenCapture: React.FC<SimpleScreenCaptureProps> = ({
  isOpen,
  onClose,
  onProblemExtracted,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  console.log('[SimpleScreenCapture] Render - isOpen:', isOpen);

  if (!isOpen) {
    console.log('[SimpleScreenCapture] Not rendering - isOpen is false');
    return null;
  }

  console.log('[SimpleScreenCapture] ✅ Rendering modal!');

  const captureScreen = async () => {
    try {
      setIsCapturing(true);
      setError(null);

      // Step 1: Request screen share
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Step 2: Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Step 3: Wait for video to load
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Step 4: Capture to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Step 5: Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(imageData);

      // Step 6: Stop stream
      stream.getTracks().forEach((track) => track.stop());

      setIsCapturing(false);

      // Step 7: Process with AI
      await processWithAI(imageData);
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(err.message || 'Failed to capture screen');
      setIsCapturing(false);
    }
  };

  const processWithAI = async (imageBase64: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Remove data URL prefix
      const base64Data = imageBase64.split(',')[1];

      // Call Gemini API
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this screenshot and extract the problem. Return ONLY valid JSON in this exact format:

{
  "subject": "algorithms" | "math" | "science",
  "title": "Problem title",
  "text": "Complete problem description",
  "examples": ["example1", "example2"],
  "constraints": ["constraint1"],
  "testCases": [
    {
      "input": "input as string",
      "expected": "expected output",
      "description": "test description"
    }
  ]
}

Rules:
- For ALGORITHMS: Include 3-5 test cases with inputs, expected outputs
- For MATH/SCIENCE: Leave testCases empty array
- Extract ALL visible text accurately
- Return ONLY the JSON, no markdown`,
                  },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!textResponse) {
        throw new Error('No response from AI');
      }

      // Parse JSON (handle markdown code blocks)
      let jsonText = textResponse.trim();
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const parsed = JSON.parse(jsonText);

      // Create Problem object
      const problem: Problem = {
        subject: parsed.subject || 'other',
        title: parsed.title,
        text: parsed.text,
        examples: parsed.examples || [],
        constraints: [...(parsed.constraints || []), 'Source: Screen Capture'],
      };

      // Add test cases for algorithms
      if (
        parsed.subject === 'algorithms' &&
        parsed.testCases &&
        parsed.testCases.length > 0
      ) {
        problem.testCases = parsed.testCases.map((tc: any) => ({
          input: [tc.input],
          expected: tc.expected,
          description: tc.description,
        }));
      }

      setIsProcessing(false);
      onProblemExtracted(problem);
      onClose();
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process image');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">
            📸 Capture Problem from Screen
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Preview */}
          {preview && !isProcessing && (
            <div className="mb-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg border-2 border-gray-200"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Loading States */}
          {isCapturing && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-700 font-medium">
                Capturing your screen...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Select the window or screen to capture
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-700 font-medium">
                Analyzing with AI...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Extracting problem details and generating test cases
              </p>
            </div>
          )}

          {/* Instructions */}
          {!isCapturing && !isProcessing && !preview && (
            <div className="py-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📋 How it works:
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Click "Start Capture" below</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>
                      Select the window/screen with your problem
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>
                      AI will extract the problem and generate test cases
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Start solving immediately!</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isCapturing || isProcessing}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </button>

            {!preview && !isCapturing && !isProcessing && (
              <button
                onClick={captureScreen}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                🎬 Start Capture
              </button>
            )}

            {preview && !isProcessing && (
              <button
                onClick={() => {
                  setPreview(null);
                  captureScreen();
                }}
                className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                🔄 Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
