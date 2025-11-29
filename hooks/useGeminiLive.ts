// FIX: Replaced placeholder content with a full implementation of the useGeminiLive hook.
// This resolves errors related to 'full', 'contents', 'of', 'hooks', and 'useGeminiLive' not being defined.
// FIX: Add React import to resolve "Cannot find namespace 'React'" error.
import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` from import as it is not an exported member.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Problem } from '../types';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';
import {
  stickyNoteHintFunctionDeclaration,
  writeOnCanvasFunctionDeclaration,
  replaceAllCodeOnCanvasFunctionDeclaration,
  updateCodeOnCanvasFunctionDeclaration,
  generateImageOnCanvasFunctionDeclaration,
  executeCodeFunctionDeclaration,
  generateVideoOnCanvasFunctionDeclaration,
} from '../utils/toolDeclarations';
import { SlateHandle } from '../components/Slate';
import { generateImageOnSlate } from '../services/geminiService';
import { generateEducationalVideo } from '../services/videoService';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Helper function to generate subject-aware system instructions
const getSystemInstruction = (problem: Problem): string => {
  const baseInstruction = `You are a friendly and helpful tutor assisting a student with a practice problem.
The problem is titled "${problem.title}" and the statement is: "${problem.text}".

The student is working on a digital whiteboard.`;

  if (problem.subject === 'algorithms') {
    return `${baseInstruction}

SUBJECT: ALGORITHMS & CODING
You have these tools for helping with code:

FOR HINTS (when user asks for help/hints):
- stickyNoteHint: PRIMARY tool for hints - creates a yellow sticky note with your hint
- NEVER modify their code when giving hints - ONLY use stickyNoteHint

FOR CODE MODIFICATION (ONLY when user explicitly says "modify the code", "update the code", "change the code"):
- writeOnCanvas: ONLY use when canvas is COMPLETELY EMPTY (no code exists yet)
  * Format code properly with line breaks and indentation (write multi-line code as you would in a text editor)
- replaceAllCodeOnCanvas: Use when there is EXISTING code and user asks to modify/update it
  * This tool REPLACES all existing code with your new version
  * CRITICAL: Write the code with proper structure - separate lines for each statement, consistent indentation (2-4 spaces)
  * Example proper formatting:
    function sum(arr) {
      let total = 0;
      for (let i = 0; i < arr.length; i++) {
        total += arr[i];
      }
      return total;
    }
  * DO NOT write code on a single line or without proper spacing
- updateCodeOnCanvas: For small targeted line fixes only
- executeCode: Test JavaScript code after writing/modifying - ALWAYS verify code works

OTHER TOOLS:
- generateImageOnCanvas: For visual diagrams (flowcharts, algorithm visualizations, etc.)
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
- generateVideoOnCanvas: For 8-second CINEMATIC educational videos with STORY-BASED narratives
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
  * Use when user explicitly requests a video ("show me a video", "animate this", "make a video")
  * Use for complex processes that benefit from engaging visual storytelling
  * CRITICAL: Create NARRATIVE-DRIVEN prompts like a filmmaker, NOT technical descriptions
  * Think: "Show, don't tell" - Use real-world scenarios, camera movements, visual metaphors
  * Prompt Structure:
    1. Set the scene (context/setting with visual details)
    2. Introduce characters/objects (people, everyday items students relate to)
    3. Show the action (smooth transitions, zoom in/out, camera follows motion)
    4. Build progression (step-by-step with visual cues: arrows, labels, colors)
    5. Reveal the result (final state with emphasis: checkmarks, highlights)
  * Example GOOD prompt: "Imagine organizing a line of students by height. Camera pans down the line. Zoom in as two students compare heights - numbers pop up above their heads. If wrong order, they smoothly swap places with a sliding animation. Camera follows along as we repeat through the line. Each pass, the tallest student 'bubbles up' to the end like a balloon rising. Show progress with green checkmarks floating up. Final shot: perfect lineup with confetti."
  * Example BAD prompt: "Animate bubble sort algorithm showing comparisons and swaps"
  * Use analogies: sorting → organizing people, forces → pushing/pulling objects, reactions → cooking/mixing

CRITICAL RULES:
1. When user asks for "hint" or "help" → Use stickyNoteHint (DO NOT touch their code)
2. When user says "modify code" or "update code" → Use replaceAllCodeOnCanvas with COMPLETE, FORMATTED code
3. NEVER use writeOnCanvas if there is already code on the canvas - ALWAYS use replaceAllCodeOnCanvas instead
4. After writing code → ALWAYS use executeCode to test it
5. Keep sticky note hints concise and encouraging
6. FORMATTING IS CRITICAL: Code must have proper line breaks and indentation - write it as you would in a code editor

