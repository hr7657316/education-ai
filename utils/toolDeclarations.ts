import { FunctionDeclaration, Type } from "@google/genai";

export const stickyNoteHintFunctionDeclaration: FunctionDeclaration = {
  name: 'stickyNoteHint',
  description: 'Creates a yellow sticky note with a hint. Use this when the user asks for a hint or help. DO NOT modify their code when giving hints - just add a sticky note.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      hint: {
        type: Type.STRING,
        description: 'The hint text to show on the sticky note. Keep it concise and helpful.',
      },
    },
    required: ['hint'],
  },
};

export const writeOnCanvasFunctionDeclaration: FunctionDeclaration = {
  name: 'writeOnCanvas',
  description: 'Writes new text onto the canvas. ONLY use this when the canvas is completely empty for the first time (no existing code). If there is ANY existing code, use replaceAllCodeOnCanvas instead. NEVER use this if code already exists.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The text to write on the canvas. For multi-line code, ensure proper formatting with line breaks and indentation. Each line of code should be on a separate line with appropriate spacing.',
      },
    },
    required: ['text'],
  },
};

export const replaceAllCodeOnCanvasFunctionDeclaration: FunctionDeclaration = {
  name: 'replaceAllCodeOnCanvas',
  description: 'Replaces ALL text content on the canvas with new content. Use this when there is EXISTING code and the user asks to "modify the code", "update the code", "change the code". This completely replaces the old code. For hints, use stickyNoteHint instead.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      newCode: {
        type: Type.STRING,
        description: 'The complete updated code to display. CRITICAL: Format as properly structured code with line breaks between lines and proper indentation (2 or 4 spaces per indent level). Write the code exactly as you would in a code editor - with clear line separation and consistent spacing.',
      },
    },
    required: ['newCode'],
  },
};

export const updateCodeOnCanvasFunctionDeclaration: FunctionDeclaration = {
  name: 'updateCodeOnCanvas',
  description: 'Finds a specific snippet of code and replaces just that part. Use this ONLY for small targeted fixes when you need to change a specific line or section without rewriting everything.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      oldCode: {
        type: Type.STRING,
        description: 'The exact snippet of incorrect code to find on the canvas.',
      },
      newCode: {
        type: Type.STRING,
        description: 'The corrected code to replace just that snippet.',
      },
    },
    required: ['oldCode', 'newCode'],
  },
};

export const generateImageOnCanvasFunctionDeclaration: FunctionDeclaration = {
  name: 'generateImageOnCanvas',
  description: 'Generates an image and places it on the canvas. Use only when a visual diagram is necessary to explain a concept.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed prompt describing the image to be generated.',
      },
    },
    required: ['prompt'],
  },
};

export const executeCodeFunctionDeclaration: FunctionDeclaration = {
  name: 'executeCode',
  description: 'Executes JavaScript code and returns the output or errors. Use this to test code the student has written or to demonstrate how code works. Always execute code after writing it to verify it works correctly.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: 'The JavaScript code to execute. Can include function definitions and calls. Use console.log() for output.',
      },
    },
    required: ['code'],
  },
};

export const generateVideoOnCanvasFunctionDeclaration: FunctionDeclaration = {
  name: 'generateVideoOnCanvas',
  description: 'Generates an 8-second educational video that animates the current canvas content to explain the concept step-by-step. Use this when: (1) User explicitly asks for a video ("show me a video", "animate this", "can you make a video"); (2) Explaining complex multi-step processes that would benefit significantly from animation over static images; (3) Demonstrating algorithm execution, scientific processes, or mathematical transformations. The video will use the current canvas as a reference and animate it according to your prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      animationPrompt: {
        type: Type.STRING,
        description: 'A detailed description of how to animate the canvas content from start to finish. Describe the step-by-step progression, movements, and transformations. Example: "Animate the quicksort algorithm: start with the unsorted array, highlight the pivot element, show the partitioning process with elements moving left and right, then recursively animate sorting of subarrays until the entire array is sorted." Be specific about what changes and how.',
      },
    },
    required: ['animationPrompt'],
  },
};
