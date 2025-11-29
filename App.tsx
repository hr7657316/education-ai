// FIX: Replaced placeholder content with a full implementation of the App component.
// This resolves errors related to 'full', 'contents', 'of', 'App' not being defined
// and the module resolution error in `index.tsx`.
import React, { useState, useRef, useEffect } from 'react';
import { Slate, SlateHandle } from './components/Slate';
import { FloatingAIAvatar } from './components/FloatingAIAvatar';
import { LeftSidebar, SidebarSection } from './components/LeftSidebar';
import { CollapsiblePanel } from './components/CollapsiblePanel';
import { ProblemStatement } from './components/ProblemStatement';
import { TestResultsPanel } from './components/TestResultsPanel';
import { SessionEndDialog } from './components/SessionEndDialog';
import { useGeminiLive } from './hooks/useGeminiLive';
import { generateProblem, validateExamSolution } from './services/geminiService';
import { AppState, Problem, SubjectCategory, ExamResult } from './types';
import { GooeyText } from './components/ui/gooey-text-morphing';
import { TopicModal } from './components/TopicModal';
import { ArcGalleryHero } from './components/ui/arc-gallery-hero-component';
import { Logo } from './components/Logo';
import { LoadingScreen } from './components/LoadingScreen';
import { StudyTopicsPanel } from './components/StudyTopicsPanel';
import { AnswerValidationPanel } from './components/AnswerValidationPanel';
import { LandingPageIntegration } from './components/LandingPageIntegration';
import { ProblemThumbnail } from './services/historyService';
import { SimpleScreenCapture } from './components/SimpleScreenCapture';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [topic, setTopic] = useState<string>('Basic JavaScript Arrays');
  const [subject, setSubject] = useState<SubjectCategory>('algorithms');
  const [error, setError] = useState<string | null>(null);
  const [isSlateLoading, setIsSlateLoading] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watercolorImages, setWatercolorImages] = useState<string[]>([]);
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);

  const slateRef = useRef<SlateHandle>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ExamResult | null>(null);
  const [activeSidebarSection, setActiveSidebarSection] = useState<SidebarSection>(null);
  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);

  const {
    isConnected,
    isMuted,
    isSpeaking,
    error: liveError,
    startSession,
    stopSession,
    toggleMute,
    askForHint,
    explainWithImages
  } = useGeminiLive(slateRef, problem, setIsSlateLoading);

  useEffect(() => {
    if (liveError) {
      setError(`Assistant Error: ${liveError}`);
    }
  }, [liveError]);

  // Load watercolor images on mount
  useEffect(() => {
    const loadWatercolorImages = async () => {
      try {
        const response = await fetch('/assets/problem-thumbnails.json');
        if (response.ok) {
          const thumbnails: ProblemThumbnail[] = await response.json();
          const images = thumbnails
            .filter(t => t.imageDataUrl)
            .map(t => t.imageDataUrl!);
          setWatercolorImages(images);
        }
      } catch (err) {
        console.error('Failed to load watercolor images:', err);
      }
    };
    loadWatercolorImages();
  }, []);

  // Auto-open question panel when problem is generated
  useEffect(() => {
    if (appState === 'solving' && problem !== null) {
      setActiveSidebarSection('question');
    }
  }, [appState, problem]);

  // Don't auto-connect - let user manually connect via floating avatar
  // The useEffect for auto-connect has been removed


  const handleGenerateProblem = async (selectedTopic: string, selectedSubject: SubjectCategory) => {
    console.log('[APP] handleGenerateProblem called - subject:', selectedSubject);
    setTopic(selectedTopic);
    setSubject(selectedSubject);
    setError(null);
    setIsEditorReady(false);
    setIsModalOpen(false);

    // For "other" subject, open screen capture modal instead of generating
    if (selectedSubject === 'other') {
      console.log('[APP] 🎯 Opening screen capture modal!');
      console.log('[APP] Current isScreenCaptureOpen:', isScreenCaptureOpen);
      setIsScreenCaptureOpen(true);
      console.log('[APP] Set isScreenCaptureOpen to TRUE');
      return;
    }

    // For regular subjects, generate problem as usual
    setAppState('generating');
    try {
      const newProblem = await generateProblem(selectedTopic, selectedSubject);
      setProblem(newProblem);
      setAppState('solving');
    } catch (e) {
      setError((e as Error).message);
      setAppState('initial');
      setIsModalOpen(false);
    }
  };

  const handleScreenCapturedProblem = (problem: Problem) => {
    console.log('[APP] Problem extracted from screen capture:', problem.title);
    setIsScreenCaptureOpen(false);
    setProblem(problem);
    setTopic(problem.title);
    setSubject(problem.subject as SubjectCategory);
    setAppState('solving');
  };

  const handleEndSession = () => {
    stopSession();
    setShowSessionEndDialog(true);
  };

  const handleGoBackHome = () => {
    setProblem(null);
    setAppState('initial');
    setIsEditorReady(false);
    setTestResults(null);
    setValidationResult(null);
    setActiveSidebarSection(null);
    setShowSessionEndDialog(false);
  };

  const handleStartNewSession = () => {
    setShowSessionEndDialog(false);
    setIsModalOpen(true);
    setProblem(null);
    setTestResults(null);
    setValidationResult(null);
    setActiveSidebarSection(null);
  };

  const handleSidebarToggle = (section: 'question' | 'tests' | 'study') => {
    setActiveSidebarSection(prev => prev === section ? null : section);
  };

  const handleEditorReady = () => {
    setIsEditorReady(true);
  };

  const handleRunTests = async () => {
    if (subject === 'algorithms') {
      // Run code tests for algorithms
      if (slateRef.current) {
        await slateRef.current.runTests();
      }
    } else {
      // Check answer for math/science
      await handleCheckAnswer();
    }
  };

  const handleCheckAnswer = async () => {
    if (!slateRef.current || !problem) {
      console.warn('Cannot check answer: slate or problem not available');
      return;
    }

    try {
      setIsSlateLoading(true);
      setError(null);

      // Export canvas as image
      const canvasImage = await slateRef.current.exportAsDataURL();

      if (!canvasImage) {
        setError('Please write your solution on the canvas first');
        setIsSlateLoading(false);
        return;
      }

      // Validate the answer using AI
      const result = await validateExamSolution(problem, canvasImage);

      // Store the validation result
      setValidationResult(result);

      // Open the validation panel (reuse the tests section)
      setActiveSidebarSection('tests');

    } catch (e) {
      console.error('Error validating answer:', e);
      setError(`Validation Error: ${(e as Error).message}`);
    } finally {
      setIsSlateLoading(false);
    }
  };

  const handleClearCanvas = () => {
    if (slateRef.current) {
      slateRef.current.clearCanvas();
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'initial':
        // Use Unsplash stock images for the arc gallery
        const educationImages = [
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop', // Coding
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop', // Mathematics
          'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400&auto=format&fit=crop', // Chemistry lab
          'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=400&auto=format&fit=crop', // Physics
          'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400&auto=format&fit=crop', // Education/studying
          'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop', // Science
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=400&auto=format&fit=crop', // Programming
          'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=400&auto=format&fit=crop', // Learning
        ];
        
        return (
          <div className="relative min-h-screen w-full overflow-hidden" style={{
            background: '#f5f1e8'
          }}>
            {/* Logo */}
            <Logo />
            
            {/* Arc Gallery Hero with integrated content */}
            <ArcGalleryHero 
              images={educationImages}
              startAngle={20}
              endAngle={160}
              radiusLg={420}
              radiusMd={320}
              radiusSm={220}
              cardSizeLg={100}
              cardSizeMd={80}
              cardSizeSm={60}
              className="bg-transparent"
              title={
                <div className="mb-6">
                  <div className="mb-12 md:mb-24 lg:mb-24 tablet:mb-32">
                    <div style={{ color: '#4A154B' }}>
                      <GooeyText
                        texts={["Learn", "Explore", "Practice", "Master"]}
                        morphTime={1.5}
                        cooldownTime={1.5}
                        className="font-bold"
                        textClassName="drop-shadow-2xl"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Master Any Subject with Realtime AI
                    </h1>
                    <div className="flex items-center gap-3 text-lg text-gray-600">
                      <span>Powered by</span>
                      <img 
                        src="https://logos-world.net/wp-content/uploads/2025/02/Google-Gemini-Logo.png"
                        alt="Google Gemini"
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              }
              description="Learn coding, mathematics, physics, chemistry, and more in one place. Your AI tutor provides live guidance, interactive videos, and personalized help."
              primaryButton={
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-3 rounded-full text-white font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4A154B, #611f69)',
                  }}
                >
                  Start Learning Now
                </button>
              }
              secondaryButtons={
                <>
                  <button className="w-full sm:w-auto px-6 py-3 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white transition-all duration-200">
                    How It Works
                  </button>
                </>
              }
            />
            
            {/* Educational Thumbnails Section */}
            <LandingPageIntegration
              onStartLearning={(problem?: ProblemThumbnail) => {
                if (problem) {
                  console.log('Selected educational topic:', problem);
                  // Pre-fill the topic and subject based on the selected thumbnail
                  setTopic(problem.title);
                  setSubject(problem.category as SubjectCategory);
                  // Open modal with pre-filled data
                  setIsModalOpen(true);
                } else {
                  // If no specific problem selected, just open the modal
                  setIsModalOpen(true);
                }
              }}
            />
            
            {error && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl" style={{
                background: 'rgba(220, 38, 38, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <p className="text-white drop-shadow-md">{error}</p>
              </div>
            )}
            
            {/* Topic Selection Modal */}
            <TopicModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleGenerateProblem}
              isGenerating={false}
              initialTopic={topic}
              initialSubject={subject}
            />

            {/* Simple Screen Capture */}
            <SimpleScreenCapture
              isOpen={isScreenCaptureOpen}
              onClose={() => setIsScreenCaptureOpen(false)}
              onProblemExtracted={handleScreenCapturedProblem}
            />
          </div>
        );
      case 'generating':
        return (
          <>
            {/* Show loading screen with purple theme */}
            <LoadingScreen isVisible={true} />
          </>
        );
      case 'solving':
        return (
          <div className="h-screen w-screen flex bg-white">
            {/* Left Icon Sidebar */}
            <LeftSidebar
              activeSection={activeSidebarSection}
              onSectionToggle={handleSidebarToggle}
              hasTestResults={subject === 'algorithms' ? !!testResults : !!validationResult}
              hasTests={subject === 'algorithms'
                ? !!(problem && problem.testCases && problem.testCases.length > 0)
                : !!problem // For math/science, show Check Answer button if problem exists
              }
              onAskForHint={askForHint}
              onRunTests={handleRunTests}
              onClearCanvas={handleClearCanvas}
              onExplainWithImages={explainWithImages}
              isLoading={isSlateLoading}
              hasProblem={!!problem}
              subject={subject}
              topic={topic}
            />

            {/* Collapsible Study Topics Panel */}
            <CollapsiblePanel
              isOpen={activeSidebarSection === 'study'}
              onClose={() => setActiveSidebarSection(null)}
            >
              <StudyTopicsPanel
                subject={subject}
                topic={topic}
                problem={problem}
                onClose={() => setActiveSidebarSection(null)}
              />
            </CollapsiblePanel>

            {/* Collapsible Question Panel */}
            <CollapsiblePanel
              isOpen={activeSidebarSection === 'question'}
              onClose={() => setActiveSidebarSection(null)}
            >
              {problem && <ProblemStatement title={problem.title} text={problem.text} />}
            </CollapsiblePanel>

            {/* Collapsible Test Results / Answer Validation Panel */}
            <CollapsiblePanel
              isOpen={activeSidebarSection === 'tests'}
              onClose={() => setActiveSidebarSection(null)}
            >
              {subject === 'algorithms' && problem && problem.testCases ? (
                <TestResultsPanel
                  testCases={problem.testCases}
                  results={testResults}
                  onClose={() => setActiveSidebarSection(null)}
                  onRunTests={handleRunTests}
                  isLoading={isSlateLoading}
                />
              ) : subject !== 'algorithms' && validationResult ? (
                <AnswerValidationPanel
                  result={validationResult}
                  onClose={() => setActiveSidebarSection(null)}
                  onShowSolution={() => {
                    // Show solution in a dialog or on canvas
                    if (problem?.solution) {
                      alert(`Solution:\n\n${problem.solution}`);
                    }
                  }}
                />
              ) : null}
            </CollapsiblePanel>

            {/* Center - Full Canvas */}
            <div className="flex-1 relative">
              <Slate
                ref={slateRef}
                problem={problem}
                isLoading={isSlateLoading}
                error={error}
                onAskForHint={askForHint}
                onEditorReady={handleEditorReady}
                onTestResultsChange={setTestResults}
              />
            </div>

            {/* Floating AI Avatar (Top Right) */}
            <FloatingAIAvatar
              isConnected={isConnected}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              isLoading={isSlateLoading}
              onConnect={startSession}
              onDisconnect={handleEndSession}
              onToggleMute={toggleMute}
            />

            {/* Session End Dialog */}
            <SessionEndDialog
              isOpen={showSessionEndDialog}
              onGoBack={handleGoBackHome}
              onStartNew={handleStartNewSession}
              onClose={() => setShowSessionEndDialog(false)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="h-screen w-screen bg-gray-800 font-sans">
      {renderContent()}
    </main>
  );
};

export default App;