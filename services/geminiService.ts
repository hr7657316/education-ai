import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Problem, SubjectCategory, ExamResult } from "../types";
import { getCachedProblem, setCachedProblem } from "../utils/problemCache";

export const generateImageOnSlate = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      const base64ImageBytes = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image data received from the API.");
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
};

const getSubjectPrompt = (subject: SubjectCategory, topic: string): string => {
  switch (subject) {
    case 'algorithms':
      return `Generate a single, beginner-friendly CODING practice problem for a student learning about "${topic}". The problem should be specific and solvable, similar to an easy LeetCode or Khan Academy question.

IMPORTANT:
- Include a clear problem statement with proper formatting
- Provide 2-3 example test cases with expected outputs
- Include 3-5 hidden test cases for validation
- Specify the exact function name the student should implement
- Add constraints if relevant
- Format the text with markdown code blocks for examples
- MUST provide a function skeleton/template with the exact function signature, parameter names, and a TODO comment to help students get started

Example format:
"Given an array of numbers, return the sum of all elements.

Example:
\`\`\`javascript
Input: [1, 2, 3]
Output: 6
\`\`\`"`;

    case 'math':
      return `Generate a single, beginner-friendly MATHEMATICS practice problem for a student learning about "${topic}". The problem should be specific and solvable, similar to a Khan Academy or math textbook question.

IMPORTANT:
- Include a clear problem statement with SPECIFIC NUMBERS (not placeholders or variables like "units" or blank spaces)
- Use backticks \`like this\` for important numbers, variables, and mathematical symbols to make them stand out
- Provide relevant formulas or theorems
- Format mathematical expressions properly (use superscript notation like x² or write out exponents)
- The problem should require written work on a canvas (equations, diagrams, etc.)
- Do NOT include test cases or function names (this is not a coding problem)
- Do NOT use white text or invisible placeholders

Example format:
"You are given a right-angled triangle. The two sides that form the right angle (the legs) have lengths of \`3\` units and \`4\` units.

Calculate the length of the hypotenuse, \`c\`, which is the side opposite the right angle.

The Pythagorean Theorem states that for a right-angled triangle:
\`a² + b² = c²\`

Draw a diagram of the triangle and show all the steps in your calculation to find the value of \`c\`."`;


    case 'science':
      return `Generate a single, beginner-friendly SCIENCE practice problem for a student learning about "${topic}". The problem should be specific and solvable, similar to a Khan Academy or science textbook question.

IMPORTANT:
- Include a clear problem statement with SPECIFIC NUMBERS (not placeholders or blank spaces)
- Use backticks \`like this\` for important numbers, variables, units, and scientific symbols to make them stand out
- Provide relevant scientific concepts, formulas, or laws
- Format equations properly using standard notation
- The problem should require written work on a canvas (diagrams, calculations, etc.)
- Do NOT include test cases or function names (this is not a coding problem)
- Do NOT use white text or invisible placeholders

Example format:
"A sealed syringe contains \`50.0 mL\` of air at an initial pressure of \`1.00 atm\`. The plunger is then pushed in, compressing the air to a final volume of \`20.0 mL\`. Assuming the temperature of the air and the amount of gas in the syringe remain constant, what is the new pressure of the air inside the syringe?

**Boyle's Law** states that for a fixed amount of gas at constant temperature:
\`P₁V₁ = P₂V₂\`

Where:
- \`P₁\` = Initial Pressure
- \`V₁\` = Initial Volume
- \`P₂\` = Final Pressure
- \`V₂\` = Final Volume

Show your work on your canvas, including the formula, the substitution of values, and the final answer with the correct units."`;
  }
};

