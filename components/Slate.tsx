import React, { useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Tldraw, Editor, useEditor, createShapeId, TLTextShape, TLImageShape, TLNoteShape, AssetRecordType, toRichText, renderPlaintextFromRichText } from 'tldraw';
import { blobToBase64 } from '../utils/dataUtils';
import { Problem, TestCase } from '../types';
import { VideoOverlay } from './VideoOverlay';

interface TestResults {
  passed: number;
  failed: number;
  results: Array<{ testCase: TestCase; passed: boolean; output?: any; error?: string }>;
}

interface SlateProps {
  problem: Problem | null;
  isLoading: boolean;
  error: string | null;
  onAskForHint: () => void;
  onEditorReady: () => void;
  onTestResultsChange?: (results: TestResults | null) => void;
}

export interface SlateHandle {
  editor: Editor | null;
  exportAsDataURL: () => Promise<string | null>;
  getAllCanvasText: () => string;
  writeText: (text: string) => Promise<void>;
  replaceAllCode: (newCode: string) => Promise<void>;
  updateText: (oldText: string, newText: string) => Promise<void>;
  createStickyNote: (text: string) => Promise<void>;
  createImage: (imageUrl: string, altText: string) => Promise<void>;
  createVideoOverlay: (videoUrl: string) => Promise<void>;
  executeCode: (code: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  runTests: () => Promise<{ passed: number; failed: number; results: Array<{ testCase: TestCase; passed: boolean; output?: any; error?: string }> }>;
  clearCanvas: () => void;
}

// Loading spinner removed - loading state now shown on FloatingAIAvatar instead
// This prevents blocking the canvas during video/image generation

// CustomUi component removed - controls moved to LeftSidebar


export const Slate = forwardRef<SlateHandle, SlateProps>(({ problem, isLoading, error, onAskForHint, onEditorReady, onTestResultsChange }, ref) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [hasWrittenInitialCode, setHasWrittenInitialCode] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
    onEditorReady();
  }, [onEditorReady]);

  const getViewportCenter = useCallback(() => {
    if (!editor) {
      // Return a sensible default if editor is not yet available
      return { x: 400, y: 300 };
    }

    // The most reliable method is getViewportPageBounds
    const bounds = editor.getViewportPageBounds();
    if (bounds) {
      return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
    }

    // Fallback to viewportPageCenter if bounds are not ready
    if (editor.viewportPageCenter) {
      return { x: editor.viewportPageCenter.x, y: editor.viewportPageCenter.y };
    }
    
    // Absolute fallback if neither is available
    console.warn("Could not determine viewport center, using default coordinates.");
    return { x: 400, y: 300 };
  }, [editor]);

  // FIX: Define writeText as a useCallback before useImperativeHandle so it can be called by other handle methods.
  const writeText = useCallback(async (text: string) => {
    if (!editor || !text?.trim()) return;
    const center = getViewportCenter();
    const shapeId = createShapeId();
    // FIX: Removed explicit generic type argument <TLTextShape> to fix "Untyped function calls may not accept type arguments" error.
    editor.createShape({
        id: shapeId,
        type: 'text',
        x: center.x - 150,
        y: center.y - 50,
        props: {
            richText: toRichText(text),
            textAlign: 'middle',
            font: text.includes('`') ? 'mono' : 'draw',
            autoSize: false,
            w: 300,
        }
    });
    editor.select(shapeId);
    editor.zoomToSelection();
  }, [editor, getViewportCenter]);

  // Auto-write initial code when problem loads
  React.useEffect(() => {
    if (editor && problem && problem.initialCode && !hasWrittenInitialCode) {
      const writeInitialCode = async () => {
        // Check if canvas is empty
        const existingShapes = editor.getCurrentPageShapes();
        if (existingShapes.length === 0) {
          // Write the initial code
          const center = getViewportCenter();

          const shapeId = createShapeId();
          // FIX: Removed explicit generic type argument <TLTextShape> to fix "Untyped function calls may not accept type arguments" error.
          editor.createShape({
            id: shapeId,
            type: 'text',
            x: center.x - 300,
            y: center.y - 100,
            props: {
              richText: toRichText(problem.initialCode),
              textAlign: 'start',
              font: 'mono',
              autoSize: true,
              w: 600,
            }
          });

          editor.select(shapeId);
          editor.zoomToSelection();
          setHasWrittenInitialCode(true);
        }
      };

      // Small delay to ensure editor is fully ready
      setTimeout(writeInitialCode, 100);
    }
  }, [editor, problem, hasWrittenInitialCode, getViewportCenter]);

  // Reset flag when problem changes
  React.useEffect(() => {
    setHasWrittenInitialCode(false);
  }, [problem?.title]); // Use problem title as dependency to detect problem changes

  useImperativeHandle(ref, () => ({
    editor,
    getAllCanvasText: () => {
      if (!editor) return '';
      const textShapes = editor.getCurrentPageShapes().filter((shape): shape is TLTextShape => shape.type === 'text');
      if (textShapes.length === 0) return '';

      // Combine all text from all text shapes
      const allText = textShapes
        .map(shape => renderPlaintextFromRichText(editor, shape.props.richText))
        .join('\n\n');

      return allText;
    },
    exportAsDataURL: async () => {
      if (!editor) return null;

      // Wait a short moment to ensure shapes are rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const shapes = editor.getCurrentPageShapes();
      if (shapes.length === 0) {
        console.log("No shapes on canvas to export");
        return null;
      }

      try {
        const shapeIds = shapes.map(shape => shape.id);
        const imageExport = await editor.toImage(shapeIds, { format: 'png', background: true, scale: 1, darkMode: true });
        if (!imageExport?.blob) {
          console.warn("toImage returned no blob");
          return null;
        }
        const dataUrl = await blobToBase64(imageExport.blob);
        console.log("Canvas exported successfully, data URL length:", dataUrl?.length);
        return dataUrl;
      } catch (e) {
        console.error("Failed to export canvas as data URL:", e);
        return null;
      }
    },
    writeText,
    replaceAllCode: async (newCode: string) => {
        if (!editor || !newCode?.trim()) return;

        // Get all shapes on canvas
        const allShapes = editor.getCurrentPageShapes();
        const textShapes = allShapes.filter((shape): shape is TLTextShape => shape.type === 'text');

        // Preserve properties from existing shape if available
        let existingShape = textShapes.length > 0 ? textShapes[0] : null;
        const preservedFont = existingShape?.props.font || 'mono';
        const preservedX = existingShape?.x || getViewportCenter().x - 300;
        const preservedY = existingShape?.y || getViewportCenter().y - 200;
        const preservedWidth = existingShape?.props.w || 600;
        const preservedTextAlign = existingShape?.props.textAlign || 'start';

        // Delete ALL existing text shapes first
        if (textShapes.length > 0) {
            editor.deleteShapes(textShapes.map(s => s.id));
        }

        // Create a single new text shape with the complete code, preserving style
        const shapeId = createShapeId();
        // FIX: Removed explicit generic type argument <TLTextShape> to fix "Untyped function calls may not accept type arguments" error.
        editor.createShape({
            id: shapeId,
            type: 'text',
            x: preservedX,
            y: preservedY,
            props: {
                richText: toRichText(newCode),
                textAlign: preservedTextAlign,
                font: preservedFont,
                autoSize: true,
                w: preservedWidth,
            }
        });

        editor.select(shapeId);
        editor.zoomToSelection();

        console.log(`replaceAllCode: Replaced all text with new code (font: ${preservedFont})`);
    },
    updateText: async (oldText: string, newText: string) => {
        if (!editor) return;
        const textShapes = editor.getCurrentPageShapes().filter((shape): shape is TLTextShape => shape.type === 'text');
        const targetShape = textShapes.find(shape => {
            const plainText = renderPlaintextFromRichText(editor, shape.props.richText);
            return plainText.includes(oldText);
        });

        if (targetShape) {
            const plainText = renderPlaintextFromRichText(editor, targetShape.props.richText);
            const updatedText = plainText.replace(oldText, newText);
            // FIX: Removed explicit generic type argument <TLTextShape> to fix "Untyped function calls may not accept type arguments" error.
            editor.updateShape({
                id: targetShape.id,
                type: 'text',
                props: {
                    richText: toRichText(updatedText),
                }
            });
            editor.select(targetShape.id);
            editor.zoomToSelection();
        } else {
            console.warn("Could not find text to update:", oldText);
            // FIX: Fixed incorrect ref access. `ref.current` is not available inside the component. Call `writeText` directly.
            // Fallback to writing new text if old text not found
            await writeText(newText);
        }
    },
    createStickyNote: async (text: string) => {
        if (!editor || !text?.trim()) return;

        // Find all text shapes to position sticky note beside them
        const textShapes = editor.getCurrentPageShapes().filter((shape): shape is TLTextShape => shape.type === 'text');

        let x, y;
        if (textShapes.length > 0) {
            // Position sticky note to the right of the rightmost text shape
            const rightmostShape = textShapes.reduce((rightmost, shape) => {
                const shapeRight = shape.x + (shape.props.w || 0);
                const rightmostRight = rightmost.x + (rightmost.props.w || 0);
                return shapeRight > rightmostRight ? shape : rightmost;
            });

            x = rightmostShape.x + (rightmostShape.props.w || 300) + 50; // 50px gap
            y = rightmostShape.y;
        } else {
            // No text shapes, position in center-right area
            const center = getViewportCenter();
            x = center.x + 200;
            y = center.y - 100;
        }

        const shapeId = createShapeId();
        // FIX: Removed explicit generic type argument <TLNoteShape> to fix "Untyped function calls may not accept type arguments" error.
        editor.createShape({
            id: shapeId,
            type: 'note',
            x: x,
            y: y,
            props: {
                richText: toRichText(text),
                color: 'yellow',
                size: 'm',
                font: 'sans',
                align: 'start',
                verticalAlign: 'start',
                growY: 0,
                url: '',
                fontSizeAdjustment: 0,
                labelColor: 'black',
            }
        });

        editor.select(shapeId);
        console.log('Created sticky note hint beside code');
    },
    createImage: async (imageUrl: string, altText: string) => {
        if (!editor) return;

        const assetId = AssetRecordType.createId();
        const asset = {
            id: assetId,
            type: 'image',
            typeName: 'asset',
            props: {
                name: altText,
                src: imageUrl,
                w: 500,
                h: 500,
                mimeType: 'image/png',
                isAnimated: false,
            },
            meta: {},
        };
        editor.createAssets([asset]);

        const center = getViewportCenter();
        const shapeId = createShapeId();
        // FIX: Removed explicit generic type argument <TLImageShape> to fix "Untyped function calls may not accept type arguments" error.
        editor.createShape({
            id: shapeId,
            type: 'image',
            x: center.x - 250,
            y: center.y - 250,
            props: {
                assetId: assetId,
                w: 500,
                h: 500,
            }
        });
        editor.select(shapeId);
        editor.zoomToSelection();
    },
    createVideoOverlay: async (videoUrl: string) => {
        console.log('[VIDEO] Displaying video overlay:', videoUrl);
        setVideoUrl(videoUrl);
        setIsVideoVisible(true);
    },
    executeCode: async (code: string) => {
      // Execute JavaScript code safely in an isolated context
      try {
        // Capture console output
        const logs: string[] = [];
        const originalLog = console.log;
        const mockConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => String(arg)).join(' '));
          }
        };

        // Create a function to execute the code with access to mock console
        const executeFunction = new Function('console', `
          'use strict';
          ${code}
        `);

        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout (5s)')), 5000)
        );

        const executionPromise = Promise.resolve().then(() => {
          executeFunction(mockConsole);
        });

        await Promise.race([executionPromise, timeoutPromise]);

        return {
          success: true,
          output: logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no output)'
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    },
    runTests: async () => {
      if (!problem || !problem.testCases || problem.testCases.length === 0) {
        return {
          passed: 0,
          failed: 0,
          results: []
        };
      }

      // Get code from canvas
      const code = ref.current?.getAllCanvasText() || '';
      if (!code.trim()) {
        return {
          passed: 0,
          failed: 1,
          results: [{
            testCase: { input: [], expected: null, description: 'No code found' },
            passed: false,
            error: 'No code found on canvas'
          }]
        };
      }

      console.log('[TEST] Running tests against code:', code.substring(0, 100));
      console.log('[TEST] Function name:', problem.functionName);
      console.log('[TEST] Test cases:', problem.testCases.length);

      const results: Array<{ testCase: TestCase; passed: boolean; output?: any; error?: string }> = [];
      let passed = 0;
      let failed = 0;

      // Run each test case
      for (const testCase of problem.testCases) {
        try {
          // Create execution context with the user's code
          const executeFunction = new Function(`
            'use strict';
            ${code}

            // Return the function to test
            if (typeof ${problem.functionName} === 'function') {
              return ${problem.functionName};
            } else {
              throw new Error('Function ${problem.functionName} not found in code');
            }
          `);

          // Execute with timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test execution timeout (2s)')), 2000)
          );

          const executionPromise = Promise.resolve().then(() => {
            const userFunction = executeFunction();
            return userFunction(...testCase.input);
          });

          const output = await Promise.race([executionPromise, timeoutPromise]);

          // Compare output with expected
          const isEqual = JSON.stringify(output) === JSON.stringify(testCase.expected);

          if (isEqual) {
            passed++;
            results.push({
              testCase,
              passed: true,
              output
            });
          } else {
            failed++;
            results.push({
              testCase,
              passed: false,
              output,
              error: `Expected ${JSON.stringify(testCase.expected)}, but got ${JSON.stringify(output)}`
            });
          }

        } catch (error) {
          failed++;
          results.push({
            testCase,
            passed: false,
            error: (error as Error).message
          });
        }
      }

      const testResult = { passed, failed, results };
      setTestResults(testResult);
      if (onTestResultsChange) {
        onTestResultsChange(testResult);
      }
      console.log('[TEST] Results:', testResult);
      return testResult;
    },
    clearCanvas: () => {
      if (!editor) return;
      const allShapes = editor.getCurrentPageShapes();
      if (allShapes.length > 0) {
        editor.deleteShapes(allShapes.map(s => s.id));
      }
    },
  }), [editor, getViewportCenter, onTestResultsChange, problem, setTestResults, testResults, writeText]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Tldraw
        onMount={handleMount}
        components={{ StylePanel: () => null }}
      />
      {error && (
        <div className="absolute inset-0 bg-purple-900/80 backdrop-blur-sm flex items-center justify-center text-center text-red-300 z-20">
            <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-6 max-w-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-bold text-lg mb-2">Error</p>
              <p className="text-sm">{error}</p>
            </div>
        </div>
      )}
      {videoUrl && (
        <VideoOverlay
          videoUrl={videoUrl}
          isVisible={isVideoVisible}
          onClose={() => {
            setIsVideoVisible(false);
            setVideoUrl(null);
          }}
        />
      )}
    </div>
  );
});
