import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, MediaResolution, FunctionDeclaration, Type, EndSensitivity } from '@google/genai';
import { Problem } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { startFrameCapture, stopFrameCapture, FrameCaptureHandle } from '../utils/screenStreamCapture';
import { parseProblemFromLiveResponse } from '../services/problemExtraction';
import { AudioRecorder } from '../utils/audioRecorder';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

const CAPTURE_SYSTEM_INSTRUCTION = `You are an educational AI assistant helping a student capture a problem from their screen.

YOU ARE RECEIVING LIVE VIDEO FRAMES showing the student's screen. Observe silently and accumulate information.

WHEN THE USER REQUESTS EXTRACTION (says "EXTRACT" or similar):
Immediately call the extractProblem() function with the complete problem details:

IMPORTANT INSTRUCTIONS:
- Extract ALL visible text, code snippets, equations, and diagrams from the video frames
- If it's an ALGORITHM problem: Generate 3-5 comprehensive test cases covering edge cases, typical cases, and boundary conditions
- If it's MATH/SCIENCE: Include the solution approach and key formulas in the "examples" field
- Be thorough and accurate - this is the student's learning material
- Call the extractProblem() function IMMEDIATELY when extraction is requested
- DO NOT respond with text - ONLY call the function

DO NOT respond to casual conversation. Only call extractProblem() when extraction is explicitly requested.
`;

// Tool declaration for fast problem extraction
const EXTRACT_PROBLEM_TOOL: FunctionDeclaration = {
  name: 'extractProblem',
  description: 'Extract the complete problem details from the captured screen frames and submit it to the application. Use this when the user requests extraction.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      subject: {
        type: Type.STRING,
        enum: ['algorithms', 'math', 'science'],
        description: 'The subject category of the problem',
      },
      title: {
        type: Type.STRING,
        description: 'The title or name of the problem',
      },
      text: {
        type: Type.STRING,
        description: 'The complete problem statement with all details, descriptions, and context',
      },
      examples: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Examples, input/output samples, or solution approaches',
      },
      constraints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Constraints, limitations, requirements, or additional notes',
      },
      testCases: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            input: {
              type: Type.STRING,
              description: 'Test input as string (will be parsed)',
            },
            expectedOutput: {
              type: Type.STRING,
              description: 'Expected output as string',
            },
            explanation: {
              type: Type.STRING,
              description: 'Why this test case is important (edge case, typical case, etc.)',
            },
          },
          required: ['input', 'expectedOutput', 'explanation'],
        },
        description: 'Test cases for algorithm problems (3-5 comprehensive cases covering edge cases and typical scenarios). Leave empty for math/science.',
      },
    },
    required: ['subject', 'title', 'text', 'examples', 'constraints'],
  },
};

interface UseGeminiLiveCaptureProps {
  onProblemExtracted: (problem: Problem) => void;
  onError: (error: string) => void;
}

export interface UseGeminiLiveCaptureReturn {
  startCapture: (screenStream: MediaStream) => Promise<void>;
  stopCapture: () => void;
  finishCapture: () => void; // User clicks "Done" button
  isActive: boolean;
  aiMessage: string;
  isListening: boolean;
  isSpeaking: boolean;
  error: string | null;
}