Canvas Awareness:
- You will receive [CANVAS UPDATE] messages when the student manually edits code AND stops typing for 10 seconds
- Updates are debounced to avoid overwhelming you while the student is actively typing
- When you receive updates, analyze the changes and provide helpful, concise verbal feedback
- Keep responses brief - the student is working, don't interrupt too much

Guide the student through solving the problem step-by-step. Be encouraging and clear.`;
  } else if (problem.subject === 'other') {
    // For imported/captured problems
    return `${baseInstruction}

SUBJECT: IMPORTED PROBLEM
This problem was captured from an external source (screen share, camera, or image upload).
The student wants to work on this problem collaboratively with your help.

You have these tools for helping:

FOR HINTS (when user asks for help/hints):
- stickyNoteHint: PRIMARY tool for hints - creates a yellow sticky note with your hint
- NEVER modify their work when giving hints - ONLY use stickyNoteHint

FOR WRITING/MODIFYING CONTENT:
- writeOnCanvas: Use to write text, formulas, code, or explanations on the canvas
- replaceAllCodeOnCanvas: Use to update existing text/work on the canvas with new content
- updateCodeOnCanvas: For small targeted text edits

FOR VISUAL EXPLANATIONS:
- generateImageOnCanvas: For diagrams, flowcharts, visualizations
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
- generateVideoOnCanvas: For 8-second educational videos
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
  * Use story-based, cinematic prompts with real-world scenarios

FOR CODE EXECUTION (if this is a coding problem):
- executeCode: Test JavaScript code and return output/errors

CRITICAL RULES:
1. The problem format may be less structured than typical practice problems
2. Be flexible - the student may need help understanding the problem itself
3. Ask clarifying questions if the problem statement is unclear
4. Adapt your teaching style based on the problem type (code, math, science, etc.)
5. Focus on collaborative problem-solving rather than structured lessons
6. Be encouraging and supportive throughout the session

Canvas Awareness:
- You will receive [CANVAS UPDATE] messages when the student manually edits content
- Updates are debounced - sent only after student stops editing for 10 seconds
- Provide helpful, concise verbal feedback when you see their work
- Keep responses brief to avoid interrupting their flow

Work collaboratively with the student to solve this imported problem. Be adaptable and supportive.`;
  } else {
    // For math and science
    const subjectLabel = problem.subject === 'math' ? 'MATHEMATICS' : 'SCIENCE';
    return `${baseInstruction}

SUBJECT: ${subjectLabel}
You have these tools for helping with ${problem.subject}:

FOR HINTS (when user asks for help/hints):
- stickyNoteHint: PRIMARY tool for hints - creates a yellow sticky note with your hint
- NEVER modify their work when giving hints - ONLY use stickyNoteHint

FOR WRITING/MODIFYING CONTENT:
- writeOnCanvas: Use to write formulas, equations, diagrams, or explanations on the canvas
- replaceAllCodeOnCanvas: Use to update existing text/work on the canvas with new content
- updateCodeOnCanvas: For small targeted text edits

FOR VISUAL EXPLANATIONS:
- generateImageOnCanvas: Use to create diagrams, graphs, molecular structures, physics diagrams, etc.
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
  * When user asks "explain with images", generate relevant educational visualizations
- generateVideoOnCanvas: For 8-second CINEMATIC educational videos with REAL-WORLD STORIES
  * IMPORTANT: Only ONE media generation at a time - do NOT call this if a video/image is already generating
  * Use when user explicitly requests a video ("show me a video", "animate this")
  * Use for processes that benefit from engaging visual storytelling
  * CRITICAL: Create STORY-BASED prompts with everyday scenarios, NOT dry technical descriptions
  * Use analogies students can relate to:
    - Physics: Sports (skating, throwing balls, racing), playground activities
    - Chemistry: Cooking, mixing drinks, everyday reactions
    - Math: Shopping, building, measuring real objects
  * Prompt Structure (filmmaker mindset):
    1. Set scene with relatable context (ice rink, kitchen, construction site)
    2. Introduce characters/objects students know (people, sports equipment, food)
    3. Show action with camera work (zoom, pan, slow-motion, split-screen)
    4. Visualize abstract concepts (force arrows glow, molecules as colored balls)
    5. Reveal result with impact (freeze frame, formula overlay, visual celebration)
  * Example GOOD prompt: "A construction worker checks if a wall corner is square. Camera shows worker with measuring tape. Bottom edge: 3 meters - glowing blue line appears. Side edge: 4 meters - glowing green line. Diagonal: animated tape extends, question mark pops up. Blue square (3×3=9) and green square (4×4=16) materialize as actual 3D squares. They slide together and fuse into one large square. Square root animation extracts the answer: √25 = 5. Tape shows 5 meters! Green checkmark confirms perfect square."
  * Example BAD prompt: "Show Pythagorean theorem calculation with a² + b² = c²"

