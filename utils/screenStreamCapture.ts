/**
 * Utility functions for capturing and processing screen share streams
 * for real-time Gemini Live video integration
 */

export interface FrameCaptureHandle {
  // FIX: Replaced NodeJS.Timeout with number for browser compatibility.
  intervalId: number;
  stop: () => void;
}

/**
 * Start screen share and return the media stream
 * @returns Promise with screen MediaStream
 */
export async function startScreenShare(): Promise<MediaStream> {
  try {
    // FIX: Removed non-standard `mediaSource` property from constraints.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false, // We handle audio separately via microphone
    });

    return stream;
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('Screen sharing permission denied');
    }
    throw new Error(`Failed to start screen share: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture a single frame from a video stream as base64 PNG
 * @param stream The MediaStream containing video track
 * @returns Promise with base64 encoded image (without data URL prefix)
 */
export async function captureFrameFromStream(stream: MediaStream): Promise<string> {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    throw new Error('No video track found in stream');
  }

  // Create video element to capture frame
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;

  // Wait for video to be ready
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play();
      // Wait for first frame
      setTimeout(() => resolve(), 100);
    };
    video.onerror = () => reject(new Error('Video load error'));

    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('Video load timeout')), 5000);
  });

  // Create canvas and capture frame
  const canvas = document.createElement('canvas');

  // Use video dimensions or fall back to stream settings
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;

  // Downscale if too large (to reduce bandwidth)
  const maxWidth = 1280;
  const maxHeight = 720;
  if (canvas.width > maxWidth || canvas.height > maxHeight) {
    const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    canvas.width = Math.floor(canvas.width * scale);
    canvas.height = Math.floor(canvas.height * scale);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to base64 JPEG for better compression (remove data:image/jpeg;base64, prefix)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for good balance
  const base64 = dataUrl.split(',')[1];

  // Cleanup
  video.srcObject = null;

  return base64;
}

/**
 * Start capturing frames at a specified interval
 * @param stream The MediaStream to capture from
 * @param onFrame Callback function called with each captured frame
 * @param fps Frames per second (default: 1)
 * @returns FrameCaptureHandle to control the capture
 */
export function startFrameCapture(
  stream: MediaStream,
  onFrame: (base64: string) => void,
  fps: number = 1
): FrameCaptureHandle {
  const intervalMs = 1000 / fps;

  console.log('[Frame Capture] Starting frame capture at', fps, 'fps');

  // Capture first frame immediately
  captureFrameFromStream(stream)
    .then((frame) => {
      console.log('[Frame Capture] Initial frame captured, size:', frame.length);
      onFrame(frame);
    })
    .catch(err => console.error('[Frame Capture] Initial frame error:', err));

  // Then capture at intervals
  const intervalId = window.setInterval(async () => {
    try {
      const frame = await captureFrameFromStream(stream);
      console.log('[Frame Capture] Frame captured at', new Date().toLocaleTimeString(), 'size:', frame.length);
      onFrame(frame);
    } catch (error) {
      console.error('[Frame Capture] Error capturing frame:', error);
      // Don't throw - continue trying to capture frames
    }
  }, intervalMs);

  const stop = () => {
    clearInterval(intervalId);
    console.log('[Frame Capture] Stopped frame capture');
  };

  return { intervalId, stop };
}

/**
 * Stop frame capture
 * @param handle The FrameCaptureHandle returned by startFrameCapture
 */
export function stopFrameCapture(handle: FrameCaptureHandle): void {
  handle.stop();
}

/**
 * Stop all tracks in a media stream
 * @param stream The MediaStream to stop
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
    stream.removeTrack(track);
  });
}

/**
 * Check if screen sharing is supported
 * @returns Boolean indicating support
 */
export function isScreenShareSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
}

/**
 * Get video dimensions from stream
 * @param stream The MediaStream
 * @returns Object with width and height, or null if unavailable
 */
export function getStreamDimensions(stream: MediaStream): { width: number; height: number } | null {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return null;

  const settings = videoTrack.getSettings();
  if (settings.width && settings.height) {
    return {
      width: settings.width,
      height: settings.height,
    };
  }

  return null;
}