export function useGeminiLiveCapture({
  onProblemExtracted,
  onError,
}: UseGeminiLiveCaptureProps): UseGeminiLiveCaptureReturn {
  const [isActive, setIsActive] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const frameCaptureRef = useRef<FrameCaptureHandle | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isExtractingRef = useRef(false);
  // FIX: Replaced NodeJS.Timeout with number for browser compatibility.
  const promptTimerRef = useRef<number | null>(null);
  const isCleaningUpRef = useRef(false);

  const cleanup = useCallback(() => {
    // Prevent concurrent cleanup calls
    if (isCleaningUpRef.current) {
      console.log('[LiveCapture] ⚠️ Cleanup already in progress, skipping...');
      return;
    }

    isCleaningUpRef.current = true;
    console.log('[LiveCapture] 🧹 Starting cleanup...');

    // Immediately reset state to prevent race conditions
    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    isExtractingRef.current = false;

    // Stop prompt timer
    try {
      if (promptTimerRef.current) {
        console.log('[LiveCapture] Clearing prompt timer...');
        clearInterval(promptTimerRef.current);
        promptTimerRef.current = null;
      }
    } catch (e) {
      console.error('[LiveCapture] Error clearing timer:', e);
    }

    // Stop audio recorder
    try {
      if (audioRecorderRef.current) {
        console.log('[LiveCapture] Stopping audio recorder...');
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        console.log('[LiveCapture] ✓ Audio recorder stopped');
      }
    } catch (e) {
      console.error('[LiveCapture] Error stopping audio recorder:', e);
    }

    // Stop frame capture
    try {
      if (frameCaptureRef.current) {
        console.log('[LiveCapture] Stopping frame capture...');
        stopFrameCapture(frameCaptureRef.current);
        frameCaptureRef.current = null;
        console.log('[LiveCapture] ✓ Frame capture stopped');
      }
    } catch (e) {
      console.error('[LiveCapture] Error stopping frame capture:', e);
    }

    // Stop screen stream
    try {
      if (screenStreamRef.current) {
        console.log('[LiveCapture] Stopping screen stream...');
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        console.log('[LiveCapture] ✓ Screen stream stopped');
      }
    } catch (e) {
      console.error('[LiveCapture] Error stopping screen stream:', e);
    }

    // Close Live session
    try {
      if (sessionRef.current) {
        console.log('[LiveCapture] Closing Live session...');
        sessionRef.current.close();
        sessionRef.current = null;
        console.log('[LiveCapture] ✓ Live session closed');
      }
    } catch (e) {
      console.error('[LiveCapture] Error closing session:', e);
    }

    // Close audio context (for playback)
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('[LiveCapture] Closing audio context...');
        audioContextRef.current.close();
        audioContextRef.current = null;
        console.log('[LiveCapture] ✓ Audio context closed');
      }
    } catch (e) {
      console.error('[LiveCapture] Error closing audio context:', e);
    }

    console.log('[LiveCapture] ✅ Cleanup completed!');

    // Reset cleanup flag after a short delay to allow new sessions
    setTimeout(() => {
      isCleaningUpRef.current = false;
      console.log('[LiveCapture] 🔓 Ready for new session');
    }, 100);
  }, []);

  const startCapture = useCallback(async (screenStream: MediaStream) => {
    // Wait for cleanup to complete if in progress
    if (isCleaningUpRef.current) {
      console.log('[LiveCapture] ⏳ Waiting for cleanup to complete...');
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      console.log('[LiveCapture] Starting capture session...');
      setError(null);
      screenStreamRef.current = screenStream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

      // Setup audio context for playback only (24kHz for output)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
      audioContextRef.current = audioContext;

      // Connect Live session
      const session = await ai.live.connect({
        model: 'models/gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
          realtimeInputConfig: {
            automaticActivityDetection: {
              silenceDurationMs: 2000, // 2 seconds of silence before ending speech
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            },
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              },
            },
          },
          systemInstruction: {
            parts: [{ text: CAPTURE_SYSTEM_INSTRUCTION }],
          },
          tools: [
            {
              functionDeclarations: [EXTRACT_PROBLEM_TOOL],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            console.log('[LiveCapture] Session opened');
            setIsActive(true);
            setIsListening(true);
          },
          onmessage: (message: LiveServerMessage) => {
            handleServerMessage(message);
          },
          onerror: (e: ErrorEvent) => {
            console.error('[LiveCapture] Session error:', e);
            setError('Connection error: ' + e.message);
            onError('Connection error: ' + e.message);
          },
          onclose: (e: CloseEvent) => {
            console.log('[LiveCapture] Session closed:', e.reason);
            cleanup();
          },
        },
      });

      sessionRef.current = session;

      // Create and start audio recorder
      console.log('[LiveCapture] Creating AudioRecorder with sample rate:', INPUT_SAMPLE_RATE);
      const audioRecorder = new AudioRecorder(INPUT_SAMPLE_RATE);
      audioRecorderRef.current = audioRecorder;

      let audioChunkCount = 0;
      // Listen for audio data from the recorder
      audioRecorder.on('data', (base64Audio: string) => {
        audioChunkCount++;
        console.log('[LiveCapture] Audio chunk #' + audioChunkCount + ' received, size:', base64Audio.length);
        if (session) {
          // Use sendRealtimeInput for audio (enables Voice Activity Detection)
          session.sendRealtimeInput({
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio,
            },
          });
          console.log('[LiveCapture] Audio chunk #' + audioChunkCount + ' sent to AI via sendRealtimeInput');
        }
      });

      // Handle recorder start event
      audioRecorder.on('start', () => {
        console.log('[LiveCapture] ✅ Audio recorder STARTED - microphone is capturing audio');
      });

      // Handle recorder errors
      audioRecorder.on('error', (err) => {
        console.error('[LiveCapture] ❌ Audio recorder error:', err);
        setError('Microphone error: ' + (err.message || 'Failed to access microphone'));
      });

      // Start recording
      console.log('[LiveCapture] Requesting microphone access...');
      try {
        await audioRecorder.start();
        console.log('[LiveCapture] AudioRecorder.start() completed successfully');
      } catch (err) {
        console.error('[LiveCapture] Failed to start audio recorder:', err);
        throw err;
      }

      // Start frame capture (1 fps = 1 frame per second for realtime)
      let frameCount = 0;
      const frameCapture = startFrameCapture(
        screenStream,
        (frame: string) => {
          if (session) {
            frameCount++;
            console.log('[LiveCapture] Sending frame #', frameCount, 'to AI via sendRealtimeInput, size:', frame.length);

            // Use sendRealtimeInput for video frames (optimized for realtime)
            // The API expects a Blob object with data as base64 string
            session.sendRealtimeInput({
              video: {
                data: frame, // base64 encoded JPEG
                mimeType: 'image/jpeg',
              },
            });
          }
        },
        1 // 1 frame per second
      );

      frameCaptureRef.current = frameCapture;

      console.log('[LiveCapture] Video and audio streaming started. AI is observing silently...');

    } catch (err) {
      console.error('[LiveCapture] Failed to start capture:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start capture session';
      setError(errorMessage);
      onError(errorMessage);
      cleanup();
    }
  }, [isActive, cleanup, onError]);

  const handleServerMessage = useCallback((message: LiveServerMessage) => {
    console.log('[LiveCapture] 📨 Server message received:', JSON.stringify(message).substring(0, 200) + '...');

    // Handle tool calls (function calling)
    if (message.toolCall?.functionCalls) {
      console.log('[LiveCapture] 🔧 Tool call received:', message.toolCall.functionCalls.length, 'function(s)');

      for (const funcCall of message.toolCall.functionCalls) {
        if (funcCall.name === 'extractProblem') {
          console.log('[LiveCapture] ⚡ Fast extraction via tool call!');
          console.log('[LiveCapture] Tool args:', JSON.stringify(funcCall.args));

          try {
            const args = funcCall.args as any;

            // Map subject string to SubjectCategory
            let subject: 'algorithms' | 'math' | 'science' | 'other' = 'other';
            if (args.subject === 'algorithms') subject = 'algorithms';
            else if (args.subject === 'math') subject = 'math';
            else if (args.subject === 'science') subject = 'science';

            // Build Problem object from tool args
            const problem: Problem = {
              title: args.title,
              text: args.text,
              subject: subject,
              examples: args.examples || [],
              constraints: [
                ...(args.constraints || []),
                'Source: live screen capture',
              ],
            };

            // Add test cases if present (for algorithm problems)
            if (args.testCases && Array.isArray(args.testCases) && args.testCases.length > 0) {
              problem.testCases = args.testCases.map((tc: any) => ({
                input: [tc.input],
                expected: tc.expectedOutput,
                description: tc.explanation,
              }));
              console.log('[LiveCapture] ✅ Extracted', problem.testCases.length, 'test cases');
            }

            console.log('[LiveCapture] ✅ Problem extracted successfully:', problem.title);

            // Send tool response to acknowledge the call
            if (sessionRef.current && funcCall.id) {
              sessionRef.current.sendToolResponse({
                functionResponses: [{
                  id: funcCall.id,
                  name: 'extractProblem',
                  response: { success: true },
                }],
              });
            }

            // Notify parent component
            onProblemExtracted(problem);
            cleanup();
            return; // Exit early

          } catch (err) {
            console.error('[LiveCapture] ❌ Failed to process tool call:', err);
            setError('Failed to extract problem from tool call. Please try again.');
            isExtractingRef.current = false;
          }
        }
      }
    }

    // Handle audio output
    if (message.serverContent?.modelTurn?.parts) {
      const parts = message.serverContent.modelTurn.parts;
      console.log('[LiveCapture] Processing ' + parts.length + ' parts from model turn');

      for (const part of parts) {
        // Handle text responses
        if (part.text) {
          console.log('[LiveCapture] 💬 AI says:', part.text);
          setAiMessage(part.text);

          // Check if this is the problem extraction response
          // Only try to extract if we've requested extraction (isExtractingRef is true)
          if (isExtractingRef.current && (part.text.includes('"subject"') || part.text.includes('json'))) {
            console.log('[LiveCapture] Detected problem extraction response');

            try {
              const problem = parseProblemFromLiveResponse(part.text);
              console.log('[LiveCapture] Successfully extracted problem:', problem.title);
              onProblemExtracted(problem);
              cleanup();
            } catch (err) {
              console.error('[LiveCapture] Failed to parse problem:', err);
              setError('Failed to extract problem. Please try again.');
              isExtractingRef.current = false; // Reset so user can try again
            }
          }
        }

        // Handle audio responses
        if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
          console.log('[LiveCapture] 🔊 Received audio chunk, size:', part.inlineData.data.length);
          setIsSpeaking(true);
          playAudioChunk(part.inlineData.data);
        }
      }
    } else {
      console.log('[LiveCapture] ⚠️ Server message received but no modelTurn parts found');
    }

    // Handle turn complete
    if (message.serverContent?.turnComplete) {
      console.log('[LiveCapture] ✅ Turn complete');
      setIsListening(true);
      setIsSpeaking(false);
    }
  }, [onProblemExtracted, cleanup]);

  const playAudioChunk = useCallback(async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      const audioData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, OUTPUT_SAMPLE_RATE, 1);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
      source.start(startTime);

      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error('[LiveCapture] Error playing audio:', err);
    }
  }, []);

  const finishCapture = useCallback(() => {
    if (!sessionRef.current || isExtractingRef.current) return;

    console.log('[LiveCapture] 🎯 User clicked Done - requesting extraction...');
    isExtractingRef.current = true;
    setAiMessage('Extracting problem details from captured frames...');

    // Use sendRealtimeInput with text to trigger extraction
    sessionRef.current.sendRealtimeInput({
      text: 'EXTRACT - Please extract the complete problem details from all the video frames you have observed. Include all text, code, equations, examples, and constraints. If this is an algorithm problem, generate comprehensive test cases.',
    });

    console.log('[LiveCapture] Extraction request sent via sendRealtimeInput');
  }, []);

  const stopCapture = useCallback(() => {
    console.log('[LiveCapture] User cancelled capture');
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    startCapture,
    stopCapture,
    finishCapture,
    isActive,
    aiMessage,
    isListening,
    isSpeaking,
    error,
  };
}
