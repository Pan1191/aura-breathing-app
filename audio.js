/*
 * Audio engine for Aura
 *
 * This module encapsulates Web Audio API logic used to generate
 * background ambience and breathing cues. The engine uses noise
 * generators for the “waves” (brown noise) and “forest” (pink noise
 * with occasional bird chirps) backgrounds. Brown noise is created
 * by integrating white noise to produce a waterfall‑like sound,
 * inspired by the method described on Noisehack【596180980067455†L112-L133】. Pink noise
 * uses a refined algorithm by Paul Kellet【596180980067455†L81-L99】.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.backgroundGain = null;
    this.backgroundNode = null;
    this.chirpInterval = null;
  }

  /**
   * Initialise the audio context on first use. The Web Audio API
   * requires user interaction before audio can start, so this
   * method should be called in response to a user action (e.g. tap).
   */
  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  /**
   * Play a short tone for breathing cues. A fade in/out envelope
   * avoids abrupt audio edges.
   * @param {number} frequency – Frequency in Hz
   * @param {number} duration – Duration in seconds
   */
  playTone(frequency = 440, duration = 0.4) {
    this.init();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  /**
   * Public methods for inhale/exhale cues.
   */
  playInhale() {
    this.playTone(660, 0.35);
  }
  playExhale() {
    this.playTone(440, 0.35);
  }

  /**
   * Start background ambience.
   * @param {String} type – one of 'none', 'waves', 'forest'
   */
  startBackground(type = 'none') {
    this.init();
    // Stop any existing ambience
    this.stopBackground();
    if (type === 'none') return;
    // Create gain for volume control and fading
    this.backgroundGain = this.audioCtx.createGain();
    this.backgroundGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    if (type === 'waves') {
      // Brown noise (waterfall/waves). Using algorithm from Noisehack【596180980067455†L112-L133】
      const bufferSize = 4096;
      let lastOut = 0.0;
      try {
        const node = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; // compensate gain
          }
        };
        this.backgroundNode = node;
        node.connect(this.backgroundGain).connect(this.audioCtx.destination);
      } catch (err) {
        console.warn('Unable to start brown noise:', err);
      }
    } else if (type === 'forest') {
      // Pink noise plus random chirps for birds. Pink noise algorithm
      // adapted from Paul Kellet’s refined method【596180980067455†L81-L99】.
      const bufferSize = 4096;
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      try {
        const node = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            output[i] = pink * 0.05; // lower volume
          }
        };
        this.backgroundNode = node;
        node.connect(this.backgroundGain).connect(this.audioCtx.destination);
      } catch (err) {
        console.warn('Unable to start pink noise:', err);
      }
      // Schedule bird chirps: random high‑pitched tones every few seconds
      const scheduleChirp = () => {
        const delay = 3000 + Math.random() * 7000; // 3–10 s
        this.chirpInterval = setTimeout(() => {
          this.playTone(1200 + Math.random() * 300, 0.15);
          scheduleChirp();
        }, delay);
      };
      scheduleChirp();
    }
    // Fade in volume
    this.backgroundGain.gain.linearRampToValueAtTime(0.25, this.audioCtx.currentTime + 2);
  }

  /**
   * Stop and fade out current background audio.
   */
  stopBackground() {
    if (this.backgroundGain) {
      const now = this.audioCtx.currentTime;
      // fade out
      this.backgroundGain.gain.cancelScheduledValues(now);
      this.backgroundGain.gain.setValueAtTime(this.backgroundGain.gain.value, now);
      this.backgroundGain.gain.linearRampToValueAtTime(0, now + 2);
      // Disconnect after fade
      setTimeout(() => {
        if (this.backgroundNode) {
          try {
            this.backgroundNode.disconnect();
          } catch (e) {}
          this.backgroundNode = null;
        }
        if (this.backgroundGain) {
          try {
            this.backgroundGain.disconnect();
          } catch (e) {}
        }
      }, 2300);
    }
    if (this.chirpInterval) {
      clearTimeout(this.chirpInterval);
      this.chirpInterval = null;
    }
  }
}

// Export a singleton instance
window.audioEngine = new AudioEngine();