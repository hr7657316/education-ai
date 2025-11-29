
export interface ChatMessage {
  speaker: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export type SubjectCategory = 'algorithms' | 'math' | 'science' | 'other';

export type LearningMode = 'practice' | 'exam';

export type AppState = 'initial' | 'generating' | 'solving' | 'exam';

export interface TestCase {
  input: any[];
  expected: any;
  description: string;
}

export interface Problem {
  title: string;
  text: string;
  subject: SubjectCategory;
  examples?: string[];
  constraints?: string[];
  testCases?: TestCase[]; // Optional for non-algorithm subjects
  functionName?: string; // Only for algorithms
  initialCode?: string; // Only for algorithms - Function skeleton/template
  solution?: string; // Expected solution for exam validation (math/science)
  cachedAt?: string; // ISO timestamp of when the problem was cached
}

export interface ExamResult {
  score: number; // 0-100
  feedback: string;
  strengths: string[];
  improvements: string[];
  isCorrect: boolean;
}
