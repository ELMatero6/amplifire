// controller.js
window.addEventListener('DOMContentLoaded', async () => {
  await init();               // from function.js
  setupKnobs();               // from knobs-module.js
  setupRecorder();            // from recorder-module.js
  startTuner();               // from tuner-module.js
  renderTuningDisplay();      // from tuning-logic.js
});
