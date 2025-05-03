window.addEventListener('DOMContentLoaded', () => {
    renderTuningDisplay();
  });
  
  window.addEventListener('click', async () => {
    if (!audioCtx || audioCtx.state === 'suspended') {
      await init();
      setupKnobs();
      setupRecorder();
      startTuner();
    }
  });
  