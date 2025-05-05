// tuner-module.js

let currentTuning = [];
const tuningPresets = {
  standard: ['E', 'A', 'D', 'G', 'B', 'E'],
  dropD: ['D', 'A', 'D', 'G', 'B', 'E'],
  openD: ['D', 'A', 'D', 'F#', 'A', 'D'],
  openG: ['D', 'G', 'D', 'G', 'B', 'D'],
  openE: ['E', 'B', 'E', 'G#', 'B', 'E'],
  dadgad: ['D', 'A', 'D', 'G', 'A', 'D']
};

const noteToMidi = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

function noteNameToMidi(note) {
  let octave = 4;
  let name = note;
  if (note.length > 1 && note[note.length - 1].match(/[0-9]/)) {
    octave = parseInt(note[note.length - 1]);
    name = note.slice(0, note.length - 1);
  }
  return 12 * (octave + 1) + noteToMidi[name.toUpperCase()];
}

function getStandardFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function setTuning(presetName) {
  const preset = tuningPresets[presetName];
  if (!preset) return;
  currentTuning = preset.map((note, idx) => {
    const defaultOctaves = [2, 2, 3, 3, 3, 4]; // E A D G B E
    const midi = noteNameToMidi(note + defaultOctaves[idx]);
    return { name: note, midi };
  });
  renderTuningDisplay();
}

function renderTuningDisplay() {
  const ul = document.getElementById('tuningDisplay');
  if (!ul) return;
  ul.innerHTML = '';
  currentTuning.forEach((item, i) => {
    const li = document.createElement('li');
    li.textContent = `String ${6 - i}: ${item.name}`;
    ul.appendChild(li);
  });
}

function startTuner() {
  const tuneDirection = document.getElementById('tuneDirection');
  if (!audioCtx || !mic) {
    setTimeout(startTuner, 500);
    return;
  }

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 4096;

  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 100;

  const buffer = new Float32Array(analyser.fftSize);
  mic.connect(highpass);
  highpass.connect(analyser);

  function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.0015) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
  }

  function detectPitch() {
    analyser.getFloatTimeDomainData(buffer);
    const ac = autoCorrelate(buffer, audioCtx.sampleRate);
    if (ac === -1) {
      tuneDirection.textContent = 'No signal';
      tuneDirection.style.color = '#999';
    } else {
      let closest = null;
      let minDiff = Infinity;
      currentTuning.forEach(item => {
        const freq = getStandardFreq(item.midi);
        const diff = Math.abs(ac - freq);
        if (diff < minDiff) {
          minDiff = diff;
          closest = { ...item, freq };
        }
      });

      const diff = ac - closest.freq;
      if (Math.abs(diff) < 1.5) {
        tuneDirection.textContent = `In Tune with ${closest.name}`;
        tuneDirection.style.color = 'lightgreen';
      } else if (diff < 0) {
        tuneDirection.textContent = `Tune Up ↑ (${closest.name})`;
        tuneDirection.style.color = '#f39c12';
      } else {
        tuneDirection.textContent = `Tune Down ↓ (${closest.name})`;
        tuneDirection.style.color = '#e74c3c';
      }
    }

    requestAnimationFrame(detectPitch);
  }

  detectPitch();
}

// Initialize standard tuning on load
window.addEventListener('DOMContentLoaded', () => {
  setTuning('standard');
});

// Make functions accessible globally
window.setTuning = setTuning;
window.startTuner = startTuner;