CRITICAL RULES:
1. When user asks for "hint" or "help" → Use stickyNoteHint (DO NOT modify their work)
2. When user asks "explain with images" → Use generateImageOnCanvas with detailed educational prompts
3. For ${problem.subject} explanations, focus on:
${problem.subject === 'math'
  ? '   - Clear step-by-step solutions\n   - Mathematical notation and formulas\n   - Graphs and geometric diagrams when helpful'
  : '   - Scientific concepts and principles\n   - Relevant formulas and laws\n   - Diagrams (molecular structures, force diagrams, etc.)'}
4. Keep hints concise but educational
5. Encourage understanding, not just memorization

Canvas Awareness:
- You will receive [CANVAS UPDATE] messages when the student modifies their work AND stops for 10 seconds
- Analyze their work and provide helpful, encouraging feedback
- Point out correct approaches and gently guide on mistakes

Guide the student through understanding the concept step-by-step. Be encouraging, patient, and focus on building their understanding.`;
  }
};

export const useGeminiLive = (
  slateRef: React.RefObject<SlateHandle>,
  problem: Problem | null,
  setIsLoading: (loading: boolean) => void,
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: Changed type from Promise<LiveSession> to Promise<any> as LiveSession is not exported.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const outputSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  const lastCanvasContentRef = useRef<string>('');
  const lastCanvasChangeTimeRef = useRef<number>(0);
  const pendingCanvasUpdateRef = useRef<boolean>(false);
  // FIX: Replaced NodeJS.Timeout with number for browser compatibility.
  const canvasMonitorIntervalRef = useRef<number | null>(null);
  const isAISpeakingRef = useRef<boolean>(false);
  const lastUserSpeechTimeRef = useRef<number>(0);
  const isGeneratingMediaRef = useRef<boolean>(false); // Track video/image generation status

  const stopAIAudio = useCallback(() => {
    // Stop all currently playing audio sources
    for (const source of outputSourcesRef.current.values()) {
      try {
        source.stop();
      } catch (e) {
        // Source may already be stopped
      }
    }
    outputSourcesRef.current.clear();
    nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
    isAISpeakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close().catch(console.error);
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
    }
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
  }, []);
  
  const stopSession = useCallback(async () => {
    setError(null);
    const session = await sessionPromiseRef.current;
    if (session) {
      session.close();
    }
    sessionPromiseRef.current = null;
    setIsConnected(false);
    cleanupAudio();
    for (const source of outputSourcesRef.current.values()) {
        source.stop();
    }
    outputSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Stop canvas monitoring
    if (canvasMonitorIntervalRef.current) {
      clearInterval(canvasMonitorIntervalRef.current);
      canvasMonitorIntervalRef.current = null;
    }
    lastCanvasContentRef.current = '';
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);
  
  const processToolCall = useCallback(async (toolCall: LiveServerMessage['toolCall']) => {
    if (!toolCall || !slateRef.current) return;

    for (const fc of toolCall.functionCalls) {
      console.log(`[TOOL CALL] Function: ${fc.name}`, fc.args);
      // FIX: Cast fc.args to any to handle unknown type errors
      const args = fc.args as any;
      let result: any = { result: "ok" };
      try {
        switch (fc.name) {
          case 'stickyNoteHint':
            console.log('[STICKY NOTE] Creating hint:', args.hint);
            await slateRef.current.createStickyNote(args.hint);
            break;
          case 'writeOnCanvas':
            console.log('[WRITE] Writing text (length):', args.text?.length);
            await slateRef.current.writeText(args.text);
            break;
          case 'replaceAllCodeOnCanvas':
            console.log('[REPLACE] Replacing code (length):', args.newCode?.length);
            console.log('[REPLACE] Code preview:', args.newCode?.substring(0, 100));
            await slateRef.current.replaceAllCode(args.newCode);
            break;
          case 'updateCodeOnCanvas':
            console.log('[UPDATE] Updating code snippet');
            await slateRef.current.updateText(args.oldCode, args.newCode);
            break;
          case 'generateImageOnCanvas':
            if (isGeneratingMediaRef.current) {
              console.log('[IMAGE] Skipping - media generation already in progress');
              result = { result: 'Media generation already in progress. Please wait for the current generation to complete.' };
              break;
            }
            console.log('[IMAGE] Generating image');
            isGeneratingMediaRef.current = true;
            setIsLoading(true);
            try {
              const imageUrl = await generateImageOnSlate(args.prompt);
              await slateRef.current.createImage(imageUrl, args.prompt);
              result = { result: 'Image generated and displayed successfully' };
            } catch (e) {
              console.error('[IMAGE] Error:', e);
              result = { result: `Image generation failed: ${(e as Error).message}` };
            } finally {
              isGeneratingMediaRef.current = false;
              setIsLoading(false);
            }
            break;
          case 'executeCode':
            console.log('[EXECUTE] Running code');
            const execResult = await slateRef.current.executeCode(args.code);
            result = execResult;
            break;
          case 'generateVideoOnCanvas':
            if (isGeneratingMediaRef.current) {
              console.log('[VIDEO] Skipping - media generation already in progress');
              result = { result: 'Media generation already in progress. Please wait for the current generation to complete.' };
              break;
            }
            console.log('[VIDEO] Generating educational video');
            console.log('[VIDEO] Animation prompt:', args.animationPrompt);
            isGeneratingMediaRef.current = true;
            setIsLoading(true);
            try {
              // Export current canvas state as reference image
              const canvasImage = await slateRef.current.exportAsDataURL();
              if (!canvasImage) {
                throw new Error('Cannot generate video: canvas is empty');
              }

              // Generate video with AI's animation prompt
              const videoUrl = await generateEducationalVideo(
                canvasImage,
                problem!,
                args.animationPrompt
              );

              // Display video overlay on canvas
              await slateRef.current.createVideoOverlay(videoUrl);
              result = { result: 'Video generated and displayed successfully' };
            } catch (e) {
              console.error('[VIDEO] Error:', e);
              result = { result: `Video generation failed: ${(e as Error).message}` };
            } finally {
              isGeneratingMediaRef.current = false;
              setIsLoading(false);
            }
            break;
          default:
            console.warn(`Unknown function call: ${fc.name}`);
            result = { result: `Unknown function: ${fc.name}` };
        }
      } catch (e) {
        console.error(`Error executing tool ${fc.name}:`, e);
        result = { result: `Error: ${(e as Error).message}` };
      }

      sessionPromiseRef.current?.then((session) => {
        session.sendToolResponse({
          functionResponses: {
            id: fc.id,
            name: fc.name,
            response: result,
          }
        });
      });
    }
  }, [slateRef, problem, setIsLoading]);
  
  const processAudio = useCallback(async (base64EncodedAudioString: string) => {
    if (!outputAudioContextRef.current || isMuted) return;

    isAISpeakingRef.current = true;
    setIsSpeaking(true);
    nextStartTimeRef.current = Math.max(
      nextStartTimeRef.current,
      outputAudioContextRef.current.currentTime,
    );

    try {
        const audioBuffer = await decodeAudioData(
            decode(base64EncodedAudioString),
            outputAudioContextRef.current,
            OUTPUT_SAMPLE_RATE,
            1,
        );
        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);
        source.addEventListener('ended', () => {
            outputSourcesRef.current.delete(source);
            // If no more sources playing, AI is done speaking
            if (outputSourcesRef.current.size === 0) {
              isAISpeakingRef.current = false;
              setIsSpeaking(false);
            }
        });

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
        outputSourcesRef.current.add(source);
    } catch(e) {
        console.error("Error decoding or playing audio:", e);
    }
  }, [isMuted]);

  const startSession = useCallback(async () => {
    if (!problem) {
      setError("Cannot start session without a problem.");
      return;
    }

    setError(null);
    setIsLoading(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // FIX: Cast window to any to allow access to vendor-prefixed webkitAudioContext for broader browser compatibility.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      // FIX: Cast window to any to allow access to vendor-prefixed webkitAudioContext for broader browser compatibility.
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;

              // Calculate RMS (Root Mean Square) to detect if user is speaking
              let sum = 0;
              for (let i = 0; i < l; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / l);
              const volumeThreshold = 0.01; // Adjust this threshold as needed

              // If user is speaking and AI is currently speaking, interrupt the AI
              if (rms > volumeThreshold && isAISpeakingRef.current) {
                const now = Date.now();
                // Only interrupt if user has been speaking for at least 500ms (avoid false positives)
                if (now - lastUserSpeechTimeRef.current > 500) {
                  console.log('User interrupted AI, stopping audio playback');
                  stopAIAudio();
                }
              }

              // Track when user is speaking
              if (rms > volumeThreshold) {
                lastUserSpeechTimeRef.current = Date.now();
              }

              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);

            // Start canvas monitoring - check every 2 seconds
            // Only send updates after 10 seconds of no changes (debounce)
            canvasMonitorIntervalRef.current = window.setInterval(() => {
              if (!slateRef.current) return;

              const currentContent = slateRef.current.getAllCanvasText();
              const now = Date.now();

              // Detect change
              if (currentContent && currentContent !== lastCanvasContentRef.current) {
                lastCanvasContentRef.current = currentContent;
                lastCanvasChangeTimeRef.current = now;
                pendingCanvasUpdateRef.current = true;
                console.log('Canvas content changed, waiting for user to stop typing...');
              }

              // Send update only if:
              // 1. There's a pending update
              // 2. User stopped typing for 10 seconds
              // 3. AI is not currently speaking (turnComplete)
              if (pendingCanvasUpdateRef.current &&
                  (now - lastCanvasChangeTimeRef.current) > 10000) {
                pendingCanvasUpdateRef.current = false;
                console.log('User stopped typing, sending canvas update to AI');

                // Send update to AI via text input
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({
                    text: `[CANVAS UPDATE] The student has modified their code. Current code:\n\n${currentContent}`
                  });
                });
              }
            }, 2000);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              await processAudio(base64Audio);
            }
            if (message.toolCall) {
              await processToolCall(message.toolCall);
            }
            if (message.serverContent?.turnComplete) {
              setIsLoading(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Live session error:", e);
            setError(`Session error: ${e.message || 'An unknown error occurred.'}`);
            setIsLoading(false);
            stopSession();
          },
          onclose: () => {
            setIsConnected(false);
            setIsLoading(false);
            cleanupAudio();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [
            stickyNoteHintFunctionDeclaration,
            writeOnCanvasFunctionDeclaration,
            replaceAllCodeOnCanvasFunctionDeclaration,
            updateCodeOnCanvasFunctionDeclaration,
            generateImageOnCanvasFunctionDeclaration,
            executeCodeFunctionDeclaration,
            generateVideoOnCanvasFunctionDeclaration
          ] }],
          systemInstruction: getSystemInstruction(problem),
        },
      });

      await sessionPromiseRef.current;

    } catch (e) {
      console.error("Failed to start session:", e);
      setError(`Failed to start session: ${(e as Error).message}`);
      setIsLoading(false);
      cleanupAudio();
    }
  }, [problem, cleanupAudio, processAudio, processToolCall, stopSession, setIsLoading, stopAIAudio]);
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  const askForHint = useCallback(async () => {
    if (!isConnected || !sessionPromiseRef.current || !slateRef.current) {
        console.warn("Cannot ask for hint: session not connected or slate not ready.");
        return;
    }

    setIsLoading(true);
    const dataUrl = await slateRef.current.exportAsDataURL();

    // For Live API, send image as base64 inline data with text
    if(dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        sessionPromiseRef.current?.then(session => {
          // Send text with image data
          session.sendRealtimeInput({
            text: "Here's my current work on the whiteboard. Can you give me a hint?",
            media: {
              data: base64Data,
              mimeType: 'image/png'
            }
          });
        });
    } else {
        // Send just text if no canvas content
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({
            text: "I'm stuck. Can you give me a hint to get started?"
          });
        });
    }

  }, [isConnected, slateRef, setIsLoading]);

  const explainWithImages = useCallback(async () => {
    if (!isConnected || !sessionPromiseRef.current || !slateRef.current || !problem) {
        console.warn("Cannot request image explanation: session not connected or slate not ready.");
        return;
    }

    setIsLoading(true);
    const dataUrl = await slateRef.current.exportAsDataURL();

    // Request AI to generate educational diagrams/images for the current problem
    const promptText = problem.subject === 'algorithms'
      ? `Can you explain this ${problem.title} problem using visual diagrams and images? Generate helpful visual explanations on the canvas.`
      : `Can you explain the ${problem.subject} concept "${problem.title}" using visual diagrams, formulas, and images? Generate clear educational visualizations on the canvas.`;

    if(dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({
            text: promptText,
            media: {
              data: base64Data,
              mimeType: 'image/png'
            }
          });
        });
    } else {
        sessionPromiseRef.current?.then(session => {
          session.sendRealtimeInput({
            text: promptText
          });
        });
    }

  }, [isConnected, slateRef, setIsLoading, problem]);

  return {
    isConnected,
    isMuted,
    isSpeaking,
    error,
    startSession,
    stopSession,
    toggleMute,
    askForHint,
    explainWithImages,
  };
};