export const generateProblem = async (topic: string, subject: SubjectCategory = 'algorithms'): Promise<Problem> => {
  // Check cache first (include subject in cache key)
  const cacheKey = `${subject}:${topic}`;
  const cachedProblem = getCachedProblem(cacheKey);
  if (cachedProblem) {
    console.log(`[GEMINI] Using cached problem for ${subject}/${topic}`);
    return cachedProblem;
  }

  // Generate new problem if not cached
  console.log(`[GEMINI] Generating new ${subject} problem for topic: "${topic}"`);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Build schema based on subject type
    const baseSchema: any = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'A concise, descriptive title for the problem.',
        },
        text: {
          type: Type.STRING,
          description: 'The full text of the problem statement with markdown formatting.',
        },
        examples: {
          type: Type.ARRAY,
          description: 'Array of examples or helpful information',
          items: {
            type: Type.STRING,
          }
        },
        constraints: {
          type: Type.ARRAY,
          description: 'Array of constraints or key concepts',
          items: {
            type: Type.STRING,
          }
        },
      },
      required: ["title", "text"],
    };

    // Add algorithm-specific fields
    if (subject === 'algorithms') {
      baseSchema.properties.functionName = {
        type: Type.STRING,
        description: 'The exact name of the function the student should implement',
      };
      baseSchema.properties.initialCode = {
        type: Type.STRING,
        description: 'A function skeleton/template with signature and TODO comment',
      };
      baseSchema.properties.testCases = {
        type: Type.ARRAY,
        description: 'Array of test cases including both visible examples and hidden tests',
        items: {
          type: Type.OBJECT,
          properties: {
            input: {
              type: Type.ARRAY,
              description: 'Array of input arguments for the function',
              items: {},
            },
            expected: {
              description: 'Expected output value',
            },
            description: {
              type: Type.STRING,
              description: 'Description of what this test case checks',
            },
          },
          required: ["input", "expected", "description"],
        },
      };
      baseSchema.required.push("functionName", "initialCode", "testCases");
    } else {
      // For math and science, add solution field
      baseSchema.properties.solution = {
        type: Type.STRING,
        description: 'The complete solution with step-by-step explanation for validation purposes',
      };
      baseSchema.required.push("solution");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: getSubjectPrompt(subject, topic),
      config: {
        responseMimeType: "application/json",
        responseSchema: baseSchema,
      },
    });

    const jsonText = response.text.trim();
    const problem: Problem = {
      ...JSON.parse(jsonText),
      subject, // Add subject to the problem
    };

    // Cache the generated problem
    setCachedProblem(cacheKey, problem);
    console.log(`[GEMINI] Problem generated and cached for ${subject}/${topic}`);

    return problem;
  } catch (error) {
     console.error("Error generating problem with Gemini:", error);
     if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during problem generation.");
  }
};

export const validateExamSolution = async (
  problem: Problem,
  canvasImageBase64: string
): Promise<ExamResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an educational AI evaluator. A student has solved the following ${problem.subject} problem:

**Problem Title:** ${problem.title}

**Problem Statement:**
${problem.text}

${problem.solution ? `**Expected Solution:**\n${problem.solution}` : ''}

**Student's Work:**
The student has written their solution on a canvas (see attached image).

Please evaluate the student's work and provide:
1. A score from 0-100
2. Detailed feedback on their approach
3. Strengths in their solution
4. Areas for improvement
5. Whether the solution is correct or not

Be encouraging but honest. Focus on understanding and learning, not just correctness.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: canvasImageBase64.split(',')[1], // Remove data:image/png;base64, prefix
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.NUMBER,
              description: 'Score from 0-100',
            },
            feedback: {
              type: Type.STRING,
              description: 'Detailed feedback on the student\'s work',
            },
            strengths: {
              type: Type.ARRAY,
              description: 'Array of strengths in the solution',
              items: { type: Type.STRING },
            },
            improvements: {
              type: Type.ARRAY,
              description: 'Array of areas for improvement',
              items: { type: Type.STRING },
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: 'Whether the solution is fundamentally correct',
            },
          },
          required: ["score", "feedback", "strengths", "improvements", "isCorrect"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result: ExamResult = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Error validating exam solution:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred during exam validation.");
  }
};