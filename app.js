// Main application logic for Aura breathing app

(() => {
  const circle = document.getElementById('circle');
  const phaseText = document.getElementById('phase-text');
  const ratioText = document.getElementById('ratio-text');
  const settingsButton = document.getElementById('settings-button');
  const overlay = document.getElementById('overlay');
  const modal = document.getElementById('settings-modal');
  const tabThree = document.getElementById('tab-three');
  const tabFour = document.getElementById('tab-four');
  const durationInputsContainer = document.getElementById('duration-inputs');
  const practiceButtons = document.querySelectorAll('.practice-btn');
  const soundButtons = document.querySelectorAll('.sound-btn');
  const saveBtn = document.getElementById('save-settings');

  // State
  let mode = 'three'; // 'three' or 'four'
  let durations = [4, 7, 8]; // seconds for each phase
  let practiceDuration = 0; // total session duration in seconds (0 for infinite)
  let backgroundSound = 'none';
  let isRunning = false;
  let phaseIndex = 0;
  let timeoutId = null;
  let sessionStart = null;
  const SCALE_INHALE = 1.3;
  const SCALE_EXHALE = 1.0;

  /**
   * Build duration input fields based on the current mode (three or four phases).
   */
  function buildDurationInputs() {
    durationInputsContainer.innerHTML = '';
    const labels = mode === 'three'
      ? ['吸氣', '閉氣', '呼氣']
      : ['吸氣', '閉氣', '呼氣', '閉氣'];
    durations = mode === 'three' ? [4, 7, 8] : [4, 4, 4, 4];
    labels.forEach((label, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.flex = '1';
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '30';
      input.value = durations[idx];
      input.addEventListener('input', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 30) val = 30;
        durations[idx] = val;
        updateRatioText();
      });
      wrapper.appendChild(labelEl);
      wrapper.appendChild(input);
      durationInputsContainer.appendChild(wrapper);
    });
    updateRatioText();
  }

  /**
   * Update ratio display text (e.g. 4-7-8) based on current durations.
   */
  function updateRatioText() {
    ratioText.textContent = durations.join('‑');
  }

  /**
   * Open settings modal.
   */
  function openModal() {
    // highlight active tab
    if (mode === 'three') {
      tabThree.classList.add('active');
      tabFour.classList.remove('active');
    } else {
      tabFour.classList.add('active');
      tabThree.classList.remove('active');
    }
    // highlight practice duration button
    practiceButtons.forEach((btn) => {
      if (parseInt(btn.dataset.duration, 10) === practiceDuration) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    // highlight sound button
    soundButtons.forEach((btn) => {
      if (btn.dataset.sound === backgroundSound) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    overlay.classList.add('visible');
    modal.classList.add('visible');
  }

  /**
   * Close settings modal and apply changes.
   */
  function closeModal() {
    overlay.classList.remove('visible');
    modal.classList.remove('visible');
    // Apply background sound
    window.audioEngine.startBackground(backgroundSound);
    // Reset session when settings change
    if (isRunning) {
      stopBreathing();
      startBreathing();
    } else {
      // Just update ratio display
      updateRatioText();
    }
  }

  /**
   * Start the breathing session. Resets state and begins from phase 0.
   */
  function startBreathing() {
    if (isRunning) return;
    isRunning = true;
    phaseIndex = 0;
    sessionStart = Date.now();
    runPhase();
  }

  /**
   * Stop the breathing session. Clears timers and resets state.
   */
  function stopBreathing() {
    isRunning = false;
    clearTimeout(timeoutId);
    timeoutId = null;
    // Reset circle to baseline size and remove pulse
    circle.style.transitionDuration = '0.3s';
    circle.style.transform = `scale(${SCALE_EXHALE})`;
    circle.classList.remove('pulse');
    phaseText.textContent = '開始';
  }

  /**
   * Run the current phase and schedule the next one.
   */
  function runPhase() {
    // Determine phase name and behaviour
    const currentDuration = durations[phaseIndex];
    // If session length is limited, check remaining time
    if (practiceDuration > 0) {
      const elapsed = (Date.now() - sessionStart) / 1000;
      if (elapsed >= practiceDuration) {
        stopBreathing();
        return;
      }
    }
    let phaseName;
    if (phaseIndex === 0) {
      phaseName = '吸氣';
    } else if (mode === 'three') {
      // three-phase: [Inhale, Hold, Exhale]
      if (phaseIndex === 1) phaseName = '閉氣';
      else phaseName = '呼氣';
    } else {
      // four-phase: [Inhale, Hold1, Exhale, Hold2]
      if (phaseIndex === 1) phaseName = '閉氣';
      else if (phaseIndex === 2) phaseName = '呼氣';
      else phaseName = '閉氣';
    }
    // Update UI
    phaseText.textContent = phaseName;
    // Determine scaling and glow
    if (phaseName === '吸氣') {
      circle.classList.remove('pulse');
      circle.style.transitionDuration = currentDuration + 's';
      circle.style.transform = `scale(${SCALE_INHALE})`;
      window.audioEngine.playInhale();
    } else if (phaseName === '呼氣') {
      circle.classList.remove('pulse');
      circle.style.transitionDuration = currentDuration + 's';
      circle.style.transform = `scale(${SCALE_EXHALE})`;
      window.audioEngine.playExhale();
    } else {
      // hold: keep current scale and pulse
      circle.classList.add('pulse');
      circle.style.transitionDuration = currentDuration + 's';
      // no change to transform
    }
    // Schedule next phase
    timeoutId = setTimeout(() => {
      // move to next phase
      phaseIndex = (phaseIndex + 1) % durations.length;
      runPhase();
    }, currentDuration * 1000);
  }

  // Tab switching
  tabThree.addEventListener('click', () => {
    if (mode !== 'three') {
      mode = 'three';
      tabThree.classList.add('active');
      tabFour.classList.remove('active');
      buildDurationInputs();
    }
  });
  tabFour.addEventListener('click', () => {
    if (mode !== 'four') {
      mode = 'four';
      tabFour.classList.add('active');
      tabThree.classList.remove('active');
      buildDurationInputs();
    }
  });

  // Practice duration selection
  practiceButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      practiceButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      practiceDuration = parseInt(btn.dataset.duration, 10);
    });
  });

  // Background sound selection
  soundButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      soundButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      backgroundSound = btn.dataset.sound;
    });
  });

  // Save button
  saveBtn.addEventListener('click', () => {
    closeModal();
  });

  // Settings button click
  settingsButton.addEventListener('click', () => {
    openModal();
  });

  // Clicking overlay closes modal
  overlay.addEventListener('click', () => {
    closeModal();
  });

  // Start/pause breathing by clicking circle
  circle.addEventListener('click', () => {
    // Need to resume audio context on user interaction
    if (window.audioEngine.audioCtx && window.audioEngine.audioCtx.state === 'suspended') {
      window.audioEngine.audioCtx.resume();
    }
    if (!isRunning) {
      startBreathing();
    } else {
      stopBreathing();
    }
  });

  // Build initial inputs and ratio
  buildDurationInputs();
})();