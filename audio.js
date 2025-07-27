/*
 * Cue engine for Aura
 *
 * This module implements the rhythmic cue system for Aura. It uses
 * a single sine‑wave sound palette and applies pitch envelopes
 * tailored to each breathing phase. Inhale sweeps upwards in
 * frequency, exhale sweeps downwards, and hold maintains a
 * steady tone. The first beat of each phase can still be
 * accentuated by increasing amplitude. A master gain node is used
 * to control overall volume.
 */

class CueEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.volume = 0.5; // default volume [0,1]
    /**
     * Pitch definitions for each breathing phase. Each object
     * contains a start and end frequency (Hz) for the pitch
     * envelope. Inhale ramps up from A4 (440 Hz) to C5 (523.25 Hz);
     * exhale ramps down from C5 to A4; hold stays at G4 (392 Hz).
     */
    this.pitches = {
      inhale: { start: 440, end: 523.25 },
      exhale: { start: 523.25, end: 440 },
      hold:   { start: 392, end: 392 },
    };
  }

  /**
   * Initialise the audio context and master gain. Must be called in
   * response to a user interaction to satisfy browser autoplay
   * policies.
   */
  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }


  // Removed setPack: only one sound palette is used

  /**
   * Adjust master volume. Accepts values from 0 to 1.
   * @param {number} vol – new volume level
   */
  setVolume(vol) {
    this.volume = Math.min(Math.max(vol, 0), 1);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  /**
   * Play a single cue tone for the given phase. If isFirst is true
   * the amplitude can be slightly higher to emphasise the first beat.
   * Otherwise the standard amplitude is applied. The tone decays
   * quickly to avoid lingering and uses a pitch envelope for
   * inhale/exhale transitions.
   *
   * @param {string} phase – one of 'inhale', 'hold', 'exhale'
   * @param {boolean} isFirst – whether this cue is the first beat of the phase
   */
  playCue(phase, isFirst = false) {
    // Lazy initialise audio context
    this.init();
    const { start, end } = this.pitches[phase] || this.pitches.hold;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    // Set initial frequency and schedule pitch ramp
    osc.frequency.setValueAtTime(start, now);
    // Use a 0.4 s pitch envelope for inhale/exhale transitions
    osc.frequency.linearRampToValueAtTime(end, now + 0.4);
    // Amplitude envelope: quick attack and decay
    const baseAmp = isFirst ? 1.0 : 0.7;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseAmp, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

// Export as singleton
window.audioEngine = new CueEngine();