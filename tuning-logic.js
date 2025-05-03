// tuning-logic.js
const tuningPresets = {
    standard: ['E', 'A', 'D', 'G', 'B', 'E'],
    dropD:    ['D', 'A', 'D', 'G', 'B', 'E'],
    openD:    ['D', 'A', 'D', 'F#', 'A', 'D'],
    openG:    ['D', 'G', 'D', 'G', 'B', 'D'],
    openE:    ['E', 'B', 'E', 'G#', 'B', 'E'],
    dadgad:   ['D', 'A', 'D', 'G', 'A', 'D']
  };
  
  let currentTuning = tuningPresets.standard;
  
  function setTuning(preset) {
    currentTuning = tuningPresets[preset];
    renderTuningDisplay();
  }
  
  function renderTuningDisplay() {
    const ul = document.getElementById('tuningDisplay');
    ul.innerHTML = '';
    currentTuning.forEach((note, i) => {
      const li = document.createElement('li');
      li.textContent = `String ${6 - i}: ${note}`;
      ul.appendChild(li);
    });
  }
  