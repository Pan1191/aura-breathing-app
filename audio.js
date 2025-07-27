/*
 * Cue engine for Aura
 *
 * This module replaces the previous background ambience with a
 * rhythmic cue system. It uses Web Audio API oscillators to
 * generate brief tones for inhale, hold and exhale phases. Multiple
 * sound packs are provided, each with distinct oscillator types
 * and frequency pairs (normal and emphasised). The first beat of
 * each phase can be accentuated via a higher frequency or
 * amplitude. A gain node is used to control overall volume.
 */

class CueEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.volume = 0.5; // default volume [0,1]
    this.packIndex = 0;
    /**
     * Each sound pack defines an oscillator type and two frequencies
     * for each breathing phase. The first element in the array is
     * the normal beat frequency, the second is the accentuated
     * frequency used for the first beat.
     */
    this.soundPacks = [
      {
        type: 'sine',
        inhale: [600, 720],
        hold: [500, 620],
        exhale: [400, 540],
      },
      {
        type: 'triangle',
        inhale: [550, 650],
        hold: [450, 550],
        exhale: [350, 450],
      },
      {
        type: 'square',
        inhale: [700, 900],
        hold: [600, 800],
        exhale: [500, 700],
      },
    ];
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

  /**
   * Set the current sound pack.
   * @param {number} index – index of the pack in this.soundPacks
   */
  setPack(index) {
    this.packIndex = Math.min(Math.max(index, 0), this.soundPacks.length - 1);
  }

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
   * the accentuated frequency and a slightly louder amplitude are
   * used. Otherwise the normal frequency and standard amplitude are
   * applied. The tone decays quickly to avoid lingering.
   *
   * @param {string} phase – one of 'inhale', 'hold', 'exhale'
   * @param {boolean} isFirst – whether this cue is the first beat of the phase
   */
  playCue(phase, isFirst = false) {
    // Lazy initialise audio context
    this.init();
    const pack = this.soundPacks[this.packIndex];
    // Pick frequencies for the phase
    let freqPair;
    if (phase === 'inhale') {
      freqPair = pack.inhale;
    } else if (phase === 'hold') {
      freqPair = pack.hold;
    } else {
      freqPair = pack.exhale;
    }
    const frequency = isFirst ? freqPair[1] : freqPair[0];
    const now = this.audioCtx.currentTime;
    // Create oscillator and gain for envelope
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = pack.type;
    osc.frequency.setValueAtTime(frequency, now);
    // Envelope: quick attack and decay
    const baseAmp = isFirst ? 1.0 : 0.7;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseAmp, now + 0.02);
    // Use exponential decay for a natural release
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

// Export as singleton
window.audioEngine = new CueEngine();