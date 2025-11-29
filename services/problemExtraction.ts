import { GoogleGenAI, Type } from "@google/genai";
import { Problem, SubjectCategory } from "../types";

/**
 * Parse problem from Gemini Live session response text
 * Handles both pure JSON and JSON wrapped in markdown code blocks
 * @param responseText The AI's response text containing JSON
 * @returns Parsed Problem object with 'other' as subject
 */
export function parseProblemFromLiveResponse(responseText: string): Problem {
  try {
    // Remove markdown code blocks if present
    let jsonText = responseText.trim();

    // Extract JSON from markdown code blocks
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Try to find JSON object directly
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    // Parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.subject || !parsed.title || !parsed.text) {
      throw new Error('Missing required fields in problem JSON');
    }

    // Map subject string to SubjectCategory
    let subject: SubjectCategory = 'other';
    if (parsed.subject === 'algorithms' || parsed.subject === 'algorithm') {
      subject = 'algorithms';
    } else if (parsed.subject === 'math' || parsed.subject === 'mathematics') {
      subject = 'math';
    } else if (parsed.subject === 'science') {
      subject = 'science';
    }

    // Create Problem object
    const problem: Problem = {
      title: parsed.title,
      text: parsed.text,
      subject: subject,
      examples: parsed.examples || [],
      constraints: [
        ...(parsed.constraints || []),
        'Source: live screen capture',
      ],
    };

    // Add test cases if present (for algorithm problems)
    if (parsed.testCases && Array.isArray(parsed.testCases)) {
      problem.testCases = parsed.testCases.map((tc: any) => ({
        input: Array.isArray(tc.input) ? tc.input : [tc.input],
        expected: tc.expectedOutput || tc.expected,
        description: tc.explanation || tc.description || 'Test case',
      }));
    }

    console.log('[Problem Extraction] Successfully extracted problem:', problem.title, 'Subject:', subject);
    if (problem.testCases && problem.testCases.length > 0) {
      console.log('[Problem Extraction] Extracted', problem.testCases.length, 'test cases');
    }

    return problem;
  } catch (error) {
    console.error('[Problem Extraction] Failed to parse Live response:', error);
    console.error('[Problem Extraction] Response text:', responseText);
    throw new Error('Failed to parse problem from AI response. Please try again.');
  }
}
