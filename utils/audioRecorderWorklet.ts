/**
 * AudioWorklet processor for real-time audio capture and PCM16 encoding.
 * This runs on the audio rendering thread for optimal performance.
 *
 * Based on Google's official multimodal-live-api-web-console implementation.
 */

// Type declarations for AudioWorklet globals
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(
  name: string,
  processorCtor: new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor
): void;

class AudioRecorderWorkletProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];

    // Check if we have valid input
    if (!input || !input[0]) {
      return true; // Keep processor alive
    }

    const channelData = input[0]; // Get first channel (mono)

    // Convert Float32 samples (-1.0 to 1.0) to Int16 PCM (-32768 to 32767)
    const pcmData = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      // Clamp the value to prevent overflow
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    // Send the Int16 array buffer to the main thread
    this.port.postMessage({
      type: 'audio',
      data: {
        int16arrayBuffer: pcmData.buffer,
      },
    }, [pcmData.buffer]); // Transfer ownership for efficiency

    return true; // Keep processor alive
  }
}

// Register the processor
registerProcessor('audio-recorder-worklet', AudioRecorderWorkletProcessor);
