/**
 * AudioRecorder utility for capturing microphone input and encoding to PCM16.
 * Uses modern AudioWorklet API for efficient, low-latency audio processing.
 *
 * Based on Google's official multimodal-live-api-web-console implementation.
 */

import { encode } from './audioUtils';

export type AudioRecorderEvent = 'data' | 'start' | 'stop' | 'error';

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sampleRate: number;
  private listeners: Map<AudioRecorderEvent, Set<(data?: any) => void>> = new Map();

  constructor(sampleRate: number = 16000) {
    this.sampleRate = sampleRate;
  }

  /**
   * Start recording audio from the user's microphone
   */
  async start(): Promise<void> {
    try {
      // Create audio context with specified sample rate
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: this.sampleRate });

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create audio source from microphone stream
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Load the AudioWorklet processor
      // Convert the worklet file to a blob URL to work with Vite
      const workletCode = await this.loadWorkletCode();
      const workletBlob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(workletBlob);

      await this.audioContext.audioWorklet.addModule(workletUrl);

      // Create the worklet node
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-recorder-worklet'
      );

      // Listen for audio data from the worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && event.data.data.int16arrayBuffer) {
          // Convert Int16Array buffer to Uint8Array for base64 encoding
          const int16Array = new Int16Array(event.data.data.int16arrayBuffer);
          const uint8Array = new Uint8Array(int16Array.buffer);
          const base64Audio = encode(uint8Array);

          // Emit the base64 encoded audio
          this.emit('data', base64Audio);
        }
      };

      // Connect the audio pipeline
      this.source.connect(this.workletNode);
      // Note: We don't connect to destination - we're just capturing, not playing

      this.emit('start');
      console.log('[AudioRecorder] Started recording at', this.sampleRate, 'Hz');
    } catch (error) {
      console.error('[AudioRecorder] Failed to start recording:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop recording and clean up resources
   */
  stop(): void {
    try {
      // Disconnect audio nodes
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }

      if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode.port.onmessage = null;
        this.workletNode = null;
      }

      // Stop all tracks on the microphone stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      // Close the audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.emit('stop');
      console.log('[AudioRecorder] Stopped recording');
    } catch (error) {
      console.error('[AudioRecorder] Error stopping recording:', error);
      this.emit('error', error);
    }
  }

  /**
   * Add an event listener
   */
  on(event: AudioRecorderEvent, callback: (data?: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener
   */
  off(event: AudioRecorderEvent, callback: (data?: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: AudioRecorderEvent, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Load the AudioWorklet processor code
   * We inline the code here to work with Vite's build system
   */
  private async loadWorkletCode(): Promise<string> {
    return `
      class AudioRecorderWorkletProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];

          if (!input || !input[0]) {
            return true;
          }

          const channelData = input[0];

          // Convert Float32 to Int16 PCM
          const pcmData = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          }

          // Send to main thread
          this.port.postMessage({
            type: 'audio',
            data: {
              int16arrayBuffer: pcmData.buffer,
            },
          }, [pcmData.buffer]);

          return true;
        }
      }

      registerProcessor('audio-recorder-worklet', AudioRecorderWorkletProcessor);
    `;
  }
}
