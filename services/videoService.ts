import { fal } from "@fal-ai/client";
import { Problem } from "../types";

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_API_KEY
});

/**
 * Generates an 8-second educational video using Google Veo 3.1 via fal.ai
 * @param canvasImageBase64 - Base64 data URL of the current canvas state
 * @param problem - The current problem being worked on
 * @param animationPrompt - How to animate the content (provided by AI)
 * @returns Video URL from fal.ai
 */
export const generateEducationalVideo = async (
  canvasImageBase64: string,
  problem: Problem,
  animationPrompt: string
): Promise<string> => {
  try {
    console.log('[VIDEO] Starting video generation with Veo 3.1');
    console.log('[VIDEO] Animation prompt:', animationPrompt);

    // Upload canvas image to fal.ai storage
    const imageFile = dataURLtoFile(canvasImageBase64, 'canvas-snapshot.png');
    const imageUrl = await fal.storage.upload(imageFile);
    console.log('[VIDEO] Canvas image uploaded:', imageUrl);

    // Generate video using Veo 3.1
    const result = await fal.subscribe("fal-ai/veo3.1/reference-to-video", {
      input: {
        image_urls: [imageUrl],
        prompt: animationPrompt,
        duration: "8s",
        resolution: "720p",
        generate_audio: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log('[VIDEO] Video generated successfully');
    console.log('[VIDEO] Result:', result.data);

    if (!result.data.video?.url) {
      throw new Error('No video URL returned from fal.ai');
    }

    return result.data.video.url;
  } catch (error) {
    console.error('[VIDEO] Error generating video:', error);
    if (error instanceof Error) {
      throw new Error(`Video Generation Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred during video generation.');
  }
};

/**
 * Helper function to convert base64 data URL to File object
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
